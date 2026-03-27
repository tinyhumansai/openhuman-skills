export const lcmIngestTool: ToolDefinition = {
  name: 'lcm_ingest',
  description:
    'Ingest a message into the lossless context management system. Automatically triggers compaction when the context threshold is exceeded.',
  input_schema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session identifier for the conversation' },
      role: {
        type: 'string',
        enum: ['system', 'user', 'assistant', 'tool'],
        description: 'Message role',
      },
      content: { type: 'string', description: 'Message content' },
      tokenCount: { type: 'number', description: 'Token count (estimated if not provided)' },
    },
    required: ['sessionId', 'role', 'content'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const sessionId = args.sessionId as string;
    const role = args.role as string;
    const content = args.content as string;
    const tokenCount = args.tokenCount as number | undefined;

    const conversationId = globalThis.lcmEngine.getOrCreateConversation(sessionId);
    const s = globalThis.getLcmState();
    s.currentConversationId = conversationId;

    globalThis.lcmEngine.ingestMessage(conversationId, role, content, tokenCount);

    const msgCount = globalThis.lcmDb.getMessageCount(conversationId);
    const totalTokens = globalThis.lcmDb.getTotalTokenCount(conversationId);

    return JSON.stringify({ success: true, conversationId, messageCount: msgCount, totalTokens });
  },
};
