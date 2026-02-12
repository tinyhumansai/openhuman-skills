// Gmail data synchronization engine.
// Fetches emails from Gmail API and stores them in the local SQLite database.
import * as api from './api';

async function performInitialSync(onProgress?: (msg: string) => void): Promise<void> {
  const s = globalThis.getGmailSkillState();

  if (!oauth.getCredential() || s.sync.inProgress) return;

  s.sync.inProgress = true;
  s.sync.error = null;
  const startTime = Date.now();

  try {
    onProgress?.('Loading Gmail profile...');
    const profile = await api.getProfile();
    if (profile) {
      s.cache.profile = profile;
      if (!s.config.userEmail) {
        s.config.userEmail = profile.emailAddress;
        state.set('config', s.config);
      }
    }

    onProgress?.('Fetching emails...');
    const params = `maxResults=${s.config.maxEmailsPerSync}&q=${encodeURIComponent('in:inbox')}`;
    const listResponse = await api.listMessages(params);

    let synced = 0;
    if (listResponse.success && listResponse.data?.messages) {
      const messages: Array<{ id: string }> = listResponse.data.messages;

      for (const msgRef of messages) {
        try {
          const msgResponse = await api.getMessage(msgRef.id);
          if (msgResponse.success && msgResponse.data) {
            globalThis.gmailDb.upsertEmail(msgResponse.data);
            synced++;
          }
        } catch {
          // Individual message failures don't abort the batch
        }
      }

      onProgress?.(`Synced ${synced} emails`);

      if (synced > 0 && s.config.notifyOnNewEmails) {
        platform.notify('Gmail Sync Complete', `Synchronized ${synced} emails`);
      }
    }

    // Fetch labels
    onProgress?.('Syncing labels...');
    const labelsResponse = await api.listLabels();
    if (labelsResponse.success && labelsResponse.data?.labels) {
      for (const label of labelsResponse.data.labels) {
        globalThis.gmailDb.upsertLabel(label);
      }
    }

    // Mark sync as completed
    s.sync.lastSyncTime = Date.now();
    s.sync.nextSyncTime = Date.now() + s.config.syncIntervalMinutes * 60 * 1000;
    s.sync.lastSyncDurationMs = Date.now() - startTime;
    s.sync.completed = true;

    globalThis.gmailDb.setSyncState('last_sync_time', String(s.sync.lastSyncTime));
    globalThis.gmailDb.setSyncState('sync_completed', '1');

    if (profile?.historyId) {
      s.sync.lastHistoryId = profile.historyId;
      globalThis.gmailDb.setSyncState('last_history_id', profile.historyId);
    }

    // Update storage stats
    s.storage = globalThis.gmailDb.getEntityCounts();

    onProgress?.('Sync complete');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    s.sync.error = errorMsg;
    console.error(`[gmail] Sync failed: ${errorMsg}`);
  } finally {
    s.sync.inProgress = false;
  }
}

function isSyncCompleted(): boolean {
  return globalThis.gmailDb.getSyncState('sync_completed') === '1';
}

function getLastSyncTime(): number {
  const val = globalThis.gmailDb.getSyncState('last_sync_time');
  return val ? parseInt(val, 10) : 0;
}

// ---------------------------------------------------------------------------
// globalThis registration
// ---------------------------------------------------------------------------

declare global {
  var gmailSync: {
    performInitialSync: typeof performInitialSync;
    isSyncCompleted: typeof isSyncCompleted;
    getLastSyncTime: typeof getLastSyncTime;
  };
}

globalThis.gmailSync = { performInitialSync, isSyncCompleted, getLastSyncTime };
