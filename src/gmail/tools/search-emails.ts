// Tool: gmail-search-emails
// Advanced email search using Gmail query syntax.
import * as api from '../api';
import { hasPayloadAttachments, isSensitiveText, parseSenderInfo } from '../helpers';

export const searchEmailsTool: ToolDefinition = {
  name: 'gmail-search-emails',
  description:
    'Search emails using advanced Gmail query syntax. Supports complex queries with operators like from:, to:, subject:, has:attachment, is:unread, etc.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Gmail search query (e.g., "from:john@example.com subject:meeting is:unread", "has:attachment after:2023/01/01")',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return (default: 20, max: 100)',
        minimum: 1,
        maximum: 100,
      },
      include_spam_trash: {
        type: 'boolean',
        description: 'Include results from spam and trash folders (default: false)',
      },
      page_token: { type: 'string', description: 'Token for pagination (from previous search)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      if (!oauth.getCredential()) {
        return JSON.stringify({
          success: false,
          error: 'Gmail not connected. Complete OAuth setup first.',
        });
      }

      const query = args.query as string;
      if (!query) {
        return JSON.stringify({ success: false, error: 'Search query is required' });
      }

      // Build API parameters
      const params: string[] = [];
      params.push(`q=${encodeURIComponent(query)}`);

      const maxResults = Math.min(parseInt((args.max_results as string) || '20', 10), 100);
      params.push(`maxResults=${maxResults}`);

      if (args.include_spam_trash) {
        params.push('includeSpamTrash=true');
      }

      if (args.page_token) {
        params.push(`pageToken=${encodeURIComponent(args.page_token as string)}`);
      }

      const searchResponse = await api.listMessages(params.join('&'));

      if (!searchResponse.success) {
        return JSON.stringify({
          success: false,
          error: searchResponse.error?.message || 'Search failed',
        });
      }

      const searchResults = searchResponse.data as {
        messages?: Array<{ id: string; threadId: string }>;
        nextPageToken?: string;
        resultSizeEstimate: number;
      };

      if (!searchResults.messages || searchResults.messages.length === 0) {
        return JSON.stringify({
          success: true,
          emails: [],
          query,
          total_estimate: searchResults.resultSizeEstimate || 0,
          next_page_token: null,
        });
      }

      // Get detailed information for found emails
      const emails = [];

      for (const msgRef of searchResults.messages) {
        try {
          const msgResponse = await api.getMessage(msgRef.id, 'metadata');

          if (msgResponse.success) {
            const message = msgResponse.data;
            const headers = message.payload?.headers || [];

            const headerMap: Record<string, string> = {};
            headers.forEach((header: any) => {
              headerMap[header.name.toLowerCase()] = header.value;
            });

            const sender = parseSenderInfo(headerMap.from || '');

            emails.push({
              id: message.id,
              thread_id: message.threadId,
              subject: headerMap.subject || '',
              sender,
              recipients: headerMap.to || '',
              date: headerMap.date
                ? new Date(headerMap.date).toISOString()
                : new Date(parseInt(message.internalDate)).toISOString(),
              snippet: message.snippet,
              label_ids: message.labelIds || [],
              size_estimate: message.sizeEstimate || 0,
              status: {
                is_read: !message.labelIds?.includes('UNREAD'),
                is_important: message.labelIds?.includes('IMPORTANT'),
                is_starred: message.labelIds?.includes('STARRED'),
                has_attachments: hasPayloadAttachments(message),
              },
              relevance_score: calculateRelevanceScore(message, query),
            });

            // Cache in local database
            globalThis.gmailDb.upsertEmail(message);
          }
        } catch {
          // Individual message failures don't abort the batch
        }
      }

      // Filter out sensitive emails unless user opted in
      const s = globalThis.getGmailSkillState();
      const filteredEmails = s.config.showSensitiveContent
        ? emails
        : emails.filter(e => !isSensitiveText((e.subject || '') + ' ' + (e.snippet || '')));

      // Sort by relevance score (highest first)
      filteredEmails.sort((a, b) => b.relevance_score - a.relevance_score);

      return JSON.stringify({
        success: true,
        emails: filteredEmails,
        query,
        total_estimate: searchResults.resultSizeEstimate,
        returned_count: filteredEmails.length,
        next_page_token: searchResults.nextPageToken || null,
        search_tips: generateSearchTips(query),
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};

/** Calculate relevance score based on query matching. */
function calculateRelevanceScore(message: any, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();

  const subject =
    message.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
  if (subject.toLowerCase().includes(queryLower)) score += 10;

  if (message.snippet?.toLowerCase().includes(queryLower)) score += 5;

  if (message.labelIds?.includes('UNREAD')) score += 3;
  if (message.labelIds?.includes('IMPORTANT')) score += 5;

  const messageDate = new Date(parseInt(message.internalDate));
  const daysSinceMessage = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceMessage < 7) score += 2;

  return score;
}

/** Generate search tips based on the query. */
function generateSearchTips(query: string): string[] {
  const tips: string[] = [];

  if (!query.includes(':')) {
    tips.push('Use operators like "from:", "to:", "subject:" for more precise searches');
  }
  if (!query.includes('has:')) {
    tips.push('Use "has:attachment" to find emails with attachments');
  }
  if (!query.includes('is:')) {
    tips.push('Use "is:unread", "is:important", or "is:starred" to filter by status');
  }
  if (!query.includes('after:') && !query.includes('before:')) {
    tips.push('Use "after:2023/01/01" or "before:2023/12/31" to filter by date');
  }
  if (!query.includes('label:')) {
    tips.push('Use "label:inbox" or "label:sent" to search within specific labels');
  }

  return tips.slice(0, 3);
}
