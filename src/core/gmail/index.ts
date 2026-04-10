// Gmail skill main entry point
// Gmail integration with OAuth bridge; sync sends list API response (id + threadId) to frontend.
import { loadGmailProfile } from './api/helpers';
import { isGmailConnected } from './api/index';
import { getEmailCount } from './db/helpers';
import { initializeGmailSchema } from './db/schema';
import { publishSkillState } from './publish-state';
import { start } from './start';
import { getGmailSkillState } from './state';
import { onSync } from './sync';
import { tools } from './tools';
import type { SkillConfig } from './types';

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

function init(): void {
  console.log(`[gmail] Initializing on ${platform.os()}`);
  const s = getGmailSkillState();

  // Initialize database schema
  initializeGmailSchema();

  // Load persisted config from store
  const saved = state.get('config') as Partial<SkillConfig> | null;
  if (saved) {
    s.config.credentialId = saved.credentialId || s.config.credentialId;
    s.config.userEmail = saved.userEmail || s.config.userEmail;
    s.config.syncEnabled = saved.syncEnabled != null ? saved.syncEnabled : s.config.syncEnabled;
    s.config.syncIntervalMinutes = saved.syncIntervalMinutes || s.config.syncIntervalMinutes;
    s.config.maxEmailsPerSync = saved.maxEmailsPerSync || s.config.maxEmailsPerSync;
    s.config.notifyOnNewEmails =
      saved.notifyOnNewEmails != null ? saved.notifyOnNewEmails : s.config.notifyOnNewEmails;
    s.config.showSensitiveMessages =
      saved.showSensitiveMessages != null
        ? saved.showSensitiveMessages
        : s.config.showSensitiveMessages;
  }

  // Load sync status from persistent state
  const lastSync = state.get('lastSyncTime');
  const lastHistoryId = state.get('lastHistoryId');
  if (typeof lastSync === 'number') s.syncStatus.lastSyncTime = lastSync;
  if (typeof lastHistoryId === 'string') s.syncStatus.lastHistoryId = lastHistoryId;
  s.syncStatus.totalEmails = getEmailCount();

  const isConnected = isGmailConnected();
  console.log(`[gmail] Initialized. Connected: ${isConnected}`);
}

function stop(): void {
  console.log('[gmail] Skill stopped');
}

function onCronTrigger(scheduleId: string): void {
  console.log(`[gmail] Cron triggered: ${scheduleId}`);
  if (scheduleId === 'gmail-sync') {
    onSync();
  }
}

function onSessionStart(args: { sessionId: string }): void {
  const s = getGmailSkillState();
  s.activeSessions.push(args.sessionId);
  console.log(`[gmail] Session started: ${args.sessionId} (${s.activeSessions.length} active)`);
}

function onSessionEnd(args: { sessionId: string }): void {
  const s = getGmailSkillState();
  const index = s.activeSessions.indexOf(args.sessionId);
  if (index > -1) {
    s.activeSessions.splice(index, 1);
  }
  console.log(`[gmail] Session ended: ${args.sessionId} (${s.activeSessions.length} active)`);
}

// ---------------------------------------------------------------------------
// OAuth lifecycle hooks
// ---------------------------------------------------------------------------

function onOAuthRevoked(args: OAuthRevokedArgs): void {
  console.log(`[gmail] OAuth revoked: ${args.reason}`);
  const s = getGmailSkillState();

  s.config.credentialId = '';
  s.config.userEmail = '';
  s.profile = null;

  state.set('config', s.config);
  cron.unregister('gmail-sync');
  publishSkillState();

  if (args.reason === 'token_expired' || args.reason === 'provider_revoked') {
    platform.notify('Gmail Disconnected', 'Your Gmail connection has expired. Please reconnect.');
  }
}

function onDisconnect(): void {
  console.log('[gmail] Disconnecting...');
  const s = getGmailSkillState();

  // Revoke via OAuth bridge
  oauth.revoke();

  s.config = {
    credentialId: '',
    userEmail: '',
    syncEnabled: true,
    syncIntervalMinutes: 15,
    maxEmailsPerSync: 100,
    notifyOnNewEmails: true,
  };

  s.profile = null;
  state.delete('config');
  cron.unregister('gmail-sync');
  publishSkillState();

  console.log('[gmail] Disconnected and cleaned up');
}

// ---------------------------------------------------------------------------
// Auth revoke (self_hosted / text modes)
// ---------------------------------------------------------------------------

function onAuthRevoked(args: { mode?: string }): void {
  console.log(`[gmail] Auth revoked — mode: ${args.mode || 'unknown'}`);
  const s = getGmailSkillState();

  s.config.credentialId = '';
  s.config.userEmail = '';
  s.profile = null;
  state.delete('config');
  cron.unregister('gmail-sync');
  publishSkillState();
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

// ---------------------------------------------------------------------------
// Options system
// ---------------------------------------------------------------------------

function onListOptions(): { options: SkillOption[] } {
  const s = getGmailSkillState();

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
        name: 'showSensitiveMessages',
        type: 'boolean',
        label: 'Show Sensitive Messages',
        value: s.config.showSensitiveMessages || false,
      },
    ],
  };
}

function onSetOption(args: { name: string; value: unknown }): void {
  const s = getGmailSkillState();
  const connected = isGmailConnected();

  switch (args.name) {
    case 'syncEnabled':
      s.config.syncEnabled = Boolean(args.value);
      if (s.config.syncEnabled && connected) {
        const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
        cron.register('gmail-sync', cronExpr);
      } else {
        cron.unregister('gmail-sync');
      }
      break;

    case 'syncInterval':
      s.config.syncIntervalMinutes = parseInt(args.value as string, 10);
      if (s.config.syncEnabled && connected) {
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

    case 'showSensitiveMessages':
      s.config.showSensitiveMessages = Boolean(args.value);
      break;
  }

  // Save updated config
  state.set('config', s.config);
  publishSkillState();
}

// Expose helper functions on globalThis for tools to use
const _g = globalThis as Record<string, unknown>;
_g.getGmailSkillState = getGmailSkillState;
_g.publishSkillState = publishSkillState;
_g.loadGmailProfile = loadGmailProfile;

const skill: Skill = {
  info: {
    id: 'gmail',
    name: 'Gmail',
    version: '2.1.0',
    description: 'Gmail integration with persistent storage',
    auto_start: false,
    setup: { required: true, label: 'Configure Gmail' },
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
  onSync,
  onDisconnect,
  onListOptions,
  onSetOption,
};

export default skill;
