// Gmail email sync: initial + incremental sync with 30-day window.
// Fetches messages via Gmail API and upserts into local SQLite database.
// Skips emails already in the local DB to avoid redundant API calls.
import { gmailFetch } from './api';
import { getEmailById, getSyncState, getUnsubmittedEmails, markEmailsSubmitted, setSyncState, upsertEmail } from './db/helpers';
import { getGmailSkillState, publishSkillState } from './state';
import type { DatabaseEmail, GmailMessage } from './types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Number of days to look back for emails. */
const SYNC_WINDOW_DAYS = 30;

/** Max emails to fetch per API page. */
const PAGE_SIZE = 100;

/** Max pages to fetch during initial sync. */
const MAX_INITIAL_PAGES = 10;

/** Max pages to fetch during incremental sync. */
const MAX_INCREMENTAL_PAGES = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Progress callback: receives a human-readable message and a 0-100 percentage. */
type SyncProgressCallback = (message: string, progress: number) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a Gmail `after:` date string (YYYY/MM/DD) for N days ago. */
function getDateNDaysAgo(days: number): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/** Format a timestamp as YYYY/MM/DD for Gmail query syntax. */
function formatDateForQuery(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * Fetch a page of message IDs from the Gmail API.
 * Returns the message references and optional next page token.
 */
async function fetchMessagePage(
  query: string,
  pageToken?: string
): Promise<{ messages: Array<{ id: string; threadId: string }>; nextPageToken?: string }> {
  const params: string[] = [`maxResults=${PAGE_SIZE}`, `q=${encodeURIComponent(query)}`];
  if (pageToken) params.push(`pageToken=${encodeURIComponent(pageToken)}`);

  const response = await gmailFetch(`/users/me/messages?${params.join('&')}`);

  if (!response.success || !response.data?.messages) {
    if (response.error) {
      console.error(`[gmail-sync] List error: ${response.error.message}`);
    }
    return { messages: [] };
  }

  return {
    messages: response.data.messages as Array<{ id: string; threadId: string }>,
    nextPageToken: response.data.nextPageToken,
  };
}

/**
 * Fetch full message details and upsert into DB.
 * Returns true if a new email was synced, false if skipped (already exists).
 */
async function syncMessage(msgId: string): Promise<boolean> {
  // Skip if already in local DB
  if (getEmailById(msgId)) return false;

  const msgResponse = await gmailFetch(`/users/me/messages/${msgId}`);
  if (msgResponse.success && msgResponse.data) {
    upsertEmail(msgResponse.data as GmailMessage);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Initial Sync
// ---------------------------------------------------------------------------

/**
 * Perform initial sync: loads all emails from the last 30 days.
 * Paginates through results and skips emails already in the local database.
 * Called on first connect or when initial sync hasn't been completed.
 */
export async function performInitialSync(onProgress?: SyncProgressCallback): Promise<void> {
  const s = getGmailSkillState();

  if (!oauth.getCredential()) {
    console.log('[gmail-sync] No OAuth credential, skipping initial sync');
    return;
  }

  if (s.syncStatus.syncInProgress) {
    console.log('[gmail-sync] Sync already in progress, skipping');
    return;
  }

  const log = (msg: string, pct: number) => {
    console.log(`[gmail-sync] [${pct}%] ${msg}`);
    onProgress?.(msg, pct);
  };

  s.syncStatus.syncInProgress = true;
  s.syncStatus.newEmailsCount = 0;
  publishSkillState();

  try {
    const afterDate = getDateNDaysAgo(SYNC_WINDOW_DAYS);
    const query = `after:${afterDate}`;
    log(`Starting initial sync (emails after ${afterDate})...`, 0);

    let pageToken: string | undefined;
    let newEmails = 0;
    let skipped = 0;
    let page = 0;

    do {
      page++;
      log(`Fetching page ${page}...`, Math.min(5 + page * 8, 80));

      const result = await fetchMessagePage(query, pageToken);
      if (result.messages.length === 0) break;

      pageToken = result.nextPageToken;

      for (const msgRef of result.messages) {
        const isNew = await syncMessage(msgRef.id);
        if (isNew) newEmails++;
        else skipped++;
      }

      log(`Page ${page}: ${newEmails} new, ${skipped} skipped`, Math.min(10 + page * 10, 90));
    } while (pageToken && page < MAX_INITIAL_PAGES);

    // Mark initial sync as complete
    setSyncState('initial_sync_completed', 'true');
    setSyncState('last_sync_time', String(Date.now()));

    s.syncStatus.lastSyncTime = Date.now();
    s.syncStatus.newEmailsCount = newEmails;
    s.syncStatus.nextSyncTime = Date.now() + s.config.syncIntervalMinutes * 60 * 1000;

    log(`Initial sync complete: ${newEmails} new emails, ${skipped} skipped`, 100);

    // Submit newly synced emails to backend for processing
    submitNewEmails();

    if (newEmails > 0 && s.config.notifyOnNewEmails) {
      platform.notify('Gmail Sync Complete', `Synchronized ${newEmails} new emails`);
    }
  } catch (error) {
    console.error(`[gmail-sync] Initial sync failed: ${error}`);
    s.lastApiError = error instanceof Error ? error.message : String(error);
  } finally {
    s.syncStatus.syncInProgress = false;
    publishSkillState();
  }
}

// ---------------------------------------------------------------------------
// Incremental Sync
// ---------------------------------------------------------------------------

/**
 * Incremental sync: fetches only emails newer than the last sync time,
 * within the 30-day window. Skips emails already in the database.
 * Falls back to initial sync if it hasn't been completed yet.
 */
export async function onSync(): Promise<void> {
  const s = getGmailSkillState();

  if (!oauth.getCredential() || s.syncStatus.syncInProgress) return;

  // If initial sync hasn't completed, run it instead
  if (!isSyncCompleted()) {
    return performInitialSync();
  }

  console.log('[gmail-sync] Starting incremental sync...');
  s.syncStatus.syncInProgress = true;
  s.syncStatus.newEmailsCount = 0;
  publishSkillState();

  try {
    // Use last sync time to narrow the query window, but never go beyond 30 days
    const thirtyDaysAgo = getDateNDaysAgo(SYNC_WINDOW_DAYS);
    const lastSyncTime = getLastSyncTime();

    let query: string;
    if (lastSyncTime) {
      // Use the later of: last sync time or 30 days ago
      const thirtyDaysAgoMs = Date.now() - SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000;
      const effectiveDate = Math.max(lastSyncTime, thirtyDaysAgoMs);
      query = `after:${formatDateForQuery(effectiveDate)}`;
    } else {
      query = `after:${thirtyDaysAgo}`;
    }

    let pageToken: string | undefined;
    let newEmails = 0;
    let skipped = 0;
    let page = 0;

    do {
      page++;
      const result = await fetchMessagePage(query, pageToken);
      if (result.messages.length === 0) break;

      pageToken = result.nextPageToken;

      for (const msgRef of result.messages) {
        const isNew = await syncMessage(msgRef.id);
        if (isNew) newEmails++;
        else skipped++;
      }
    } while (pageToken && page < MAX_INCREMENTAL_PAGES);

    // Update sync state
    setSyncState('last_sync_time', String(Date.now()));
    s.syncStatus.lastSyncTime = Date.now();
    s.syncStatus.newEmailsCount = newEmails;
    s.syncStatus.nextSyncTime = Date.now() + s.config.syncIntervalMinutes * 60 * 1000;

    console.log(`[gmail-sync] Incremental sync done: ${newEmails} new, ${skipped} skipped`);

    // Submit newly synced emails to backend for processing
    submitNewEmails();

    if (newEmails > 0 && s.config.notifyOnNewEmails) {
      platform.notify('New Gmail Emails', `${newEmails} new emails synced`);
    }
  } catch (error) {
    console.error(`[gmail-sync] Incremental sync failed: ${error}`);
    s.lastApiError = error instanceof Error ? error.message : String(error);
  } finally {
    s.syncStatus.syncInProgress = false;
    publishSkillState();
  }
}

// ---------------------------------------------------------------------------
// Backend data submission
// ---------------------------------------------------------------------------

/** Max chunks per backend.submitData call (backend limit is 500). */
const SUBMIT_BATCH_SIZE = 200;

/**
 * Build a DataSubmissionChunk from a database email row.
 * Prefers body_text, falls back to snippet. Includes key metadata.
 */
function emailToChunk(email: DatabaseEmail): { title?: string; content: string; metadata?: Record<string, unknown> } {
  const content = email.body_text || email.snippet || '';
  return {
    title: email.subject || undefined,
    content,
    metadata: {
      emailId: email.id,
      threadId: email.thread_id,
      senderEmail: email.sender_email,
      senderName: email.sender_name,
      recipientEmails: email.recipient_emails,
      date: email.date,
      labels: email.labels,
    },
  };
}

/**
 * Submit un-submitted emails to the backend for processing.
 * Reads emails where backend_submitted = 0, batches them into
 * backend.submitData() calls, and marks them as submitted.
 */
function submitNewEmails(): void {
  const emails = getUnsubmittedEmails(SUBMIT_BATCH_SIZE);
  if (emails.length === 0) return;

  const chunks = emails
    .map(emailToChunk)
    .filter((c) => c.content.length > 0);

  if (chunks.length === 0) {
    // All emails had empty content — mark them submitted anyway to avoid re-processing
    markEmailsSubmitted(emails.map((e) => e.id));
    return;
  }

  try {
    backend.submitData(chunks, { dataSource: 'gmail' });
    markEmailsSubmitted(emails.map((e) => e.id));
    console.log(`[gmail-sync] Submitted ${chunks.length} email(s) to backend`);
  } catch (error) {
    // Non-fatal: emails stay un-submitted and will be retried on next sync
    console.error(`[gmail-sync] Failed to submit emails to backend: ${error}`);
  }
}

// ---------------------------------------------------------------------------
// Sync state helpers
// ---------------------------------------------------------------------------

/** Check if initial sync has been completed. */
export function isSyncCompleted(): boolean {
  return getSyncState('initial_sync_completed') === 'true';
}

/** Get last sync timestamp (ms since epoch), or null if never synced. */
export function getLastSyncTime(): number | null {
  const value = getSyncState('last_sync_time');
  return value ? parseInt(value, 10) : null;
}
