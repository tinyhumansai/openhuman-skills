// Notion sync engine
// Periodically downloads pages, databases, users, and page content from Notion
// into local SQLite for fast local querying.
import { syncIntegrationMetadata } from '../../shared/integration-metadata';
import { notionApi } from './api/index';
import {
  getDatabaseById, // getDatabaseRowById,
  getEntityCounts, // getLocalDatabases,
  getLocalPages,
  getLocalSummaries,
  getPageById,
  getPagesNeedingContent,
  getUnsubmittedPages,
  getUnsubmittedRows,
  getUnsyncedSummaries,
  markPagesSubmitted,
  markRowsSubmitted,
  markSummariesSynced,
  updatePageContent,
  upsertDatabase, // upsertDatabaseRow,
  upsertPage,
  upsertUser,
} from './db/helpers';
import { isNotionConnected } from './helpers';
import { fetchBlockTreeText } from './helpers';
import { getNotionSkillState } from './state';

// ---------------------------------------------------------------------------
// Main sync orchestrator
// ---------------------------------------------------------------------------

/** Update sync progress and publish to frontend state. */
function syncProgress(phase: string, progress: number, message: string): void {
  const s = getNotionSkillState();
  s.syncStatus.syncPhase = phase;
  s.syncStatus.syncProgress = Math.round(Math.min(100, Math.max(0, progress)));
  s.syncStatus.syncMessage = message;
  console.log(`[notion][sync] [${phase}] ${progress.toFixed(0)}% — ${message}`);
  publishSyncState();
}

