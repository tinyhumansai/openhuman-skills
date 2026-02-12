// Tool: gmail-get-profile
// Get Gmail user profile information.
import * as api from '../api';

export const getProfileTool: ToolDefinition = {
  name: 'gmail-get-profile',
  description:
    'Get Gmail user profile information including email address, total message counts, and account details.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async execute(): Promise<string> {
    try {
      if (!oauth.getCredential()) {
        return JSON.stringify({
          success: false,
          error: 'Gmail not connected. Complete OAuth setup first.',
        });
      }

      const profile = await api.getProfile();
      if (!profile) {
        return JSON.stringify({ success: false, error: 'Failed to fetch profile' });
      }

      // Update skill state
      const s = globalThis.getGmailSkillState();
      s.cache.profile = profile;
      if (!s.config.userEmail) {
        s.config.userEmail = profile.emailAddress;
        state.set('config', s.config);
      }

      return JSON.stringify({
        success: true,
        profile: {
          email_address: profile.emailAddress,
          messages_total: profile.messagesTotal,
          threads_total: profile.threadsTotal,
          history_id: profile.historyId,
        },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
