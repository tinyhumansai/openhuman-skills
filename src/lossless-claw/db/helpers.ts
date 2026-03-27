/**
 * Database helpers for conversations, messages, and summaries.
 * Ported from lossless-claw conversation-store.ts and summary-store.ts.
 */
import type {
  ConversationId,
  ConversationRecord,
  CreateConversationInput,
  CreateMessageInput,
  CreateSummaryInput,
  DescribeResult,
  ExpandResult,
  GrepResult,
  MessageId,
  MessageRecord,
  SummaryId,
  SummaryRecord,
} from '../types';

// ============================================================================
// FTS5 helpers
// ============================================================================

function sanitizeFts5Query(raw: string): string {
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '""';
  return tokens.map((t) => `"${t.replace(/"/g, '')}"`).join(' ');
}

function escapeLike(term: string): string {
  return term.replace(/([\\%_])/g, '\\$1');
}

// ============================================================================
// Conversations
// ============================================================================

function createConversation(input: CreateConversationInput): ConversationRecord {
  db.exec(
    `INSERT INTO conversations (session_id, session_key, title)
     VALUES (?, ?, ?)`,
    [input.sessionId, input.sessionKey ?? null, input.title ?? null],
  );
  const row = db.get(
    `SELECT * FROM conversations WHERE session_id = ? ORDER BY conversation_id DESC LIMIT 1`,
    [input.sessionId],
  ) as Record<string, unknown> | null;
  return mapConversationRow(row!);
}

function getConversationBySessionKey(sessionKey: string): ConversationRecord | null {
  const row = db.get(`SELECT * FROM conversations WHERE session_key = ?`, [sessionKey]) as Record<
    string,
    unknown
  > | null;
  return row ? mapConversationRow(row) : null;
}

function getConversationById(conversationId: ConversationId): ConversationRecord | null {
  const row = db.get(`SELECT * FROM conversations WHERE conversation_id = ?`, [
    conversationId,
  ]) as Record<string, unknown> | null;
  return row ? mapConversationRow(row) : null;
}

function listConversations(): ConversationRecord[] {
  const rows = db.all(`SELECT * FROM conversations ORDER BY updated_at DESC`, []) as Array<
    Record<string, unknown>
  >;
  return rows.map(mapConversationRow);
}

