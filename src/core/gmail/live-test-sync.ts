#!/usr/bin/env npx tsx

/**
 * Gmail sync live test.
 *
 * Starts the skill, authenticates, triggers sync, and polls until done.
 * Similar to the Notion sync test — just an observer.
 *
 * Credentials: set JWT_TOKEN + either encrypted OAuth (GMAIL_INTEGRATION_ID,
 * GMAIL_CLIENT_KEY_SHARE) or self-hosted (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET,
 * GMAIL_REFRESH_TOKEN), or run interactively (same flow as live-test.ts).
 *
 * Usage:
 *   npx tsx src/core/gmail/live-test-sync.ts
 *
 * Core must see BACKEND_URL + JWT_TOKEN (same as this script). From openhuman-skills:
 *   npm run serve:core -- --port 7788
 * Or run `openhuman serve` from the openhuman repo with `.env` present (auto-loaded) or
 * `OPENHUMAN_DOTENV_PATH` pointing at your `.env`.
 */
import * as readline from 'readline';
import { exec } from 'child_process';
import 'dotenv/config';

import {
  authComplete,
  callToolRaw,
  getSkillStatus,
  oauthComplete,
  setSetupComplete,
  skillRpc,
  startSkill,
  stopSkill,
} from '../../../dev/test-harness';

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

/** Print a cyan section header with horizontal rules. */
const header = (t: string) =>
  console.log(`\n${C.cyan}${'─'.repeat(60)}\n  ${t}\n${'─'.repeat(60)}${C.reset}`);
/** Print a blue in-progress step label (no newline). */
const step = (l: string) => process.stdout.write(`${C.blue}  ▸ ${l}${C.reset} `);
/** Print a green checkmark with optional dim detail. */
const ok = (d?: string) =>
  console.log(`${C.green}✓${C.reset}${d ? ` ${C.dim}${d}${C.reset}` : ''}`);
/** Print a red failure line. */
const fail = (d: string) => console.log(`${C.red}✗ ${d}${C.reset}`);
/** Print a dim key/value diagnostic line. */
const info = (l: string, v: unknown) => console.log(`${C.dim}    ${l}: ${C.reset}${v}`);
/** Current time as `HH:MM:SS` for poll logs. */
const ts = () => new Date().toISOString().slice(11, 19);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SKILL_ID = 'gmail';

/**
 * Invoke a Gmail skill tool via the test harness and parse JSON/text from the result.
 *
 * @param name - Tool name
 * @param args - Tool arguments
 * @param timeoutMs - RPC timeout
 */
async function callTool(
  name: string,
  args: Record<string, unknown> = {},
  timeoutMs = 15_000
): Promise<{ data?: any; error?: string; ms: number }> {
  const t0 = Date.now();
  try {
    const r = await callToolRaw(SKILL_ID, name, args, timeoutMs);
    const ms = Date.now() - t0;
    const text = r.content && r.content[0] ? r.content[0].text : '';
    if (r.is_error) return { error: text || 'unknown', ms };
    if (!text) return { data: null, ms };
    try {
      const p = JSON.parse(text);
      if (p.error && typeof p.error === 'string') return { error: p.error, ms };
      return { data: p, ms };
    } catch {
      return { data: text, ms };
    }
  } catch (e: any) {
    return { error: e.message, ms: Date.now() - t0 };
  }
}

/** Read the skill’s published state snapshot from the harness (or null on error). */
async function getState(): Promise<Record<string, unknown> | null> {
  try {
    const snap = await getSkillStatus(SKILL_ID);
    return (snap.state as Record<string, unknown>) || null;
  } catch {
    return null;
  }
}

/** Run an async function and return `[result, elapsedMs]`. */
function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const t0 = Date.now();
  return fn().then(r => [r, Date.now() - t0]);
}

// ---------------------------------------------------------------------------
// Prompt (interactive credential resolution)
// ---------------------------------------------------------------------------

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/**
 * Prompt for a line of input; empty input falls back to `defaultValue` when provided.
 */
