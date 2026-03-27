/**
 * SQLite schema for Lossless Context Management.
 * Ported from lossless-claw/src/db/migration.ts.
 *
 * Uses the AlphaHuman skill bridge `db.exec()` which is synchronous.
 */

export function initializeSchema(): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS conversations (
      conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      session_key TEXT,
      title TEXT,
      bootstrapped_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    []
  );

  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS conversations_session_key_idx
     ON conversations (session_key)`,
    []
  );

  db.exec(
    `CREATE TABLE IF NOT EXISTS messages (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
      seq INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
      content TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (conversation_id, seq)
    )`,
    []
  );

  db.exec(
    `CREATE TABLE IF NOT EXISTS summaries (
      summary_id TEXT PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('leaf', 'condensed')),
      depth INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      token_count INTEGER NOT NULL,
      model TEXT NOT NULL DEFAULT 'unknown',
      earliest_at TEXT,
      latest_at TEXT,
      descendant_count INTEGER NOT NULL DEFAULT 0,
      descendant_token_count INTEGER NOT NULL DEFAULT 0,
      source_message_token_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      file_ids TEXT NOT NULL DEFAULT '[]'
    )`,
    []
  );

  db.exec(
    `CREATE TABLE IF NOT EXISTS summary_messages (
      summary_id TEXT NOT NULL REFERENCES summaries(summary_id) ON DELETE CASCADE,
      message_id INTEGER NOT NULL REFERENCES messages(message_id) ON DELETE RESTRICT,
      ordinal INTEGER NOT NULL,
      PRIMARY KEY (summary_id, message_id)
    )`,
    []
  );

  db.exec(
    `CREATE TABLE IF NOT EXISTS summary_parents (
      summary_id TEXT NOT NULL REFERENCES summaries(summary_id) ON DELETE CASCADE,
      parent_summary_id TEXT NOT NULL REFERENCES summaries(summary_id) ON DELETE RESTRICT,
      ordinal INTEGER NOT NULL,
      PRIMARY KEY (summary_id, parent_summary_id)
    )`,
    []
  );

  db.exec(
    `CREATE TABLE IF NOT EXISTS context_items (
      conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
      ordinal INTEGER NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('message', 'summary')),
      message_id INTEGER REFERENCES messages(message_id) ON DELETE RESTRICT,
      summary_id TEXT REFERENCES summaries(summary_id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (conversation_id, ordinal),
      CHECK (
        (item_type = 'message' AND message_id IS NOT NULL AND summary_id IS NULL) OR
        (item_type = 'summary' AND summary_id IS NOT NULL AND message_id IS NULL)
      )
    )`,
    []
  );

  db.exec(
    `CREATE TABLE IF NOT EXISTS large_files (
      file_id TEXT PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
      file_name TEXT,
      mime_type TEXT,
      byte_size INTEGER,
      storage_uri TEXT NOT NULL,
      exploration_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    []
  );

  // Indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS messages_conv_seq_idx ON messages (conversation_id, seq)`,
    []
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS summaries_conv_created_idx ON summaries (conversation_id, created_at)`,
    []
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS context_items_conv_idx ON context_items (conversation_id, ordinal)`,
    []
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS large_files_conv_idx ON large_files (conversation_id, created_at)`,
    []
  );

  // Detect FTS5 support and create virtual tables
  const s = globalThis.getLcmState();
  try {
    db.exec(
      `CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        content,
        tokenize='porter unicode61'
      )`,
      []
    );
    db.exec(
      `CREATE VIRTUAL TABLE IF NOT EXISTS summaries_fts USING fts5(
        summary_id UNINDEXED,
        content,
        tokenize='porter unicode61'
      )`,
      []
    );
    s.fts5Available = true;
    console.log('[lcm] FTS5 virtual tables created');
  } catch {
    s.fts5Available = false;
    console.warn('[lcm] FTS5 not available, using LIKE fallback');
  }
}

declare global {
  var initializeLcmSchema: () => void;
}
globalThis.initializeLcmSchema = initializeSchema;
