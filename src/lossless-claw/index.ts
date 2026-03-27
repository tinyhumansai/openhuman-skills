/**
 * Lossless Context Management (LCM) Skill
 *
 * DAG-based conversation summarization that never loses context.
 * Ported from lossless-claw OpenClaw plugin to AlphaHuman skill.
 *
 * Features:
 * - Hierarchical summarization DAG (leaf → condensed)
 * - Automatic compaction when token threshold exceeded
 * - FTS5 full-text search with LIKE fallback
 * - Context assembly with fresh tail protection
 * - 6 tools: ingest, context, grep, describe, expand, expand_query
 */

// 1. State first
import './skill-state';
// 2. DB schema
import './db/schema';
// 3. DB helpers
import './db/helpers';
// 4. Core engine
import './engine';
// 5. Tools
import {
  lcmGrepTool,
  lcmDescribeTool,
  lcmExpandTool,
  lcmExpandQueryTool,
  lcmIngestTool,
  lcmContextTool,
} from './tools';

import type { LcmConfig } from './types';

function init(): void {
  // Initialize database schema
  globalThis.initializeLcmSchema();

  // Load saved config
  const s = globalThis.getLcmState();
  const savedConfig = state.get('config');
  if (savedConfig) {
    s.config = { ...s.config, ...(savedConfig as Partial<LcmConfig>) };
  }

  console.log('[lcm] Initialized. FTS5 available:', s.fts5Available);
}

function start(): void {
  const s = globalThis.getLcmState();
  s.isRunning = true;
  globalThis.lcmEngine.publishLcmState();
  console.log('[lcm] Started');
}

function stop(): void {
  const s = globalThis.getLcmState();
  s.isRunning = false;
  state.set('config', s.config);
  globalThis.lcmEngine.publishLcmState();
  console.log('[lcm] Stopped');
}

function onSessionStart(args: { sessionId: string }): void {
  const s = globalThis.getLcmState();
  const conversationId = globalThis.lcmEngine.getOrCreateConversation(args.sessionId);
  s.currentConversationId = conversationId;
  console.log(`[lcm] Session started: ${args.sessionId} → conversation ${conversationId}`);
}

function onSessionEnd(_args: { sessionId: string }): void {
  const s = globalThis.getLcmState();
  // Persist config on session end
  state.set('config', s.config);
}

const skill = {
  info: {
    id: 'lossless-claw',
    name: 'Lossless Context Management',
    version: '0.1.0',
    description: 'DAG-based conversation summarization — never lose context',
  },
  tools: [
    lcmIngestTool,
    lcmContextTool,
    lcmGrepTool,
    lcmDescribeTool,
    lcmExpandTool,
    lcmExpandQueryTool,
  ] as ToolDefinition[],
  init,
  start,
  stop,
  onSessionStart,
  onSessionEnd,
};

export default skill;