function prompt(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` ${C.dim}[${defaultValue}]${C.reset}` : '';
  return new Promise(resolve => {
    rl.question(`${C.yellow}  ? ${question}${suffix}: ${C.reset}`, answer => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/** Prompt for a hidden secret (raw TTY mode); Ctrl+C exits the process. */
function promptSecret(question: string): Promise<string> {
  return new Promise(resolve => {
    process.stdout.write(`${C.yellow}  ? ${question}: ${C.reset}`);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    let input = '';
    const onData = (ch: Buffer) => {
      const c = ch.toString();
      if (c === '\n' || c === '\r') {
        if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
        stdin.removeListener('data', onData);
        console.log();
        resolve(input.trim());
      } else if (c === '\x7f' || c === '\b') {
        input = input.slice(0, -1);
      } else if (c === '\x03') {
        process.exit(1);
      } else {
        input += c;
      }
    };
    stdin.on('data', onData);
  });
}

/** Open a URL in the default browser (best-effort; logs if the command fails). */
function openUrl(url: string) {
  const cmd =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
        ? `start "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, err => {
    if (err) console.warn(`${C.dim}    (could not open browser: ${err.message})${C.reset}`);
  });
}

const GRANTED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
];

type ResolvedCreds =
  | { mode: 'encrypted_oauth'; integrationId: string; clientKeyShare: string }
  | { mode: 'self_hosted'; clientId: string; clientSecret: string; refreshToken: string };

/** Resolve JWT (required), then OAuth env or interactive — mirrors live-test.ts */
async function resolveCredentials(): Promise<ResolvedCreds> {
  const jwt = (process.env.JWT_TOKEN || '').trim();
  if (!jwt) {
    console.error(`\n${C.red}  JWT_TOKEN env var is required.${C.reset}`);
    console.error(
      `${C.dim}  Usage: JWT_TOKEN=<jwt> npx tsx src/core/gmail/live-test-sync.ts${C.reset}\n`
    );
    process.exit(1);
  }

  const BACKEND_URL = (process.env.BACKEND_URL || 'https://api.tinyhumans.ai').replace(/\/+$/, '');
  const ENV_AUTH_MODE = process.env.AUTH_MODE || '';
  const ENV_INTEGRATION_ID = (process.env.GMAIL_INTEGRATION_ID || '').trim();
  const ENV_CLIENT_KEY = (process.env.GMAIL_CLIENT_KEY_SHARE || '').trim();
  const ENV_CLIENT_ID = (process.env.GMAIL_CLIENT_ID || '').trim();
  const ENV_CLIENT_SECRET = (process.env.GMAIL_CLIENT_SECRET || '').trim();
  const ENV_REFRESH_TOKEN = (process.env.GMAIL_REFRESH_TOKEN || '').trim();

  const hasOAuthEnv = !!(ENV_INTEGRATION_ID && ENV_CLIENT_KEY);
  const hasSelfHostedEnv = !!(ENV_CLIENT_ID && ENV_CLIENT_SECRET && ENV_REFRESH_TOKEN);

  if (hasOAuthEnv || (ENV_AUTH_MODE === 'oauth' && hasOAuthEnv)) {
    header('Credentials (from env)');
    info('Mode', 'encrypted_oauth');
    info('Integration ID', ENV_INTEGRATION_ID);
    info('Client key', `<${ENV_CLIENT_KEY.length} chars>`);
    return {
      mode: 'encrypted_oauth',
      integrationId: ENV_INTEGRATION_ID,
      clientKeyShare: ENV_CLIENT_KEY,
    };
  }

  if (hasSelfHostedEnv || ENV_AUTH_MODE === 'self_hosted') {
    let clientId = ENV_CLIENT_ID;
    let clientSecret = ENV_CLIENT_SECRET;
    let refreshToken = ENV_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      header('Credentials');
      clientId = clientId || (await prompt('Google Client ID'));
      clientSecret = clientSecret || (await promptSecret('Google Client Secret'));
      refreshToken = refreshToken || (await promptSecret('Refresh Token'));
      if (!clientId || !clientSecret || !refreshToken) {
        console.error(`\n${C.red}  All three self-hosted fields are required.${C.reset}\n`);
        process.exit(1);
      }
    } else {
      header('Credentials (from env)');
    }
    info('Mode', 'self_hosted');
    info('Client ID', `${clientId.slice(0, 12)}...`);
    return { mode: 'self_hosted', clientId, clientSecret, refreshToken };
  }

  header('Authentication Mode');
  const choice = await prompt(
    'Auth mode — (1) Encrypted OAuth via browser  (2) Own OAuth credentials',
    '1'
  );
  const mode = choice === '2' ? 'self_hosted' : 'encrypted_oauth';

  if (mode === 'self_hosted') {
    const clientId = await prompt('Google Client ID');
    const clientSecret = await promptSecret('Google Client Secret');
    const refreshToken = await promptSecret('Refresh Token');
    if (!clientId || !clientSecret || !refreshToken) {
      console.error(`\n${C.red}  All three fields are required.${C.reset}\n`);
      process.exit(1);
    }
    return { mode: 'self_hosted', clientId, clientSecret, refreshToken };
  }

  header('OAuth Flow (browser)');
  step('Requesting OAuth URL from backend...');
  const connectUrl = `${BACKEND_URL}/auth/gmail/connect?skillId=gmail&responseType=json&encryptionMode=encrypted`;
  const connectResp = await fetch(connectUrl, { headers: { Authorization: `Bearer ${jwt}` } });
  if (!connectResp.ok) {
    const text = await connectResp.text();
    console.log(`${C.red}✗ Backend returned ${connectResp.status}: ${text}${C.reset}`);
    process.exit(1);
  }
  const connectData = (await connectResp.json()) as { oauthUrl?: string };
  const oauthUrl = connectData.oauthUrl;
  if (!oauthUrl) {
    console.log(`${C.red}✗ No oauthUrl in response: ${JSON.stringify(connectData)}${C.reset}`);
    process.exit(1);
  }
  ok();

  console.log(`\n${C.yellow}  Opening Google OAuth page in your browser...${C.reset}`);
  console.log(`${C.dim}  If it doesn't open, visit this URL manually:${C.reset}`);
  console.log(`${C.dim}  ${oauthUrl}${C.reset}\n`);
  openUrl(oauthUrl);

  console.log(
    `${C.yellow}  After authorizing, copy integrationId and clientKey from the JSON response.${C.reset}\n`
  );

  const integrationId = await prompt('Integration ID (24-char hex from callback)');
  const clientKeyShare = await promptSecret('Client key share (base64 from callback)');
  if (!integrationId || !clientKeyShare) {
    console.error(`\n${C.red}  Integration ID and client key share are required.${C.reset}\n`);
    process.exit(1);
  }
  return { mode: 'encrypted_oauth', integrationId, clientKeyShare };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** CLI entry: resolve creds, start skill, OAuth, trigger sync, poll, verify tools, stop. */
async function main() {
  console.log(`\n${C.bold}  Gmail Sync — Live Test${C.reset}`);

  const creds = await resolveCredentials();

  // ── 1. Setup ──────────────────────────────────────────────────────────

  header('1. Setup');

  step('Stop existing...');
  try {
    await stopSkill(SKILL_ID);
    ok();
  } catch {
    ok('(not running)');
  }

  step('Start skill...');
  const [snap, startMs] = await timed(() => startSkill(SKILL_ID));
  ok(`tools=${snap.tools.length} (${startMs}ms)`);

  step('OAuth...');
  if (creds.mode === 'encrypted_oauth') {
    const [, oauthMs] = await timed(() =>
      oauthComplete(SKILL_ID, {
        credentialId: creds.integrationId,
        provider: 'gmail',
        grantedScopes: GRANTED_SCOPES,
        clientKeyShare: creds.clientKeyShare,
      })
    );
    ok(`${oauthMs}ms`);
  } else {
    const [, oauthMs] = await timed(async () => {
      const result = (await authComplete(SKILL_ID, 'self_hosted', {
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        refresh_token: creds.refreshToken,
      })) as { status?: string; errors?: unknown };
      if (result.status !== 'complete') {
        throw new Error(JSON.stringify(result.errors || result));
      }
    });
    ok(`${oauthMs}ms`);
  }

  step('Setup complete...');
  const [, setupMs] = await timed(() => setSetupComplete(SKILL_ID, true));
  ok(`${setupMs}ms`);

  await new Promise(r => setTimeout(r, 1500));

  // ── 2. Pre-sync check ────────────────────────────────────────────────

  header('2. Pre-Sync');

  step('get-profile...');
  const {
    data: profile,
    error: profileErr,
    ms: profileMs,
  } = await callTool('get-profile', {}, 30_000);
  if (profileErr) {
    fail(`${profileErr} (${profileMs}ms)`);
  } else {
    ok(`${profile?.emailAddress || profile?.email || 'unknown'} (${profileMs}ms)`);
  }

  step('Checking state...');
  const preState = await getState();
  if (preState) {
    info('totalEmails', preState.totalEmails);
    info('syncInProgress', preState.syncInProgress);
    info('lastSyncTime', preState.lastSyncTime);
  }
  ok();

  // ── 3. Trigger sync ──────────────────────────────────────────────────

  header('3. Sync');

  step('Triggering skill/sync...');
  const [syncResult, triggerMs] = await timed(() => skillRpc(SKILL_ID, 'skill/sync', {}));
  ok(`${JSON.stringify(syncResult)} (${triggerMs}ms)`);

  // ── 4. Poll ──────────────────────────────────────────────────────────

  const t0 = Date.now();
  let lastLine = '';
  let stale = 0;

  while (Date.now() - t0 < 5 * 60 * 1000) {
    await new Promise(r => setTimeout(r, 2000));

    const s = await getState();
    if (!s) {
      console.log(`${C.yellow}    [${ts()}] state=null${C.reset}`);
      continue;
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    const pct = (s.syncProgress as number) || 0;
    const msg = (s.syncProgressMessage as string) || '';
    const total = (s.totalEmails as number) || 0;
    const newCount = (s.newEmailsCount as number) || 0;
    const inProg = s.syncInProgress;
    const err = s.lastError as string | null;

    const line = `${pct}|${msg}`;
    if (line === lastLine) {
      stale++;
    } else {
      stale = 0;
    }
    lastLine = line;

    const staleTag = stale >= 5 ? ` ${C.yellow}STALE(${stale})${C.reset}` : '';
    console.log(
      `    [${C.dim}${elapsed}s${C.reset}] ${C.cyan}[${pct}%]${C.reset} ` +
        `${msg} ` +
        `| total=${total} new=${newCount} run=${inProg}${staleTag}`
    );

    if (err) console.log(`    ${C.red}⚠ ${err}${C.reset}`);

    if (!inProg && (total > 0 || pct >= 100)) {
      if (err) {
        fail(`Sync error: ${err}`);
      } else {
        ok(`Sync done in ${elapsed}s — ${total} emails (${newCount} new)`);
      }
      break;
    }

    if (stale >= 30) {
      fail(`Stuck for ${stale} polls`);
      break;
    }
  }

  // ── 5. Results ───────────────────────────────────────────────────────

  header('4. Results');

  const post = await getState();
  if (post) {
    info('totalEmails', post.totalEmails);
    info('newEmailsCount', post.newEmailsCount);
    info('lastSyncTime', post.lastSyncTime);
    info('syncInProgress', post.syncInProgress);
    info('lastError', post.lastError || '(none)');
    info('userEmail', post.userEmail);

    if (post.lastError) fail(`${post.lastError}`);
    else if (post.lastSyncTime) ok();
    else fail('lastSyncTime not set');
  }

  // ── 6. Tool check ───────────────────────────────────────────────────

  header('5. Tools');

  for (const [tool, args, label] of [
    ['get-profile', {}, 'profile'] as const,
    ['get-labels', {}, 'labels'] as const,
    ['get-emails', { max_results: 5 }, 'emails'] as const,
  ]) {
    step(`${label}...`);
    const { data, error, ms } = await callTool(tool, args);
    if (error) fail(`${error} (${ms}ms)`);
    else {
      const count =
        label === 'labels'
          ? (data?.labels || []).length
          : label === 'emails'
            ? (data?.emails || data?.messages || []).length
            : 1;
      ok(`${count} ${label} (${ms}ms)`);
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────────

  step('Stop...');
  try {
    await stopSkill(SKILL_ID);
    ok();
  } catch (e: any) {
    fail(e.message);
  }

  console.log(`\n${C.green}${C.bold}  Done.${C.reset}\n`);
  process.exit(0);
}

main().catch(e => {
  console.error(`\n${C.red}Fatal: ${e.message}${C.reset}`);
  process.exit(1);
});
