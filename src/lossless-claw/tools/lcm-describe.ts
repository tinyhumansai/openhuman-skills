export const lcmDescribeTool: ToolDefinition = {
  name: 'lcm_describe',
  description:
    'Get detailed metadata about a specific summary node in the DAG, including depth, token count, time range, parent/child relationships, and descendant statistics.',
  input_schema: {
    type: 'object',
    properties: { summaryId: { type: 'string', description: 'The summary ID to describe' } },
    required: ['summaryId'],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const summaryId = args.summaryId as string;

    const result = globalThis.lcmDb.describeSummary(summaryId);
    if (!result) {
      return JSON.stringify({ error: `Summary '${summaryId}' not found` });
    }

    return JSON.stringify(result);
  },
};
