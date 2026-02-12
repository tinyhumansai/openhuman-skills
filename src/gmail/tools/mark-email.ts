// Tool: gmail-mark-email
// Mark emails as read/unread, important, starred, etc.
import * as api from '../api';
import { getLabelOperations } from '../helpers';

export const markEmailTool: ToolDefinition = {
  name: 'gmail-mark-email',
  description:
    'Mark emails with specific status (read/unread, important, starred) or add/remove labels.',
  input_schema: {
    type: 'object',
    properties: {
      message_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of message IDs to modify',
      },
      action: {
        type: 'string',
        enum: [
          'mark_read',
          'mark_unread',
          'add_star',
          'remove_star',
          'mark_important',
          'mark_not_important',
          'add_labels',
          'remove_labels',
        ],
        description: 'Action to perform on the messages',
      },
      label_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Label IDs to add or remove (required for add_labels/remove_labels actions)',
      },
    },
    required: ['message_ids', 'action'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      if (!oauth.getCredential()) {
        return JSON.stringify({
          success: false,
          error: 'Gmail not connected. Complete OAuth setup first.',
        });
      }

      // Write permission check
      const s = globalThis.getGmailSkillState();
      if (!s.config.allowWriteActions) {
        return JSON.stringify({
          success: false,
          error:
            'Write actions are disabled. Enable "Allow write actions" in skill settings to modify emails.',
        });
      }

      const messageIds = args.message_ids as string[];
      const action = args.action as string;
      const labelIds = (args.label_ids as string[]) || [];

      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return JSON.stringify({ success: false, error: 'At least one message ID is required' });
      }

      if ((action === 'add_labels' || action === 'remove_labels') && labelIds.length === 0) {
        return JSON.stringify({
          success: false,
          error: 'label_ids are required for add_labels/remove_labels actions',
        });
      }

      const labelOperations = getLabelOperations(action, labelIds);

      const results = [];
      const errors: string[] = [];

      for (const messageId of messageIds) {
        try {
          const response = await api.batchModifyMessages({
            ids: [messageId],
            ...labelOperations,
          });

          if (response.success) {
            results.push({ message_id: messageId, success: true, action });

            // Update local database
            if (action === 'mark_read') {
              globalThis.gmailDb.updateEmailReadStatus(messageId, true);
            } else if (action === 'mark_unread') {
              globalThis.gmailDb.updateEmailReadStatus(messageId, false);
            }
          } else {
            results.push({
              message_id: messageId,
              success: false,
              error: response.error?.message || 'Failed to update message',
            });
            errors.push(messageId);
          }
        } catch (error) {
          results.push({
            message_id: messageId,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
          errors.push(messageId);
        }
      }

      return JSON.stringify({
        success: errors.length === 0,
        action,
        total_processed: messageIds.length,
        successful: results.filter(r => r.success).length,
        failed: errors.length,
        results,
        failed_message_ids: errors,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
