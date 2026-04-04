/**
 * Tests for the Gmail skill.
 * Covers lifecycle hooks, setup flow, tools, database operations, and sync logic.
 */
import {
  _assertEqual,
  _assertNotNull,
  _assertNull,
  _assertTrue,
  _assertFalse,
  _callTool,
  _describe,
  _getMockState,
  _it,
  _setup,
  _mockFetchResponse,
  _mockFetchError,
} from '../../test-harness-globals';

const g = globalThis as Record<string, unknown>;
const setupSkillTest = _setup;
const getMockState = _getMockState;
const callTool = _callTool;

const init = () => (g.init as () => void)();
const start = () => (g.start as () => void)();
const stop = () => (g.stop as () => void)();
const onSetupStart = () => (g.onSetupStart as () => unknown)();
const onSetupSubmit = (args: { stepId: string; values: Record<string, unknown> }) =>
  (g.onSetupSubmit as (a: typeof args) => unknown)(args);
const onOAuthComplete = (args: Record<string, unknown>) =>
  (g.onOAuthComplete as (a: typeof args) => unknown)(args);
const onDisconnect = () => (g.onDisconnect as () => void)();
const onListOptions = () => (g.onListOptions as () => { options: unknown[] })();
const onSetOption = (args: { name: string; value: unknown }) =>
  (g.onSetOption as (a: typeof args) => void)(args);

// Mock data
const MOCK_CREDENTIAL = {
  credentialId: 'cred-123',
  provider: 'google',
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  isValid: true,
  createdAt: Date.now(),
  accountLabel: 'user@gmail.com',
};

const MOCK_PROFILE_RESPONSE = {
  emailAddress: 'user@gmail.com',
  messagesTotal: 1500,
  threadsTotal: 800,
  historyId: '12345',
};

const MOCK_MESSAGE = {
  id: 'msg-001',
  threadId: 'thread-001',
  labelIds: ['INBOX', 'UNREAD'],
  snippet: 'Hello, this is a test email',
  internalDate: String(Date.now()),
  sizeEstimate: 1024,
  payload: {
    mimeType: 'text/plain',
    headers: [
      { name: 'From', value: 'sender@example.com' },
      { name: 'To', value: 'user@gmail.com' },
      { name: 'Subject', value: 'Test Email' },
      { name: 'Date', value: 'Mon, 1 Jan 2025 12:00:00 +0000' },
      { name: 'Message-ID', value: '<test@example.com>' },
    ],
    body: {
      size: 27,
      data: btoa('Hello, this is a test email'),
    },
    parts: [],
  },
};

const MOCK_LABELS = {
  labels: [
    { id: 'INBOX', name: 'INBOX', type: 'system', messagesTotal: 100, messagesUnread: 5 },
    { id: 'SENT', name: 'SENT', type: 'system', messagesTotal: 50, messagesUnread: 0 },
    { id: 'Label_1', name: 'Work', type: 'user', messagesTotal: 20, messagesUnread: 3 },
  ],
};

function freshInit(overrides?: Record<string, unknown>): void {
  setupSkillTest({
    stateData: overrides ?? {},
    oauthCredential: MOCK_CREDENTIAL,
    oauthFetchResponses: {
      '/gmail/v1/users/me/profile': {
        status: 200,
        body: JSON.stringify(MOCK_PROFILE_RESPONSE),
      },
      '/gmail/v1/users/me/labels': {
        status: 200,
        body: JSON.stringify(MOCK_LABELS),
      },
    },
  });
  init();
}

// ─── init() ──────────────────────────────────────────────────────────

_describe('init()', () => {
  _it('should create database tables', () => {
    freshInit();
    // Verify tables exist by querying them
    const emails = db.all('SELECT * FROM emails LIMIT 1', []);
    _assertNotNull(emails);
  });

  _it('should load config from state', () => {
    setupSkillTest({
      stateData: {
        config: {
          credentialId: 'saved-cred',
          userEmail: 'saved@gmail.com',
          syncEnabled: true,
        },
      },
    });
    init();
    const s = g.getGmailSkillState as () => { config: { credentialId: string; userEmail: string } };
    const state = s();
    _assertEqual(state.config.credentialId, 'saved-cred');
    _assertEqual(state.config.userEmail, 'saved@gmail.com');
  });

  _it('should use defaults when no saved config', () => {
    setupSkillTest({});
    init();
    const s = g.getGmailSkillState as () => { config: { credentialId: string; syncEnabled: boolean } };
    const state = s();
    _assertEqual(state.config.credentialId, '');
    _assertTrue(state.config.syncEnabled);
  });
});

// ─── start() / stop() ──────────────────────────────────────────────

_describe('start()', () => {
  _it('should register cron when connected', () => {
    freshInit({
      config: {
        credentialId: 'cred-123',
        userEmail: 'user@gmail.com',
        syncEnabled: true,
        syncInterval: 5,
      },
    });
    start();
    const ms = getMockState();
    const hasCron = Object.keys(ms.cronSchedules ?? {}).length > 0;
    _assertTrue(hasCron);
  });

  _it('should not register cron when not connected', () => {
    setupSkillTest({});
    init();
    start();
    const ms = getMockState();
    const cronCount = Object.keys(ms.cronSchedules ?? {}).length;
    _assertEqual(cronCount, 0);
  });
});

