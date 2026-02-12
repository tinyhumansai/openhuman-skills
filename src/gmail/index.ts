// Gmail skill main entry point.
// Orchestrator: imports all modules, implements lifecycle hooks, assembles tools.

// 1. State first (registers globalThis.getGmailSkillState)
import { defaultConfig } from './state';
// 2. DB schema registration (registers globalThis.initializeGmailSchema)
import './db/schema';
// 3. DB helpers registration (registers globalThis.gmailDb)
import './db/helpers';
// 4. Sync registration (registers globalThis.gmailSync)
import './sync';
// 5. API layer
import * as api from './api';
// 6. Setup wizard
import { onSetupCancel, onSetupStart, onSetupSubmit } from './setup';
// 7. Tools
import {
  getEmailTool,
  getEmailsTool,
  getLabelsTool,
  getProfileTool,
  markEmailTool,
  searchEmailsTool,
  sendEmailTool,
  statusTool,
} from './tools';

import type { SkillConfig } from './types';

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  console.log(`[gmail] Initializing on ${platform.os()}`);

  // Initialize database schema
  globalThis.initializeGmailSchema();

  // Load persisted config from store
  const s = globalThis.getGmailSkillState();
  const saved = state.get('config') as Partial<SkillConfig> | null;
  if (saved) {
    s.config = { ...s.config, ...saved };
  }

  // Restore sync state from database
  const lastSync = globalThis.gmailDb.getSyncState('last_sync_time');
  const lastHistoryId = globalThis.gmailDb.getSyncState('last_history_id');
  if (lastSync) s.sync.lastSyncTime = parseInt(lastSync, 10);
  if (lastHistoryId) s.sync.lastHistoryId = lastHistoryId;

  const isConnected = !!oauth.getCredential();
  console.log(`[gmail] Initialized. Connected: ${isConnected}`);
}

async function start(): Promise<void> {
  console.log('[gmail] Starting skill...');
  const s = globalThis.getGmailSkillState();
  const credential = oauth.getCredential();

  if (credential && s.config.syncEnabled) {
    // Schedule periodic sync
    const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
    cron.register('gmail-sync', cronExpr);
    console.log(`[gmail] Scheduled sync every ${s.config.syncIntervalMinutes} minutes`);

    // Load Gmail profile
    await loadGmailProfile();

    // Perform initial sync
    await globalThis.gmailSync.performInitialSync(msg => console.log(`[gmail] ${msg}`));

    // Update storage stats
    s.storage = globalThis.gmailDb.getEntityCounts();

    // Publish initial state
    publishState();
  } else {
    console.log('[gmail] Not connected or sync disabled');
  }
}

async function stop(): Promise<void> {
  console.log('[gmail] Stopping skill...');
  const s = globalThis.getGmailSkillState();

  cron.unregister('gmail-sync');
  state.set('config', s.config);

  globalThis.gmailDb.setSyncState('last_sync_time', String(s.sync.lastSyncTime));
  if (s.sync.lastHistoryId) {
    globalThis.gmailDb.setSyncState('last_history_id', s.sync.lastHistoryId);
  }

  console.log('[gmail] Skill stopped');
}

async function onCronTrigger(scheduleId: string): Promise<void> {
  console.log(`[gmail] Cron triggered: ${scheduleId}`);

  if (scheduleId === 'gmail-sync') {
    try {
      await globalThis.gmailSync.performInitialSync(msg => console.log(`[gmail] ${msg}`));
      const s = globalThis.getGmailSkillState();
      s.storage = globalThis.gmailDb.getEntityCounts();
      publishState();
    } catch (e) {
      console.error(`[gmail] Sync error: ${e}`);
      platform.notify('Gmail Sync Failed', String(e));
    }
  }
}

async function onSessionStart(args: { sessionId: string }): Promise<void> {
  const s = globalThis.getGmailSkillState();
  s.activeSessions.push(args.sessionId);
  console.log(`[gmail] Session started: ${args.sessionId} (${s.activeSessions.length} active)`);
}

