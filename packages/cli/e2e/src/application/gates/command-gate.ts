import type { CommandExecutor } from '../../ports/command-executor.ts';
import type { CommandGateDefinition, GateResult } from '../../domain/gate-definition.ts';
import type { RunContext } from '../../domain/run-context.ts';

/** Gate that succeeds when command exit and output expectations are satisfied. */
export class CommandGate {
  constructor(
    private readonly definition: CommandGateDefinition,
    private readonly executor: CommandExecutor,
  ) {
  }

  async execute(context: RunContext): Promise<GateResult> {
    const result = await this.executor.run({
      cwd: this.definition.cwd(context),
      command: this.definition.command(context),
      timeoutMs: context.request.options.commandTimeoutMs,
      outputMode: this.definition.outputMode,
      failureHint: this.definition.failureHint,
    });
    const expectedExitCode = this.definition.expectedExitCode ?? 0;
    const missingOutput = (this.definition.stdoutIncludes ?? []).filter((value) =>
      !result.stdout.includes(value)
    );
    const passed = result.code === expectedExitCode && !result.timedOut &&
      missingOutput.length === 0;
    return {
      id: this.definition.id,
      title: this.definition.title,
      critical: this.definition.critical,
      verdict: passed ? 'passed' : 'failed',
      evidence: [{
        kind: 'command',
        label: this.definition.id,
        data: {
          command: result.command,
          cwd: result.cwd,
          code: result.code,
          timedOut: result.timedOut,
          stdoutTail: tail(result.stdout),
          stderrTail: tail(result.stderr),
        },
      }],
      error: passed
        ? undefined
        : missingOutput.length > 0
        ? `Command output omitted: ${missingOutput.join(', ')}.`
        : `Command exited ${result.code}; expected ${expectedExitCode}.`,
    };
  }
}

function tail(text: string): string {
  return text.length > 4_000 ? text.slice(-4_000) : text;
}
