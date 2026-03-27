export const lcmExpandQueryTool: ToolDefinition = {
  name: 'lcm_expand_query',
  description:
    'Search for relevant summaries by keyword, then expand the matching summaries to retrieve detailed context. Combines grep + expand in one step.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query to find relevant summaries' },
      conversationId: {
        type: 'number',
        description: 'Conversation ID to search in. Defaults to current conversation.',
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum depth to expand matching summaries (default: 2)',
      },
      tokenBudget: { type: 'number', description: 'Maximum tokens to return (default: 10000)' },
    },
    required: ['query'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const query = args.query as string;
    const maxDepth = (args.maxDepth as number) || 2;
    const tokenBudget = (args.tokenBudget as number) || 10000;
    const s = globalThis.getLcmState();
    const conversationId = (args.conversationId as number) || s.currentConversationId;

    if (!conversationId) {
      return JSON.stringify({ error: 'No active conversation. Ingest messages first.' });
    }

    // Step 1: Search summaries
    const searchResults = globalThis.lcmDb.grepSummaries(conversationId, query, 'full_text', 10);

    if (searchResults.length === 0) {
      // Fall back to message search
      const msgResults = globalThis.lcmDb.grepMessages(conversationId, query, 'full_text', 10);
      return JSON.stringify({
        query,
        matchCount: msgResults.length,
        expandedCount: 0,
        results: msgResults,
      });
    }

    // Step 2: Expand matching summaries
    const summaryIds = searchResults.map(r => String(r.id));
    const allExpanded: unknown[] = [];
    let remainingBudget = tokenBudget;

    for (const id of summaryIds) {
      if (remainingBudget <= 0) break;
      const expanded = globalThis.lcmDb.expandSummary(id, maxDepth, remainingBudget);
      for (const r of expanded) {
        allExpanded.push(r);
        remainingBudget -= r.tokenCount;
      }
    }

    return JSON.stringify({
      query,
      matchCount: searchResults.length,
      expandedCount: allExpanded.length,
      totalTokens: tokenBudget - remainingBudget,
      results: allExpanded,
    });
  },
};