async function onSessionEnd(args: { sessionId: string }): Promise<void> {
  const s = globalThis.getGmailSkillState();
  const index = s.activeSessions.indexOf(args.sessionId);
  if (index > -1) {
    s.activeSessions.splice(index, 1);
  }
  console.log(`[gmail] Session ended: ${args.sessionId} (${s.activeSessions.length} active)`);
}

// ---------------------------------------------------------------------------
// OAuth lifecycle hooks
// ---------------------------------------------------------------------------

async function onOAuthComplete(args: OAuthCompleteArgs): Promise<OAuthCompleteResult | void> {
  console.log(`[gmail] OAuth complete for provider: ${args.provider}`);
  const s = globalThis.getGmailSkillState();

  s.config.credentialId = args.credentialId;
  if (args.accountLabel) {
    s.config.userEmail = args.accountLabel;
  }

  state.set('config', s.config);

  // Load profile to get user email
  await loadGmailProfile();

  // Start sync
  if (s.config.syncEnabled) {
    const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
    cron.register('gmail-sync', cronExpr);
    await globalThis.gmailSync.performInitialSync(msg => console.log(`[gmail] ${msg}`));
    s.storage = globalThis.gmailDb.getEntityCounts();
  }

  publishState();
  console.log(`[gmail] Connected as ${s.config.userEmail || args.accountLabel || 'unknown'}`);
}

async function onOAuthRevoked(args: OAuthRevokedArgs): Promise<void> {
  console.log(`[gmail] OAuth revoked: ${args.reason}`);
  const s = globalThis.getGmailSkillState();

  s.config.credentialId = '';
  s.config.userEmail = '';
  s.cache.profile = null;

  state.set('config', s.config);
  cron.unregister('gmail-sync');
  publishState();

  if (args.reason === 'token_expired' || args.reason === 'provider_revoked') {
    platform.notify('Gmail Disconnected', 'Your Gmail connection has expired. Please reconnect.');
  }
}

async function onDisconnect(): Promise<void> {
  console.log('[gmail] Disconnecting...');

  oauth.revoke();

  const s = globalThis.getGmailSkillState();
  s.config = { ...defaultConfig };
  s.cache.profile = null;

  state.delete('config');
  cron.unregister('gmail-sync');
  publishState();

  console.log('[gmail] Disconnected and cleaned up');
}

// ---------------------------------------------------------------------------
// Options system
// ---------------------------------------------------------------------------

