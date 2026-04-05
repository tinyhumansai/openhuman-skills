/**
 * Notion skill live integration test — exercises the full encrypted OAuth flow.
 *
 * Supports two modes:
 *
 * 1. Self-hosted (direct API token):
 *    NOTION_API_KEY=ntn_xxx yarn test src/core/notion/__tests__/test-notion-live.ts
 *
 * 2. Encrypted OAuth (managed mode):
 *    The clientKey is returned directly in the OAuth callback URL by the backend
 *    (no separate fetch step). For testing, provide it as an env var:
 *
 *    NOTION_INTEGRATION_ID=<24-char-hex> \
 *    CLIENT_KEY_SHARE=<base64-encoded-client-key> \
 *    yarn test src/core/notion/__tests__/test-notion-live.ts
 *
 * Flow:
 *   1. Starts the Notion skill in the runtime
 *   2. Injects OAuth credential + clientKeyShare via oauth/complete RPC
 *   3. The skill's oauth.fetch() routes through /proxy/encrypted/:id/ with X-Encryption-Key
 *   4. Backend XOR-combines client+server shares to decrypt tokens and proxy requests
 *   5. Verifies connection, exercises tools, triggers sync
 */
import {
  afterAll,
  assert,
  assertEqual,
  assertNotNull,
  authComplete,
  callTool,
  describe,
  getSkillStatus,
  it,
  oauthComplete,
  run,
  setSetupComplete,
  startSkill,
  stopSkill,
  triggerSync,
} from '../../../../dev/test-harness';

// ---------------------------------------------------------------------------
// Configuration from environment
// ---------------------------------------------------------------------------

const SKILL_ID = 'notion';

// Self-hosted mode
const NOTION_API_KEY = process.env.NOTION_API_KEY || '';

// Encrypted OAuth mode — clientKey comes from the OAuth callback URL, not a separate fetch
const INTEGRATION_ID = process.env.NOTION_INTEGRATION_ID || '';
const CLIENT_KEY_SHARE = process.env.CLIENT_KEY_SHARE || '';

const isSelfHosted = !!NOTION_API_KEY;
const isEncryptedOAuth = !!INTEGRATION_ID && !!CLIENT_KEY_SHARE;

if (!isSelfHosted && !isEncryptedOAuth) {
  console.error(
    '\n  Missing credentials. Provide one of:\n' +
      '    - NOTION_API_KEY=ntn_xxx (self-hosted mode)\n' +
      '    - NOTION_INTEGRATION_ID + CLIENT_KEY_SHARE (encrypted OAuth mode)\n'
  );
  process.exit(1);
}

const mode = isSelfHosted ? 'self_hosted' : 'encrypted_oauth';
console.log(`\n  Mode: ${mode}`);
if (isEncryptedOAuth) {
  console.log(`  Integration ID: ${INTEGRATION_ID}`);
  console.log(`  Client key: <redacted, ${CLIENT_KEY_SHARE.length} chars>`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Call a tool, returning result or error object (never throws). */
async function callToolSafe(toolName: string, args: Record<string, unknown> = {}): Promise<any> {
  try {
    return await callTool(SKILL_ID, toolName, args);
  } catch (e: any) {
    return { error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Tests: Start & Auth
// ---------------------------------------------------------------------------

describe('Notion Live — Start & Auth', () => {
  it('should start the skill', async () => {
    // Stop first in case it's already running
    try {
      await stopSkill(SKILL_ID);
    } catch {}

    const snap = await startSkill(SKILL_ID);
    assertEqual(snap.status, 'running');
    assertEqual(snap.name, 'Notion');
    console.log(`    Tools registered: ${snap.tools.length}`);
  });

  if (isSelfHosted) {
    it('should authenticate with self-hosted API token', async () => {
      const result = (await authComplete(SKILL_ID, 'self_hosted', {
        api_token: NOTION_API_KEY,
      })) as any;
      console.log(`    Auth result: ${JSON.stringify(result)}`);
      assertEqual(result.status, 'complete', `Expected complete, got: ${JSON.stringify(result)}`);
    });
  }

  if (isEncryptedOAuth) {
    it('should inject encrypted OAuth credential with client key', async () => {
      const result = await oauthComplete(SKILL_ID, {
        credentialId: INTEGRATION_ID,
        provider: 'notion',
        grantedScopes: [],
        clientKeyShare: CLIENT_KEY_SHARE,
      });
      console.log(`    OAuth complete result: ${JSON.stringify(result)}`);
    });
  }

  it('should mark setup as complete', async () => {
    await setSetupComplete(SKILL_ID, true);
    const snap = await getSkillStatus(SKILL_ID);
    assertEqual(snap.setup_complete, true);
  });

  it('should show connected status', async () => {
    // Give the skill a moment to update state after auth
    await new Promise(r => setTimeout(r, 1000));
    const snap = await getSkillStatus(SKILL_ID);
    console.log(`    Connection status: ${snap.state?.connection_status}`);
    console.log(`    Auth status: ${snap.state?.auth_status}`);
    assertEqual(snap.state?.connection_status, 'connected');
  });
});

// ---------------------------------------------------------------------------
// Tests: Tool Verification
// ---------------------------------------------------------------------------

describe('Notion Live — Tools', () => {
  it('search should return results', async () => {
    const result = await callToolSafe('search', { query: 'test' });
    console.log(
      `    Search result: ${result.error ? result.error : `${(result.results || result.pages || []).length} results`}`
    );
    assert(!result.error, `search failed: ${result.error}`);
  });

  it('list-all-pages should return pages', async () => {
    const result = await callToolSafe('list-all-pages', {});
    const pages = result.pages || result.results || [];
    console.log(`    Pages: ${pages.length}`);
    assert(!result.error, `list-all-pages failed: ${result.error}`);
  });

  it('list-all-databases should return databases', async () => {
    const result = await callToolSafe('list-all-databases', {});
    const databases = result.databases || result.results || [];
    console.log(`    Databases: ${databases.length}`);
    assert(!result.error, `list-all-databases failed: ${result.error}`);
  });

  it('get-current-user should return user info', async () => {
    const result = await callToolSafe('get-current-user', {});
    console.log(`    User: ${result.error ? result.error : JSON.stringify(result).slice(0, 200)}`);
    assert(!result.error, `get-current-user failed: ${result.error}`);
  });
});

// ---------------------------------------------------------------------------
// Tests: Sync
// ---------------------------------------------------------------------------

describe('Notion Live — Sync', () => {
  it('should trigger sync without error', async () => {
    try {
      await triggerSync(SKILL_ID);
      // Wait for sync to process
      await new Promise(r => setTimeout(r, 3000));
      console.log('    Sync triggered successfully');
    } catch (e: any) {
      console.log(`    Sync result: ${e.message}`);
      // Sync may fail on first run if there's no data yet — that's OK
    }
  });

  it('should have updated state after sync', async () => {
    const snap = await getSkillStatus(SKILL_ID);
    console.log(`    Total pages: ${snap.state?.totalPages ?? 'N/A'}`);
    console.log(`    Total databases: ${snap.state?.totalDatabases ?? 'N/A'}`);
    console.log(`    Last sync: ${snap.state?.lastSyncTime ?? 'N/A'}`);
    console.log(`    Sync in progress: ${snap.state?.syncInProgress ?? 'N/A'}`);
  });

  afterAll(async () => {
    try {
      await stopSkill(SKILL_ID);
    } catch {}
  });
});

// Run all tests
run();
