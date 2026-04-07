// Tool: notion-list-users
import { notionApi } from '../api/index';
import { formatApiError, formatUserSummary } from '../helpers';
import { getLocalUsers } from '../db/helpers';
import { isCacheFresh } from './cache';

export const listUsersTool: ToolDefinition = {
  name: 'list-users',
  description:
    'List all users in the workspace. Auto-paginates to fetch all users. Set tryCache=true to use locally synced users when available (faster).',
  input_schema: {
    type: 'object',
    properties: {
      tryCache: {
        type: 'boolean',
        description: 'If true, return locally cached users when cache is fresh (synced within 3 hours)',
      },
    },
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const tryCache = args.tryCache === true;

      // Try local cache if requested
      if (tryCache && isCacheFresh()) {
        const localUsers = getLocalUsers();
        if (localUsers.length > 0) {
          const users = localUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            type: u.type,
            avatar_url: u.avatar_url,
          }));
          return JSON.stringify({ count: users.length, users, source: 'cache' });
        }
      }

      // Fetch from API with auto-pagination
      const allUsers: Record<string, unknown>[] = [];
      let startCursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const result = await notionApi.listUsers(100, startCursor);
        for (const u of result.results) {
          allUsers.push(formatUserSummary(u as Record<string, unknown>));
        }
        hasMore = result.has_more;
        startCursor = (result.next_cursor as string | undefined) || undefined;
      }

      return JSON.stringify({ count: allUsers.length, users: allUsers, source: 'api' });
    } catch (e) {
      return JSON.stringify({ error: formatApiError(e) });
    }
  },
};
