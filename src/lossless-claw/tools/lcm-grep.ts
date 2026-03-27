export const lcmGrepTool: ToolDefinition = {
  name: 'lcm_grep',
  description:
    'Search archived conversation messages and summaries by pattern. Use full_text mode for keyword search, regex mode for pattern matching.',
  input_schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Search pattern (text query or regex)',
      },
      mode: {
        type: 'string',
        enum: ['regex', 'full_text'],
        description: 'Search mode: "regex" or "full_text" (default: "full_text")',
      },
      scope: {
        type: 'string',
        enum: ['messages', 'summaries', 'both'],
        description: 'What to search: "messages", "summaries", or "both" (default: "both")',
      },
      conversationId: {
        type: 'number',
        description: 'Conversation ID to search in. Defaults to current conversation.',
      },
      limit: {
        type: 'number',
        description: 'Max results to return (default: 20)',
      },
    },
    required: ['pattern'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const pattern = args.pattern as string;
    const mode = (args.mode as string) || 'full_text';
    const scope = (args.scope as string) || 'both';
    const limit = (args.limit as number) || 20;
    const s = globalThis.getLcmState();
    const conversationId = (args.conversationId as number) || s.currentConversationId;

    if (!conversationId) {
      return JSON.stringify({ error: 'No active conversation. Ingest messages first.' });
    }

    const results: unknown[] = [];

    if (scope === 'messages' || scope === 'both') {
      const msgResults = globalThis.lcmDb.grepMessages(
        conversationId,
        pattern,
        mode as 'regex' | 'full_text',
        limit,
      );
      results.push(...msgResults);
    }

    if (scope === 'summaries' || scope === 'both') {
      const sumResults = globalThis.lcmDb.grepSummaries(
        conversationId,
        pattern,
        mode as 'regex' | 'full_text',
        limit,
      );
      results.push(...sumResults);
    }

    return JSON.stringify({
      pattern,
      mode,
      scope,
      resultCount: results.length,
      results: results.slice(0, limit),
    });
  },
};
