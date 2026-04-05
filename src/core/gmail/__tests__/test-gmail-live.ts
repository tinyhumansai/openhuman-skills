#!/usr/bin/env npx tsx
/**
 * Gmail skill live integration script.
 *
 * Interactive sequential script that walks through the full skill lifecycle:
 *   start → authenticate → verify connection → exercise tools → sync → stop
 *
 * Credentials can be passed via env vars or entered interactively when prompted.
 *
 * Usage:
 *   # Interactive — prompts for everything:
 *   npx tsx src/core/gmail/__tests__/test-gmail-live.ts
 *
 *   # Self-hosted via env:
 *   GMAIL_CLIENT_ID=x GMAIL_CLIENT_SECRET=x GMAIL_REFRESH_TOKEN=x \
 *     npx tsx src/core/gmail/__tests__/test-gmail-live.ts
 *
 *   # Encrypted OAuth via env:
 *   GMAIL_INTEGRATION_ID=<id> CLIENT_KEY_SHARE=<key> \
 *     npx tsx src/core/gmail/__tests__/test-gmail-live.ts
 */
import * as readline from 'readline';
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
// Formatting helpers
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
// Prompt helper
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

// ---------------------------------------------------------------------------
// Tool caller (safe, never throws)
// ---------------------------------------------------------------------------

const SKILL_ID = 'gmail';

