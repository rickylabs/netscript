import type { GateDefinition, GateResult } from '../../domain/gate-definition.ts';
import type { RunContext } from '../../domain/run-context.ts';
import type { Clock } from '../../ports/clock.ts';
import type { CommandExecutor } from '../../ports/command-executor.ts';
import type { HttpClient } from '../../ports/http-client.ts';
import type { StepResult } from '../../domain/report.ts';
import { CommandGate } from '../gates/command-gate.ts';
import { HttpGate } from '../gates/http-gate.ts';
import { NATIVE_DESKTOP_SUITE_STATUSES } from '../../domain/platform.ts';
import type { PlatformPort } from '../../ports/platform.ts';

/** Ports required to execute semantic gates. */
export interface GateRunnerOptions {
  readonly clock: Clock;
  readonly commandExecutor: CommandExecutor;
  readonly httpClient: HttpClient;
  readonly platform: PlatformPort;
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
    result = skipUnsupportedPlatform(gate, options.platform) ??
      await executeGate(gate, context, options);
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

function skipUnsupportedPlatform(
  gate: GateDefinition,
  platformPort: PlatformPort,
): GateResult | undefined {
  if (!gate.platforms) return undefined;
  const platform = platformPort.current();
  if (gate.platforms.includes(platform)) return undefined;
  const supportedPlatforms = [...gate.platforms];
  return {
    id: gate.id,
    title: gate.title,
    critical: gate.critical,
    verdict: 'skipped',
    evidence: [{
      kind: 'summary',
      label: 'platform applicability',
      data: {
        status: NATIVE_DESKTOP_SUITE_STATUSES.NOT_RUN,
        platform,
        supportedPlatforms,
        reason: `Gate requires one of: ${supportedPlatforms.join(', ')}.`,
      },
    }],
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
