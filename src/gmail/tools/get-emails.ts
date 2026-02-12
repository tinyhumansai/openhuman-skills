// Tool: gmail-get-emails
// Get emails with filtering and search capabilities.
import * as api from '../api';
import { hasPayloadAttachments, isSensitiveText, parseSenderInfo } from '../helpers';

export const getEmailsTool: ToolDefinition = {
  name: 'gmail-get-emails',
  description:
    'Get emails from Gmail with optional filtering by query, labels, read status, and pagination. Supports Gmail search syntax.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Search query using Gmail search syntax (e.g., "from:example@gmail.com", "subject:meeting", "is:unread")',
      },
      label_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by specific label IDs (e.g., ["INBOX", "IMPORTANT"])',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of emails to return (default: 20, max: 100)',
        minimum: 1,
        maximum: 100,
      },
      include_spam_trash: {
        type: 'boolean',
        description: 'Include emails from spam and trash (default: false)',
      },
      page_token: {
        type: 'string',
        description: 'Token for pagination (returned from previous request)',
      },
    },
    required: [],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      if (!oauth.getCredential()) {
        return JSON.stringify({
          success: false,
          error: 'Gmail not connected. Complete OAuth setup first.',
        });
      }

      // Build API parameters
      const params: string[] = [];

      if (args.query) {
        params.push(`q=${encodeURIComponent(args.query as string)}`);
      }

      if (args.label_ids && Array.isArray(args.label_ids)) {
        (args.label_ids as string[]).forEach(labelId => {
          params.push(`labelIds=${encodeURIComponent(labelId)}`);
        });
      }

      const maxResults = Math.min(parseInt((args.max_results as string) || '20', 10), 100);
      params.push(`maxResults=${maxResults}`);

      if (args.include_spam_trash) {
        params.push('includeSpamTrash=true');
      }

      if (args.page_token) {
        params.push(`pageToken=${encodeURIComponent(args.page_token as string)}`);
      }

      // Get email list
      const listResponse = await api.listMessages(params.join('&'));

      if (!listResponse.success) {
        return JSON.stringify({
          success: false,
          error: listResponse.error?.message || 'Failed to fetch email list',
        });
      }

      const messageList = listResponse.data as {
        messages?: Array<{ id: string; threadId: string }>;
        nextPageToken?: string;
        resultSizeEstimate: number;
      };

      if (!messageList.messages || messageList.messages.length === 0) {
        return JSON.stringify({ success: true, emails: [], total_count: 0, next_page_token: null });
      }

      // Get detailed email data
      const emails = [];
      for (const msgRef of messageList.messages) {
        try {
          const msgResponse = await api.getMessage(msgRef.id);
          if (msgResponse.success) {
            const message = msgResponse.data;
            const headers = message.payload?.headers || [];

            // Extract common headers
            const subject =
              headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
            const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
            const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
            const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

            const sender = parseSenderInfo(from);

            emails.push({
              id: message.id,
              thread_id: message.threadId,
              subject,
              sender,
              recipients: to,
              date: date
                ? new Date(date).toISOString()
                : new Date(parseInt(message.internalDate)).toISOString(),
              snippet: message.snippet,
              label_ids: message.labelIds || [],
              is_read: !message.labelIds?.includes('UNREAD'),
              is_important: message.labelIds?.includes('IMPORTANT'),
              is_starred: message.labelIds?.includes('STARRED'),
              has_attachments: hasPayloadAttachments(message),
              size_estimate: message.sizeEstimate || 0,
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

      return JSON.stringify({
        success: true,
        emails: filteredEmails,
        total_count: messageList.resultSizeEstimate,
        next_page_token: messageList.nextPageToken || null,
        query: args.query || null,
        label_ids: args.label_ids || null,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