async function callToolSafe(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<{ data?: any; error?: string }> {
  try {
    const data = await callTool(SKILL_ID, toolName, args);
    return { data };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${C.bold}  Gmail Skill — Live Integration Script${C.reset}`);

  // ── Collect credentials ──────────────────────────────────────────────────

  header('1. Credentials');

  let mode: 'self_hosted' | 'encrypted_oauth' = 'self_hosted';
  let clientId = process.env.GMAIL_CLIENT_ID || '';
  let clientSecret = process.env.GMAIL_CLIENT_SECRET || '';
  let refreshToken = process.env.GMAIL_REFRESH_TOKEN || '';
  let integrationId = process.env.GMAIL_INTEGRATION_ID || '';
  let clientKeyShare = process.env.CLIENT_KEY_SHARE || '';

  const hasSelfHostedEnv = !!(clientId && clientSecret && refreshToken);
  const hasOAuthEnv = !!(integrationId && clientKeyShare);

  if (!hasSelfHostedEnv && !hasOAuthEnv) {
    const choice = await prompt(
      'Auth mode — (1) Own OAuth credentials  (2) Encrypted OAuth',
      '1',
    );

    if (choice === '2') {
      mode = 'encrypted_oauth';
      integrationId = await prompt('Integration ID (24-char hex)');
      clientKeyShare = await promptSecret('Client key share (base64)');

      if (!integrationId || !clientKeyShare) {
        fail('Integration ID and client key share are both required.');
        process.exit(1);
      }
    } else {
      mode = 'self_hosted';
      clientId = await prompt('Google Client ID');
      clientSecret = await promptSecret('Google Client Secret');
      refreshToken = await promptSecret('Refresh Token');

      if (!clientId || !clientSecret || !refreshToken) {
        fail('All three fields are required.');
        process.exit(1);
      }
    }
  } else {
    mode = hasSelfHostedEnv ? 'self_hosted' : 'encrypted_oauth';
  }

  info('Mode', mode);
  if (mode === 'self_hosted') {
    info('Client ID', `${clientId.slice(0, 12)}...`);
  } else {
    info('Integration ID', integrationId);
    info('Client key', `<${clientKeyShare.length} chars>`);
  }

  // ── Start skill ──────────────────────────────────────────────────────────

  header('2. Start Skill');

  step('Stopping any existing instance...');
  try { await stopSkill(SKILL_ID); ok(); } catch { ok('(was not running)'); }

  step('Starting gmail skill...');
  try {
    const snap = await startSkill(SKILL_ID);
    ok(`status=${snap.status}, tools=${snap.tools.length}`);
  } catch (e: any) {
    fail(e.message);
    process.exit(1);
  }

  // ── Authenticate ─────────────────────────────────────────────────────────

  header('3. Authenticate');

  if (mode === 'self_hosted') {
    step('Sending auth/complete with self-hosted credentials...');
    try {
      const result = (await authComplete(SKILL_ID, 'self_hosted', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      })) as any;
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
        provider: 'gmail',
        grantedScopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels',
        ],
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

  header('4. Verify Connection');

  step('Waiting for state to settle...');
  await new Promise(r => setTimeout(r, 1500));
  ok();

  step('Checking skill status...');
  try {
    const snap = await getSkillStatus(SKILL_ID);
    const s = snap.state as Record<string, unknown> | undefined;
    info('connection_status', s?.connection_status ?? '(none)');
    info('auth_status', s?.auth_status ?? '(none)');
    info('userEmail', s?.userEmail ?? '(none)');

    if (s?.connection_status === 'connected') {
      ok('connected');
    } else {
      fail(`Expected connected, got ${s?.connection_status}`);
    }
  } catch (e: any) {
    fail(e.message);
  }

  // ── Exercise tools ───────────────────────────────────────────────────────

  header('5. Exercise Tools');

  step('get-profile...');
  {
    const { data, error } = await callToolSafe('get-profile', {});
    if (error) { fail(error); }
    else {
      const email = data?.emailAddress || data?.email || JSON.stringify(data).slice(0, 80);
      ok(String(email));
    }
  }

  step('get-labels...');
  {
    const { data, error } = await callToolSafe('get-labels', {});
    if (error) { fail(error); }
    else {
      const labels = data?.labels || [];
      ok(`${labels.length} labels`);
      for (const l of labels.slice(0, 5)) {
        info('label', l.name || l.id);
      }
      if (labels.length > 5) info('', `...and ${labels.length - 5} more`);
    }
  }

  step('get-emails (max 5)...');
  {
    const { data, error } = await callToolSafe('get-emails', { max_results: 5 });
    if (error) { fail(error); }
    else {
      const emails = data?.emails || data?.messages || [];
      ok(`${emails.length} emails`);
      for (const e of emails.slice(0, 3)) {
        info('email', `${e.subject || e.id} — ${e.from || ''}`);
      }
    }
  }

  step('search-emails (in:inbox, max 3)...');
  {
    const { data, error } = await callToolSafe('search-emails', { query: 'in:inbox', max_results: 3 });
    if (error) { fail(error); }
    else {
      const emails = data?.emails || data?.messages || [];
      ok(`${emails.length} results`);
    }
  }

  // ── Sync ─────────────────────────────────────────────────────────────────
  // The Rust runtime auto-triggers onSync() immediately after auth succeeds,
  // so we just wait for it to finish and verify the state.

  header('6. Sync (auto-triggered by runtime after auth)');

  step('Waiting for auto-sync to complete...');
  await new Promise(r => setTimeout(r, 5000));
  ok();

  step('Checking post-sync state...');
  try {
    const snap = await getSkillStatus(SKILL_ID);
    const s = snap.state as Record<string, unknown> | undefined;
    info('userEmail', s?.userEmail ?? 'N/A');
    info('totalEmails', s?.totalEmails ?? 'N/A');
    info('lastSyncTime', s?.lastSyncTime ?? 'N/A');
    info('syncInProgress', s?.syncInProgress ?? 'N/A');
    ok();
  } catch (e: any) {
    fail(e.message);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  header('7. Cleanup');

  step('Stopping skill...');
  try { await stopSkill(SKILL_ID); ok(); } catch (e: any) { fail(e.message); }

  console.log(`\n${C.green}${C.bold}  Done.${C.reset}\n`);

  rl.close();
  process.exit(0);
}

main().catch(e => {
  console.error(`\n${C.red}Fatal: ${e.message}${C.reset}`);
  rl.close();
  process.exit(1);
});