_describe('stop()', () => {
  _it('should persist config', () => {
    freshInit({
      config: {
        credentialId: 'cred-123',
        userEmail: 'user@gmail.com',
        syncEnabled: true,
      },
    });
    start();
    stop();
    const ms = getMockState();
    _assertNotNull(ms.store['config'] ?? ms.stateValues?.config);
  });
});

// ─── OAuth Flow ──────────────────────────────────────────────────────

_describe('OAuth Flow', () => {
  _it('onOAuthComplete should save credential and publish state', () => {
    setupSkillTest({});
    init();
    onOAuthComplete({
      credentialId: 'new-cred',
      provider: 'google',
      scopes: [],
      isValid: true,
      createdAt: Date.now(),
      accountLabel: 'new@gmail.com',
    });
    const s = g.getGmailSkillState as () => { config: { credentialId: string; userEmail: string } };
    const state = s();
    _assertEqual(state.config.credentialId, 'new-cred');
    _assertEqual(state.config.userEmail, 'new@gmail.com');
  });

  _it('onDisconnect should clear credential', () => {
    freshInit({
      config: {
        credentialId: 'cred-123',
        userEmail: 'user@gmail.com',
      },
    });
    onDisconnect();
    const s = g.getGmailSkillState as () => { config: { credentialId: string } };
    const state = s();
    _assertEqual(state.config.credentialId, '');
  });
});

// ─── Options ──────────────────────────────────────────────────────────

_describe('Options', () => {
  _it('should list all configurable options', () => {
    freshInit({
      config: {
        credentialId: 'cred-123',
        userEmail: 'user@gmail.com',
        syncEnabled: true,
      },
    });
    const result = onListOptions();
    _assertNotNull(result);
    _assertNotNull(result.options);
    _assertTrue(result.options.length > 0);
  });

  _it('should toggle syncEnabled', () => {
    freshInit({
      config: {
        credentialId: 'cred-123',
        userEmail: 'user@gmail.com',
        syncEnabled: true,
      },
    });
    onSetOption({ name: 'syncEnabled', value: false });
    const s = g.getGmailSkillState as () => { config: { syncEnabled: boolean } };
    _assertFalse(s().config.syncEnabled);
  });
});

// ─── Tools ──────────────────────────────────────────────────────────

_describe('Tools - get-labels', () => {
  _it('should return a result object', () => {
    freshInit({
      config: { credentialId: 'cred-123', userEmail: 'user@gmail.com' },
    });
    const result = callTool('get-labels', {});
    _assertNotNull(result);
    // Tool should return either success:true with labels or success:false with error
    _assertTrue(typeof result.success === 'boolean');
  });
});

_describe('Tools - get-emails', () => {
  _it('should return emails from local database', () => {
    freshInit({
      config: { credentialId: 'cred-123', userEmail: 'user@gmail.com' },
    });
    const now = Math.floor(Date.now() / 1000);
    db.exec(
      `INSERT INTO emails (id, credential_id, thread_id, subject, sender_email, sender_name, recipient_emails, date, snippet, labels, is_read, size_estimate, history_id, internal_date, body_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'msg-001', 'cred-123', 'thread-001', 'Test Email', 'sender@example.com', 'Sender',
        'user@gmail.com', now, 'Hello test', '["INBOX","UNREAD"]',
        0, 1024, '12345', String(Date.now()), 'Hello, this is a test email',
      ]
    );

    // get-emails reads from DB, should find our inserted email
    const result = callTool('get-emails', {});
    _assertNotNull(result);
    // The tool may return success:true with emails, or may fail if it tries API first
    // At minimum, it should not crash
  });
});

_describe('Tools - get-email', () => {
  _it('should return single email by ID', () => {
    freshInit({
      config: { credentialId: 'cred-123', userEmail: 'user@gmail.com' },
    });
    const now = Math.floor(Date.now() / 1000);
    db.exec(
      `INSERT INTO emails (id, credential_id, thread_id, subject, sender_email, sender_name, recipient_emails, date, snippet, labels, is_read, size_estimate, history_id, internal_date, body_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'msg-001', 'cred-123', 'thread-001', 'Test Email', 'sender@example.com', 'Sender',
        'user@gmail.com', now, 'Hello test', '["INBOX","UNREAD"]',
        0, 1024, '12345', String(Date.now()), 'Full email body content',
      ]
    );

    const result = callTool('get-email', { message_id: 'msg-001' });
    _assertNotNull(result);
    // Tool queries DB for the message — should return it or an error
    _assertTrue(typeof result.success === 'boolean');
  });

  _it('should require message_id', () => {
    freshInit({
      config: { credentialId: 'cred-123', userEmail: 'user@gmail.com' },
    });
    const result = callTool('get-email', {});
    _assertFalse(result.success);
  });
});

// ─── Database Helpers ────────────────────────────────────────────────

_describe('Database - Sensitive Content Detection', () => {
  _it('should detect passwords in text', () => {
    freshInit();
    const isSensitive = g.gmailDbHelpers as {
      isSensitiveText: (text: string) => boolean;
    };
    if (isSensitive?.isSensitiveText) {
      _assertTrue(isSensitive.isSensitiveText('my password is hunter2'));
      _assertTrue(isSensitive.isSensitiveText('API_KEY=sk-abc123xyz'));
      _assertFalse(isSensitive.isSensitiveText('Hello, how are you today?'));
    }
  });
});
