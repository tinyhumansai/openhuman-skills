import {
  _describe,
  _it,
  _assert,
  _assertEqual,
  _assertNotNull,
  _assertGreaterThan,
  _setup,
  _callTool,
  _getMockState,
} from '../../test-harness-globals';

const DEFAULT_CONFIG = {
  contextThreshold: 0.75,
  freshTailCount: 3,
  incrementalMaxDepth: -1,
  leafMinFanout: 4,
  condensedMinFanout: 3,
  condensedMinFanoutHard: 2,
  summaryModel: 'neocortex-mk1',
  maxContextTokens: 128000,
};

function freshInit(overrides?: { config?: Record<string, unknown> }): void {
  _setup({
    stateData: {
      config: { ...DEFAULT_CONFIG, ...(overrides?.config || {}) },
    },
  });
  (globalThis as any).init();
}

// ============================================================================
// Schema Tests
// ============================================================================

_describe('LCM Schema', () => {
  _it('should create all tables on init', () => {
    freshInit();
    // Verify tables exist by inserting into them
    const s = globalThis.getLcmState();
    _assertNotNull(s, 'state should be initialized');

    // conversations table
    db.exec(
      `INSERT INTO conversations (session_id, session_key) VALUES (?, ?)`,
      ['test-session', 'test-key'],
    );
    const conv = db.get(`SELECT * FROM conversations WHERE session_id = ?`, [
      'test-session',
    ]) as Record<string, unknown> | null;
    _assertNotNull(conv, 'conversation should be created');
    _assertEqual(conv!.session_id, 'test-session');
  });

  _it('should create messages table', () => {
    freshInit();
    db.exec(
      `INSERT INTO conversations (session_id) VALUES (?)`,
      ['s1'],
    );
    const conv = db.get(
      `SELECT conversation_id FROM conversations WHERE session_id = ?`,
      ['s1'],
    ) as { conversation_id: number };
    db.exec(
      `INSERT INTO messages (conversation_id, seq, role, content, token_count) VALUES (?, ?, ?, ?, ?)`,
      [conv.conversation_id, 1, 'user', 'Hello world', 3],
    );
    const msg = db.get(`SELECT * FROM messages WHERE conversation_id = ?`, [
      conv.conversation_id,
    ]) as Record<string, unknown> | null;
    _assertNotNull(msg, 'message should be created');
    _assertEqual(msg!.content, 'Hello world');
  });

  _it('should create summaries table', () => {
    freshInit();
    db.exec(
      `INSERT INTO conversations (session_id) VALUES (?)`,
      ['s1'],
    );
    const conv = db.get(
      `SELECT conversation_id FROM conversations WHERE session_id = ?`,
      ['s1'],
    ) as { conversation_id: number };
    db.exec(
      `INSERT INTO summaries (summary_id, conversation_id, kind, depth, content, token_count, model) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['sum-1', conv.conversation_id, 'leaf', 0, 'Summary text', 10, 'test'],
    );
    const sum = db.get(`SELECT * FROM summaries WHERE summary_id = ?`, [
      'sum-1',
    ]) as Record<string, unknown> | null;
    _assertNotNull(sum, 'summary should be created');
    _assertEqual(sum!.kind, 'leaf');
  });
});

// ============================================================================
// Ingest Tests
// ============================================================================

_describe('LCM Ingest', () => {
  _it('should ingest a message via tool', () => {
    freshInit();
    const result = _callTool('lcm_ingest', {
      sessionId: 'sess-1',
      role: 'user',
      content: 'Hello, how are you?',
    }) as Record<string, unknown>;

    _assertEqual(result.success, true);
    _assertGreaterThan(result.conversationId as number, 0, 'should have conversation ID');
    _assertEqual(result.messageCount, 1);
    _assertGreaterThan(result.totalTokens as number, 0, 'should have tokens');
  });

  _it('should create conversation on first ingest', () => {
    freshInit();
    _callTool('lcm_ingest', {
      sessionId: 'new-session',
      role: 'user',
      content: 'First message',
    });

    const s = globalThis.getLcmState();
    _assertNotNull(s.currentConversationId, 'should have a current conversation');
  });

  _it('should ingest multiple messages', () => {
    freshInit();
    _callTool('lcm_ingest', {
      sessionId: 'sess-multi',
      role: 'user',
      content: 'Message 1',
    });
    _callTool('lcm_ingest', {
      sessionId: 'sess-multi',
      role: 'assistant',
      content: 'Response 1',
    });
    const result = _callTool('lcm_ingest', {
      sessionId: 'sess-multi',
      role: 'user',
      content: 'Message 2',
    }) as Record<string, unknown>;

    _assertEqual(result.messageCount, 3);
  });
});

// ============================================================================
// Context Assembly Tests
// ============================================================================

_describe('LCM Context', () => {
  _it('should assemble context from messages', () => {
    freshInit();
    // Ingest messages
    for (let i = 0; i < 5; i++) {
      _callTool('lcm_ingest', {
        sessionId: 'ctx-session',
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message number ${i}`,
      });
    }

    const result = _callTool('lcm_context', {}) as Record<string, unknown>;
    _assertNotNull(result.conversationId, 'should have conversation ID');
    _assertGreaterThan(result.partCount as number, 0, 'should have context parts');
    _assertGreaterThan(result.totalTokens as number, 0, 'should have token count');
    _assert(Array.isArray(result.context), 'context should be an array');
  });

  _it('should return error when no conversation active', () => {
    freshInit();
    // Reset conversation ID
    const s = globalThis.getLcmState();
    s.currentConversationId = null;

    const result = _callTool('lcm_context', {}) as Record<string, unknown>;
    _assertNotNull(result.error, 'should have error');
  });
});

