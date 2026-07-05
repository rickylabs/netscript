/** Type-checked source stub for a generated AI tool.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Token replaced with the tool's exported symbol / wire name. */
export type ToolToken = 'TOOL_EXPORT' | 'TOOL_ID';

/**
 * App-owned AI tool. A thin wrapper over `@netscript/ai/tools` `defineAiTool`:
 * declare a Standard-Schema input, implement `execute`, and (optionally) a UI
 * renderer. The registry the agent loop consumes is assembled in the barrel.
 */
export const toolStub: StubSource<ToolToken> = defineStub({
  source: `/** App-owned AI tool "%%TOOL_ID%%". Thin wrapper over @netscript/ai/tools. */

import { defineAiTool } from '@netscript/ai/tools';

const %%TOOL_EXPORT%%Input = {
  '~standard': {
    version: 1,
    vendor: 'netscript-scaffold',
    validate(value: unknown) {
      if (
        typeof value === 'object' && value !== null &&
        typeof (value as { query?: unknown }).query === 'string'
      ) {
        return { value: { query: (value as { query: string }).query } };
      }
      return { issues: [{ message: '"query" must be a string.', path: ['query'] }] };
    },
  },
} as const;

/** The "%%TOOL_ID%%" tool, callable by the agent loop. */
export const %%TOOL_EXPORT%% = defineAiTool('%%TOOL_ID%%')
  .describe('Describe what %%TOOL_ID%% does so the model knows when to call it.')
  .parameters({
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The primary input for %%TOOL_ID%%.' },
    },
    required: ['query'],
  })
  .input(%%TOOL_EXPORT%%Input)
  .server(({ query }) => {
    // TODO: implement %%TOOL_ID%%. App-owned — this is your business logic.
    return { ok: true, echo: query };
  });
`,
  tokens: ['TOOL_EXPORT', 'TOOL_ID'],
});
