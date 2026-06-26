import type { GateId, GatePhase } from '../../../domain/cli-surface.ts';
import { GATE_PHASE } from '../../../domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../../domain/extension-axes.ts';
import { resolve } from '@std/path';
import type {
  CommandFactory,
  GateDefinition,
  HttpGateDefinition,
} from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import type { CommandOutputMode } from '../../../ports/command-executor.ts';

/** Create a CLI command invocation for the generated project context. */
export function cli(context: RunContext, ...args: string[]): readonly string[] {
  // When the entrypoint is a published JSR specifier, disable Deno 2.9's
  // supply-chain recency guard so a freshly-published CLI (and its
  // `jsr:@netscript/*` dependencies) can be resolved without the ~24h
  // "newer than the specified minimum dependency date" block.
  const denoFlags = context.project.cliEntrypoint.startsWith('jsr:@netscript/cli@')
    ? ['-A', '--minimum-dependency-age=0']
    : ['-A'];
  const cliEntrypoint = context.project.cliEntrypoint.startsWith('jsr:')
    ? context.project.cliEntrypoint
    : resolve(context.project.repoRoot, context.project.cliEntrypoint);
  return ['deno', 'run', ...denoFlags, cliEntrypoint, ...args];
}

/**
 * Build a raw `deno` subcommand for the generated project, disabling the
 * Deno 2.9 supply-chain recency guard when running against published JSR
 * sources. Generated workspaces import `jsr:@netscript/*`, so a freshly
 * published release would otherwise be blocked while resolving those deps.
 */
export function denoCommand(
  context: RunContext,
  subcommand: string,
  ...args: string[]
): readonly string[] {
  return context.request.options.packageSource === PACKAGE_SOURCE.JSR
    ? ['deno', subcommand, '--minimum-dependency-age=0', ...args]
    : ['deno', subcommand, ...args];
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

/** Create an HTTP gate definition for a fixed local runtime URL. */
export function httpGate(
  id: GateId,
  title: string,
  url: string,
  method: 'GET' | 'POST' = 'GET',
): HttpGateDefinition {
  return {
    id,
    title,
    phase: GATE_PHASE.BEHAVIOR,
    kind: 'http',
    critical: true,
    method,
    url: () => url,
  };
}