export async function performSync(): Promise<void> {
  const s = getNotionSkillState();

  // Guard: skip if already syncing or no credential
  if (s.syncStatus.syncInProgress) {
    console.log('[notion] Sync already in progress, skipping');
    return;
  }

  if (!isNotionConnected()) {
    console.log('[notion] No credential, skipping sync');
    return;
  }

  const startTime = Date.now();
  s.syncStatus.syncInProgress = true;
  s.syncStatus.lastSyncError = null;
  syncProgress('starting', 0, 'Starting sync...');

  try {
    // Phase 1: Sync users (0-10%)
    syncProgress('users', 0, 'Fetching workspace users...');
    await syncUsers();
    syncProgress('users', 10, 'Users synced');

    // Phase 2: Sync pages and databases via search (10-60%)
    syncProgress('pages', 10, 'Discovering pages and databases...');
    await syncSearchItems();

    // Phase 3: Sync page content (60-90%)
    if (s.config.contentSyncEnabled) {
      syncProgress('content', 60, 'Fetching page content...');
      await syncContent(startTime, CONTENT_SYNC_TIME_BUDGET_MS);
    }

    // Phase 4: Ingest into knowledge graph (90-100%)
    syncProgress('ingestion', 90, 'Ingesting documents into knowledge graph...');
    ingestNewDocuments();

    // Finalize
    const durationMs = Date.now() - startTime;
    const nowMs = Date.now();
    s.syncStatus.nextSyncTime = nowMs + s.config.syncIntervalMinutes * 60 * 1000;
    s.syncStatus.lastSyncDurationMs = durationMs;

    const counts = getEntityCounts();
    if (counts.pages > 0 || counts.databases > 0) {
      s.syncStatus.lastSyncTime = nowMs;
    }

    s.syncStatus.totalPages = counts.pages;
    s.syncStatus.totalDatabases = counts.databases;
    s.syncStatus.pagesWithContent = counts.pagesWithContent;
    s.syncStatus.pagesWithSummary = counts.pagesWithSummary;
    s.syncStatus.summariesTotal = counts.summariesTotal;
    s.syncStatus.summariesPending = counts.summariesPending;
    s.syncStatus.totalDatabaseRows = counts.databaseRows;

    insertNotionMemorySnapshot();

    const secs = (durationMs / 1000).toFixed(1);
    syncProgress('done', 100,
      `Sync complete in ${secs}s — ${counts.pages} pages, ${counts.databases} databases, ${counts.pagesWithContent} with content`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    s.syncStatus.lastSyncError = errorMsg;
    s.syncStatus.lastSyncDurationMs = Date.now() - startTime;
    syncProgress('error', 0, `Sync failed: ${errorMsg}`);
  } finally {
    s.syncStatus.syncInProgress = false;
    s.syncStatus.syncPhase = null;
    s.syncStatus.syncProgress = 0;
    publishSyncState();
  }
}

function insertNotionMemorySnapshot(): void {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const s = getNotionSkillState();
  const profile = (state.get('profile') as Record<string, unknown> | null) ?? null;
  if (!profile?.id) return;

  const pages = getLocalPages({ limit: 100 }).map(p => ({
    id: p.id,
    title: p.title,
    url: p.url,
    icon: p.icon,
    parent_type: p.parent_type,
    parent_id: p.parent_id,
    created_by_id: p.created_by_id,
    last_edited_by_id: p.last_edited_by_id,
    created_time: p.created_time,
    last_edited_time: p.last_edited_time,
    content_synced_at: p.content_synced_at,
    archived: p.archived === 1,
    synced_at: p.synced_at,
    has_content: !!p.content_text,
    content_length: p.content_text ? p.content_text.length : 0,
    content_text: p.content_text,
  }));

  const summaries = getLocalSummaries(100).map(summary => ({
    id: summary.id,
    pageId: summary.page_id,
    url: summary.url,
    summary: summary.summary,
    category: summary.category,
    sentiment: summary.sentiment || 'neutral',
    entities: (() => {
      if (!summary.entities) return [];
      try {
        const parsed = JSON.parse(summary.entities) as unknown;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    topics: (() => {
      if (!summary.topics) return [];
      try {
        const parsed = JSON.parse(summary.topics) as unknown;
        return Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        return [];
      }
    })(),
    metadata: (() => {
      if (!summary.metadata) return {};
      try {
        const parsed = JSON.parse(summary.metadata) as unknown;
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
      } catch {
        return {};
      }
    })(),
    sourceCreatedAt: summary.source_created_at,
    sourceUpdatedAt: summary.source_updated_at,
    createdAt: summary.created_at,
    synced: summary.synced === 1,
    syncedAt: summary.synced_at,
  }));

  const metadata = {
    snapshot_version: 'notion-sync-v2',
    captured_at: nowIso,
    id: profile.id,
    name: (profile.name as string | null) ?? null,
    email: (profile.email as string | null) ?? null,
    type: (profile.type as string | null) ?? null,
    avatar_url: (profile.avatar_url as string | null) ?? null,
    workspace_name: s.config.workspaceName || null,
    sync: {
      in_progress: s.syncStatus.syncInProgress,
      last_sync_time: s.syncStatus.lastSyncTime || null,
      next_sync_time: s.syncStatus.nextSyncTime || null,
      last_sync_duration_ms: s.syncStatus.lastSyncDurationMs || null,
      total_pages: s.syncStatus.totalPages,
      total_databases: s.syncStatus.totalDatabases,
      total_database_rows: s.syncStatus.totalDatabaseRows,
      pages_with_content: s.syncStatus.pagesWithContent,
      pages_with_summary: s.syncStatus.pagesWithSummary,
      summaries_total: s.syncStatus.summariesTotal,
      summaries_pending: s.syncStatus.summariesPending,
      last_sync_error: s.syncStatus.lastSyncError || null,
    },
    pages,
    pages_total: pages.length,
    summaries,
    summaries_total: summaries.length,
  };

  syncIntegrationMetadata({
    title: `Notion metadata sync — ${nowIso}`,
    content: JSON.stringify(metadata),
    sourceType: 'doc',
    metadata,
    createdAt: now / 1000,
    updatedAt: now / 1000,
  });
}

// ---------------------------------------------------------------------------
// Phase 1: Sync users
// ---------------------------------------------------------------------------

async function syncUsers(): Promise<void> {
  let startCursor: string | undefined;
  let hasMore = true;
  let count = 0;

  while (hasMore) {
    const result = await notionApi.listUsers(100, startCursor);

    for (const user of result.results) {
      try {
        upsertUser(user as Record<string, unknown>);
        count++;
      } catch (e) {
        console.error(
          `[notion] Failed to upsert user ${(user as Record<string, unknown>).id}: ${e}`
        );
      }
    }

    hasMore = result.has_more;
    startCursor = (result.next_cursor as string | undefined) || undefined;
    syncProgress('users', 5, `Fetched ${count} users...`);
  }

  syncProgress('users', 10, `Synced ${count} users`);
}

// ---------------------------------------------------------------------------
// Phase 2: Sync pages and databases via search (incremental)
// Restricts to items updated in the last 30 days to limit data volume.
// ---------------------------------------------------------------------------

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function syncSearchItems(): Promise<void> {
  const s = getNotionSkillState();
  const lastSyncTime = s.syncStatus.lastSyncTime;
  const isFirstSync = lastSyncTime === 0;
  const cutoffMs = Date.now() - THIRTY_DAYS_MS;

  let startCursor: string | undefined;
  let hasMore = true;
  let pageCount = 0;
  let dbCount = 0;
  let pageSkipped = 0;
  let dbSkipped = 0;
  let errorCount = 0;
  let reachedOldItems = false;
  let batchNum = 0;

  while (hasMore && !reachedOldItems) {
    batchNum++;
    const body: Record<string, unknown> = {
      page_size: 100,
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
    };
    if (startCursor) body.start_cursor = startCursor;

    const result = await notionApi.search(body);

    for (const item of result.results) {
      const rec = item as Record<string, unknown>;
      const lastEdited = rec.last_edited_time as string;
      if (!lastEdited) continue;

      const editedMs = new Date(lastEdited).getTime();

      if (editedMs < cutoffMs) {
        reachedOldItems = true;
        break;
      }

      if (!isFirstSync && editedMs <= lastSyncTime) {
        reachedOldItems = true;
        break;
      }

      const objectType = rec.object as string;

      if (objectType === 'page') {
        const existing = getPageById ? getPageById(rec.id as string) : null;
        if (existing && existing.last_edited_time === lastEdited) {
          pageSkipped++;
        } else {
          try {
            upsertPage(rec);
            pageCount++;
          } catch (e) {
            console.error(`[notion] Failed to upsert page ${rec.id}: ${e}`);
            errorCount++;
          }
        }
      } else if (objectType === 'data_source' || objectType === 'database') {
        const existing = getDatabaseById ? getDatabaseById(rec.id as string) : null;
        if (existing && existing.last_edited_time === lastEdited) {
          dbSkipped++;
        } else {
          try {
            upsertDatabase(rec);
            dbCount++;
          } catch (e) {
            console.error(`[notion] Failed to upsert database ${rec.id}: ${e}`);
            errorCount++;
          }
        }
      }
    }

    hasMore = result.has_more;
    startCursor = (result.next_cursor as string | undefined) || undefined;

    // Progress: 10-50% range, estimate based on batches (cap at 50 batches)
    const pct = 10 + Math.min(40, (batchNum / 50) * 40);
    const total = pageCount + pageSkipped;
    syncProgress('pages', pct, `Discovered ${total} pages, ${dbCount} databases (batch ${batchNum})...`);
  }

  // Fetch data_sources explicitly (50-55%)
  syncProgress('pages', 50, 'Fetching databases (data_sources)...');
  const dsResult = await syncDataSources(
    upsertDatabase,
    getDatabaseById,
    cutoffMs,
    lastSyncTime,
    isFirstSync
  );
  dbCount += dsResult.count;
  dbSkipped += dsResult.skipped;
  errorCount += dsResult.errors;

  state.set('last_search_sync', Date.now());

  // Update counts in state so they're visible immediately
  const counts = getEntityCounts();
  s.syncStatus.totalPages = counts.pages;
  s.syncStatus.totalDatabases = counts.databases;

  syncProgress('pages', 60,
    `Synced ${pageCount} pages, ${dbCount} databases` +
    (pageSkipped > 0 ? ` (${pageSkipped} unchanged)` : '') +
    (errorCount > 0 ? `, ${errorCount} errors` : '')
  );
}

async function syncDataSources(
  upsertDatabase: (db: Record<string, unknown>) => void,
  getDatabaseById: ((id: string) => { last_edited_time: string } | null) | undefined,
  cutoffMs: number,
  lastSyncTime: number,
  isFirstSync: boolean
): Promise<{ count: number; skipped: number; errors: number }> {
  let startCursor: string | undefined;
  let hasMore = true;
  let count = 0;
  let skipped = 0;
  let errors = 0;
  let reachedOldItems = false;

  while (hasMore && !reachedOldItems) {
    const result = await notionApi.search({
      page_size: 100,
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      filter: { property: 'object', value: 'data_source' },
      ...(startCursor ? { start_cursor: startCursor } : {}),
    });

    for (const item of result.results) {
      const rec = item as Record<string, unknown>;
      const lastEdited = rec.last_edited_time as string;
      if (!lastEdited) continue;

      const editedMs = new Date(lastEdited).getTime();

      if (editedMs < cutoffMs) {
        reachedOldItems = true;
        break;
      }
      if (!isFirstSync && editedMs <= lastSyncTime) {
        reachedOldItems = true;
        break;
      }

      const existing = getDatabaseById?.(rec.id as string);
      if (existing && existing.last_edited_time === lastEdited) {
        skipped++;
      } else {
        try {
          upsertDatabase(rec);
          count++;
        } catch (e) {
          console.error(`[notion] Failed to upsert data_source ${rec.id}: ${e}`);
          errors++;
        }
      }
    }

    hasMore = result.has_more;
    startCursor = (result.next_cursor as string | undefined) || undefined;
  }

  return { count, skipped, errors };
}

// ---------------------------------------------------------------------------
// Phase 2.5: Sync database rows
// For each synced database, query its rows and store them locally.
// ---------------------------------------------------------------------------

/** Max rows to sync per database per sync cycle */
// const MAX_ROWS_PER_DATABASE = 200;

/**
 * Maximum ms for phases 3+ (content sync, submit) to prevent the Rust async
 * operation timeout (~120s). Mirrors the google-drive sync time budget pattern.
 * Budget is measured from the overall sync startTime.
 */
const CONTENT_SYNC_TIME_BUDGET_MS = 18_000;

// async function syncDatabaseRows(startTime: number, budgetMs: number): Promise<void> {
//   // Get all locally synced databases
//   const databases = getLocalDatabases({ limit: 100 }) as Array<{ id: string; title: string }>;

//   if (databases.length === 0) {
//     console.log('[notion] No databases to sync rows for');
//     return;
//   }

//   const s = getNotionSkillState();
//   const lastSyncTime = s.syncStatus.lastSyncTime;
//   const isFirstSync = lastSyncTime === 0;

//   let totalRowCount = 0;
//   let totalSkipped = 0;
//   let totalErrors = 0;
//   let dbsSynced = 0;

//   for (const database of databases) {
//     if (Date.now() - startTime > budgetMs) {
//       console.log('[notion] DB row sync time budget reached, deferring remaining databases');
//       break;
//     }
//     try {
//       let startCursor: string | undefined;
//       let hasMore = true;
//       let rowCount = 0;
//       let skipped = 0;
//       let fetched = 0;
//       let reachedOldRows = false;

//       while (hasMore && fetched < MAX_ROWS_PER_DATABASE && !reachedOldRows) {
//         const body: Record<string, unknown> = {
//           page_size: 100,
//           sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
//         };
//         if (startCursor) body.start_cursor = startCursor;

//         let result: { results: Record<string, unknown>[]; has_more: boolean; next_cursor?: string };
//         try {
//           result = (await notionApi.queryDataSource(database.id, body)) as typeof result;
//         } catch (e) {
//           const msg = e instanceof Error ? e.message : String(e);
//           // Skip databases we can't query (permissions, deleted, etc.)
//           if (
//             msg.includes('404') ||
//             msg.includes('403') ||
//             msg.includes('no data sources') ||
//             msg.includes('Could not find')
//           ) {
//             console.warn(
//               `[notion] Cannot query database "${database.title}" (${database.id}): ${msg}`
//             );
//             break;
//           }
//           throw e;
//         }

//         for (const row of result.results) {
//           const rec = row as Record<string, unknown>;
//           const lastEdited = rec.last_edited_time as string;

//           // Incremental: stop when we reach rows older than last sync
//           if (!isFirstSync && lastEdited) {
//             const editedMs = new Date(lastEdited).getTime();
//             if (editedMs <= lastSyncTime) {
//               reachedOldRows = true;
//               break;
//             }
//           }

//           // Skip if unchanged
//           const existing = getDatabaseRowById?.(rec.id as string);
//           if (existing && existing.last_edited_time === lastEdited) {
//             skipped++;
//             fetched++;
//             continue;
//           }

//           try {
//             upsertDatabaseRow(rec, database.id);
//             rowCount++;
//           } catch (e) {
//             console.error(
//               `[notion] Failed to upsert row ${rec.id} in database ${database.id}: ${e}`
//             );
//             totalErrors++;
//           }
//           fetched++;
//         }

//         hasMore = result.has_more;
//         startCursor = result.next_cursor as string | undefined;
//       }

//       totalRowCount += rowCount;
//       totalSkipped += skipped;
//       if (rowCount > 0 || skipped > 0) dbsSynced++;

//       if (rowCount > 0) {
//         console.log(
//           `[notion] Database "${database.title}": ${rowCount} rows synced${skipped > 0 ? `, ${skipped} unchanged` : ''}`
//         );
//       }
//     } catch (e) {
//       console.error(
//         `[notion] Failed to sync rows for database "${database.title}" (${database.id}): ${e}`
//       );
//       totalErrors++;
//     }
//   }

//   const skipMsg = totalSkipped > 0 ? ` (${totalSkipped} unchanged)` : '';
//   const errorMsg = totalErrors > 0 ? `, ${totalErrors} errors` : '';
//   console.log(
//     `[notion] Database row sync: ${totalRowCount} rows across ${dbsSynced} databases${skipMsg}${errorMsg}`
//   );
// }

// ---------------------------------------------------------------------------
// Phase 3: Sync page content (block text extraction)
// ---------------------------------------------------------------------------

async function syncContent(startTime: number, budgetMs: number): Promise<void> {
  const s = getNotionSkillState();
  const batchSize = s.config.maxPagesPerContentSync;
  const cutoffIso = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const pages = getPagesNeedingContent(batchSize, cutoffIso);
  let synced = 0;
  let failed = 0;

  for (const page of pages) {
    if (Date.now() - startTime > budgetMs) {
      console.log('[notion] Content sync time budget reached, deferring remaining pages');
      break;
    }
    try {
      const text = await fetchBlockTreeText(page.id, 2);
      updatePageContent(page.id, text);
      synced++;
    } catch (e) {
      // Individual page failures are logged but don't abort the batch
      console.error(`[notion] Failed to sync content for page ${page.id}: ${e}`);
      failed++;
    }
  }

  console.log(
    `[notion] Content sync: ${synced} pages updated${failed > 0 ? `, ${failed} failed` : ''}`
  );
}

// ---------------------------------------------------------------------------
// Phase 4: Sync unsynced summaries to the server
// ---------------------------------------------------------------------------

/**
 * Sync unsynced summaries to the server via net.fetch().
 * Reads summaries with synced=0, submits each to the backend API,
 * and marks them as synced on success.
 * Reserved for Phase 4 — currently not called to avoid extra network dependency.
 */
async function _syncSummariesToServer(): Promise<void> {
  const batch = getUnsyncedSummaries(100);
  if (batch.length === 0) {
    console.log('[notion] No unsynced summaries to send');
    return;
  }

  // Get backend URL and auth token from environment
  const backendUrl = platform.env('BACKEND_URL');
  const authToken = platform.env('AUTH_TOKEN');

  if (!backendUrl || !authToken) {
    console.warn('[notion] Missing BACKEND_URL or AUTH_TOKEN — skipping summary sync');
    return;
  }

  let sent = 0;
  let failed = 0;
  const syncedIds: number[] = [];

  for (const row of batch) {
    try {
      // Parse stored JSON fields
      const entities: SummaryEntity[] = row.entities ? JSON.parse(row.entities) : [];
      const topics: string[] = row.topics ? JSON.parse(row.topics) : [];
      const metadata: Record<string, unknown> = row.metadata ? JSON.parse(row.metadata) : {};

      const submission: SummarySubmission = {
        summary: row.summary,
        url: row.url || undefined,
        category: row.category || undefined,
        dataSource: 'notion',
        sentiment: (row.sentiment as 'positive' | 'neutral' | 'negative' | 'mixed') || 'neutral',
        keyPoints: topics.length > 0 ? topics : undefined,
        entities: entities.length > 0 ? entities : undefined,
        metadata,
        createdAt: row.source_created_at,
        updatedAt: row.source_updated_at,
      };

      const resp = await net.fetch(`${backendUrl}/api/summaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(submission),
        timeout: 10000,
      });

      if (resp.status >= 400) {
        console.error(`[notion] Summary submit failed (${resp.status}): ${resp.body}`);
        failed++;
        continue;
      }

      syncedIds.push(row.id);
      sent++;
    } catch (e) {
      console.error(`[notion] Failed to sync summary ${row.id} (page ${row.page_id}): ${e}`);
      failed++;
    }
  }

  // Mark successfully sent summaries as synced
  if (syncedIds.length > 0) {
    markSummariesSynced(syncedIds);
  }

  console.log(
    `[notion] Server sync: ${sent} summaries sent${failed > 0 ? `, ${failed} failed` : ''}`
  );
}
void _syncSummariesToServer; // Reserved for Phase 4; reference to avoid TS6133

// ---------------------------------------------------------------------------
// Phase 5: Ingest synced documents into knowledge graph via memory.insert()
// ---------------------------------------------------------------------------

/** Max items to pull from DB per ingestion round. */
const INGEST_QUERY_LIMIT = 500;

/**
 * Ingest un-submitted pages and database rows into the knowledge graph.
 * Each document is sent via memory.insert() which routes through the Rust
 * ingestion pipeline (upsert → GLiNER entity/relation extraction → graph).
 * Uses documentId for dedup so re-synced pages update rather than duplicate.
 */
function ingestNewDocuments(): void {
  const pages = getUnsubmittedPages(INGEST_QUERY_LIMIT);
  const rows = getUnsubmittedRows(INGEST_QUERY_LIMIT);

  if (pages.length === 0 && rows.length === 0) return;

  const emptyPageIds: string[] = [];
  const emptyRowIds: string[] = [];
  const submittedPageIds: string[] = [];
  const submittedRowIds: string[] = [];
  let ingested = 0;

  for (const page of pages) {
    const content = (page.content_text || '').trim();
    if (content.length === 0) {
      emptyPageIds.push(page.id);
      continue;
    }

    try {
      memory.insert({
        title: page.title || `Notion page ${page.id}`,
        content,
        sourceType: 'doc',
        documentId: `notion-page-${page.id}`,
        metadata: {
          source: 'notion',
          type: 'page',
          pageId: page.id,
          url: page.url,
          parentType: page.parent_type,
          parentId: page.parent_id,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
        },
        createdAt: page.created_time ? new Date(page.created_time).getTime() / 1000 : undefined,
        updatedAt: page.last_edited_time
          ? new Date(page.last_edited_time).getTime() / 1000
          : undefined,
      });
      submittedPageIds.push(page.id);
      ingested++;
    } catch (e) {
      console.error(`[notion] Failed to ingest page ${page.id}: ${e}`);
    }
  }

  for (const row of rows) {
    const content = (row.properties_text || '').trim();
    if (content.length === 0) {
      emptyRowIds.push(row.id);
      continue;
    }

    try {
      memory.insert({
        title: row.title || `Notion row ${row.id}`,
        content,
        sourceType: 'doc',
        documentId: `notion-row-${row.id}`,
        metadata: {
          source: 'notion',
          type: 'database_row',
          rowId: row.id,
          databaseId: row.database_id,
          url: row.url,
          createdTime: row.created_time,
          lastEditedTime: row.last_edited_time,
        },
        createdAt: row.created_time ? new Date(row.created_time).getTime() / 1000 : undefined,
        updatedAt: row.last_edited_time
          ? new Date(row.last_edited_time).getTime() / 1000
          : undefined,
      });
      submittedRowIds.push(row.id);
      ingested++;
    } catch (e) {
      console.error(`[notion] Failed to ingest row ${row.id}: ${e}`);
    }
  }

  // Mark processed items so they aren't re-ingested next sync
  if (emptyPageIds.length > 0) markPagesSubmitted(emptyPageIds);
  if (emptyRowIds.length > 0) markRowsSubmitted(emptyRowIds);
  if (submittedPageIds.length > 0) markPagesSubmitted(submittedPageIds);
  if (submittedRowIds.length > 0) markRowsSubmitted(submittedRowIds);

  if (ingested > 0) {
    console.log(`[notion] Ingested ${ingested} document(s) into knowledge graph`);
  }
}

// ---------------------------------------------------------------------------
// State publishing helper
// ---------------------------------------------------------------------------

function publishSyncState(): void {
  const s = getNotionSkillState();
  const isConnected = isNotionConnected();

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
    nextSyncTime: s.syncStatus.nextSyncTime
      ? new Date(s.syncStatus.nextSyncTime).toISOString()
      : null,
    totalPages: s.syncStatus.totalPages,
    totalDatabases: s.syncStatus.totalDatabases,
    totalDatabaseRows: s.syncStatus.totalDatabaseRows,
    pagesWithContent: s.syncStatus.pagesWithContent,
    pagesWithSummary: s.syncStatus.pagesWithSummary,
    summariesTotal: s.syncStatus.summariesTotal,
    summariesPending: s.syncStatus.summariesPending,
    lastSyncError: s.syncStatus.lastSyncError,
    lastSyncDurationMs: s.syncStatus.lastSyncDurationMs,
  });
}
