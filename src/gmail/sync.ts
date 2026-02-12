// Gmail email sync: fetch inbox messages and upsert into local DB.
// Uses gmailFetch and publishSkillState from globalThis (set by index.ts).

declare global {
  var gmailSync: { performSync: () => Promise<void> };
}

export async function onSync(): Promise<void> {
  const s = globalThis.getGmailSkillState();

  if (!oauth.getCredential() || s.syncStatus.syncInProgress) {
    return;
  }

  const gmailFetch = (globalThis as Record<string, unknown>).gmailFetch as (
    endpoint: string
  ) => Promise<{ success: boolean; data?: { messages?: { id: string }[] }; error?: unknown }>;
  const publishSkillState = (globalThis as Record<string, unknown>).publishSkillState as () => void;

  if (!gmailFetch || !publishSkillState) {
    console.error('[gmail] performSync: gmailFetch or publishSkillState not available');
    return;
  }

  console.log('[gmail] Starting email sync...');
  s.syncStatus.syncInProgress = true;
  s.syncStatus.newEmailsCount = 0;

  const upsertEmail = (globalThis as { upsertEmail?: (msg: Record<string, unknown>) => void })
    .upsertEmail;
  if (!upsertEmail) {
    s.syncStatus.syncInProgress = false;
    return;
  }

  try {
    const params: string[] = [];
    params.push(`maxResults=${s.config.maxEmailsPerSync}`);
    params.push('q=in%3Ainbox');

    const response = await gmailFetch(`/users/me/messages?${params.join('&')}`);

    if (response.success && response.data?.messages) {
      let newEmails = 0;

      for (const msgRef of response.data.messages) {
        const msgResponse = await gmailFetch(`/users/me/messages/${msgRef.id}`);
        if (msgResponse.success && msgResponse.data) {
          upsertEmail(msgResponse.data as Record<string, unknown>);
          newEmails++;
        }
      }

      s.syncStatus.newEmailsCount = newEmails;

      if (newEmails > 0 && s.config.notifyOnNewEmails) {
        platform.notify('Gmail Sync Complete', `Synchronized ${newEmails} emails`);
      }
    }

    s.syncStatus.lastSyncTime = Date.now();
    s.syncStatus.nextSyncTime = Date.now() + s.config.syncIntervalMinutes * 60 * 1000;

    console.log(`[gmail] Sync completed. New emails: ${s.syncStatus.newEmailsCount}`);
  } catch (error) {
    console.error(`[gmail] Sync failed: ${error}`);
    s.lastApiError = error instanceof Error ? error.message : String(error);
  } finally {
    s.syncStatus.syncInProgress = false;
    publishSkillState();
  }
}
