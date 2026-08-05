import type { CommandExecutor } from '../../ports/command-executor.ts';
import type {
  CommandGateDefinition,
  GateAttempt,
  GateFailureClass,
  GateResult,
} from '../../domain/gate-definition.ts';
import type { RunContext } from '../../domain/run-context.ts';

export const RETRYABLE_COMMAND_FAILURE_CLASSES = [
  'timeout',
  'canceled',
  'infrastructure',
] as const;
export const MAX_COMMAND_GATE_ATTEMPTS = 3;
const CANCELED_EXIT_CODE = 6;
const CANCELED_MARKER = /task was canceled/i;
const DENO_USAGE_MARKER = /(?:^|\n)Usage:\s+deno(?:\s|$)/i;
const ARGUMENT_PARSER_MARKER =
  /unexpected argument|unexpected option|invalid value .* for|required arguments were not provided/i;

/** Gate that succeeds when command exit and output expectations are satisfied. */
export class CommandGate {
  constructor(
    private readonly definition: CommandGateDefinition,
    private readonly executor: CommandExecutor,
  ) {
  }

  async execute(context: RunContext): Promise<GateResult> {
    const expectedExitCode = this.definition.expectedExitCode ?? 0;
    const attempts: GateAttempt[] = [];
    const evidence: GateResult['evidence'][number][] = [];
    const maxAttempts = this.definition.retry
      ? Math.min(1 + this.definition.retry.maxRetries, MAX_COMMAND_GATE_ATTEMPTS)
      : 1;
    let error: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const started = performance.now();
      const result = await this.executor.run({
        cwd: this.definition.cwd(context),
        command: this.definition.command(context),
        timeoutMs: this.definition.timeoutMs ?? context.request.options.commandTimeoutMs,
        outputMode: this.definition.outputMode,
        failureHint: this.definition.failureHint,
      });
      const durationMs = Math.round(performance.now() - started);
      const missingOutput = (this.definition.stdoutIncludes ?? []).filter((value) =>
        !result.stdout.includes(value)
      );
      const passed = result.code === expectedExitCode && !result.timedOut &&
        missingOutput.length === 0;
      const failureClass = passed
        ? undefined
        : this.definition.failureClass ?? classifyFailure(result);
      attempts.push({
        attempt,
        verdict: passed ? 'passed' : 'failed',
        durationMs,
        failureClass,
        exitCode: result.code,
      });
      evidence.push({
        kind: 'command',
        label: `${this.definition.id} attempt ${attempt}`,
        data: {
          command: result.command,
          cwd: result.cwd,
          code: result.code,
          timedOut: result.timedOut,
          stdoutTail: tail(result.stdout),
          stderrTail: tail(result.stderr),
        },
      });
      error = passed
        ? undefined
        : missingOutput.length > 0
        ? `Command output omitted: ${missingOutput.join(', ')}.`
        : failureClass === 'harness-invocation'
        ? 'Harness command invocation failed before product execution.'
        : `Command exited ${result.code}; expected ${expectedExitCode}.`;

      if (passed) {
        return gateResult(this.definition, attempts, evidence);
      }
      if (!failureClass || !shouldRetry(failureClass, this.definition.retry?.classes)) break;
    }

    return gateResult(this.definition, attempts, evidence, error);
  }
}

function classifyFailure(
  result: { readonly timedOut: boolean; readonly code: number; readonly stderr: string },
): GateFailureClass {
  if (result.timedOut) return 'timeout';
  if (result.code === CANCELED_EXIT_CODE && CANCELED_MARKER.test(result.stderr)) return 'canceled';
  if (DENO_USAGE_MARKER.test(result.stderr) && ARGUMENT_PARSER_MARKER.test(result.stderr)) {
    return 'harness-invocation';
  }
  return 'assertion';
}

function shouldRetry(
  failureClass: GateFailureClass,
  configuredClasses: readonly GateFailureClass[] | undefined,
): boolean {
  if (
    failureClass === 'assertion' || failureClass === 'harness-invocation' || !configuredClasses
  ) return false;
  return RETRYABLE_COMMAND_FAILURE_CLASSES.includes(failureClass) &&
    configuredClasses.includes(failureClass);
}

function gateResult(
  definition: CommandGateDefinition,
  attempts: GateAttempt[],
  evidence: GateResult['evidence'],
  error?: string,
): GateResult {
  return {
    id: definition.id,
    title: definition.title,
    critical: definition.critical,
    verdict: error ? 'failed' : 'passed',
    evidence,
    attempts,
    retried: attempts.length > 1,
    error,
  };
}

function tail(text: string): string {
  return text.length > 4_000 ? text.slice(-4_000) : text;
}
