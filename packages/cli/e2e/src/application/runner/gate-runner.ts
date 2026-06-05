import type { GateDefinition, GateResult } from '../../domain/gate-definition.ts';
import type { RunContext } from '../../domain/run-context.ts';
import type { Clock } from '../../ports/clock.ts';
import type { CommandExecutor } from '../../ports/command-executor.ts';
import type { HttpClient } from '../../ports/http-client.ts';
import type { StepResult } from '../../domain/report.ts';
import { CommandGate } from '../gates/command-gate.ts';
import { HttpGate } from '../gates/http-gate.ts';

/** Ports required to execute semantic gates. */
export interface GateRunnerOptions {
  readonly clock: Clock;
  readonly commandExecutor: CommandExecutor;
  readonly httpClient: HttpClient;
}

/** Execute one gate and convert it to a report step. */
export async function runGate(
  gate: GateDefinition,
  context: RunContext,
  options: GateRunnerOptions,
): Promise<StepResult> {
  const started = options.clock.monotonicMs();
  let result: GateResult;
  try {
    result = await executeGate(gate, context, options);
  } catch (error) {
    result = {
      id: gate.id,
      title: gate.title,
      critical: gate.critical,
      verdict: 'failed',
      evidence: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
  return {
    ...result,
    durationMs: Math.round(options.clock.monotonicMs() - started),
  };
}

function executeGate(
  gate: GateDefinition,
  context: RunContext,
  options: GateRunnerOptions,
): Promise<GateResult> {
  if (gate.kind === 'command') {
    return new CommandGate(gate, options.commandExecutor).execute(context);
  }
  return new HttpGate(gate, options.httpClient).execute(context);
}
