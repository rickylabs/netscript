import type { CommandExecutorPort } from '../../domain/command-executor-port.ts';
import {
  type CommandPolicy,
  decideCommand,
  DEFAULT_COMMAND_POLICY,
} from '../../domain/command-policy.ts';
import { isRecord } from '../../domain/schema.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';

/** Create the policy-gated bounded CLI execution flow. */
export function createExecuteCommandFlow(
  executor: CommandExecutorPort,
  policy: CommandPolicy = DEFAULT_COMMAND_POLICY,
): ToolFlow {
  return async (input: unknown): Promise<ToolExecutionResult> => {
    const command = isRecord(input) && typeof input.command === 'string'
      ? input.command.trim()
      : '';
    const path = command.split(/\s+/).filter(Boolean);
    const args = isRecord(input) && Array.isArray(input.args)
      ? input.args.filter((value): value is string => typeof value === 'string')
      : [];
    const decision = decideCommand(policy, path);
    if (!decision.allowed) {
      return {
        ok: false,
        error: {
          code: 'command_denied',
          message: `Command '${path.join(' ')}' is denied by rule '${decision.rule}'.`,
          status: decision.rule,
        },
      };
    }
    return { ok: true, value: await executor.execute({ path, args }) };
  };
}
