// notion/index.ts
// Notion integration skill exposing 25 tools for the Notion API + local sync.
// Supports pages, databases, blocks, users, comments, and local search.
// Authentication is handled via the platform OAuth bridge.
import { notionApi } from './api/index';
import { getEntityCounts } from './db/helpers';
import { initializeNotionSchema } from './db/schema';
import { formatUserSummary, isNotionConnected } from './helpers';
import { publishState } from './publish-state';
import { start } from './start';
import { getNotionSkillState } from './state';
import type { NotionSkillConfig } from './state';
import { performSync } from './sync';
import tools from './tools/index';

function init(): void {
  console.log('[notion] Initializing');
  const s = getNotionSkillState();

  initializeNotionSchema();

  // Load persisted config from store
  const saved = state.get('config') as Partial<NotionSkillConfig> | null;
  if (saved) {
    s.config.credentialId = saved.credentialId || s.config.credentialId;
    s.config.workspaceName = saved.workspaceName || s.config.workspaceName;
    s.config.syncIntervalMinutes = saved.syncIntervalMinutes || s.config.syncIntervalMinutes;
    s.config.contentSyncEnabled =
      saved.contentSyncEnabled !== undefined && saved.contentSyncEnabled !== null
        ? saved.contentSyncEnabled
        : s.config.contentSyncEnabled;
    s.config.maxPagesPerContentSync =
      saved.maxPagesPerContentSync || s.config.maxPagesPerContentSync;
  }

  // Load sync state from store (lastSyncTime may be an ISO string from
  // setPartial or a number from legacy last_sync_time; parse tolerantly)
  const lastSync = state.get('lastSyncTime') as string | number | null;
  if (lastSync) {
    s.syncStatus.lastSyncTime =
      typeof lastSync === 'number' ? lastSync : new Date(lastSync).getTime();
  }

  const counts = getEntityCounts();
  s.syncStatus.totalPages = counts.pages;
  s.syncStatus.totalDatabases = counts.databases;
  s.syncStatus.totalDatabaseRows = counts.databaseRows;
  s.syncStatus.pagesWithContent = counts.pagesWithContent;
  s.syncStatus.pagesWithSummary = counts.pagesWithSummary;

  // Check for credentials from either OAuth (managed) or advanced auth (self_hosted/text)
  const oauthCred = oauth.getCredential();
  if (oauthCred) {
    s.config.credentialId = oauthCred.credentialId;
    console.log(
      `[notion] Connected via OAuth to workspace: ${s.config.workspaceName || '(unnamed)'}`
    );
  } else if (isNotionConnected()) {
    console.log(
      `[notion] Connected via auth credential to workspace: ${s.config.workspaceName || '(unnamed)'}`
    );
  } else {
    console.log('[notion] No credential — waiting for setup');
  }

  publishState();
}

function stop(): void {
  console.log('[notion] Stopping');
  const s = getNotionSkillState();

  // Unregister cron
  cron.unregister('notion-sync');

  // Persist config
  state.set('config', s.config);
  state.set('status', 'stopped');
  console.log('[notion] Stopped');
}

