// Tool: gmail-status
// Comprehensive health and connection status for the Gmail skill.

export const statusTool: ToolDefinition = {
  name: 'gmail-status',
  description:
    'Get Gmail skill connection status, sync state, storage statistics, and account information.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async execute(): Promise<string> {
    try {
      const s = globalThis.getGmailSkillState();
      const credential = oauth.getCredential();
      const isConnected = !!credential;

      return JSON.stringify({
        success: true,
        status: {
          connected: isConnected,
          user_email: s.config.userEmail || null,
          profile: s.cache.profile
            ? {
                email: s.cache.profile.emailAddress,
                messages_total: s.cache.profile.messagesTotal,
                threads_total: s.cache.profile.threadsTotal,
              }
            : null,
          sync: {
            enabled: s.config.syncEnabled,
            in_progress: s.sync.inProgress,
            completed: s.sync.completed,
            last_sync_time: s.sync.lastSyncTime
              ? new Date(s.sync.lastSyncTime).toISOString()
              : null,
            next_sync_time: s.sync.nextSyncTime
              ? new Date(s.sync.nextSyncTime).toISOString()
              : null,
            last_duration_ms: s.sync.lastSyncDurationMs,
            error: s.sync.error,
          },
          storage: s.storage,
          permissions: {
            allow_write_actions: s.config.allowWriteActions,
            show_sensitive_content: s.config.showSensitiveContent,
          },
          rate_limit_remaining: s.rateLimitRemaining,
          last_error: s.lastApiError,
          active_sessions: s.activeSessions.length,
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