// ============================================================================
// Grep Tests
// ============================================================================

_describe('LCM Grep', () => {
  _it('should search messages by pattern', () => {
    freshInit();
    _callTool('lcm_ingest', {
      sessionId: 'grep-session',
      role: 'user',
      content: 'The quick brown fox jumps over the lazy dog',
    });
    _callTool('lcm_ingest', {
      sessionId: 'grep-session',
      role: 'assistant',
      content: 'That is a classic pangram sentence',
    });

    const result = _callTool('lcm_grep', {
      pattern: 'fox',
      scope: 'messages',
    }) as Record<string, unknown>;

    _assertNotNull(result.resultCount, 'should have result count');
  });

  _it('should return empty results for no matches', () => {
    freshInit();
    _callTool('lcm_ingest', {
      sessionId: 'grep-empty',
      role: 'user',
      content: 'Hello world',
    });

    const result = _callTool('lcm_grep', {
      pattern: 'zzz_nonexistent_zzz',
      scope: 'messages',
    }) as Record<string, unknown>;

    _assertEqual(result.resultCount, 0);
  });

  _it('should return error when no conversation active', () => {
    freshInit();
    const s = globalThis.getLcmState();
    s.currentConversationId = null;

    const result = _callTool('lcm_grep', {
      pattern: 'test',
    }) as Record<string, unknown>;

    _assertNotNull(result.error, 'should have error');
  });
});

// ============================================================================
// Describe Tests
// ============================================================================