function mapConversationRow(row: Record<string, unknown>): ConversationRecord {
  return {
    conversationId: row.conversation_id as number,
    sessionId: row.session_id as string,
    sessionKey: (row.session_key as string) ?? null,
    title: (row.title as string) ?? null,
    bootstrappedAt: (row.bootstrapped_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================================
// Messages
// ============================================================================

function createMessage(input: CreateMessageInput): MessageRecord {
  db.exec(
    `INSERT INTO messages (conversation_id, seq, role, content, token_count)
     VALUES (?, ?, ?, ?, ?)`,
    [input.conversationId, input.seq, input.role, input.content, input.tokenCount],
  );
  const row = db.get(
    `SELECT * FROM messages WHERE conversation_id = ? AND seq = ?`,
    [input.conversationId, input.seq],
  ) as Record<string, unknown>;

  // Index in FTS5 if available
  const s = globalThis.getLcmState();
  if (s.fts5Available && row) {
    try {
      db.exec(`INSERT INTO messages_fts(rowid, content) VALUES (?, ?)`, [
        row.message_id,
        input.content,
      ]);
    } catch {
      // FTS insert may fail on duplicate, ignore
    }
  }

  return mapMessageRow(row);
}

function getMessages(
  conversationId: ConversationId,
  opts?: { limit?: number; offset?: number },
): MessageRecord[] {
  const limit = opts?.limit ?? 1000;
  const offset = opts?.offset ?? 0;
  const rows = db.all(
    `SELECT * FROM messages WHERE conversation_id = ?
     ORDER BY seq ASC LIMIT ? OFFSET ?`,
    [conversationId, limit, offset],
  ) as Array<Record<string, unknown>>;
  return rows.map(mapMessageRow);
}

function getMessageCount(conversationId: ConversationId): number {
  const row = db.get(`SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?`, [
    conversationId,
  ]) as { count: number } | null;
  return row?.count ?? 0;
}

function getLatestSeq(conversationId: ConversationId): number {
  const row = db.get(
    `SELECT MAX(seq) as max_seq FROM messages WHERE conversation_id = ?`,
    [conversationId],
  ) as { max_seq: number | null } | null;
  return row?.max_seq ?? 0;
}

function getTotalTokenCount(conversationId: ConversationId): number {
  const row = db.get(
    `SELECT COALESCE(SUM(token_count), 0) as total FROM messages WHERE conversation_id = ?`,
    [conversationId],
  ) as { total: number };
  return row.total;
}

function mapMessageRow(row: Record<string, unknown>): MessageRecord {
  return {
    messageId: row.message_id as number,
    conversationId: row.conversation_id as number,
    seq: row.seq as number,
    role: row.role as MessageRecord['role'],
    content: row.content as string,
    tokenCount: row.token_count as number,
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// Summaries
// ============================================================================

function createSummary(input: CreateSummaryInput): SummaryRecord {
  const fileIds = JSON.stringify(input.fileIds ?? []);
  db.exec(
    `INSERT INTO summaries (summary_id, conversation_id, kind, depth, content, token_count,
      model, earliest_at, latest_at, descendant_count, descendant_token_count,
      source_message_token_count, file_ids)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.summaryId,
      input.conversationId,
      input.kind,
      input.depth,
      input.content,
      input.tokenCount,
      input.model,
      input.earliestAt ?? null,
      input.latestAt ?? null,
      input.descendantCount ?? 0,
      input.descendantTokenCount ?? 0,
      input.sourceMessageTokenCount ?? 0,
      fileIds,
    ],
  );

  // Index in FTS5
  const s = globalThis.getLcmState();
  if (s.fts5Available) {
    try {
      db.exec(`INSERT INTO summaries_fts(summary_id, content) VALUES (?, ?)`, [
        input.summaryId,
        input.content,
      ]);
    } catch {
      // ignore
    }
  }

  return getSummaryById(input.summaryId)!;
}

function linkSummaryMessages(summaryId: SummaryId, messageIds: MessageId[]): void {
  for (let i = 0; i < messageIds.length; i++) {
    db.exec(
      `INSERT OR IGNORE INTO summary_messages (summary_id, message_id, ordinal) VALUES (?, ?, ?)`,
      [summaryId, messageIds[i], i],
    );
  }
}

function linkSummaryParents(summaryId: SummaryId, parentIds: SummaryId[]): void {
  for (let i = 0; i < parentIds.length; i++) {
    db.exec(
      `INSERT OR IGNORE INTO summary_parents (summary_id, parent_summary_id, ordinal) VALUES (?, ?, ?)`,
      [summaryId, parentIds[i], i],
    );
  }
}

function getSummaryById(summaryId: SummaryId): SummaryRecord | null {
  const row = db.get(`SELECT * FROM summaries WHERE summary_id = ?`, [summaryId]) as Record<
    string,
    unknown
  > | null;
  return row ? mapSummaryRow(row) : null;
}

function getSummaries(
  conversationId: ConversationId,
  opts?: { kind?: string; minDepth?: number },
): SummaryRecord[] {
  let sql = `SELECT * FROM summaries WHERE conversation_id = ?`;
  const params: unknown[] = [conversationId];
  if (opts?.kind) {
    sql += ` AND kind = ?`;
    params.push(opts.kind);
  }
  if (opts?.minDepth != null) {
    sql += ` AND depth >= ?`;
    params.push(opts.minDepth);
  }
  sql += ` ORDER BY depth ASC, created_at ASC`;
  const rows = db.all(sql, params) as Array<Record<string, unknown>>;
  return rows.map(mapSummaryRow);
}

function getLeafSummaries(conversationId: ConversationId): SummaryRecord[] {
  return getSummaries(conversationId, { kind: 'leaf' });
}

function getTopLevelSummaries(conversationId: ConversationId): SummaryRecord[] {
  // Summaries that are not children of any other summary
  const rows = db.all(
    `SELECT s.* FROM summaries s
     WHERE s.conversation_id = ?
       AND s.summary_id NOT IN (
         SELECT parent_summary_id FROM summary_parents
       )
     ORDER BY s.created_at ASC`,
    [conversationId],
  ) as Array<Record<string, unknown>>;
  return rows.map(mapSummaryRow);
}

function getChildSummaries(parentSummaryId: SummaryId): SummaryRecord[] {
  const rows = db.all(
    `SELECT s.* FROM summaries s
     JOIN summary_parents sp ON sp.summary_id = s.summary_id
     WHERE sp.parent_summary_id = ?
     ORDER BY sp.ordinal ASC`,
    [parentSummaryId],
  ) as Array<Record<string, unknown>>;
  return rows.map(mapSummaryRow);
}

function getParentSummaries(summaryId: SummaryId): SummaryRecord[] {
  const rows = db.all(
    `SELECT s.* FROM summaries s
     JOIN summary_parents sp ON sp.parent_summary_id = s.summary_id
     WHERE sp.summary_id = ?
     ORDER BY sp.ordinal ASC`,
    [summaryId],
  ) as Array<Record<string, unknown>>;
  return rows.map(mapSummaryRow);
}

function getSummaryMessageIds(summaryId: SummaryId): MessageId[] {
  const rows = db.all(
    `SELECT message_id FROM summary_messages WHERE summary_id = ? ORDER BY ordinal ASC`,
    [summaryId],
  ) as Array<{ message_id: number }>;
  return rows.map((r) => r.message_id);
}

function getMaxSummaryDepth(conversationId: ConversationId): number {
  const row = db.get(
    `SELECT COALESCE(MAX(depth), -1) as max_depth FROM summaries WHERE conversation_id = ?`,
    [conversationId],
  ) as { max_depth: number };
  return row.max_depth;
}

function getUnsummarizedMessages(conversationId: ConversationId): MessageRecord[] {
  const rows = db.all(
    `SELECT m.* FROM messages m
     WHERE m.conversation_id = ?
       AND m.message_id NOT IN (
         SELECT sm.message_id FROM summary_messages sm
         JOIN summaries s ON s.summary_id = sm.summary_id
         WHERE s.kind = 'leaf'
       )
     ORDER BY m.seq ASC`,
    [conversationId],
  ) as Array<Record<string, unknown>>;
  return rows.map(mapMessageRow);
}

function mapSummaryRow(row: Record<string, unknown>): SummaryRecord {
  return {
    summaryId: row.summary_id as string,
    conversationId: row.conversation_id as number,
    kind: row.kind as SummaryRecord['kind'],
    depth: row.depth as number,
    content: row.content as string,
    tokenCount: row.token_count as number,
    earliestAt: (row.earliest_at as string) ?? null,
    latestAt: (row.latest_at as string) ?? null,
    descendantCount: (row.descendant_count as number) ?? 0,
    descendantTokenCount: (row.descendant_token_count as number) ?? 0,
    sourceMessageTokenCount: (row.source_message_token_count as number) ?? 0,
    model: (row.model as string) ?? 'unknown',
    createdAt: row.created_at as string,
    fileIds: (row.file_ids as string) ?? '[]',
  };
}

// ============================================================================
// Search (grep)
// ============================================================================

function grepMessages(
  conversationId: ConversationId,
  pattern: string,
  mode: 'regex' | 'full_text',
  limit: number,
): GrepResult[] {
  const s = globalThis.getLcmState();

  if (mode === 'full_text' && s.fts5Available) {
    const sanitized = sanitizeFts5Query(pattern);
    const rows = db.all(
      `SELECT m.message_id, m.conversation_id, m.content, m.created_at, m.token_count,
              snippet(messages_fts, 0, '>>>', '<<<', '...', 32) as snippet
       FROM messages_fts f
       JOIN messages m ON m.message_id = f.rowid
       WHERE messages_fts MATCH ?
         AND m.conversation_id = ?
       ORDER BY rank
       LIMIT ?`,
      [sanitized, conversationId, limit],
    ) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      type: 'message' as const,
      id: r.message_id as number,
      conversationId: r.conversation_id as number,
      content: r.content as string,
      snippet: (r.snippet as string) || (r.content as string).slice(0, 100),
      createdAt: r.created_at as string,
      tokenCount: r.token_count as number,
    }));
  }

  // LIKE fallback
  const likePattern = `%${escapeLike(pattern)}%`;
  const rows = db.all(
    `SELECT * FROM messages
     WHERE conversation_id = ? AND content LIKE ? ESCAPE '\\'
     ORDER BY seq ASC LIMIT ?`,
    [conversationId, likePattern, limit],
  ) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    type: 'message' as const,
    id: r.message_id as number,
    conversationId: r.conversation_id as number,
    content: r.content as string,
    snippet: (r.content as string).slice(0, 100),
    createdAt: r.created_at as string,
    tokenCount: r.token_count as number,
  }));
}

function grepSummaries(
  conversationId: ConversationId,
  pattern: string,
  mode: 'regex' | 'full_text',
  limit: number,
): GrepResult[] {
  const s = globalThis.getLcmState();

  if (mode === 'full_text' && s.fts5Available) {
    const sanitized = sanitizeFts5Query(pattern);
    const rows = db.all(
      `SELECT s.summary_id, s.conversation_id, s.content, s.created_at, s.token_count,
              snippet(summaries_fts, 1, '>>>', '<<<', '...', 32) as snippet
       FROM summaries_fts f
       JOIN summaries s ON s.summary_id = f.summary_id
       WHERE summaries_fts MATCH ?
         AND s.conversation_id = ?
       ORDER BY rank
       LIMIT ?`,
      [sanitized, conversationId, limit],
    ) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      type: 'summary' as const,
      id: r.summary_id as string,
      conversationId: r.conversation_id as number,
      content: r.content as string,
      snippet: (r.snippet as string) || (r.content as string).slice(0, 100),
      createdAt: r.created_at as string,
      tokenCount: r.token_count as number,
    }));
  }

  // LIKE fallback
  const likePattern = `%${escapeLike(pattern)}%`;
  const rows = db.all(
    `SELECT * FROM summaries
     WHERE conversation_id = ? AND content LIKE ? ESCAPE '\\'
     ORDER BY created_at ASC LIMIT ?`,
    [conversationId, likePattern, limit],
  ) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    type: 'summary' as const,
    id: r.summary_id as string,
    conversationId: r.conversation_id as number,
    content: r.content as string,
    snippet: (r.content as string).slice(0, 100),
    createdAt: r.created_at as string,
    tokenCount: r.token_count as number,
  }));
}

// ============================================================================
// Describe
// ============================================================================

function describeSummary(summaryId: SummaryId): DescribeResult | null {
  const summary = getSummaryById(summaryId);
  if (!summary) return null;

  const parentRows = db.all(
    `SELECT parent_summary_id FROM summary_parents WHERE summary_id = ? ORDER BY ordinal`,
    [summaryId],
  ) as Array<{ parent_summary_id: string }>;

  const childRows = db.all(
    `SELECT summary_id FROM summary_parents WHERE parent_summary_id = ? ORDER BY ordinal`,
    [summaryId],
  ) as Array<{ summary_id: string }>;

  return {
    summaryId: summary.summaryId,
    kind: summary.kind,
    depth: summary.depth,
    content: summary.content,
    tokenCount: summary.tokenCount,
    descendantCount: summary.descendantCount,
    descendantTokenCount: summary.descendantTokenCount,
    sourceMessageTokenCount: summary.sourceMessageTokenCount,
    earliestAt: summary.earliestAt,
    latestAt: summary.latestAt,
    parentIds: parentRows.map((r) => r.parent_summary_id),
    childIds: childRows.map((r) => r.summary_id),
  };
}

// ============================================================================
// Expand
// ============================================================================

function expandSummary(
  summaryId: SummaryId,
  maxDepth: number,
  tokenBudget: number,
): ExpandResult[] {
  const results: ExpandResult[] = [];
  let tokensUsed = 0;

  const queue: Array<{ id: SummaryId; currentDepth: number }> = [
    { id: summaryId, currentDepth: 0 },
  ];

  while (queue.length > 0 && tokensUsed < tokenBudget) {
    const item = queue.shift()!;
    if (item.currentDepth > maxDepth) continue;

    const children = getChildSummaries(item.id);
    if (children.length === 0) {
      // This is a leaf or has no children — show the parent summary's source messages
      const summary = getSummaryById(item.id);
      if (summary && tokensUsed + summary.tokenCount <= tokenBudget) {
        results.push({
          summaryId: summary.summaryId,
          kind: summary.kind,
          depth: summary.depth,
          content: summary.content,
          tokenCount: summary.tokenCount,
          childCount: 0,
          earliestAt: summary.earliestAt,
          latestAt: summary.latestAt,
        });
        tokensUsed += summary.tokenCount;
      }
      continue;
    }

    for (const child of children) {
      if (tokensUsed + child.tokenCount > tokenBudget) break;
      results.push({
        summaryId: child.summaryId,
        kind: child.kind,
        depth: child.depth,
        content: child.content,
        tokenCount: child.tokenCount,
        childCount: getChildSummaries(child.summaryId).length,
        earliestAt: child.earliestAt,
        latestAt: child.latestAt,
      });
      tokensUsed += child.tokenCount;

      // Queue for further expansion
      if (item.currentDepth + 1 < maxDepth) {
        queue.push({ id: child.summaryId, currentDepth: item.currentDepth + 1 });
      }
    }
  }

  return results;
}

// ============================================================================
// Context Items
// ============================================================================

function getContextItems(conversationId: ConversationId): Array<{
  ordinal: number;
  itemType: string;
  messageId: number | null;
  summaryId: string | null;
}> {
  const rows = db.all(
    `SELECT ordinal, item_type, message_id, summary_id
     FROM context_items WHERE conversation_id = ? ORDER BY ordinal ASC`,
    [conversationId],
  ) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    ordinal: r.ordinal as number,
    itemType: r.item_type as string,
    messageId: (r.message_id as number) ?? null,
    summaryId: (r.summary_id as string) ?? null,
  }));
}

function replaceContextItems(
  conversationId: ConversationId,
  items: Array<{ itemType: string; messageId?: number; summaryId?: string }>,
): void {
  db.exec(`DELETE FROM context_items WHERE conversation_id = ?`, [conversationId]);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    db.exec(
      `INSERT INTO context_items (conversation_id, ordinal, item_type, message_id, summary_id)
       VALUES (?, ?, ?, ?, ?)`,
      [conversationId, i, item.itemType, item.messageId ?? null, item.summaryId ?? null],
    );
  }
}

// ============================================================================
// Register on globalThis
// ============================================================================

declare global {
  var lcmDb: {
    // Conversations
    createConversation: typeof createConversation;
    getConversationBySessionKey: typeof getConversationBySessionKey;
    getConversationById: typeof getConversationById;
    listConversations: typeof listConversations;
    // Messages
    createMessage: typeof createMessage;
    getMessages: typeof getMessages;
    getMessageCount: typeof getMessageCount;
    getLatestSeq: typeof getLatestSeq;
    getTotalTokenCount: typeof getTotalTokenCount;
    getUnsummarizedMessages: typeof getUnsummarizedMessages;
    // Summaries
    createSummary: typeof createSummary;
    linkSummaryMessages: typeof linkSummaryMessages;
    linkSummaryParents: typeof linkSummaryParents;
    getSummaryById: typeof getSummaryById;
    getSummaries: typeof getSummaries;
    getLeafSummaries: typeof getLeafSummaries;
    getTopLevelSummaries: typeof getTopLevelSummaries;
    getChildSummaries: typeof getChildSummaries;
    getParentSummaries: typeof getParentSummaries;
    getSummaryMessageIds: typeof getSummaryMessageIds;
    getMaxSummaryDepth: typeof getMaxSummaryDepth;
    // Search
    grepMessages: typeof grepMessages;
    grepSummaries: typeof grepSummaries;
    describeSummary: typeof describeSummary;
    expandSummary: typeof expandSummary;
    // Context items
    getContextItems: typeof getContextItems;
    replaceContextItems: typeof replaceContextItems;
  };
}

globalThis.lcmDb = {
  createConversation,
  getConversationBySessionKey,
  getConversationById,
  listConversations,
  createMessage,
  getMessages,
  getMessageCount,
  getLatestSeq,
  getTotalTokenCount,
  getUnsummarizedMessages,
  createSummary,
  linkSummaryMessages,
  linkSummaryParents,
  getSummaryById,
  getSummaries,
  getLeafSummaries,
  getTopLevelSummaries,
  getChildSummaries,
  getParentSummaries,
  getSummaryMessageIds,
  getMaxSummaryDepth,
  grepMessages,
  grepSummaries,
  describeSummary,
  expandSummary,
  getContextItems,
  replaceContextItems,
};
