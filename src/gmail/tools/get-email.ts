// Tool: gmail-get-email
// Get full details of a specific email by ID.
import * as api from '../api';
import { extractAttachmentInfo, extractEmailBodies, isSensitiveText, parseSenderInfo } from '../helpers';

export const getEmailTool: ToolDefinition = {
  name: 'gmail-get-email',
  description:
    'Get full details of a specific email by its ID, including headers, body content, and attachments.',
  input_schema: {
    type: 'object',
    properties: {
      message_id: { type: 'string', description: 'The Gmail message ID to retrieve' },
      format: {
        type: 'string',
        enum: ['full', 'metadata', 'minimal'],
        description: 'Message format level (default: full)',
      },
      include_body: { type: 'boolean', description: 'Include email body content (default: true)' },
    },
    required: ['message_id'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      if (!oauth.getCredential()) {
        return JSON.stringify({
          success: false,
          error: 'Gmail not connected. Complete OAuth setup first.',
        });
      }

      const messageId = args.message_id as string;
      if (!messageId) {
        return JSON.stringify({ success: false, error: 'message_id is required' });
      }

      const format = (args.format as string) || 'full';
      const includeBody = args.include_body !== false;

      // Check local cache first
      const localEmail = globalThis.gmailDb.getEmailById(messageId);

      // Fetch from API
      const response = await api.getMessage(messageId, format);
      if (!response.success) {
        return JSON.stringify({
          success: false,
          error: response.error?.message || 'Failed to fetch email',
        });
      }

      const message = response.data;
      const headers = message.payload?.headers || [];

      // Build header map
      const headerMap: Record<string, string> = {};
      headers.forEach((h: any) => {
        headerMap[h.name.toLowerCase()] = h.value;
      });

      const sender = parseSenderInfo(headerMap.from || '');

      const result: any = {
        id: message.id,
        thread_id: message.threadId,
        label_ids: message.labelIds || [],
        snippet: message.snippet,
        size_estimate: message.sizeEstimate || 0,
        history_id: message.historyId,
        internal_date: new Date(parseInt(message.internalDate)).toISOString(),
        headers: {
          from: headerMap.from || '',
          to: headerMap.to || '',
          cc: headerMap.cc || '',
          bcc: headerMap.bcc || '',
          subject: headerMap.subject || '',
          date: headerMap.date || '',
          message_id: headerMap['message-id'] || '',
          in_reply_to: headerMap['in-reply-to'] || '',
          references: headerMap.references || '',
        },
        sender,
        status: {
          is_read: !message.labelIds?.includes('UNREAD'),
          is_important: message.labelIds?.includes('IMPORTANT'),
          is_starred: message.labelIds?.includes('STARRED'),
          is_draft: message.labelIds?.includes('DRAFT'),
          is_sent: message.labelIds?.includes('SENT'),
          is_spam: message.labelIds?.includes('SPAM'),
          is_trash: message.labelIds?.includes('TRASH'),
        },
      };

      // Extract body if requested
      if (includeBody && format === 'full') {
        result.body = extractEmailBodies(message.payload);
      }

      // Extract attachments
      const attachments = extractAttachmentInfo(message.payload);
      result.attachments = attachments;
      result.has_attachments = attachments.length > 0;

      // Cache in local database
      globalThis.gmailDb.upsertEmail(message);

      if (localEmail) {
        result.local_info = {
          created_at: new Date(localEmail.created_at * 1000).toISOString(),
          updated_at: new Date(localEmail.updated_at * 1000).toISOString(),
        };
      }

      // Sensitive content filtering
      const s = globalThis.getGmailSkillState();
      if (!s.config.showSensitiveContent) {
        const textToCheck = (result.headers?.subject || '') + ' ' + (result.snippet || '');
        if (isSensitiveText(textToCheck)) {
          return JSON.stringify({
            success: true,
            email: {
              id: result.id,
              subject: '[Sensitive - hidden]',
              snippet: null,
              body: null,
              sensitive_hidden: true,
            },
          });
        }
      }

      return JSON.stringify({ success: true, email: result });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