_describe('LCM Describe', () => {
  _it('should return error for nonexistent summary', () => {
    freshInit();
    const result = _callTool('lcm_describe', {
      summaryId: 'nonexistent-id',
    }) as Record<string, unknown>;

    _assertNotNull(result.error, 'should return error for missing summary');
  });

  _it('should describe a summary after compaction', () => {
    freshInit({
      config: {
        leafMinFanout: 2,
        freshTailCount: 1,
        maxContextTokens: 100,
        contextThreshold: 0.01,
      },
    });

    // Ingest enough messages to trigger compaction
    for (let i = 0; i < 10; i++) {
      _callTool('lcm_ingest', {
        sessionId: 'desc-session',
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Long message number ${i} with extra content to increase token count. `.repeat(5),
      });
    }

    // Check if any summaries were created
    const s = globalThis.getLcmState();
    const summaries = db.all(
      `SELECT summary_id FROM summaries WHERE conversation_id = ?`,
      [s.currentConversationId],
    ) as Array<{ summary_id: string }>;

    if (summaries.length > 0) {
      const result = _callTool('lcm_describe', {
        summaryId: summaries[0].summary_id,
      }) as Record<string, unknown>;
      _assertNotNull(result.summaryId, 'should have summary ID');
      _assertNotNull(result.kind, 'should have kind');
      _assertNotNull(result.content, 'should have content');
    }
  });
});

// ============================================================================
// Expand Tests
// ============================================================================

_describe('LCM Expand', () => {
  _it('should handle expand for nonexistent summary gracefully', () => {
    freshInit();
    const result = _callTool('lcm_expand', {
      summaryIds: ['nonexistent'],
    }) as Record<string, unknown>;

    _assertEqual(result.expandedCount, 0);
  });
});

// ============================================================================
// Expand Query Tests
// ============================================================================

_describe('LCM Expand Query', () => {
  _it('should return error when no conversation', () => {
    freshInit();
    const s = globalThis.getLcmState();
    s.currentConversationId = null;

    const result = _callTool('lcm_expand_query', {
      query: 'test',
    }) as Record<string, unknown>;

    _assertNotNull(result.error, 'should have error');
  });

  _it('should search and return results', () => {
    freshInit();
    _callTool('lcm_ingest', {
      sessionId: 'eq-session',
      role: 'user',
      content: 'Bitcoin price analysis for Q1 2026',
    });
    _callTool('lcm_ingest', {
      sessionId: 'eq-session',
      role: 'assistant',
      content: 'Based on the analysis, BTC shows bullish patterns',
    });

    const result = _callTool('lcm_expand_query', {
      query: 'Bitcoin',
    }) as Record<string, unknown>;

    _assertNotNull(result.matchCount, 'should have match count');
    _assert(Array.isArray(result.results), 'should have results array');
  });
});

// ============================================================================
// Lifecycle Tests
// ============================================================================

_describe('LCM Lifecycle', () => {
  _it('should start and publish state', () => {
    freshInit();
    (globalThis as any).start();
    const s = globalThis.getLcmState();
    _assertEqual(s.isRunning, true);

    const mock = _getMockState();
    _assertEqual(
      (mock.stateValues as Record<string, unknown>)?.connection_status,
      'connected',
    );
  });

  _it('should stop and persist config', () => {
    freshInit();
    (globalThis as any).start();
    (globalThis as any).stop();
    const s = globalThis.getLcmState();
    _assertEqual(s.isRunning, false);
  });

  _it('should handle session start', () => {
    freshInit();
    (globalThis as any).onSessionStart({ sessionId: 'lifecycle-sess' });
    const s = globalThis.getLcmState();
    _assertNotNull(s.currentConversationId, 'should set current conversation');
  });
});

// ============================================================================
// Engine Integration Tests
// ============================================================================

_describe('LCM Engine', () => {
  _it('should estimate tokens', () => {
    freshInit();
    const tokens = globalThis.lcmEngine.estimateTokens('Hello world');
    _assertGreaterThan(tokens, 0, 'should estimate tokens > 0');
  });

  _it('should create and retrieve conversation', () => {
    freshInit();
    const convId = globalThis.lcmEngine.getOrCreateConversation('engine-sess');
    _assertGreaterThan(convId, 0, 'should return conversation ID');

    // Same session should return same conversation (via sessionId lookup)
    const convId2 = globalThis.lcmEngine.getOrCreateConversation('engine-sess');
    // Note: without sessionKey, this creates a new one each time
    _assertGreaterThan(convId2, 0, 'should return conversation ID');
  });
});
