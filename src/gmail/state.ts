// Gmail skill mutable runtime state via globalThis pattern.
// Works in both the bundled esbuild IIFE (production) and the test harness.
import type { GmailProfile, SkillConfig, StorageStats, SyncStatus } from './types';

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

export interface GmailSkillState {
  // Persisted configuration
  config: SkillConfig;

  // In-memory cache
  cache: { profile: GmailProfile | null };

  // Sync tracking
  sync: SyncStatus;

  // Entity counts for status reporting
  storage: StorageStats;

  // Rate limit tracking
  rateLimitRemaining: number;
  rateLimitReset: number;

  // Last API error
  lastApiError: string | null;

  // Active sessions
  activeSessions: string[];
}

// ---------------------------------------------------------------------------
// globalThis registration
// ---------------------------------------------------------------------------

declare global {
  function getGmailSkillState(): GmailSkillState;
  var __gmailSkillState: GmailSkillState;
}

const defaultConfig: SkillConfig = {
  credentialId: '',
  userEmail: '',
  syncEnabled: true,
  syncIntervalMinutes: 15,
  maxEmailsPerSync: 100,
  notifyOnNewEmails: true,
  allowWriteActions: false,
  showSensitiveContent: false,
};

const skillState: GmailSkillState = {
  config: { ...defaultConfig },
  cache: { profile: null },
  sync: {
    inProgress: false,
    completed: false,
    lastSyncTime: 0,
    nextSyncTime: 0,
    lastSyncDurationMs: 0,
    lastHistoryId: '',
    error: null,
  },
  storage: { emailCount: 0, threadCount: 0, labelCount: 0, unreadCount: 0 },
  rateLimitRemaining: 250,
  rateLimitReset: Date.now() + 3600000,
  lastApiError: null,
  activeSessions: [],
};

globalThis.__gmailSkillState = skillState;

globalThis.getGmailSkillState = function (): GmailSkillState {
  return globalThis.__gmailSkillState;
};

export { defaultConfig };
