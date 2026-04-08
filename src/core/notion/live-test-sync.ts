#!/usr/bin/env npx tsx

/**
 * Notion sync live test.
 *
 * Tests the full sync pipeline: page discovery, content extraction, and memory ingestion.
 * Exercises the sync via skill RPC and monitors progress.
 *
 * Env vars (required):
 *   JWT_TOKEN                — session JWT
 *   BACKEND_URL              — backend API base
 *   NOTION_INTEGRATION_ID    — OAuth integration ID
 *   NOTION_CLIENT_KEY_SHARE  — client key share (base64)
 *
 * Usage:
 *   npx tsx src/core/notion/live-test-sync.ts
 */
import 'dotenv/config';

import {
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
// Tool caller
// ---------------------------------------------------------------------------

const SKILL_ID = 'notion';

async function callTool(
  toolName: string,
  args: Record<string, unknown> = {},
  timeoutMs = 15_000
): Promise<{ data?: any; error?: string; elapsedMs: number }> {
  const t0 = Date.now();
  try {
    const result = await callToolRaw(SKILL_ID, toolName, args, timeoutMs);
    const elapsedMs = Date.now() - t0;
    const text = result.content && result.content[0] ? result.content[0].text : '';
    if (result.is_error) return { error: text || 'unknown error', elapsedMs };
    if (!text) return { data: null, elapsedMs };
    try {
      const parsed = JSON.parse(text);
      if (parsed.error && typeof parsed.error === 'string') return { error: parsed.error, elapsedMs };
      return { data: parsed, elapsedMs };
    } catch {
      return { data: text, elapsedMs };
    }
  } catch (e: any) {
    return { error: e.message, elapsedMs: Date.now() - t0 };
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const JWT_TOKEN = process.env.JWT_TOKEN || '';
const INTEGRATION_ID = (process.env.NOTION_INTEGRATION_ID || '').trim();
const CLIENT_KEY = (process.env.NOTION_CLIENT_KEY_SHARE || '').trim();

if (!JWT_TOKEN || !INTEGRATION_ID || !CLIENT_KEY) {
  console.error(`\n${C.red}  Missing env vars: JWT_TOKEN, NOTION_INTEGRATION_ID, NOTION_CLIENT_KEY_SHARE${C.reset}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${C.bold}  Notion Sync — Live Test${C.reset}`);
  console.log(`${C.dim}    Tip: run the skills runtime with RUST_LOG=info to see skill logs${C.reset}`);

  // ── Setup ──────────────────────────────────────────────────────────────

  header('1. Setup');

  step('Stopping any existing instance...');
  try { await stopSkill(SKILL_ID); ok(); } catch { ok('(was not running)'); }

  step('Starting notion skill...');
  try {
    const snap = await startSkill(SKILL_ID);
    ok(`status=${snap.status}, tools=${snap.tools.length}`);
  } catch (e: any) {
    fail(e.message);
    process.exit(1);
  }

  step('Authenticating (oauth/complete)...');
  try {
    await oauthComplete(SKILL_ID, {
      credentialId: INTEGRATION_ID,
      provider: 'notion',
      grantedScopes: [],
      clientKeyShare: CLIENT_KEY,
    });
    ok();
  } catch (e: any) {
    fail(e.message);
    process.exit(1);
  }

  step('Marking setup complete...');
  try { await setSetupComplete(SKILL_ID, true); ok(); } catch (e: any) { fail(e.message); }

  // Wait for init to settle
  await new Promise(r => setTimeout(r, 3000));

  // ── Pre-sync verification ─────────────────────────────────────────────

  header('2. Pre-Sync Verification');

  step('Testing API connectivity (list-users page_size=1)...');
  {
    const { data, error, elapsedMs } = await callTool('list-users', { page_size: 1 }, 30_000);
    if (error) { fail(`${error} (${elapsedMs}ms)`); process.exit(1); }
    ok(`${data.count} user(s) (${elapsedMs}ms)`);
  }

  step('Checking sync-status...');
  {
    const { data, error } = await callTool('sync-status');
    if (error) fail(error);
    else {
      info('connected', data.connected);
      info('pages', data.totals ? data.totals.pages : 0);
      info('databases', data.totals ? data.totals.databases : 0);
      info('last_sync_time', data.last_sync_time || 'never');
      ok();
    }
  }

  // ── Trigger sync ──────────────────────────────────────────────────────

  header('3. Trigger Sync (fire-and-forget)');

  step('Triggering sync (skill/sync RPC)...');
  try {
    const result = await skillRpc(SKILL_ID, 'skill/sync', {}) as any;
    ok(result && result.message ? result.message : JSON.stringify(result));
  } catch (e: any) {
    fail(e.message);
  }

  // ── Poll sync progress ────────────────────────────────────────────────

  header('4. Sync Progress');

  const syncStartedAt = Date.now();
  let lastPagesCount = 0;

  // Poll until sync completes or 10 minutes
  while (Date.now() - syncStartedAt < 10 * 60 * 1000) {
    await new Promise(r => setTimeout(r, 3000));

    try {
      const snap = await getSkillStatus(SKILL_ID);
      const s = snap.state as Record<string, unknown> | undefined;
      if (!s) continue;

      const inProgress = s.syncInProgress;
      const pages = (s.totalPages as number) || 0;
      const dbs = (s.totalDatabases as number) || 0;
      const withContent = (s.pagesWithContent as number) || 0;
      const phase = (s.syncPhase as string) || '';
      const progress = (s.syncProgress as number) || 0;
      const message = (s.syncMessage as string) || '';
      const elapsed = ((Date.now() - syncStartedAt) / 1000).toFixed(0);

      if (pages !== lastPagesCount || !inProgress || message) {
        const bar = progress > 0 ? ` [${progress}%]` : '';
        console.log(
          `${C.dim}    [${elapsed}s]${bar} ${message || `pages=${pages} dbs=${dbs} content=${withContent}`}${C.reset}`
        );
        lastPagesCount = pages;
      }

      if (!inProgress && pages > 0) {
        const syncError = s.lastSyncError as string | null;
        if (syncError) {
          fail(`Sync error: ${syncError}`);
        } else {
          ok(`Sync completed in ${elapsed}s`);
        }
        break;
      }

      if (!inProgress && pages === 0) {
        // Sync finished but found nothing — check for errors
        const syncError = s.lastSyncError as string | null;
        if (syncError) {
          fail(`Sync error: ${syncError}`);
          break;
        }
        // Still waiting for sync to actually start
      }
    } catch {
      // Status check failed, keep polling
    }
  }

  // ── Post-sync state ───────────────────────────────────────────────────

  header('5. Post-Sync State');

  step('Checking skill state...');
  try {
    const snap = await getSkillStatus(SKILL_ID);
    const s = snap.state as Record<string, unknown> | undefined;
    info('totalPages', s ? s.totalPages : 'N/A');
    info('totalDatabases', s ? s.totalDatabases : 'N/A');
    info('totalDatabaseRows', s ? s.totalDatabaseRows : 'N/A');
    info('pagesWithContent', s ? s.pagesWithContent : 'N/A');
    info('lastSyncTime', s ? s.lastSyncTime : 'N/A');
    info('lastSyncDurationMs', s ? s.lastSyncDurationMs : 'N/A');
    info('lastSyncError', s && s.lastSyncError ? s.lastSyncError : '(none)');

    if (s && s.lastSyncError) {
      fail(`Sync error: ${s.lastSyncError}`);
    } else if (s && s.lastSyncTime) {
      ok();
    } else {
      fail('Sync did not complete (lastSyncTime not set)');
    }
  } catch (e: any) {
    fail(e.message);
  }

  step('Checking sync-status tool...');
  {
    const { data, error } = await callTool('sync-status');
    if (error) fail(error);
    else {
      const t = data.totals || {};
      info('pages', t.pages);
      info('databases', t.databases);
      info('pages_with_content', t.pages_with_content);
      info('sync_phase', data.sync_phase || '(idle)');
      info('sync_progress', data.sync_progress);
      info('sync_message', data.sync_message || '(none)');
      info('last_sync_error', data.last_sync_error || '(none)');
      ok();
    }
  }

  // ── Verify cached tools work ──────────────────────────────────────────

  header('6. Cache Verification');

  step('list-pages (tryCache=true)...');
  {
    const { data, error, elapsedMs } = await callTool('list-pages', { page_size: 5, tryCache: true });
    if (error) fail(error);
    else {
      ok(`${data.count} pages (${elapsedMs}ms, source=${data.source})`);
      const pages = data.pages || [];
      for (const p of pages.slice(0, 3)) info('page', `${p.title || p.id}`);
    }
  }

  step('list-databases (tryCache=true)...');
  {
    const { data, error, elapsedMs } = await callTool('list-databases', { page_size: 5, tryCache: true });
    if (error) fail(error);
    else {
      ok(`${data.count} databases (${elapsedMs}ms, source=${data.source})`);
      const dbs = data.databases || [];
      for (const d of dbs.slice(0, 3)) info('db', d.title || d.id);
    }
  }

  step('list-users (tryCache=true)...');
  {
    const { data, error, elapsedMs } = await callTool('list-users', { tryCache: true });
    if (error) fail(error);
    else ok(`${data.count} users (${elapsedMs}ms, source=${data.source})`);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  header('7. Cleanup');

  step('Stopping skill...');
  try { await stopSkill(SKILL_ID); ok(); } catch (e: any) { fail(e.message); }

  console.log(`\n${C.green}${C.bold}  Done.${C.reset}\n`);
  process.exit(0);
}

main().catch(e => {
  console.error(`\n${C.red}Fatal: ${e.message}${C.reset}`);
  process.exit(1);
});
