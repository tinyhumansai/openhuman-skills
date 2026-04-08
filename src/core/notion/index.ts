// notion/index.ts
// Notion integration skill exposing 25 tools for the Notion API + local sync.
// Supports pages, databases, blocks, users, comments, and local search.
// Authentication is handled via the platform OAuth bridge.
import { notionApi } from './api/index';
import { getEntityCounts, getLocalPages } from './db/helpers';
import { initializeNotionSchema } from './db/schema';
import { formatUserSummary, isNotionConnected, notionFetch, resetApiVersionCache } from './helpers';
import { getNotionSkillState } from './state';
import type { NotionSkillConfig } from './state';
import { performSync } from './sync';
import tools from './tools/index';

async function init(): Promise<void> {
  console.log('[notion] Initializing');
  const s = getNotionSkillState();

  initializeNotionSchema();

  // Load persisted config from store
  const saved = state.get('config') as Partial<NotionSkillConfig> | null;
  if (saved) {
    s.config.credentialId = saved.credentialId || s.config.credentialId;
    s.config.workspaceName = saved.workspaceName || s.config.workspaceName;
    s.config.syncIntervalMinutes = saved.syncIntervalMinutes || s.config.syncIntervalMinutes;
    s.config.contentSyncEnabled = saved.contentSyncEnabled ?? s.config.contentSyncEnabled;
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

async function start(): Promise<void> {
  const s = getNotionSkillState();

  if (!isNotionConnected()) {
    console.log('[notion] No credential — skill inactive until auth completes');
    return;
  }

  // Register sync cron schedule
  const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
  cron.register('notion-sync', cronExpr);
  console.log(`[notion] Scheduled sync every ${s.config.syncIntervalMinutes} minutes`);
}

async function stop(): Promise<void> {
  console.log('[notion] Stopping');
  const s = getNotionSkillState();

  // Unregister cron
  cron.unregister('notion-sync');

  // Persist config
  state.set('config', s.config);
  state.set('status', 'stopped');
  console.log('[notion] Stopped');
}

async function onCronTrigger(scheduleId: string): Promise<void> {
  console.log(`[notion] Cron triggered: ${scheduleId}`);

  if (scheduleId === 'notion-sync') {
    await performSync();
  }
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

async function onSessionStart(args: { sessionId: string }): Promise<void> {
  const s = getNotionSkillState();
  s.activeSessions.push(args.sessionId);
}

async function onSessionEnd(args: { sessionId: string }): Promise<void> {
  const s = getNotionSkillState();
  const index = s.activeSessions.indexOf(args.sessionId);
  if (index > -1) {
    s.activeSessions.splice(index, 1);
  }
}

// ---------------------------------------------------------------------------
// OAuth lifecycle
// ---------------------------------------------------------------------------

async function onOAuthComplete(args: OAuthCompleteArgs): Promise<OAuthCompleteResult | void> {
  const s = getNotionSkillState();
  s.config.credentialId = args.credentialId;
  console.log(
    `[notion] OAuth complete — credential: ${args.credentialId}, account: ${args.accountLabel || '(unknown)'}`
  );

  if (args.accountLabel) {
    s.config.workspaceName = args.accountLabel;
  }

  state.set('config', s.config);

  // Start sync schedule
  const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
  cron.register('notion-sync', cronExpr);

  publishState();
}

async function onOAuthRevoked(args: OAuthRevokedArgs): Promise<void> {
  console.log(`[notion] OAuth revoked — reason: ${args.reason}`);
  const s = getNotionSkillState();

  s.config.credentialId = '';
  s.config.workspaceName = '';
  state.delete('config');
  cron.unregister('notion-sync');
  publishState();
}

async function onDisconnect(): Promise<void> {
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
// Advanced auth lifecycle (self_hosted / text modes)
// ---------------------------------------------------------------------------

async function onAuthComplete(args: {
  mode: string;
  credentials: Record<string, unknown>;
}): Promise<{
  status: string;
  errors?: Array<{ field: string; message: string }>;
  message?: string;
}> {
  console.log(`[notion] onAuthComplete — mode: ${args.mode}`);
  const s = getNotionSkillState();

  if (args.mode === 'managed') {
    // Managed mode is handled by onOAuthComplete — just return success
    return { status: 'complete' };
  }

  // For self_hosted: validate the API token by making a test call
  const token = (args.credentials.api_token ??
    args.credentials.content ??
    args.credentials.access_token) as string | undefined;

  if (!token) {
    return { status: 'error', errors: [{ field: 'api_token', message: 'API token is required.' }] };
  }

  // Test the token against Notion API
  try {
    const response = await net.fetch('https://api.notion.com/v1/users?page_size=1', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      timeout: 15,
    });

    if (response.status === 401 || response.status === 403) {
      return {
        status: 'error',
        errors: [
          {
            field: 'api_token',
            message: 'Invalid token. Check that your integration token is correct.',
          },
        ],
      };
    }

    if (response.status >= 400) {
      return {
        status: 'error',
        errors: [
          {
            field: 'api_token',
            message: `Notion API returned error ${response.status}. Please check your token.`,
          },
        ],
      };
    }

    // Token is valid — extract workspace info from the bot user
    try {
      const data = JSON.parse(response.body) as {
        results?: Array<{ name?: string; type?: string }>;
      };
      const botUser = data.results?.find(u => u.type === 'bot');
      if (botUser?.name) {
        s.config.workspaceName = botUser.name;
      }
    } catch {
      // Non-critical: workspace name extraction failed
    }
  } catch (err) {
    return {
      status: 'error',
      errors: [{ field: 'api_token', message: `Could not reach Notion API: ${String(err)}` }],
    };
  }

  // Persist config and reset API version cache (new credential may have different access)
  state.set('config', s.config);
  resetApiVersionCache();

  // Register sync cron
  const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
  cron.register('notion-sync', cronExpr);

  publishState();

  return { status: 'complete', message: 'Connected to Notion!' };
}

async function onAuthRevoked(args: { mode?: string }): Promise<void> {
  console.log(`[notion] Auth revoked — mode: ${args.mode || 'unknown'}`);
  const s = getNotionSkillState();

  s.config.credentialId = '';
  s.config.workspaceName = '';
  // Clear profile from shared state so the frontend no longer sees a stale identity
  state.setPartial({ profile: null });
  state.delete('config');
  cron.unregister('notion-sync');
  resetApiVersionCache();
  publishState();
}

// ---------------------------------------------------------------------------
// Setup compatibility stubs (required while validator expects onSetupStart/onSetupSubmit)
// ---------------------------------------------------------------------------

async function onSetupStart(): Promise<SetupStartResult> {
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

async function onSetupSubmit(_args: {
  stepId: string;
  values: Record<string, unknown>;
}): Promise<SetupSubmitResult> {
  return { status: 'complete' };
}

async function onSync(): Promise<void> {
  console.log('[notion] Syncing');

  // Fetch the Notion profile immediately and publish it into state so the
  // workspace/user context is available to the host.
  try {
    const user = await notionApi.getUser('me');
    const profile = formatUserSummary(user as Record<string, unknown>);
    state.setPartial({ profile });
  } catch (e) {
    console.error('[notion] Failed to fetch profile on OAuth complete:', e);
  }

  publishState();

  await performSync();
}

// ---------------------------------------------------------------------------
// Options system
// ---------------------------------------------------------------------------

async function onListOptions(): Promise<{ options: SkillOption[] }> {
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

async function onSetOption(args: { name: string; value: unknown }): Promise<void> {
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
// State publishing
// ---------------------------------------------------------------------------

async function publishState(): Promise<void> {
  const s = getNotionSkillState();
  const isConnected = isNotionConnected();

  // Fetch recent page summaries from local DB (metadata only — no content_text
  // to avoid raw newlines breaking JSON serialization in the state transport)
  let pages: Array<{ id: string; title: string; url: string | null; last_edited_time: string }> =
    [];
  if (isConnected) {
    try {
      const localPages = getLocalPages({ limit: 100 });
      pages = localPages.map(p => ({
        id: p.id,
        title: p.title,
        url: p.url,
        last_edited_time: p.last_edited_time,
      }));
    } catch (e) {
      console.error('[notion] publishState: failed to load local pages:', e);
    }
  }

  state.setPartial({
    // Standard SkillHostConnectionState fields
    connection_status: isConnected ? 'connected' : 'disconnected',
    auth_status: isConnected ? 'authenticated' : 'not_authenticated',
    connection_error: s.syncStatus.lastSyncError || null,
    auth_error: null,
    is_initialized: isConnected,
    // Skill-specific fields
    workspaceName: s.config.workspaceName || null,
    syncInProgress: s.syncStatus.syncInProgress,
    lastSyncTime: s.syncStatus.lastSyncTime
      ? new Date(s.syncStatus.lastSyncTime).toISOString()
      : null,
    totalPages: s.syncStatus.totalPages,
    totalDatabases: s.syncStatus.totalDatabases,
    totalDatabaseRows: s.syncStatus.totalDatabaseRows,
    pagesWithContent: s.syncStatus.pagesWithContent,
    pagesWithSummary: s.syncStatus.pagesWithSummary,
    lastSyncError: s.syncStatus.lastSyncError,
    pages,
  });
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Expose lifecycle hooks on globalThis so the REPL/runtime can call them.
// esbuild IIFE bundling traps function declarations in the closure scope —
// without explicit assignment they are unreachable from outside.
// ---------------------------------------------------------------------------

async function onPing(): Promise<PingResult> {
  if (!isNotionConnected()) {
    return { ok: false, errorType: 'auth', errorMessage: 'No credential' };
  }
  try {
    // Use notionFetch so transient Cloudflare 52x errors are retried automatically
    // before reporting a failure (up to MAX_RETRIES times with exponential backoff).
    await notionFetch('/users?page_size=1');
    console.log('[notion] onPing: ok');
    return { ok: true };
  } catch (err) {
    const msg = String(err);
    console.warn('[notion] onPing error:', msg);
    // Treat auth errors (401/403) as auth failures so the skill is stopped.
    if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('unauthorized')) {
      return { ok: false, errorType: 'auth', errorMessage: msg };
    }
    // Everything else (522, timeouts, network errors) is a transient network failure.
    return { ok: false, errorType: 'network', errorMessage: msg };
  }
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
  onOAuthComplete,
  onOAuthRevoked,
  onAuthComplete,
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
