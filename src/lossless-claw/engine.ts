/**
 * Core LCM engine — orchestrates compaction, summarization, and context assembly.
 * Simplified port from lossless-claw/src/engine.ts + compaction.ts + assembler.ts + summarize.ts.
 *
 * Key adaptations for AlphaHuman skill runtime:
 * - All DB calls are synchronous (via skill bridge)
 * - Summarization uses net.fetch() to Neocortex API (sync)
 * - No OpenClaw dependencies — standalone engine
 */
import type { ConversationId, CreateSummaryInput, MessageRecord } from './types';

// ============================================================================
// Token estimation
// ============================================================================

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function generateSummaryId(): string {
  // Simple UUID-like ID using available crypto
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ============================================================================
// Summarization via Neocortex API
// ============================================================================

function summarizeText(text: string, isCondensed: boolean = false): string {
  const maxTokens = isCondensed ? 900 : 600;

  const prompt = isCondensed
    ? `Condense these summaries into a higher-level summary. Merge overlapping information and preserve all unique details:\n\n${text}`
    : `Summarize the following conversation messages, preserving key details:\n\n${text}`;

  try {
    const result = model.generate(prompt, { maxTokens, temperature: 0.3 });
    return result || text.slice(0, maxTokens * 4);
  } catch (e) {
    console.error(`[lcm] Summarization failed: ${e}`);
    // Fallback: truncate
    return text.slice(0, maxTokens * 4);
  }
}

// ============================================================================
// Leaf compaction — summarize unsummarized messages
// ============================================================================

function runLeafCompaction(conversationId: ConversationId): string | null {
  const s = globalThis.getLcmState();
  const config = s.config;

  const unsummarized = globalThis.lcmDb.getUnsummarizedMessages(conversationId);
  if (unsummarized.length < config.leafMinFanout) {
    return null;
  }

  // Protect fresh tail
  const allMessages = globalThis.lcmDb.getMessages(conversationId);
  const tailStart = Math.max(0, allMessages.length - config.freshTailCount);
  const tailMessageIds = new Set(allMessages.slice(tailStart).map(m => m.messageId));

  // Filter out tail messages from compaction candidates
  const candidates = unsummarized.filter(m => !tailMessageIds.has(m.messageId));
  if (candidates.length < config.leafMinFanout) {
    return null;
  }

  // Build text for summarization
  const textParts: string[] = [];
  let tokenCount = 0;
  const messageIds: number[] = [];

  for (const msg of candidates) {
    textParts.push(`[${msg.role}] ${msg.content}`);
    tokenCount += msg.tokenCount;
    messageIds.push(msg.messageId);
  }

  const fullText = textParts.join('\n\n');
  const summaryContent = summarizeText(fullText, false);
  const summaryTokens = estimateTokens(summaryContent);
  const summaryId = generateSummaryId();

  // Determine time range
  const earliestAt = candidates[0]?.createdAt ?? null;
  const latestAt = candidates[candidates.length - 1]?.createdAt ?? null;

  const input: CreateSummaryInput = {
    summaryId,
    conversationId,
    kind: 'leaf',
    depth: 0,
    content: summaryContent,
    tokenCount: summaryTokens,
    earliestAt,
    latestAt,
    descendantCount: 0,
    descendantTokenCount: 0,
    sourceMessageTokenCount: tokenCount,
    model: config.summaryModel,
  };

  globalThis.lcmDb.createSummary(input);
  globalThis.lcmDb.linkSummaryMessages(summaryId, messageIds);

  console.log(
    `[lcm] Leaf compaction: ${messageIds.length} messages → summary ${summaryId} (${summaryTokens} tokens)`
  );

  return summaryId;
}

// ============================================================================
// Condensed compaction — merge summaries at same depth
// ============================================================================

function runCondensedCompaction(
  conversationId: ConversationId,
  targetDepth: number
): string | null {
  const s = globalThis.getLcmState();
  const config = s.config;

  // Get summaries at (targetDepth - 1) that are not already parents of a condensed summary
  const candidateSummaries = globalThis.lcmDb
    .getSummaries(conversationId)
    .filter(sum => sum.depth === targetDepth - 1);

  // Filter to only those not already condensed into a higher summary
  const alreadyCondensed = new Set<string>();
  for (const sum of candidateSummaries) {
    const childRows = db.all(`SELECT summary_id FROM summary_parents WHERE parent_summary_id = ?`, [
      sum.summaryId,
    ]) as Array<{ summary_id: string }>;
    if (childRows.length > 0) {
      alreadyCondensed.add(sum.summaryId);
    }
  }

  const uncondensed = candidateSummaries.filter(cs => !alreadyCondensed.has(cs.summaryId));
  const minFanout = targetDepth === 1 ? config.leafMinFanout : config.condensedMinFanout;

  if (uncondensed.length < minFanout) {
    return null;
  }

  // Build text from child summaries
  const textParts: string[] = [];
  let totalTokens = 0;
  const parentIds: string[] = [];

  for (const sum of uncondensed) {
    textParts.push(sum.content);
    totalTokens += sum.tokenCount;
    parentIds.push(sum.summaryId);
  }

  const fullText = textParts.join('\n\n---\n\n');
  const summaryContent = summarizeText(fullText, true);
  const summaryTokens = estimateTokens(summaryContent);
  const summaryId = generateSummaryId();

  // Compute time range from children
  const times = uncondensed.flatMap(cs => [cs.earliestAt, cs.latestAt]).filter(Boolean) as string[];
  times.sort();
  const earliestAt = times[0] ?? null;
  const latestAt = times[times.length - 1] ?? null;

  // Compute descendant metadata
  let descendantCount = 0;
  let descendantTokenCount = 0;
  let sourceMessageTokenCount = 0;
  for (const sum of uncondensed) {
    descendantCount += sum.descendantCount + 1;
    descendantTokenCount += sum.descendantTokenCount + sum.tokenCount;
    sourceMessageTokenCount += sum.sourceMessageTokenCount;
  }

  const input: CreateSummaryInput = {
    summaryId,
    conversationId,
    kind: 'condensed',
    depth: targetDepth,
    content: summaryContent,
    tokenCount: summaryTokens,
    earliestAt,
    latestAt,
    descendantCount,
    descendantTokenCount,
    sourceMessageTokenCount,
    model: s.config.summaryModel,
  };

  globalThis.lcmDb.createSummary(input);
  globalThis.lcmDb.linkSummaryParents(summaryId, parentIds);

  console.log(
    `[lcm] Condensed compaction at depth ${targetDepth}: ${parentIds.length} summaries → ${summaryId} (${summaryTokens} tokens)`
  );

  return summaryId;
}

// ============================================================================
// Main compaction orchestrator
// ============================================================================

function shouldCompact(conversationId: ConversationId): boolean {
  const s = globalThis.getLcmState();
  const totalTokens = globalThis.lcmDb.getTotalTokenCount(conversationId);
  const threshold = s.config.maxContextTokens * s.config.contextThreshold;
  return totalTokens > threshold;
}

function runCompaction(conversationId: ConversationId): {
  leafCreated: string | null;
  condensedCreated: string[];
} {
  const s = globalThis.getLcmState();
  const config = s.config;
  const result = { leafCreated: null as string | null, condensedCreated: [] as string[] };

  // Step 1: Leaf compaction
  const leafId = runLeafCompaction(conversationId);
  result.leafCreated = leafId;

  // Step 2: Incremental condensation passes
  if (config.incrementalMaxDepth !== 0) {
    const maxDepth = globalThis.lcmDb.getMaxSummaryDepth(conversationId);
    const depthLimit =
      config.incrementalMaxDepth === -1 ? maxDepth + 1 : config.incrementalMaxDepth;

    for (let depth = 1; depth <= depthLimit; depth++) {
      const condensedId = runCondensedCompaction(conversationId, depth);
      if (condensedId) {
        result.condensedCreated.push(condensedId);
      } else {
        break; // No more work at this depth
      }
    }
  }

  return result;
}

// ============================================================================
// Context assembly
// ============================================================================

function assembleContext(conversationId: ConversationId): string[] {
  const s = globalThis.getLcmState();
  const config = s.config;
  const contextParts: string[] = [];
  let tokensUsed = 0;

  // 1. Include top-level summaries (highest depth, most condensed)
  const topSummaries = globalThis.lcmDb.getTopLevelSummaries(conversationId);
  for (const sum of topSummaries) {
    if (tokensUsed + sum.tokenCount > config.maxContextTokens) break;
    contextParts.push(
      `[Summary ${sum.summaryId} | ${sum.kind} depth=${sum.depth}]\n${sum.content}`
    );
    tokensUsed += sum.tokenCount;
  }

  // 2. Include fresh tail messages
  const allMessages = globalThis.lcmDb.getMessages(conversationId);
  const tailStart = Math.max(0, allMessages.length - config.freshTailCount);
  const tailMessages = allMessages.slice(tailStart);

  for (const msg of tailMessages) {
    if (tokensUsed + msg.tokenCount > config.maxContextTokens) break;
    contextParts.push(`[${msg.role}] ${msg.content}`);
    tokensUsed += msg.tokenCount;
  }

  return contextParts;
}

// ============================================================================
// Public API — ingest message
// ============================================================================

function ingestMessage(
  conversationId: ConversationId,
  role: string,
  content: string,
  tokenCount?: number
): void {
  const tokens = tokenCount ?? estimateTokens(content);
  const seq = globalThis.lcmDb.getLatestSeq(conversationId) + 1;

  globalThis.lcmDb.createMessage({
    conversationId,
    seq,
    role: role as MessageRecord['role'],
    content,
    tokenCount: tokens,
  });

  // Auto-compact if threshold exceeded
  if (shouldCompact(conversationId)) {
    console.log('[lcm] Threshold exceeded, running compaction...');
    const result = runCompaction(conversationId);
    if (result.leafCreated || result.condensedCreated.length > 0) {
      publishLcmState();
    }
  }
}

// ============================================================================
// Get or create conversation
// ============================================================================

function getOrCreateConversation(sessionId: string, sessionKey?: string): ConversationId {
  if (sessionKey) {
    const existing = globalThis.lcmDb.getConversationBySessionKey(sessionKey);
    if (existing) return existing.conversationId;
  }

  const conv = globalThis.lcmDb.createConversation({ sessionId, sessionKey });
  return conv.conversationId;
}

// ============================================================================
// State publishing
// ============================================================================

function publishLcmState(): void {
  const s = globalThis.getLcmState();
  const conversations = globalThis.lcmDb.listConversations();
  const stats =
    conversations.length > 0
      ? { conversationCount: conversations.length, currentConversationId: s.currentConversationId }
      : { conversationCount: 0, currentConversationId: null };

  state.setPartial({
    connection_status: s.isRunning ? 'connected' : 'disconnected',
    is_initialized: true,
    ...stats,
  });
}

// ============================================================================
// Register on globalThis
// ============================================================================

declare global {
  var lcmEngine: {
    ingestMessage: typeof ingestMessage;
    getOrCreateConversation: typeof getOrCreateConversation;
    runCompaction: typeof runCompaction;
    shouldCompact: typeof shouldCompact;
    assembleContext: typeof assembleContext;
    estimateTokens: typeof estimateTokens;
    publishLcmState: typeof publishLcmState;
  };
}

globalThis.lcmEngine = {
  ingestMessage,
  getOrCreateConversation,
  runCompaction,
  shouldCompact,
  assembleContext,
  estimateTokens,
  publishLcmState,
};
