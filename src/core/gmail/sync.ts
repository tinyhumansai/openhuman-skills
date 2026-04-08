// Gmail email sync: initial + incremental sync with 30-day window.
// Fetches messages via Gmail API and upserts into local SQLite database.
// Skips emails already in the local DB to avoid redundant API calls.
import { syncIntegrationMetadata } from '../../shared/integration-metadata';
import { gmailFetch, isGmailConnected } from './api';
import { loadGmailProfile } from './api/helpers';
import {
  emailExists,
  getEmailCount,
  getEmails,
  getUnsubmittedEmails,
  markEmailsSubmitted,
  markSensitiveAsSubmitted,
  upsertEmail,
} from './db/helpers';
import { getGmailSkillState, publishSkillState } from './state';
import type { GmailMessage } from './types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Number of days to look back for emails. */
const SYNC_WINDOW_DAYS = 30;

/** Max emails to fetch per API page. */
const PAGE_SIZE = 20;

/** Max pages to fetch per sync (20 emails/page × 10 pages = 200 emails). */
const MAX_PAGES = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Progress callback: receives a human-readable message and a 0-100 percentage. */
type SyncProgressCallback = (message: string, progress: number) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Emit sync progress to the frontend via state. */
function emitSyncProgress(message: string, progress: number): void {
  const s = getGmailSkillState();
  s.syncStatus.syncProgress = progress;
  s.syncStatus.syncProgressMessage = message;
  state.setPartial({ syncProgress: progress, syncProgressMessage: message });
}

function syncGmailMetadataToBackend(): void {
  const s = getGmailSkillState();
  if (!s.profile) return;

  const metadata = {
    email_address: s.profile.emailAddress,
    messages_total: s.profile.messagesTotal,
    threads_total: s.profile.threadsTotal,
    history_id: s.profile.historyId,
  };

  syncIntegrationMetadata({
    title: 'Gmail profile sync',
    content: JSON.stringify(metadata),
    sourceType: 'email',
    metadata,
  });
}

