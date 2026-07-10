// deno-fmt-ignore-file
import { AGENT_KINDS, type AgentKind, type RuntimeCommand } from './runtime/contract.ts';
import { runRuntimeCommand } from './runtime/controller.ts';
import {
  CommandFoundationReportReader,
  FoundationRuntimeInspector,
} from './runtime/adapters/foundation-adapter.ts';
import { LocalRuntimeStateAdapter } from './runtime/adapters/local-state-adapter.ts';
import { renderRuntimeHuman, renderRuntimeJson, runtimeExitCode } from './runtime/output.ts';
import type { RuntimeReadPorts } from './runtime/ports.ts';
interface ParsedRuntimeArgs { readonly command: RuntimeCommand; readonly json: boolean; }
interface CliOptions { readonly positional: readonly string[]; readonly json: boolean; readonly dryRun: boolean; readonly values: ReadonlyMap<string, string>; }
function usage(): string {
  return `Usage:
  deno task agentic:runtime doctor [--json]
  deno task agentic:runtime status [--agent <agent>] [--worktree <path>] [--session <id>] [--json]
  deno task agentic:runtime bootstrap [--dry-run] [--json]
  deno task agentic:runtime configure --state <file> [--dry-run] [--json]
  deno task agentic:runtime repair codex-remote --worktree <path> [--session <id>] [--dry-run] [--json]`;
}
function options(args: readonly string[]): CliOptions {
  const positional: string[] = [];
  const values = new Map<string, string>();
  let json = false;
  let dryRun = false;
  for (let index = 0; index < args.length; index++) {
    const token = args[index];
    if (token === '--json') json = true;
    else if (token === '--dry-run') dryRun = true;
    else if (['--agent', '--worktree', '--session', '--state'].includes(token)) {
      const value = args[++index];
      if (!value || value.startsWith('--') || values.has(token)) throw new Error(usage());
      values.set(token, value);
    } else if (token.startsWith('--')) throw new Error(usage());
    else positional.push(token);
  }
  return { positional, json, dryRun, values };
}
function only(values: ReadonlyMap<string, string>, allowed: readonly string[]): void {
  if ([...values.keys()].some((key) => !allowed.includes(key))) throw new Error(usage());
}
function agent(value: string | undefined): AgentKind | undefined {
  if (value === undefined) return undefined;
  if (!(AGENT_KINDS as readonly string[]).includes(value)) throw new Error(usage());
  return value as AgentKind;
}
/** Parses only the S2 surface; S3 lifecycle commands are deliberately unavailable. */
export function parseRuntimeArgs(args: readonly string[]): ParsedRuntimeArgs {
  const parsed = options(args);
  const [verb, target, ...rest] = parsed.positional;
  if (!verb || rest.length > 0) throw new Error(usage());
  const commandId = `${verb === 'repair' ? 'repair-codex-remote' : verb}-cli`;
  if (verb === 'doctor') {
    if (target || parsed.dryRun || parsed.values.size) throw new Error(usage());
    return { command: { kind: 'doctor', commandId, mode: 'inspect' }, json: parsed.json };
  }
  if (verb === 'status') {
    if (target || parsed.dryRun) throw new Error(usage());
    only(parsed.values, ['--agent', '--worktree', '--session']);
    return {
      command: {
        kind: 'status',
        commandId,
        mode: 'inspect',
        agent: agent(parsed.values.get('--agent')),
        worktree: parsed.values.get('--worktree'),
        sessionId: parsed.values.get('--session'),
      },
      json: parsed.json,
    };
  }
  if (verb === 'bootstrap') {
    if (target || parsed.values.size) throw new Error(usage());
    return {
      command: { kind: 'bootstrap', commandId, mode: parsed.dryRun ? 'plan' : 'apply' },
      json: parsed.json,
    };
  }
  if (verb === 'configure') {
    if (target) throw new Error(usage());
    only(parsed.values, ['--state']);
    const path = parsed.values.get('--state');
    if (!path) throw new Error(usage());
    return {
      command: {
        kind: 'configure',
        commandId,
        mode: parsed.dryRun ? 'plan' : 'apply',
        desiredState: { path },
      },
      json: parsed.json,
    };
  }
  if (verb === 'repair' && target === 'codex-remote') {
    only(parsed.values, ['--worktree', '--session']);
    const worktree = parsed.values.get('--worktree');
    if (!worktree) throw new Error(usage());
    return {
      command: {
        kind: 'repair-codex-remote',
        commandId,
        mode: parsed.dryRun ? 'plan' : 'apply',
        worktree,
        sessionId: parsed.values.get('--session'),
      },
      json: parsed.json,
    };
  }
  throw new Error(usage());
}
function createReadPorts(home: string): RuntimeReadPorts {
  // deno-fmt-ignore
  const local = new LocalRuntimeStateAdapter(`${home}/.config/netscript-agentic/runtime`, `${home}/.config/netscript-agentic/foundation-state.json`);
  const inspector = new FoundationRuntimeInspector(new CommandFoundationReportReader());
  return {
    inspector,
    persistedStateReader: local,
    desiredStateSource: local,
    checkpointReader: local,
    ownedResourceReader: {
      readOwnedResourceFingerprint: (id) =>
        id.startsWith('state:')
          ? local.readOwnedResourceFingerprint(id)
          : inspector.readOwnedResourceFingerprint(id),
    },
    contentReader: local,
    processProbe: {
      probeProcess: ({ probeId }) => Promise.resolve({ probeId, exitCode: 1, timedOut: false }),
    },
    clock: { now: () => new Date().toISOString() },
  };
}
async function main(): Promise<number> {
  try {
    const parsed = parseRuntimeArgs(Deno.args);
    const result = await runRuntimeCommand(
      parsed.command,
      createReadPorts(Deno.env.get('HOME') ?? ''),
    );
    console.log(parsed.json ? renderRuntimeJson(result) : renderRuntimeHuman(result));
    return runtimeExitCode(result);
  } catch (error) {
    console.error(error instanceof Error ? error.message : usage());
    return 3;
  }
}
if (import.meta.main) Deno.exitCode = await main();
