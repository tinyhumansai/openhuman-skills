#!/usr/bin/env npx tsx

/**
 * Notion skill live integration script.
 *
 * Interactive sequential script that walks through the full skill lifecycle:
 *   start → authenticate → verify connection → exercise tools → verify sync
 *
 * Env vars (required):
 *   JWT_TOKEN       — session JWT from the OpenHuman backend
 *   BACKEND_URL     — backend API base (default: https://api.tinyhumans.ai)
 *
 * Usage:
 *   JWT_TOKEN=<jwt> npx tsx src/core/notion/__tests__/test-notion-live.ts
 *   JWT_TOKEN=<jwt> BACKEND_URL=https://staging-api.example.com npx tsx ...
 */
import * as readline from 'readline';
import { exec } from 'child_process';

import {
  authComplete,
  callTool,
  getSkillStatus,
  oauthComplete,
  setSetupComplete,
  startSkill,
  stopSkill,
} from '../../../../dev/test-harness';

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

function header(text: string) {
  console.log(`\n${C.cyan}${'─'.repeat(60)}${C.reset}`);
  console.log(`${C.cyan}  ${text}${C.reset}`);
  console.log(`${C.cyan}${'─'.repeat(60)}${C.reset}`);
}

function step(label: string) {
  process.stdout.write(`${C.blue}  ▸ ${label}${C.reset} `);
}

function ok(detail?: string) {
  console.log(`${C.green}✓${C.reset}${detail ? ` ${C.dim}${detail}${C.reset}` : ''}`);
}

function fail(detail: string) {
  console.log(`${C.red}✗ ${detail}${C.reset}`);
}

