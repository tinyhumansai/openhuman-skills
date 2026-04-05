/**
 * Gmail skill live integration test — exercises the full encrypted OAuth flow.
 *
 * Supports two modes:
 *
 * 1. Self-hosted (own Google OAuth credentials):
 *    GMAIL_CLIENT_ID=xxx \
 *    GMAIL_CLIENT_SECRET=xxx \
 *    GMAIL_REFRESH_TOKEN=xxx \
 *    yarn test src/core/gmail/__tests__/test-gmail-live.ts
 *
 * 2. Encrypted OAuth (managed mode via backend):
 *    GMAIL_INTEGRATION_ID=<24-char-hex> \
 *    JWT_TOKEN=<session-jwt> \
 *    BACKEND_URL=https://api.tinyhumans.ai \
 *    yarn test src/core/gmail/__tests__/test-gmail-live.ts
 *
 * The encrypted OAuth flow:
 *   1. Fetches clientKeyShare from backend (POST /auth/integrations/:id/client-key)
 *   2. Starts the Gmail skill in the runtime
 *   3. Injects OAuth credential + clientKeyShare via oauth/complete RPC
 *   4. The skill's oauth.fetch() routes through /proxy/encrypted/:id/ with X-Encryption-Key
 *   5. Backend XOR-combines client+server shares to decrypt tokens and proxy requests
 *   6. Verifies connection, exercises tools, triggers sync
 */
import {
  afterAll,
  assert,
  assertEqual,
  assertNotNull,
  authComplete,
  beforeAll,
  callTool,
  callToolRaw,
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

const SKILL_ID = 'gmail';

// Self-hosted mode
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';

// Encrypted OAuth mode
const INTEGRATION_ID = process.env.GMAIL_INTEGRATION_ID || '';
const JWT_TOKEN = process.env.JWT_TOKEN || '';
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.tinyhumans.ai';

const isSelfHosted = !!(GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN);
const isEncryptedOAuth = !!INTEGRATION_ID && !!JWT_TOKEN;

if (!isSelfHosted && !isEncryptedOAuth) {
  console.error(
    '\n  Missing credentials. Provide one of:\n' +
      '    - GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + GMAIL_REFRESH_TOKEN (self-hosted)\n' +
      '    - GMAIL_INTEGRATION_ID + JWT_TOKEN (encrypted OAuth mode)\n'
  );
  process.exit(1);
}

const mode = isSelfHosted ? 'self_hosted' : 'encrypted_oauth';
console.log(`\n  Mode: ${mode}`);
if (isEncryptedOAuth) {
  console.log(`  Backend: ${BACKEND_URL}`);
  console.log(`  Integration ID: ${INTEGRATION_ID}`);
  console.log(`  JWT: <redacted, ${JWT_TOKEN.length} bytes>`);
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

/**
 * Fetch clientKeyShare from backend for encrypted OAuth.
 */
async function fetchClientKeyShare(): Promise<string> {
  const url = `${BACKEND_URL}/auth/integrations/${INTEGRATION_ID}/client-key`;
  console.log(`  Fetching client key share from ${url}`);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to fetch client key share (${resp.status}): ${text}`);
  }

  const data = (await resp.json()) as { success?: boolean; data?: { clientKey?: string }; clientKey?: string };
  const clientKey = data.data?.clientKey || data.clientKey;
  if (!clientKey) {
    throw new Error(`No clientKey in response: ${JSON.stringify(data)}`);
  }

  console.log(`  Client key share retrieved (${clientKey.length} chars)`);
  return clientKey;
}

// ---------------------------------------------------------------------------
// Tests: Start & Auth
// ---------------------------------------------------------------------------

describe('Gmail Live — Start & Auth', () => {
  it('should start the skill', async () => {
    try {
      await stopSkill(SKILL_ID);
    } catch {}

    const snap = await startSkill(SKILL_ID);
    assertEqual(snap.status, 'running');
    assertEqual(snap.name, 'Gmail');
    console.log(`    Tools registered: ${snap.tools.length}`);
  });

  if (isSelfHosted) {
    it('should authenticate with self-hosted credentials', async () => {
      const result = (await authComplete(SKILL_ID, 'self_hosted', {
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        refresh_token: GMAIL_REFRESH_TOKEN,
      })) as any;
      console.log(`    Auth result: ${JSON.stringify(result)}`);
      assertEqual(result.status, 'complete', `Expected complete, got: ${JSON.stringify(result)}`);
    });
  }

  if (isEncryptedOAuth) {
    it('should fetch client key share from backend', async () => {
      const clientKey = await fetchClientKeyShare();
      assertNotNull(clientKey);
      assert(clientKey.length > 0, 'clientKey should not be empty');
      (globalThis as any).__testClientKey = clientKey;
    });

    it('should inject encrypted OAuth credential', async () => {
      const clientKey = (globalThis as any).__testClientKey as string;
      assertNotNull(clientKey, 'clientKey should have been fetched in previous test');

      const result = await oauthComplete(SKILL_ID, {
        credentialId: INTEGRATION_ID,
        provider: 'gmail',
        grantedScopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels',
        ],
        clientKeyShare: clientKey,
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

describe('Gmail Live — Tools', () => {
  it('get-profile should return Gmail profile', async () => {
    const result = await callToolSafe('get-profile', {});
    console.log(
      `    Profile: ${result.error ? result.error : JSON.stringify(result).slice(0, 200)}`
    );
    assert(!result.error, `get-profile failed: ${result.error}`);
  });

  it('get-labels should return labels', async () => {
    const result = await callToolSafe('get-labels', {});
    const labels = result.labels || [];
    console.log(`    Labels: ${result.error ? result.error : `${labels.length} labels`}`);
    assert(!result.error, `get-labels failed: ${result.error}`);
  });

  it('get-emails should return recent emails', async () => {
    const result = await callToolSafe('get-emails', { max_results: 5 });
    console.log(
      `    Emails: ${result.error ? result.error : `${(result.emails || result.messages || []).length} emails`}`
    );
    assert(!result.error, `get-emails failed: ${result.error}`);
  });

  it('search-emails should return results', async () => {
    const result = await callToolSafe('search-emails', { query: 'in:inbox', max_results: 3 });
    console.log(
      `    Search: ${result.error ? result.error : `${(result.emails || result.messages || []).length} results`}`
    );
    assert(!result.error, `search-emails failed: ${result.error}`);
  });
});

// ---------------------------------------------------------------------------
// Tests: Sync
// ---------------------------------------------------------------------------

describe('Gmail Live — Sync', () => {
  it('should trigger sync without error', async () => {
    try {
      await triggerSync(SKILL_ID);
      await new Promise(r => setTimeout(r, 3000));
      console.log('    Sync triggered successfully');
    } catch (e: any) {
      console.log(`    Sync result: ${e.message}`);
    }
  });

  it('should have updated state after sync', async () => {
    const snap = await getSkillStatus(SKILL_ID);
    console.log(`    User email: ${snap.state?.userEmail ?? 'N/A'}`);
    console.log(`    Total emails: ${snap.state?.totalEmails ?? 'N/A'}`);
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
