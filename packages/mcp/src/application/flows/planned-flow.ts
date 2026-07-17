import type { ToolExecutionResult, ToolFlow, ToolName } from '../../domain/tool-types.ts';

/** Create the structured placeholder used for tools implemented in later slices. */
export function createPlannedFlow(name: ToolName): ToolFlow {
  return (): Promise<ToolExecutionResult> =>
    Promise.resolve({
      ok: false,
      error: {
        code: 'not_implemented',
        message: `${name} is registered but not implemented in S1`,
        status: 'planned',
      },
    });
}