function info(label: string, value: unknown) {
  console.log(`${C.dim}    ${label}: ${C.reset}${value}`);
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function prompt(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` ${C.dim}[${defaultValue}]${C.reset}` : '';
  return new Promise(resolve => {
    rl.question(`${C.yellow}  ? ${question}${suffix}: ${C.reset}`, answer => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

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

/** Open a URL in the default browser. */
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

// ---------------------------------------------------------------------------
// Tool caller
// ---------------------------------------------------------------------------

const SKILL_ID = 'notion';

async function callToolSafe(
  toolName: string,
  args: Record<string, unknown> = {}
): Promise<{ data?: any; error?: string }> {
  try {
    const data = await callTool(SKILL_ID, toolName, args);
    return { data };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const JWT_TOKEN = process.env.JWT_TOKEN || '';
const BACKEND_URL = (process.env.BACKEND_URL || 'https://api.tinyhumans.ai').replace(/\/+$/, '');

if (!JWT_TOKEN) {
  console.error(`\n${C.red}  JWT_TOKEN env var is required.${C.reset}`);
  console.error(
    `${C.dim}  Usage: JWT_TOKEN=<jwt> npx tsx src/core/notion/__tests__/test-notion-live.ts${C.reset}\n`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${C.bold}  Notion Skill — Live Integration Script${C.reset}`);
  info('Backend', BACKEND_URL);
  info('JWT', `<${JWT_TOKEN.length} chars>`);

  // ── Choose auth mode ─────────────────────────────────────────────────────

  header('1. Authentication Mode');

  const choice = await prompt('Auth mode — (1) Encrypted OAuth via browser  (2) API token', '1');

  const mode = choice === '2' ? 'self_hosted' : 'encrypted_oauth';
  let apiKey = '';
  let integrationId = '';
  let clientKeyShare = '';

  if (mode === 'self_hosted') {
    apiKey = await promptSecret('Notion integration token (ntn_...)');
    if (!apiKey) {
      fail('Token is required.');
      process.exit(1);
    }
  } else {
    // ── Initiate OAuth ───────────────────────────────────────────────────

    header('2. OAuth Flow');

    step('Requesting OAuth URL from backend...');
    const connectUrl = `${BACKEND_URL}/auth/notion/connect?skillId=notion&responseType=json&encryptionMode=encrypted`;
    const connectResp = await fetch(connectUrl, {
      headers: { Authorization: `Bearer ${JWT_TOKEN}` },
    });
    if (!connectResp.ok) {
      const text = await connectResp.text();
      fail(`Backend returned ${connectResp.status}: ${text}`);
      process.exit(1);
    }
    const connectData = (await connectResp.json()) as { oauthUrl?: string; success?: boolean };
    const oauthUrl = connectData.oauthUrl;
    if (!oauthUrl) {
      fail(`No oauthUrl in response: ${JSON.stringify(connectData)}`);
      process.exit(1);
    }
    ok();

    console.log(`\n${C.yellow}  Opening Notion OAuth page in your browser...${C.reset}`);
    console.log(`${C.dim}  If it doesn't open, visit this URL manually:${C.reset}`);
    console.log(`${C.dim}  ${oauthUrl}${C.reset}\n`);
    openUrl(oauthUrl);

    console.log(
      `${C.yellow}  After authorizing, the backend will return a JSON response.${C.reset}`
    );
    console.log(`${C.yellow}  Copy the integrationId and clientKey from it.${C.reset}\n`);

    integrationId = await prompt('Integration ID (24-char hex from callback)');
    clientKeyShare = await promptSecret('Client key share (base64 from callback)');

    if (!integrationId || !clientKeyShare) {
      fail('Both integration ID and client key share are required.');
      process.exit(1);
    }
  }

  // ── Start skill ──────────────────────────────────────────────────────────

  header('3. Start Skill');

  step('Stopping any existing instance...');
  try {
    await stopSkill(SKILL_ID);
    ok();
  } catch {
    ok('(was not running)');
  }

  step('Starting notion skill...');
  try {
    const snap = await startSkill(SKILL_ID);
    ok(`status=${snap.status}, tools=${snap.tools.length}`);
  } catch (e: any) {
    fail(e.message);
    process.exit(1);
  }

  // ── Authenticate ─────────────────────────────────────────────────────────

  header('4. Authenticate');

  if (mode === 'self_hosted') {
    step('Sending auth/complete with API token...');
    try {
      const result = (await authComplete(SKILL_ID, 'self_hosted', { api_token: apiKey })) as any;
      if (result.status === 'complete') {
        ok(result.message || '');
      } else {
        fail(JSON.stringify(result.errors || result));
        process.exit(1);
      }
    } catch (e: any) {
      fail(e.message);
      process.exit(1);
    }
  } else {
    step('Sending oauth/complete with encrypted credential...');
    try {
      const result = await oauthComplete(SKILL_ID, {
        credentialId: integrationId,
        provider: 'notion',
        grantedScopes: [],
        clientKeyShare,
      });
      ok(JSON.stringify(result).slice(0, 120));
    } catch (e: any) {
      fail(e.message);
      process.exit(1);
    }
  }

  step('Marking setup complete...');
  try {
    await setSetupComplete(SKILL_ID, true);
    ok();
  } catch (e: any) {
    fail(e.message);
  }

  // ── Verify connection ────────────────────────────────────────────────────

  header('5. Verify Connection');

  step('Waiting for state to settle...');
  await new Promise(r => setTimeout(r, 1500));
  ok();

  step('Checking skill status...');
  try {
    const snap = await getSkillStatus(SKILL_ID);
    const s = snap.state as Record<string, unknown> | undefined;
    info('connection_status', s?.connection_status ?? '(none)');
    info('auth_status', s?.auth_status ?? '(none)');
    info('workspace', s?.workspaceName ?? '(none)');
    if (s?.connection_status === 'connected') ok('connected');
    else fail(`Expected connected, got ${s?.connection_status}`);
  } catch (e: any) {
    fail(e.message);
  }

  // ── Exercise tools ───────────────────────────────────────────────────────

  header('6. Exercise Tools');

  step('get-current-user...');
  {
    const { data, error } = await callToolSafe('get-current-user', {});
    if (error) fail(error);
    else ok(String(data?.name || data?.id || JSON.stringify(data).slice(0, 80)));
  }

  step('search (query="test")...');
  {
    const { data, error } = await callToolSafe('search', { query: 'test' });
    if (error) fail(error);
    else ok(`${(data?.results || data?.pages || []).length} results`);
  }

  step('list-all-pages...');
  {
    const { data, error } = await callToolSafe('list-all-pages', {});
    if (error) fail(error);
    else {
      const pages = data?.pages || data?.results || [];
      ok(`${pages.length} pages`);
      for (const p of pages.slice(0, 5)) info('page', `${p.title || p.id} — ${p.url || ''}`);
      if (pages.length > 5) info('', `...and ${pages.length - 5} more`);
    }
  }

  step('list-all-databases...');
  {
    const { data, error } = await callToolSafe('list-all-databases', {});
    if (error) fail(error);
    else {
      const dbs = data?.databases || data?.results || [];
      ok(`${dbs.length} databases`);
      for (const d of dbs.slice(0, 5)) info('db', `${d.title || d.id}`);
    }
  }

  // ── Verify sync (auto-triggered by runtime after auth) ──────────────────

  header('7. Verify Sync');

  step('Waiting for auto-sync to complete...');
  await new Promise(r => setTimeout(r, 5000));
  ok();

  step('Checking post-sync state...');
  try {
    const snap = await getSkillStatus(SKILL_ID);
    const s = snap.state as Record<string, unknown> | undefined;
    info('totalPages', s?.totalPages ?? 'N/A');
    info('totalDatabases', s?.totalDatabases ?? 'N/A');
    info('pagesWithContent', s?.pagesWithContent ?? 'N/A');
    info('lastSyncTime', s?.lastSyncTime ?? 'N/A');
    info('syncInProgress', s?.syncInProgress ?? 'N/A');
    ok();
  } catch (e: any) {
    fail(e.message);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  header('8. Cleanup');

  step('Stopping skill...');
  try {
    await stopSkill(SKILL_ID);
    ok();
  } catch (e: any) {
    fail(e.message);
  }

  console.log(`\n${C.green}${C.bold}  Done.${C.reset}\n`);
  rl.close();
  process.exit(0);
}

main().catch(e => {
  console.error(`\n${C.red}Fatal: ${e.message}${C.reset}`);
  rl.close();
  process.exit(1);
});
