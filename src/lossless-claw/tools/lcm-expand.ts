export const lcmExpandTool: ToolDefinition = {
  name: 'lcm_expand',
  description:
    'Drill into a summary DAG node to see its children and their content. Use this to explore the hierarchy of compressed conversation context within a token budget.',
  input_schema: {
    type: 'object',
    properties: {
      summaryIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Summary IDs to expand',
      },
      maxDepth: { type: 'number', description: 'Maximum depth to expand (default: 2)' },
      tokenBudget: { type: 'number', description: 'Maximum tokens to return (default: 10000)' },
    },
    required: ['summaryIds'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const summaryIds = args.summaryIds as string[];
    const maxDepth = (args.maxDepth as number) || 2;
    const tokenBudget = (args.tokenBudget as number) || 10000;

    const allResults: unknown[] = [];
    let remainingBudget = tokenBudget;

    for (const id of summaryIds) {
      if (remainingBudget <= 0) break;
      const results = globalThis.lcmDb.expandSummary(id, maxDepth, remainingBudget);
      for (const r of results) {
        allResults.push(r);
        remainingBudget -= r.tokenCount;
      }
    }

    return JSON.stringify({
      expandedCount: allResults.length,
      totalTokens: tokenBudget - remainingBudget,
      results: allResults,
    });
  },
};
