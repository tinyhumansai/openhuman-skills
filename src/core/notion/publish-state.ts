// notion/publish-state.ts
//
// Owns the contract between this skill and the host's `state.setPartial`
// transport. Centralized here so `start.ts`, `index.ts`, and option/sync
// handlers all publish the same shape — and so we never accidentally
// re-introduce a cycle by having `start.ts` import from `index.ts`.

import { getLocalPages } from './db/helpers';
import { isNotionConnected } from './helpers';
import { getNotionSkillState } from './state';

export function publishState(): void {
  const s = getNotionSkillState();
  const isConnected = isNotionConnected();

  // Fetch recent page summaries from local DB (metadata only — no content_text
  // to avoid raw newlines breaking JSON serialization in the state transport).
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