/** Format a timestamp (ms) or days-ago offset as YYYY/MM/DD for Gmail query syntax. */
function gmailDateStr(msOrDaysAgo: number, isDaysAgo = false): string {
  const ms = isDaysAgo ? Date.now() - msOrDaysAgo * 24 * 60 * 60 * 1000 : msOrDaysAgo;
  const d = new Date(ms);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Fetch a page of message IDs from the Gmail API.
 * Returns the message references and optional next page token.
 */
function fetchMessagePage(
  query: string,
  pageToken?: string
): { messages: Array<{ id: string; threadId: string }>; nextPageToken?: string } {
  const params = [`maxResults=${PAGE_SIZE}`, `q=${encodeURIComponent(query)}`];
  if (pageToken) params.push(`pageToken=${encodeURIComponent(pageToken)}`);

  const response = gmailFetch<{
    messages?: Array<{ id: string; threadId: string }>;
    nextPageToken?: string;
  }>(`/users/me/messages?${params.join('&')}`);

  if (!response.success || !response.data?.messages) {
    if (response.error) console.error(`[gmail-sync] List error: ${response.error.message}`);
    return { messages: [] };
  }

  return { messages: response.data.messages, nextPageToken: response.data.nextPageToken };
}

/**
 * Fetch full message details and upsert into DB.
 * Uses emailExists (SELECT 1) instead of fetching the full row for the skip check.
 * Returns true if a new email was synced, false if skipped (already exists).
 */
function syncMessage(msgId: string): boolean {
  if (emailExists(msgId)) return false;

  const msgResponse = gmailFetch(`/users/me/messages/${msgId}`);
  if (msgResponse.success && msgResponse.data) {
    const s = getGmailSkillState();
    upsertEmail(msgResponse.data as GmailMessage, !s.config.showSensitiveMessages);
    s.syncStatus.totalEmails++;
    publishSkillState();
    return true;
  }
  return false;
}

/**
 * Shared pagination loop used by both initial and incremental sync.
 * Fetches pages of message IDs then syncs each message individually.
 * Returns { newEmails, skipped }.
 */
function runSyncPages(
  query: string,
  maxPages: number,
  log?: SyncProgressCallback
): { newEmails: number; skipped: number } {
  let pageToken: string | undefined;
  let newEmails = 0;
  let skipped = 0;
  let page = 0;

  do {
    page++;
    log?.(`Fetching page ${page}...`, Math.min(5 + page * 8, 80));

    const result = fetchMessagePage(query, pageToken);
    if (result.messages.length === 0) break;

    pageToken = result.nextPageToken;

    // Sync messages in parallel (5 concurrent) to avoid sequential proxy round-trips
    const CONCURRENCY = 5;
    for (let i = 0; i < result.messages.length; i += CONCURRENCY) {
      const batch = result.messages.slice(i, i + CONCURRENCY);
      const results = batch.map(msgRef => syncMessage(msgRef.id));
      for (const wasNew of results) {
        if (wasNew) newEmails++;
        else skipped++;
      }
    }

    log?.(`Page ${page}: ${newEmails} new, ${skipped} skipped`, Math.min(10 + page * 10, 90));
  } while (pageToken && page < maxPages);

  return { newEmails, skipped };
}

// ---------------------------------------------------------------------------
// Initial Sync
// ---------------------------------------------------------------------------

/**
 * Perform initial sync: loads all emails from the last 30 days.
 * Paginates through results and skips emails already in the local database.
 * Called on first connect or when initial sync hasn't been completed.
 */
export function performInitialSync(onProgress?: SyncProgressCallback): void {
  const s = getGmailSkillState();

  if (!isGmailConnected()) {
    console.log('[gmail-sync] No credential, skipping initial sync');
    return;
  }

  if (s.syncStatus.syncInProgress) {
    console.log('[gmail-sync] Sync already in progress, skipping');
    return;
  }

  const log = (msg: string, pct: number) => {
    console.log(`[gmail-sync] [${pct}%] ${msg}`);
    emitSyncProgress(msg, pct);
    onProgress?.(msg, pct);
  };

  s.syncStatus.syncInProgress = true;
  s.syncStatus.newEmailsCount = 0;
  s.syncStatus.totalEmails = getEmailCount();
  publishSkillState();

  try {
    const afterDate = gmailDateStr(SYNC_WINDOW_DAYS, true);
    log(`Starting initial sync (emails after ${afterDate})...`, 0);

    const { newEmails, skipped } = runSyncPages(`after:${afterDate}`, MAX_PAGES, log);

    const now = Date.now();
    state.set('initialSyncCompleted', true);
    state.set('lastSyncTime', now);

    s.syncStatus.lastSyncTime = now;
    s.syncStatus.newEmailsCount = newEmails;
    s.syncStatus.nextSyncTime = now + s.config.syncIntervalMinutes * 60 * 1000;

    log(`Initial sync complete: ${newEmails} new emails, ${skipped} skipped`, 100);

    // Ingest newly synced emails into knowledge graph
    ingestNewEmails();

    if (newEmails > 0 && s.config.notifyOnNewEmails) {
      platform.notify('Gmail Sync Complete', `Synchronized ${newEmails} new emails`);
    }
  } catch (error) {
    console.error(`[gmail-sync] Initial sync failed: ${error}`);
    s.lastApiError = error instanceof Error ? error.message : String(error);
    emitSyncProgress(`Sync failed: ${s.lastApiError}`, 0);
  } finally {
    s.syncStatus.syncInProgress = false;
    s.syncStatus.syncProgress = 0;
    s.syncStatus.syncProgressMessage = '';
    publishSkillState();
    // Publish email metadata (no body_text to avoid breaking JSON transport)
    const emails = getEmails().map(e => ({
      id: e.id,
      subject: e.subject,
      sender_email: e.sender_email,
      sender_name: e.sender_name,
      date: e.date,
      snippet: e.snippet,
      is_read: e.is_read,
      is_starred: e.is_starred,
      labels: e.labels,
    }));
    state.setPartial({ emails });
  }
}

// ---------------------------------------------------------------------------
// Incremental Sync
// ---------------------------------------------------------------------------

/**
 * Incremental sync: fetches only emails newer than the last sync time,
 * within the 30-day window. Falls back to initial sync if not yet completed.
 */
export function onSync(): void {
  const s = getGmailSkillState();

  if (!isGmailConnected() || s.syncStatus.syncInProgress) return;

  try {
    loadGmailProfile();
    syncGmailMetadataToBackend();
  } catch (error) {
    console.warn(`[gmail] Profile fetch failed, continuing sync: ${error}`);
  }

  publishSkillState();

  if (!isSyncCompleted()) {
    return performInitialSync();
  }

  s.syncStatus.syncInProgress = true;
  s.syncStatus.newEmailsCount = 0;
  s.syncStatus.totalEmails = getEmailCount();
  emitSyncProgress('Starting incremental sync...', 0);

  try {
    const lastSyncTime = getLastSyncTime();
    const thirtyDaysAgoMs = Date.now() - SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const effectiveMs = lastSyncTime ? Math.max(lastSyncTime, thirtyDaysAgoMs) : thirtyDaysAgoMs;
    const query = `after:${gmailDateStr(effectiveMs)}`;

    const { newEmails, skipped } = runSyncPages(query, MAX_PAGES);

    const now = Date.now();
    state.set('lastSyncTime', now);
    s.syncStatus.lastSyncTime = now;
    s.syncStatus.newEmailsCount = newEmails;
    s.syncStatus.nextSyncTime = now + s.config.syncIntervalMinutes * 60 * 1000;

    emitSyncProgress(`Sync complete: ${newEmails} new, ${skipped} skipped`, 100);
    console.log(`[gmail-sync] Incremental sync done: ${newEmails} new, ${skipped} skipped`);

    // Ingest newly synced emails into knowledge graph
    ingestNewEmails();

    if (newEmails > 0 && s.config.notifyOnNewEmails) {
      platform.notify('New Gmail Emails', `${newEmails} new emails synced`);
    }
  } catch (error) {
    console.error(`[gmail-sync] Incremental sync failed: ${error}`);
    s.lastApiError = error instanceof Error ? error.message : String(error);
    emitSyncProgress(`Sync failed: ${s.lastApiError}`, 0);
  } finally {
    s.syncStatus.syncInProgress = false;
    s.syncStatus.syncProgress = 0;
    s.syncStatus.syncProgressMessage = '';
    publishSkillState();
    syncGmailMetadataToBackend();
    // Publish email metadata (no body_text to avoid breaking JSON transport)
    const emails = getEmails().map(e => ({
      id: e.id,
      subject: e.subject,
      sender_email: e.sender_email,
      sender_name: e.sender_name,
      date: e.date,
      snippet: e.snippet,
      is_read: e.is_read,
      is_starred: e.is_starred,
      labels: e.labels,
    }));
    state.setPartial({ emails });
  }
}

// ---------------------------------------------------------------------------
// Ingest synced emails into knowledge graph via memory.insert()
// ---------------------------------------------------------------------------

/** Max emails to pull from DB per ingestion round. */
const INGEST_QUERY_LIMIT = 500;

/**
 * Minimum content length (in characters) required for ingestion.
 * Very short strings may tokenize to zero tokens and crash the ONNX/CoreML
 * embedding model (shape {0} is not supported). Skip anything shorter.
 */
const MIN_CONTENT_LENGTH = 50;

/**
 * Ingest un-submitted emails into the knowledge graph.
 * Each email is sent via memory.insert() which routes through the Rust
 * ingestion pipeline (upsert → GLiNER entity/relation extraction → graph).
 * Sensitive emails are marked as submitted without being ingested.
 */
function ingestNewEmails(): void {
  // Mark sensitive emails as submitted so they never enter the ingestion queue
  markSensitiveAsSubmitted();

  const emails = getUnsubmittedEmails(INGEST_QUERY_LIMIT);
  if (emails.length === 0) return;

  emitSyncProgress(`Ingesting ${emails.length} emails into knowledge graph...`, 92);

  const submittedIds: string[] = [];
  let ingested = 0;

  for (const email of emails) {
    const content = (email.body_text || email.snippet || '').trim();
    if (content.length < MIN_CONTENT_LENGTH) {
      submittedIds.push(email.id);
      continue;
    }

    try {
      memory.insert({
        title: email.subject || `Email ${email.id}`,
        content,
        sourceType: 'email',
        documentId: `gmail-email-${email.id}`,
        metadata: {
          source: 'gmail',
          type: 'email',
          emailId: email.id,
          threadId: email.thread_id,
          senderEmail: email.sender_email,
          senderName: email.sender_name,
          recipientEmails: email.recipient_emails,
          isRead: email.is_read === 1,
          isImportant: email.is_important === 1,
          isStarred: email.is_starred === 1,
          hasAttachments: email.has_attachments === 1,
          labels: email.labels,
        },
        createdAt: email.date ? email.date / 1000 : undefined,
        updatedAt: email.updated_at ? email.updated_at / 1000 : undefined,
      });
      submittedIds.push(email.id);
      ingested++;
    } catch (e) {
      console.error(`[gmail] Failed to ingest email ${email.id}: ${e}`);
    }
  }

  if (submittedIds.length > 0) markEmailsSubmitted(submittedIds);

  if (ingested > 0) {
    console.log(`[gmail] Ingested ${ingested} email(s) into knowledge graph`);
  }
}

// ---------------------------------------------------------------------------
// Sync state helpers
// ---------------------------------------------------------------------------

/** Check if initial sync has been completed. */
export function isSyncCompleted(): boolean {
  return state.get('initialSyncCompleted') === true;
}

/** Get last sync timestamp (ms since epoch), or null if never synced. */
export function getLastSyncTime(): number | null {
  const value = state.get('lastSyncTime');
  return typeof value === 'number' ? value : null;
}
