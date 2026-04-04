// test-notion.ts — Tests for the Notion skill.
// Updated for the current auth bridge architecture (oauth + auth APIs).
import {
  _assert,
  _assertContains,
  _assertEqual,
  _assertNotNull,
  _callTool,
  _describe,
  _getMockState,
  _it,
  _setup,
} from '../../../test-harness-globals';

// Mock Notion API responses
const MOCK_USER_ME = { object: 'user', id: 'user-123', name: 'Test Bot', type: 'bot' };

const MOCK_PAGE = {
  object: 'page',
  id: 'page-abc-123',
  url: 'https://notion.so/Test-Page-abc123',
  created_time: '2024-01-01T00:00:00.000Z',
  last_edited_time: '2024-01-02T00:00:00.000Z',
  archived: false,
  parent: { type: 'workspace' },
  properties: { title: { type: 'title', title: [{ plain_text: 'Test Page' }] } },
};

const MOCK_DATABASE = {
  object: 'database',
  id: 'db-xyz-789',
  url: 'https://notion.so/Test-Database-xyz789',
  created_time: '2024-01-01T00:00:00.000Z',
  last_edited_time: '2024-01-02T00:00:00.000Z',
  title: [{ plain_text: 'Test Database' }],
  properties: {
    Name: { id: 'title', type: 'title', title: {} },
    Status: {
      id: 'status',
      type: 'select',
      select: { options: [{ name: 'Todo' }, { name: 'Done' }] },
    },
  },
  data_sources: [{ id: 'ds-123', name: 'Test Data Source' }],
};

const MOCK_BLOCK = {
  object: 'block',
  id: 'block-def-456',
  type: 'paragraph',
  has_children: false,
  paragraph: { rich_text: [{ plain_text: 'Hello world' }] },
};

const MOCK_SEARCH_RESULTS = { results: [MOCK_PAGE, MOCK_DATABASE], has_more: false };

const VALID_TOKEN = 'ntn_test_token_12345';

const NOTION_API = 'https://api.notion.com/v1';

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/** Reset mocks and re-init with clean defaults (no auth) */
function freshInit(overrides?: {
  config?: Record<string, unknown>;
  fetchResponses?: Record<string, { status: number; body: string }>;
  oauthCredential?: Record<string, unknown> | null;
  authCredential?: { mode: string; credentials: Record<string, string> } | null;
}): void {
  _setup({
    stateData: { config: overrides?.config || {} },
    fetchResponses: overrides?.fetchResponses || {},
    oauthCredential: overrides?.oauthCredential as any,
    authCredential: overrides?.authCredential as any,
  });
  (globalThis as any).init();
}

/** Init with self-hosted token auth and mock API responses */
function configuredInitWithToken(
  additionalFetchResponses?: Record<string, { status: number; body: string }>
): void {
  const fetchResponses: Record<string, { status: number; body: string }> = {
    [`${NOTION_API}/users/me`]: { status: 200, body: JSON.stringify(MOCK_USER_ME) },
    [`${NOTION_API}/search`]: { status: 200, body: JSON.stringify(MOCK_SEARCH_RESULTS) },
    ...additionalFetchResponses,
  };

  freshInit({
    config: { workspaceName: 'Test Workspace' },
    fetchResponses,
    authCredential: { mode: 'text', credentials: { content: VALID_TOKEN } },
  });
}

/** Init with OAuth credentials and mock API responses */
function configuredInitWithOAuth(
  additionalFetchResponses?: Record<string, { status: number; body: string }>
): void {
  const oauthFetchResponses: Record<string, { status: number; body: string }> = {
    [`${NOTION_API}/users/me`]: { status: 200, body: JSON.stringify(MOCK_USER_ME) },
    [`${NOTION_API}/search`]: { status: 200, body: JSON.stringify(MOCK_SEARCH_RESULTS) },
    ...additionalFetchResponses,
  };

  // For OAuth, the skill uses oauth.fetch (proxy) which reads from oauthFetchResponses
  _setup({
    stateData: { config: { workspaceName: 'OAuth Workspace' } },
    fetchResponses: oauthFetchResponses,
    oauthCredential: {
      credentialId: 'cred-123',
      provider: 'notion',
      scopes: [],
      isValid: true,
      createdAt: Date.now(),
    } as any,
    oauthFetchResponses: oauthFetchResponses,
  });
  (globalThis as any).init();
}

