#!/usr/bin/env npx tsx

/**
 * Notion sync live test.
 *
 * Tests the full sync pipeline: page discovery, content extraction, and memory ingestion.
 * Exercises the sync via skill RPC and monitors progress with verbose state logging.
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
  magenta: '\x1b[35m',
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

function ts(): string {
  return new Date().toISOString().slice(11, 19);
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
      if (parsed.error && typeof parsed.error === 'string')
        return { error: parsed.error, elapsedMs };
      return { data: parsed, elapsedMs };
    } catch {
      return { data: text, elapsedMs };
    }
  } catch (e: any) {
    return { error: e.message, elapsedMs: Date.now() - t0 };
  }
}

/** Dump full skill state with labels */
async function dumpState(label: string): Promise<Record<string, unknown> | null> {
  try {
    const snap = await getSkillStatus(SKILL_ID);
    const s = snap.state as Record<string, unknown> | undefined;
    if (!s) {
      console.log(`${C.yellow}    [${ts()}] ${label}: state is null/undefined${C.reset}`);
      return null;
    }

    const syncKeys = [
      'syncInProgress', 'syncPhase', 'syncProgress', 'syncMessage',
      'totalPages', 'totalDatabases', 'totalDatabaseRows',
      'pagesWithContent', 'pagesWithSummary',
      'lastSyncTime', 'lastSyncDurationMs', 'lastSyncError',
      'connection_status', 'auth_status', 'is_initialized',
    ];

    const parts: string[] = [];
    for (const k of syncKeys) {
      const v = s[k];
      if (v !== null && v !== undefined && v !== '' && v !== 0 && v !== false) {
        parts.push(`${k}=${typeof v === 'string' && v.length > 60 ? v.slice(0, 60) + '...' : v}`);
      }
    }

    console.log(`${C.magenta}    [${ts()}] ${label}: ${parts.join(' | ') || '(all empty)'}${C.reset}`);
    return s;
  } catch (e: any) {
    console.log(`${C.red}    [${ts()}] ${label}: ERROR ${e.message}${C.reset}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const JWT_TOKEN = process.env.JWT_TOKEN || '';
const INTEGRATION_ID = (process.env.NOTION_INTEGRATION_ID || '').trim();
const CLIENT_KEY = (process.env.NOTION_CLIENT_KEY_SHARE || '').trim();

if (!JWT_TOKEN || !INTEGRATION_ID || !CLIENT_KEY) {
  console.error(
    `\n${C.red}  Missing env vars: JWT_TOKEN, NOTION_INTEGRATION_ID, NOTION_CLIENT_KEY_SHARE${C.reset}\n`
  );
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

  let t0 = Date.now();
  step('Stopping any existing instance...');
  try {
    await stopSkill(SKILL_ID);
    ok(`${Date.now() - t0}ms`);
  } catch {
    ok(`(was not running) ${Date.now() - t0}ms`);
  }

  t0 = Date.now();
  step('Starting notion skill...');
  try {
    const snap = await startSkill(SKILL_ID);
    ok(`status=${snap.status}, tools=${snap.tools.length} (${Date.now() - t0}ms)`);
  } catch (e: any) {
    fail(`${e.message} (${Date.now() - t0}ms)`);
    process.exit(1);
  }

  await dumpState('after start');

  t0 = Date.now();
  step('Authenticating (oauth/complete)...');
  try {
    await oauthComplete(SKILL_ID, {
      credentialId: INTEGRATION_ID,
      provider: 'notion',
      grantedScopes: [],
      clientKeyShare: CLIENT_KEY,
    });
    ok(`${Date.now() - t0}ms`);
  } catch (e: any) {
    fail(`${e.message} (${Date.now() - t0}ms)`);
    process.exit(1);
  }

  await dumpState('after oauth');

  t0 = Date.now();
  step('Marking setup complete...');
  try {
    await setSetupComplete(SKILL_ID, true);
    ok(`${Date.now() - t0}ms`);
  } catch (e: any) {
    fail(`${e.message} (${Date.now() - t0}ms)`);
  }

  // Wait for init to settle
  console.log(`${C.dim}    Waiting 2s for init to settle...${C.reset}`);
  await new Promise(r => setTimeout(r, 2000));
  await dumpState('after settle');

  // ── Pre-sync verification ─────────────────────────────────────────────

  header('2. Pre-Sync Verification');

  t0 = Date.now();
  step('Testing API connectivity (list-users)...');
  {
    const { data, error, elapsedMs } = await callTool('list-users', { page_size: 100 }, 30_000);
    if (error) {
      fail(`${error} (${elapsedMs}ms)`);
      await dumpState('after list-users FAIL');
      process.exit(1);
    }
    ok(`${data.count} user(s) (${elapsedMs}ms)`);
  }

  step('Checking sync-status tool...');
  {
    const { data, error, elapsedMs } = await callTool('sync-status');
    if (error) {
      fail(`${error} (${elapsedMs}ms)`);
    } else {
      info('connected', data.connected);
      info('pages', data.totals ? data.totals.pages : 0);
      info('databases', data.totals ? data.totals.databases : 0);
      info('last_sync_time', data.last_sync_time || 'never');
      ok(`${elapsedMs}ms`);
    }
  }

  // ── Trigger sync ──────────────────────────────────────────────────────

  header('3. Trigger Sync');

  await dumpState('before sync trigger');

  t0 = Date.now();
  step('Triggering sync (skill/sync RPC)...');
  try {
    const result = (await skillRpc(SKILL_ID, 'skill/sync', {})) as any;
    ok(`${result && result.message ? result.message : JSON.stringify(result)} (${Date.now() - t0}ms)`);
  } catch (e: any) {
    fail(`${e.message} (${Date.now() - t0}ms)`);
  }

  await dumpState('after sync trigger');

  // ── Poll sync progress ────────────────────────────────────────────────

  header('4. Sync Progress');

  const syncStartedAt = Date.now();
  let lastMessage = '';
  let lastPhase = '';
  let pollCount = 0;
  let staleCount = 0;

  // Poll until sync completes or 10 minutes
  while (Date.now() - syncStartedAt < 10 * 60 * 1000) {
    await new Promise(r => setTimeout(r, 2000));
    pollCount++;

    try {
      const snap = await getSkillStatus(SKILL_ID);
      const s = snap.state as Record<string, unknown> | undefined;

      if (!s) {
        console.log(`${C.yellow}    [${ts()}] poll #${pollCount}: state is null${C.reset}`);
        continue;
      }

      const inProgress = s.syncInProgress;
      const pages = (s.totalPages as number) || 0;
      const dbs = (s.totalDatabases as number) || 0;
      const dbRows = (s.totalDatabaseRows as number) || 0;
      const withContent = (s.pagesWithContent as number) || 0;
      const withSummary = (s.pagesWithSummary as number) || 0;
      const phase = (s.syncPhase as string) || '(none)';
      const progress = (s.syncProgress as number) || 0;
      const message = (s.syncMessage as string) || '';
      const syncError = s.lastSyncError as string | null;
      const elapsed = ((Date.now() - syncStartedAt) / 1000).toFixed(0);
      const connStatus = s.connection_status || '?';

      // Detect stale state (same message 5+ polls = something stuck)
      if (message === lastMessage && phase === lastPhase) {
        staleCount++;
      } else {
        staleCount = 0;
      }
      lastMessage = message;
      lastPhase = phase;

      // Always log every poll for visibility
      const bar = progress > 0 ? `[${progress}%]` : '[0%]';
      const staleTag = staleCount >= 5 ? ` ${C.yellow}(STALE x${staleCount})${C.reset}` : '';
      console.log(
        `    [${C.dim}${elapsed}s${C.reset}] ${C.cyan}${bar}${C.reset} ` +
        `${C.bold}${phase}${C.reset} — ${message || '(no message)'}` +
        ` | pages=${pages} dbs=${dbs} rows=${dbRows} content=${withContent} summaries=${withSummary}` +
        ` | conn=${connStatus} inProgress=${inProgress}` +
        staleTag
      );

      if (syncError) {
        console.log(`    ${C.red}  ⚠ syncError: ${syncError}${C.reset}`);
      }

      // Sync completed
      if (!inProgress && (pages > 0 || phase === '(none)') && pollCount > 2) {
        if (syncError) {
          fail(`Sync error: ${syncError}`);
        } else {
          ok(`Sync completed in ${elapsed}s`);
        }
        await dumpState('sync complete');
        break;
      }

      // Stale for 20+ polls = likely stuck
      if (staleCount >= 20) {
        fail(`Sync appears stuck — same state for ${staleCount} polls (${elapsed}s)`);
        await dumpState('sync stuck');
        break;
      }
    } catch (e: any) {
      console.log(`${C.red}    [${ts()}] poll #${pollCount}: ERROR ${e.message}${C.reset}`);
    }
  }

  // ── Post-sync state ───────────────────────────────────────────────────

  header('5. Post-Sync State');

  step('Full state dump...');
  const postState = await dumpState('post-sync');
  if (postState) {
    info('totalPages', postState.totalPages);
    info('totalDatabases', postState.totalDatabases);
    info('totalDatabaseRows', postState.totalDatabaseRows);
    info('pagesWithContent', postState.pagesWithContent);
    info('pagesWithSummary', postState.pagesWithSummary);
    info('lastSyncTime', postState.lastSyncTime);
    info('lastSyncDurationMs', postState.lastSyncDurationMs);
    info('lastSyncError', postState.lastSyncError || '(none)');
    info('syncPhase', postState.syncPhase || '(idle)');
    info('syncProgress', postState.syncProgress);
    info('syncMessage', postState.syncMessage || '(none)');
    info('connection_status', postState.connection_status);
    info('auth_status', postState.auth_status);

    if (postState.lastSyncError) {
      fail(`Sync error: ${postState.lastSyncError}`);
    } else if (postState.lastSyncTime) {
      ok();
    } else {
      fail('Sync did not complete (lastSyncTime not set)');
    }
  } else {
    fail('Could not read state');
  }

  step('Checking sync-status tool...');
  {
    const { data, error, elapsedMs } = await callTool('sync-status');
    if (error) fail(`${error} (${elapsedMs}ms)`);
    else {
      const t = data.totals || {};
      info('pages', t.pages);
      info('databases', t.databases);
      info('database_rows', t.database_rows);
      info('pages_with_content', t.pages_with_content);
      info('pages_with_summary', t.pages_with_summary);
      info('sync_phase', data.sync_phase || '(idle)');
      info('sync_progress', data.sync_progress);
      info('sync_message', data.sync_message || '(none)');
      info('last_sync_error', data.last_sync_error || '(none)');
      info('last_sync_time', data.last_sync_time || 'never');
      info('last_sync_duration_ms', data.last_sync_duration_ms);
      ok(`${elapsedMs}ms`);
    }
  }

  // ── Verify cached tools work ──────────────────────────────────────────

  header('6. Cache Verification');

  step('list-pages (tryCache=true)...');
  {
    const { data, error, elapsedMs } = await callTool('list-pages', {
      page_size: 5,
      tryCache: true,
    });
    if (error) fail(`${error} (${elapsedMs}ms)`);
    else {
      ok(`${data.count} pages (${elapsedMs}ms, source=${data.source})`);
      const pages = data.pages || [];
      for (const p of pages.slice(0, 3)) info('page', `${p.title || p.id}`);
    }
  }

  step('list-databases (tryCache=true)...');
  {
    const { data, error, elapsedMs } = await callTool('list-databases', {
      page_size: 5,
      tryCache: true,
    });
    if (error) fail(`${error} (${elapsedMs}ms)`);
    else {
      ok(`${data.count} databases (${elapsedMs}ms, source=${data.source})`);
      const dbs = data.databases || [];
      for (const d of dbs.slice(0, 3)) info('db', d.title || d.id);
    }
  }

  step('list-users (tryCache=true)...');
  {
    const { data, error, elapsedMs } = await callTool('list-users', { tryCache: true });
    if (error) fail(`${error} (${elapsedMs}ms)`);
    else ok(`${data.count} users (${elapsedMs}ms, source=${data.source})`);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  header('7. Cleanup');

  step('Stopping skill...');
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