async function onListOptions(): Promise<{ options: SkillOption[] }> {
  const s = globalThis.getGmailSkillState();

  return {
    options: [
      {
        name: 'syncEnabled',
        type: 'boolean',
        label: 'Enable Email Sync',
        value: s.config.syncEnabled,
      },
      {
        name: 'syncInterval',
        type: 'select',
        label: 'Sync Interval',
        value: s.config.syncIntervalMinutes.toString(),
        options: [
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
      {
        name: 'maxEmailsPerSync',
        type: 'select',
        label: 'Max Emails Per Sync',
        value: s.config.maxEmailsPerSync.toString(),
        options: [
          { label: '50 emails', value: '50' },
          { label: '100 emails', value: '100' },
          { label: '250 emails', value: '250' },
          { label: '500 emails', value: '500' },
        ],
      },
      {
        name: 'notifyOnNewEmails',
        type: 'boolean',
        label: 'Notify on New Emails',
        value: s.config.notifyOnNewEmails,
      },
      {
        name: 'allowWriteActions',
        type: 'boolean',
        label: 'Allow Write Actions',
        value: s.config.allowWriteActions,
      },
      {
        name: 'showSensitiveContent',
        type: 'boolean',
        label: 'Show Sensitive Content',
        value: s.config.showSensitiveContent,
      },
    ],
  };
}

async function onSetOption(args: { name: string; value: unknown }): Promise<void> {
  const s = globalThis.getGmailSkillState();
  const credential = oauth.getCredential();

  switch (args.name) {
    case 'syncEnabled':
      s.config.syncEnabled = Boolean(args.value);
      if (s.config.syncEnabled && credential) {
        const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
        cron.register('gmail-sync', cronExpr);
      } else {
        cron.unregister('gmail-sync');
      }
      break;

    case 'syncInterval':
      s.config.syncIntervalMinutes = parseInt(args.value as string, 10);
      if (s.config.syncEnabled && credential) {
        cron.unregister('gmail-sync');
        const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
        cron.register('gmail-sync', cronExpr);
      }
      break;

    case 'maxEmailsPerSync':
      s.config.maxEmailsPerSync = parseInt(args.value as string, 10);
      break;

    case 'notifyOnNewEmails':
      s.config.notifyOnNewEmails = Boolean(args.value);
      break;

    case 'allowWriteActions':
      s.config.allowWriteActions = Boolean(args.value);
      break;

    case 'showSensitiveContent':
      s.config.showSensitiveContent = Boolean(args.value);
      break;
  }

  state.set('config', s.config);
  publishState();
}

// ---------------------------------------------------------------------------
// Ping / Error hooks
// ---------------------------------------------------------------------------

async function onPing(): Promise<PingResult> {
  const credential = oauth.getCredential();

  return {
    ok: !!credential,
    errorMessage: credential
      ? undefined
      : 'Gmail not connected',
  };
}

async function onError(args: SkillErrorArgs): Promise<void> {
  console.error(`[gmail] Error: ${args.message}`);
  const s = globalThis.getGmailSkillState();
  s.lastApiError = args.message;
  publishState();
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

async function loadGmailProfile(): Promise<void> {
  const profile = await api.getProfile();
  if (profile) {
    const s = globalThis.getGmailSkillState();
    s.cache.profile = profile;

    if (!s.config.userEmail) {
      s.config.userEmail = profile.emailAddress;
      state.set('config', s.config);
    }

    console.log(`[gmail] Profile loaded for ${profile.emailAddress}`);
  }
}

function publishState(): void {
  const s = globalThis.getGmailSkillState();
  const isConnected = !!oauth.getCredential();

  state.setPartial({
    // Standard SkillHostConnectionState fields
    connection_status: isConnected ? 'connected' : 'disconnected',
    auth_status: isConnected ? 'authenticated' : 'not_authenticated',
    connection_error: s.lastApiError || null,
    auth_error: null,
    is_initialized: isConnected,
    // Skill-specific fields
    userEmail: s.config.userEmail,
    syncEnabled: s.config.syncEnabled,
    syncInProgress: s.sync.inProgress,
    lastSyncTime: s.sync.lastSyncTime
      ? new Date(s.sync.lastSyncTime).toISOString()
      : null,
    nextSyncTime: s.sync.nextSyncTime
      ? new Date(s.sync.nextSyncTime).toISOString()
      : null,
    activeSessions: s.activeSessions.length,
    rateLimitRemaining: s.rateLimitRemaining,
    lastError: s.lastApiError,
    storage: s.storage,
  });
}

// Expose helpers on globalThis for tools (e.g. status tool)
const _g = globalThis as Record<string, unknown>;
_g.publishState = publishState;

// ---------------------------------------------------------------------------
// Skill export
// ---------------------------------------------------------------------------

const skill: Skill = {
  info: {
    id: 'gmail',
    name: 'Gmail',
    version: '3.0.0',
    description: 'Gmail integration with persistent storage and full email management',
    auto_start: false,
    setup: { required: true, label: 'Configure Gmail' },
  },
  tools: [
    statusTool,
    getProfileTool,
    getEmailsTool,
    getEmailTool,
    searchEmailsTool,
    getLabelsTool,
    markEmailTool,
    sendEmailTool,
  ],
  init,
  start,
  stop,
  onCronTrigger,
  onSessionStart,
  onSessionEnd,
  onSetupStart: async () => onSetupStart(),
  onSetupSubmit: async (args) => onSetupSubmit(args),
  onSetupCancel: async () => onSetupCancel(),
  onOAuthComplete,
  onOAuthRevoked,
  onDisconnect,
  onListOptions,
  onSetOption,
  onPing,
  onError,
  publishState: async () => publishState(),
};

export default skill;
