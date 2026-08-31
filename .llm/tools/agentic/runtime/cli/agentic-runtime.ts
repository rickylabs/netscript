// deno-fmt-ignore-file
import { AGENT_KINDS, type AgentKind, type RuntimeCommand } from '../contract.ts';
import { runRuntimeCommand } from '../controller.ts';
import {
  CommandFoundationReportReader,
  FoundationRuntimeInspector,
} from '../adapters/foundation-adapter.ts';
import { LocalRuntimeStateAdapter } from '../adapters/local-state-adapter.ts';
import { LocalCodexRemoteAdapter } from '../adapters/local-codex-remote-adapter.ts';
import { LocalSenderOwnershipAdapter } from '../adapters/local-sender-ownership-adapter.ts';
import { LocalSenderLeaseRepairAdapter } from '../adapters/local-sender-lease-repair-adapter.ts';
import { runCodexRemoteRepair } from '../codex-remote-repair.ts';
import { runSenderLeaseRepair } from '../sender-lease-repair.ts';
import { renderRuntimeHuman, renderRuntimeJson, runtimeExitCode } from '../output.ts';
import type { RuntimeReadPorts } from '../ports.ts';
interface ParsedRuntimeArgs { readonly command: RuntimeCommand; readonly json: boolean; }
interface CliOptions { readonly positional: readonly string[]; readonly json: boolean; readonly dryRun: boolean; readonly values: ReadonlyMap<string, string>; }
interface SenderLeaseCliResult { readonly status: 'planned' | 'succeeded' | 'no_change' | 'blocked' | 'failed'; readonly changed: boolean; }
export interface SenderLeaseCliDependencies { readonly senderDirectory: string; readonly evidenceDirectory: string; readonly sessionRoot: string; readonly runSenderLeaseRepair: (worktree: string, dryRun: boolean) => Promise<SenderLeaseCliResult>; }
export interface AgenticRuntimeCliOutput { readonly code: number; readonly stdout: string; readonly stderr: string; }
function usage(): string {
  return `Usage:
  deno task agentic:runtime doctor [--json]
  deno task agentic:runtime status [--agent <agent>] [--worktree <path>] [--session <id>] [--json]
  deno task agentic:runtime bootstrap [--dry-run] [--json]
  deno task agentic:runtime configure --state <file> [--dry-run] [--json]
  deno task agentic:runtime repair codex-remote --worktree <path> [--session <id>] [--dry-run] [--json]
  deno task agentic:runtime repair sender-lease --worktree <path> [--dry-run] [--json]`;
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
/** Parses the finite guarded runtime command surface. */
export function parseRuntimeArgs(args: readonly string[]): ParsedRuntimeArgs {
  const parsed = options(args);
  const [verb, target, ...rest] = parsed.positional;
  if (!verb || rest.length > 0) throw new Error(usage());
  const commandId = `${verb === 'repair' ? `repair-${target}` : verb}-cli`;
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
  if (verb === 'repair' && target === 'sender-lease') {
    only(parsed.values, ['--worktree']);
    const worktree = parsed.values.get('--worktree');
    if (!worktree) throw new Error(usage());
    return {
      command: {
        kind: 'repair-sender-lease',
        commandId,
        mode: parsed.dryRun ? 'plan' : 'apply',
        worktree,
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
function senderLeaseDependencies(home: string): SenderLeaseCliDependencies {
  const senderDirectory = `${home}/.config/netscript-agentic/runtime/senders`;
  const evidenceDirectory = `${home}/.config/netscript-agentic/runtime/evidence`;
  const sessionRoot = `${home}/.codex/sessions`;
  const ownership = new LocalSenderOwnershipAdapter(senderDirectory);
  return {
    senderDirectory,
    evidenceDirectory,
    sessionRoot,
    async runSenderLeaseRepair(worktree, dryRun) {
      if (!home.startsWith('/')) throw new Error('HOME must be an absolute path');
      const canonical = await Deno.realPath(worktree);
      const record = await ownership.read(canonical);
      if (!record) return { status: 'no_change', changed: false };
      return await runSenderLeaseRepair(
        { worktree: canonical, record, dryRun },
        new LocalSenderLeaseRepairAdapter({
          ownership,
          evidenceDirectory,
          sessionRoot,
        }),
      );
    },
  };
}
function repairExitCode(status: SenderLeaseCliResult['status']): number {
  return status === 'blocked' ? 4 : status === 'failed' ? 5 : 0;
}
/** Executes a parsed runtime CLI request through injected sender-repair dependencies. */
export async function runAgenticRuntimeCli(
  args: readonly string[],
  dependencies: SenderLeaseCliDependencies,
): Promise<AgenticRuntimeCliOutput> {
  try {
    const parsed = parseRuntimeArgs(args);
    if (parsed.command.kind === 'repair-sender-lease') {
      const result = await dependencies.runSenderLeaseRepair(
        parsed.command.worktree,
        parsed.command.mode === 'plan',
      );
      return {
        code: repairExitCode(result.status),
        stdout: parsed.json
          ? JSON.stringify(result)
          : `sender-lease: ${result.status}\nchanged: ${result.changed}`,
        stderr: '',
      };
    }
    if (parsed.command.kind === 'repair-codex-remote') {
      const home = Deno.env.get('HOME') ?? '';
      const result = await runCodexRemoteRepair(
        parsed.command.worktree,
        parsed.command.mode === 'plan',
        new LocalCodexRemoteAdapter(
          home,
          `${home}/.config/netscript-agentic/runtime/evidence`,
        ),
      );
      return {
        code: repairExitCode(result.status),
        stdout: parsed.json
          ? JSON.stringify(result)
          : [
            `codex-remote: ${result.state}`,
            `status: ${result.status}`,
            ...result.diagnostics.map((entry) => `${entry.code}: ${entry.message}`),
          ].join('\n'),
        stderr: '',
      };
    }
    const result = await runRuntimeCommand(
      parsed.command,
      createReadPorts(Deno.env.get('HOME') ?? ''),
    );
    return {
      code: runtimeExitCode(result),
      stdout: parsed.json ? renderRuntimeJson(result) : renderRuntimeHuman(result),
      stderr: '',
    };
  } catch (error) {
    return { code: 3, stdout: '', stderr: error instanceof Error ? error.message : usage() };
  }
}
if (import.meta.main) {
  const output = await runAgenticRuntimeCli(
    Deno.args,
    senderLeaseDependencies(Deno.env.get('HOME') ?? ''),
  );
  if (output.stdout) console.log(output.stdout);
  if (output.stderr) console.error(output.stderr);
  Deno.exitCode = output.code;
}
