import type { GateId, GatePhase } from '../../../domain/cli-surface.ts';
import { GATE_PHASE } from '../../../domain/cli-surface.ts';
import type {
  CommandFactory,
  GateDefinition,
  HttpGateDefinition,
} from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import type { CommandOutputMode } from '../../../ports/command-executor.ts';

/** Create a CLI command invocation for the generated project context. */
export function cli(context: RunContext, ...args: string[]): readonly string[] {
  return ['deno', 'run', '-A', context.project.cliEntrypoint, ...args];
}

/** Create a command gate definition that passes when the command exits zero. */
export function commandGate(
  id: GateId,
  title: string,
  phase: GatePhase,
  command: CommandFactory,
  cwd: (context: RunContext) => string = (context) => context.project.repoRoot,
  outputMode: CommandOutputMode = 'capture',
  failureHint?: string,
): GateDefinition {
  return {
    id,
    title,
    phase,
    kind: 'command',
    critical: true,
    command,
    cwd,
    outputMode,
    failureHint,
  };
}

/** Create an HTTP gate definition for a fixed health-check URL. */
export function httpGate(id: GateId, title: string, url: string): HttpGateDefinition {
  return {
    id,
    title,
    phase: GATE_PHASE.BEHAVIOR,
    kind: 'http',
    critical: true,
    method: 'GET',
    url: () => url,
  };
}
