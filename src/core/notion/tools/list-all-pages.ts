// Tool: notion-list-all-pages
// Fetches pages from the Notion search API, with optional local cache.
import { notionApi } from '../api/index';
import { formatApiError, formatPageSummary } from '../helpers';
import { getLocalPages } from '../db/helpers';
import { isCacheFresh } from './cache';

export const listAllPagesTool: ToolDefinition = {
  name: 'list-all-pages',
  description:
    'List pages in the workspace. Set tryCache=true to use locally synced pages when available (faster).',
  input_schema: {
    type: 'object',
    properties: {
      page_size: {
        type: 'number',
        description: 'Number of results to return (default 20, max 100)',
      },
      tryCache: {
        type: 'boolean',
        description: 'If true, return locally cached pages when cache is fresh (synced within 3 hours)',
      },
    },
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const pageSize = Math.min((args.page_size as number) || 20, 100);
      const tryCache = args.tryCache === true;

      // Try local cache if requested
      if (tryCache && isCacheFresh()) {
        const localPages = getLocalPages({ limit: pageSize, includeArchived: false });
        if (localPages.length > 0) {
          const pages = localPages.map(p => ({
            id: p.id,
            title: p.title,
            url: p.url,
            created_time: p.created_time,
            last_edited_time: p.last_edited_time,
            archived: !!p.archived,
            parent_type: p.parent_type,
          }));
          return JSON.stringify({
            count: pages.length,
            has_more: localPages.length >= pageSize,
            pages,
            source: 'cache',
          });
        }
      }

      // Fetch from API
      const result = await notionApi.search({
        filter: { property: 'object', value: 'page' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: pageSize,
      });

      const pages = (result.results as Record<string, unknown>[]).map(item =>
        formatPageSummary(item)
      );
      return JSON.stringify({ count: pages.length, has_more: result.has_more, pages, source: 'api' });
    } catch (e) {
      return JSON.stringify({ error: formatApiError(e) });
    }
  },
};