// ─────────────────────────────────────────────────────────────────────────────
// init() tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('init()', () => {
  _it('should handle missing config gracefully', () => {
    freshInit();
    _assert(true, 'should initialize without errors');
  });

  _it('should load config from store', () => {
    freshInit({
      config: { workspaceName: 'My Workspace' },
      authCredential: { mode: 'text', credentials: { content: VALID_TOKEN } },
    });
    const s = (globalThis as any).getNotionSkillState();
    _assertNotNull(s);
    _assertEqual(s.config.workspaceName, 'My Workspace');
  });

  _it('should detect auth credential on init', () => {
    freshInit({
      authCredential: { mode: 'text', credentials: { content: VALID_TOKEN } },
    });
    // The skill should detect the credential and publish connected state
    const mock = _getMockState();
    _assertEqual(mock.state['connection_status'], 'connected');
  });

  _it('should detect OAuth credential on init', () => {
    configuredInitWithOAuth();
    const mock = _getMockState();
    _assertEqual(mock.state['connection_status'], 'connected');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// start() tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('start()', () => {
  _it('should publish connected state when configured', () => {
    configuredInitWithToken();
    (globalThis as any).start();
    const mock = _getMockState();
    _assertEqual(mock.state['connection_status'], 'connected');
  });

  _it('should not fail when not configured', () => {
    freshInit();
    (globalThis as any).start();
    _assert(true, 'should start without errors');
  });

  _it('should publish disconnected state when no credentials', () => {
    freshInit();
    (globalThis as any).start();
    const mock = _getMockState();
    _assertEqual(mock.state['connection_status'], 'disconnected');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Setup flow tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('Setup flow', () => {
  _it('onSetupStart should return auth_done step', () => {
    freshInit();
    const result = (globalThis as any).onSetupStart();
    _assertNotNull(result);
    _assertNotNull(result.step);
    _assertEqual(result.step.id, 'auth_done');
  });

  _it('onSetupSubmit auth_done should complete', () => {
    freshInit();
    const result = (globalThis as any).onSetupSubmit({ stepId: 'auth_done', values: {} });
    _assertEqual(result.status, 'complete');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Disconnect tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('Disconnect', () => {
  _it('onDisconnect should clear config and publish disconnected state', () => {
    configuredInitWithToken();
    (globalThis as any).start();
    // Disconnect clears internal state
    (globalThis as any).onDisconnect();
    // Verify config was deleted from store
    const mock = _getMockState();
    // The disconnect removes the config key
    _assert(mock.state['connection_status'] === 'disconnected' || mock.store['config'] === undefined,
      'should disconnect or clear config');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search tool tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('search tool', () => {
  _it('should search pages and databases', () => {
    configuredInitWithToken();
    const result = _callTool('search', { query: 'test' });
    _assertNotNull(result);
    _assert(result.success !== false, 'should not fail');
  });

  _it('should handle empty results', () => {
    configuredInitWithToken({
      [`${NOTION_API}/search`]: {
        status: 200,
        body: JSON.stringify({ results: [], has_more: false }),
      },
    });
    const result = _callTool('search', { query: 'nonexistent' });
    _assertNotNull(result);
  });

  _it('should require connection', () => {
    freshInit();
    const result = _callTool('search', { query: 'test' });
    _assertNotNull(result);
    _assert(result.error, 'should return error when not connected');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Page tools tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('Page tools', () => {
  _it('get-page should return page details', () => {
    configuredInitWithToken({
      [`${NOTION_API}/pages/page-123`]: { status: 200, body: JSON.stringify(MOCK_PAGE) },
    });
    const result = _callTool('get-page', { page_id: 'page-123' });
    _assertNotNull(result);
    _assert(result.success !== false || result.id, 'should return page or success');
  });

  _it('get-page should require page_id', () => {
    configuredInitWithToken();
    const result = _callTool('get-page', {});
    _assert(result.error, 'should return error');
  });

  _it('create-page should create page', () => {
    configuredInitWithToken({
      [`${NOTION_API}/pages`]: { status: 200, body: JSON.stringify(MOCK_PAGE) },
    });
    const result = _callTool('create-page', { parent_id: 'parent-123', title: 'New Page' });
    _assertNotNull(result);
    _assertEqual(result.success, true);
  });

  _it('create-page should require parent_id and title', () => {
    configuredInitWithToken();
    const result1 = _callTool('create-page', { title: 'Test' });
    _assert(result1.error, 'should require parent_id');
    const result2 = _callTool('create-page', { parent_id: '123' });
    _assert(result2.error, 'should require title');
  });

  _it('delete-page should archive page', () => {
    configuredInitWithToken({
      [`${NOTION_API}/pages/page-123`]: {
        status: 200,
        body: JSON.stringify({ ...MOCK_PAGE, archived: true }),
      },
    });
    const result = _callTool('delete-page', { page_id: 'page-123' });
    _assertEqual(result.success, true);
  });

  _it('list-all-pages should return pages', () => {
    configuredInitWithToken();
    const result = _callTool('list-all-pages', {});
    _assertNotNull(result);
    // May return from local DB or API — just verify structure
    _assert(result.success !== false, 'should not fail');
  });

  _it('append-text should append content', () => {
    configuredInitWithToken({
      [`${NOTION_API}/blocks/page-123/children`]: {
        status: 200,
        body: JSON.stringify({ results: [MOCK_BLOCK] }),
      },
    });
    const result = _callTool('append-text', { block_id: 'page-123', text: 'Hello world' });
    _assertEqual(result.success, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Database tools tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('Database tools', () => {
  _it('get-database should return database schema', () => {
    configuredInitWithToken({
      [`${NOTION_API}/databases/db-123`]: {
        status: 200,
        body: JSON.stringify(MOCK_DATABASE),
      },
    });
    const result = _callTool('get-database', { database_id: 'db-123' });
    _assertNotNull(result);
    _assert(result.success !== false, 'should not fail');
  });

  _it('query-database should return rows', () => {
    configuredInitWithToken({
      [`${NOTION_API}/databases/db-123`]: {
        status: 200,
        body: JSON.stringify(MOCK_DATABASE),
      },
      [`${NOTION_API}/databases/db-123/query`]: {
        status: 200,
        body: JSON.stringify({ results: [MOCK_PAGE], has_more: false }),
      },
    });
    const result = _callTool('query-database', { database_id: 'db-123' });
    _assertNotNull(result);
  });

  _it('list-all-databases should return databases', () => {
    configuredInitWithToken();
    const result = _callTool('list-all-databases', {});
    _assertNotNull(result);
    _assert(result.success !== false, 'should not fail');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Block tools tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('Block tools', () => {
  _it('get-block should return block', () => {
    configuredInitWithToken({
      [`${NOTION_API}/blocks/block-123`]: {
        status: 200,
        body: JSON.stringify(MOCK_BLOCK),
      },
    });
    const result = _callTool('get-block', { block_id: 'block-123' });
    _assertNotNull(result);
    _assert(result.success !== false, 'should not fail');
  });

  _it('get-block-children should return children', () => {
    configuredInitWithToken({
      [`${NOTION_API}/blocks/page-123/children?page_size=50`]: {
        status: 200,
        body: JSON.stringify({ results: [MOCK_BLOCK], has_more: false }),
      },
    });
    const result = _callTool('get-block-children', { block_id: 'page-123' });
    _assertNotNull(result);
  });

  _it('delete-block should delete block', () => {
    configuredInitWithToken({
      [`${NOTION_API}/blocks/block-123`]: { status: 200, body: JSON.stringify({ object: 'block', id: 'block-123' }) },
    });
    const result = _callTool('delete-block', { block_id: 'block-123' });
    _assertNotNull(result);
    _assert(!result.error, 'should not return error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// User tools tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('User tools', () => {
  _it('list-users should return users', () => {
    configuredInitWithToken({
      [`${NOTION_API}/users?page_size=20`]: {
        status: 200,
        body: JSON.stringify({ results: [MOCK_USER_ME], has_more: false }),
      },
    });
    const result = _callTool('list-users', {});
    _assertNotNull(result);
    _assert(result.success !== false, 'should not fail');
  });

  _it('get-user should return user', () => {
    configuredInitWithToken({
      [`${NOTION_API}/users/user-123`]: {
        status: 200,
        body: JSON.stringify(MOCK_USER_ME),
      },
    });
    const result = _callTool('get-user', { user_id: 'user-123' });
    _assertNotNull(result);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Comment tools tests
// ─────────────────────────────────────────────────────────────────────────────

_describe('Comment tools', () => {
  _it('create-comment should create comment', () => {
    configuredInitWithToken({
      [`${NOTION_API}/comments`]: {
        status: 200,
        body: JSON.stringify({
          id: 'comment-123',
          discussion_id: 'disc-456',
          created_time: '2024-01-01T00:00:00.000Z',
          rich_text: [{ plain_text: 'Test comment' }],
        }),
      },
    });
    const result = _callTool('create-comment', { page_id: 'page-123', text: 'Test comment' });
    _assertNotNull(result);
    _assert(!result.error, 'should not return error');
  });

  _it('create-comment should require page_id or discussion_id', () => {
    configuredInitWithToken();
    const result = _callTool('create-comment', { text: 'Test' });
    _assert(result.error, 'should return error');
  });

  _it('list-comments should return comments', () => {
    configuredInitWithToken({
      [`${NOTION_API}/comments?block_id=page-123&page_size=20`]: {
        status: 200,
        body: JSON.stringify({
          results: [
            {
              id: 'comment-123',
              discussion_id: 'disc-456',
              created_time: '2024-01-01T00:00:00.000Z',
              created_by: { id: 'user-123' },
              rich_text: [{ plain_text: 'Test comment' }],
            },
          ],
          has_more: false,
        }),
      },
    });
    const result = _callTool('list-comments', { block_id: 'page-123' });
    _assertNotNull(result);
    _assert(result.success !== false, 'should not fail');
  });
});
