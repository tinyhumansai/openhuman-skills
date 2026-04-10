// gmail/publish-state.ts
//
// Owns the contract between this skill and the host's `state.setPartial`
// transport. Centralized here so `start.ts`, `index.ts`, option handlers, and
// the sync loop all publish the same shape — and so we never accidentally
// re-introduce a cycle by having `start.ts` import from `index.ts`.
import { isGmailConnected } from './api/index';
import { getGmailSkillState } from './state';

export function publishSkillState(): void {
  const s = getGmailSkillState();
  const isConnected = isGmailConnected();

  // Profile for frontend gmail store (gmailSlice) — only when connected
  const profile =
    isConnected && s.profile != null
      ? {
          email_address: s.profile.emailAddress,
          messages_total: s.profile.messagesTotal,
          threads_total: s.profile.threadsTotal,
          history_id: s.profile.historyId,
        }
      : null;

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
    syncInProgress: s.syncStatus.syncInProgress,
    lastSyncTime: new Date(s.syncStatus.lastSyncTime).toISOString(),
    nextSyncTime: new Date(s.syncStatus.nextSyncTime).toISOString(),
    totalEmails: s.syncStatus.totalEmails,
    newEmailsCount: s.syncStatus.newEmailsCount,
    activeSessions: s.activeSessions.length,
    rateLimitRemaining: s.rateLimitRemaining,
    lastError: s.lastApiError,
    // For frontend gmail store (gmailSlice)
    profile,
  });
}
