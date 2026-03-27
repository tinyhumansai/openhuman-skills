export const lcmContextTool: ToolDefinition = {
  name: 'lcm_context',
  description:
    'Assemble the current context for a conversation, combining top-level summaries with fresh tail messages. Returns the reconstructed context within token limits.',
  input_schema: {
    type: 'object',
    properties: {
      conversationId: {
        type: 'number',
        description: 'Conversation ID. Defaults to current conversation.',
      },
    },
    required: [],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const s = globalThis.getLcmState();
    const conversationId = (args.conversationId as number) || s.currentConversationId;

    if (!conversationId) {
      return JSON.stringify({ error: 'No active conversation.' });
    }

    const parts = globalThis.lcmEngine.assembleContext(conversationId);
    const totalTokens = parts.reduce(
      (sum, part) => sum + globalThis.lcmEngine.estimateTokens(part),
      0,
    );

    return JSON.stringify({
      conversationId,
      partCount: parts.length,
      totalTokens,
      context: parts,
    });
  },
};