function onCronTrigger(scheduleId: string): void {
  console.log(`[notion] Cron triggered: ${scheduleId}`);

  if (scheduleId === 'notion-sync') {
    performSync();
  }
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

function onSessionStart(args: { sessionId: string }): void {
  const s = getNotionSkillState();
  s.activeSessions.push(args.sessionId);
}

function onSessionEnd(args: { sessionId: string }): void {
  const s = getNotionSkillState();
  const index = s.activeSessions.indexOf(args.sessionId);
  if (index > -1) {
    s.activeSessions.splice(index, 1);
  }
}

// ---------------------------------------------------------------------------
// OAuth lifecycle
// ---------------------------------------------------------------------------

function onOAuthRevoked(args: OAuthRevokedArgs): void {
  console.log(`[notion] OAuth revoked — reason: ${args.reason}`);
  const s = getNotionSkillState();

  s.config.credentialId = '';
  s.config.workspaceName = '';
  state.delete('config');
  cron.unregister('notion-sync');
  publishState();
}

function onDisconnect(): void {
  console.log('[notion] Disconnecting');
  const s = getNotionSkillState();

  oauth.revoke();
  s.config.credentialId = '';
  s.config.workspaceName = '';
  state.delete('config');
  cron.unregister('notion-sync');
  publishState();
}

// ---------------------------------------------------------------------------
// Auth revoke (self_hosted / text modes)
// ---------------------------------------------------------------------------

function onAuthRevoked(args: { mode?: string }): void {
  console.log(`[notion] Auth revoked — mode: ${args.mode || 'unknown'}`);
  const s = getNotionSkillState();

  s.config.credentialId = '';
  s.config.workspaceName = '';
  // Clear profile from shared state so the frontend no longer sees a stale identity
  state.setPartial({ profile: null });
  state.delete('config');
  cron.unregister('notion-sync');

  publishState();
}

// ---------------------------------------------------------------------------
// Setup compatibility stubs (required while validator expects onSetupStart/onSetupSubmit)
// ---------------------------------------------------------------------------

function onSetupStart(): SetupStartResult {
  // Auth phase already handled credentials — return a pass-through step
  return {
    step: {
      id: 'auth_done',
      title: 'Setup Complete',
      description: 'Authentication is configured. Click Continue to finish.',
      fields: [],
    },
  };
}

function onSetupSubmit(_args: {
  stepId: string;
  values: Record<string, unknown>;
}): SetupSubmitResult {
  return { status: 'complete' };
}

function onSync(): void {
  console.log('[notion] Syncing');

  // Fetch the Notion profile immediately and publish it into state so the
  // workspace/user context is available to the host.
  try {
    const user = notionApi.getUser('me');
    const profile = formatUserSummary(user as Record<string, unknown>);
    state.setPartial({ profile });
  } catch (e) {
    console.error('[notion] Failed to fetch profile on OAuth complete:', e);
  }

  publishState();

  performSync();
}

// ---------------------------------------------------------------------------
// Options system
// ---------------------------------------------------------------------------

function onListOptions(): { options: SkillOption[] } {
  const s = getNotionSkillState();

  return {
    options: [
      {
        name: 'syncInterval',
        type: 'select',
        label: 'Sync Interval',
        value: s.config.syncIntervalMinutes.toString(),
        options: [
          { label: 'Every 10 minutes', value: '10' },
          { label: 'Every 20 minutes', value: '20' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
      {
        name: 'contentSyncEnabled',
        type: 'boolean',
        label: 'Sync Page Content',
        value: s.config.contentSyncEnabled,
      },
      {
        name: 'maxPagesPerContentSync',
        type: 'select',
        label: 'Pages Per Content Sync',
        value: s.config.maxPagesPerContentSync.toString(),
        options: [
          { label: '25 pages', value: '25' },
          { label: '50 pages', value: '50' },
          { label: '100 pages', value: '100' },
        ],
      },
    ],
  };
}

function onSetOption(args: { name: string; value: unknown }): void {
  const s = getNotionSkillState();

  switch (args.name) {
    case 'syncInterval':
      s.config.syncIntervalMinutes = parseInt(args.value as string, 10);
      if (isNotionConnected()) {
        cron.unregister('notion-sync');
        const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
        cron.register('notion-sync', cronExpr);
      }
      break;

    case 'contentSyncEnabled':
      s.config.contentSyncEnabled = Boolean(args.value);
      break;

    case 'maxPagesPerContentSync':
      s.config.maxPagesPerContentSync = parseInt(args.value as string, 10);
      break;
  }

  state.set('config', s.config);
  publishState();
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Expose lifecycle hooks on globalThis so the REPL/runtime can call them.
// esbuild IIFE bundling traps function declarations in the closure scope —
// without explicit assignment they are unreachable from outside.
// ---------------------------------------------------------------------------

function onPing(): PingResult {
  // Ping is called via handle_js_call which cannot drive async network calls
  // to completion (the QuickJS scheduler and tokio runtime deadlock).
  // Just check if we have a valid credential — actual connectivity is verified by sync.
  if (!isNotionConnected()) {
    return { ok: false, errorType: 'auth', errorMessage: 'No credential' };
  }
  console.log('[notion] onPing: ok (credential present)');
  return { ok: true };
}

const skill: Skill = {
  info: {
    id: 'notion',
    name: 'Notion',
    version: '2.1.0', // Bumped for persistent storage
    description: 'Notion integration with persistent storage',
    auto_start: false,
    setup: { required: true, label: 'Configure Notion' },
  },
  tools,
  init,
  start,
  stop,
  onCronTrigger,
  onSessionStart,
  onSessionEnd,
  onOAuthRevoked,
  onAuthRevoked,
  onSetupStart,
  onSetupSubmit,
  onDisconnect,
  onSync,
  onListOptions,
  onSetOption,
  publishState,
  onPing,
};

// Expose skill for QuickJS runtime (extract_tools and start_async_tool_call read globalThis.__skill.default.tools)
const g = globalThis as Record<string, unknown>;
if (typeof g.__skill === 'undefined') {
  g.__skill = { default: skill };
}

export default skill;
