// Tool: gmail-get-labels
// Get all Gmail labels with counts and details.
import * as api from '../api';

export const getLabelsTool: ToolDefinition = {
  name: 'gmail-get-labels',
  description:
    'Get all Gmail labels including system and user-created labels with message counts and details.',
  input_schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['system', 'user', 'all'],
        description: 'Filter labels by type (default: all)',
      },
      include_hidden: { type: 'boolean', description: 'Include hidden labels (default: false)' },
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

      const typeFilter = (args.type as string) || 'all';
      const includeHidden = args.include_hidden === true;

      const response = await api.listLabels();

      if (!response.success) {
        return JSON.stringify({
          success: false,
          error: response.error?.message || 'Failed to fetch labels',
        });
      }

      const labelsData = response.data as { labels: any[] };
      let labels = labelsData.labels || [];

      // Filter by type
      if (typeFilter !== 'all') {
        labels = labels.filter(label => label.type === typeFilter);
      }

      // Filter hidden labels
      if (!includeHidden) {
        labels = labels.filter(
          label =>
            label.labelListVisibility === 'labelShow' ||
            label.labelListVisibility === 'labelShowIfUnread'
        );
      }

      // Format labels
      const formattedLabels = labels.map((label: any) => ({
        id: label.id,
        name: label.name,
        type: label.type,
        visibility: {
          message_list: label.messageListVisibility,
          label_list: label.labelListVisibility,
        },
        counts: {
          messages_total: label.messagesTotal || 0,
          messages_unread: label.messagesUnread || 0,
          threads_total: label.threadsTotal || 0,
          threads_unread: label.threadsUnread || 0,
        },
        color: label.color
          ? { text: label.color.textColor, background: label.color.backgroundColor }
          : null,
      }));

      // Update local database
      labels.forEach((label: any) => globalThis.gmailDb.upsertLabel(label));

      // Categorize
      const categorized = {
        system: formattedLabels.filter((l: any) => l.type === 'system'),
        user: formattedLabels.filter((l: any) => l.type === 'user'),
      };

      return JSON.stringify({
        success: true,
        labels: formattedLabels,
        categorized,
        total_count: formattedLabels.length,
        system_count: categorized.system.length,
        user_count: categorized.user.length,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
