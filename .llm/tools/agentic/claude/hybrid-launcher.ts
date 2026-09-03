/** Launches native Claude Remote Control with an isolated hybrid MCP worker. */

import { join } from 'node:path';
import { HYBRID_MCP_SERVER_NAME } from './hybrid-delegation.ts';
import {
  HYBRID_ATTACHMENT_POLL_MS,
  HYBRID_ATTACHMENT_TIMEOUT_MS,
  HYBRID_CLAUDE_TERMINATION_GRACE_MS,
} from '../config/versions.ts';
import { OPENCODE_TOOL } from '../config/versions.ts';
import {
  HYBRID_MCP_ENVIRONMENT_NAMES,
  HYBRID_PROCESS_GROUP_BINARIES,
} from './hybrid-opencode-adapter.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';

const STRIPPED_CLAUDE_ENV = new Set([
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'OPENROUTER_API_KEY',
]);

export interface HybridLaunchOptions {
  readonly cwd: string;
  readonly name?: string;
}

export interface HybridBridgeEvidence {
  readonly pid: number;
  readonly sessionId: string;
  readonly bridgeSessionId: string;
  readonly cwd: string;
  readonly name?: string;
}

export interface HybridBridgeDiagnostic {
  readonly recordParsed: boolean;
  readonly pidMatch: boolean;
  readonly cwdMatch: boolean;
  readonly bridgePresent: boolean;
  readonly nameMatch: boolean;
}

export interface HybridClaudeProcess {
  readonly pid: number;
  readonly status: Promise<{ readonly code: number }>;
  kill(signal: Deno.Signal): void;
}

export interface HybridLauncherDependencies {
  readonly env: Record<string, string>;
  readonly launcherPath: string;
  readonly denoExecutable: string;
  makeTempDir(): Promise<string>;
  assertDirectory(path: string): Promise<void>;
  writeTextFile(path: string, content: string): Promise<void>;
  chmod(path: string, mode: number): Promise<void>;
  remove(path: string): Promise<void>;
  readTextFile(path: string): Promise<string>;
  spawn(
    command: string,
    args: readonly string[],
    cwd: string,
    env: Record<string, string>,
  ): HybridClaudeProcess;
  sleep(milliseconds: number): Promise<void>;
  addSignalListener(signal: Deno.Signal, listener: () => void): void;
  removeSignalListener(signal: Deno.Signal, listener: () => void): void;
}

/** Parses the deliberately small launcher argument surface. */
export function parseHybridLaunchOptions(args: readonly string[]): HybridLaunchOptions {
  args = normalizeTaskArguments(args);
  let cwd: string | undefined;
  let name: string | undefined;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--cwd') cwd = args[++index];
    else if (argument === '--name') name = args[++index];
    else throw new Error(`unknown argument: ${argument}`);
  }
  if (!cwd) throw new Error('--cwd is required');
  if (!cwd.startsWith('/')) throw new Error('--cwd must be an absolute path');
  if (name !== undefined && (!name.trim() || new TextEncoder().encode(name).byteLength > 128)) {
    throw new Error('--name must be 1 to 128 bytes');
  }
  return { cwd, ...(name === undefined ? {} : { name }) };
}

/** Removes provider/auth overrides while preserving the user's native Claude environment. */
export function nativeClaudeEnvironment(source: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).filter(([name]) => !STRIPPED_CLAUDE_ENV.has(name)),
  );
}

/** Produces a single-server MCP config without embedding credentials. */
export function hybridMcpConfig(
  launcherPath: string,
  cwd: string,
  denoExecutable: string,
  credentialFile: string,
): string {
  const serverPath = new URL('./hybrid-mcp-server.ts', `file://${launcherPath}`).pathname;
  return JSON.stringify({
    mcpServers: {
      [HYBRID_MCP_SERVER_NAME]: {
        type: 'stdio',
        command: denoExecutable,
        args: [
          'run',
          '--no-lock',
          `--allow-read=${credentialFile},${join(cwd, '.mcp.json')}`,
          `--allow-run=${HYBRID_PROCESS_GROUP_BINARIES.session},${HYBRID_PROCESS_GROUP_BINARIES.signal}`,
          `--allow-env=${HYBRID_MCP_ENVIRONMENT_NAMES.join(',')}`,
          serverPath,
          '--cwd',
          cwd,
        ],
      },
    },
  });
}

/** Validates Claude's session-registry proof of native bridge attachment. */
export function parseHybridBridgeEvidence(
  source: string,
  expected: { readonly pid: number; readonly cwd: string; readonly name?: string },
): HybridBridgeEvidence | undefined {
  try {
    const value = JSON.parse(source) as Record<string, unknown>;
    if (
      value.pid !== expected.pid || value.cwd !== expected.cwd ||
      typeof value.sessionId !== 'string' || !value.sessionId ||
      typeof value.bridgeSessionId !== 'string' || !value.bridgeSessionId
    ) return undefined;
    return {
      pid: expected.pid,
      cwd: expected.cwd,
      sessionId: value.sessionId,
      bridgeSessionId: value.bridgeSessionId,
      ...(typeof value.name === 'string' ? { name: value.name } : {}),
    };
  } catch {
    return undefined;
  }
}

/** Reports only non-secret match booleans for an unattached registry record. */
export function diagnoseHybridBridgeRecord(
  source: string,
  expected: { readonly pid: number; readonly cwd: string; readonly name?: string },
): HybridBridgeDiagnostic {
  try {
    const value = JSON.parse(source) as Record<string, unknown>;
    return {
      recordParsed: true,
      pidMatch: value.pid === expected.pid,
      cwdMatch: value.cwd === expected.cwd,
      bridgePresent: typeof value.bridgeSessionId === 'string' && value.bridgeSessionId.length > 0,
      nameMatch: expected.name === undefined || value.name === expected.name,
    };
  } catch {
    return {
      recordParsed: false,
      pidMatch: false,
      cwdMatch: false,
      bridgePresent: false,
      nameMatch: false,
    };
  }
}

async function waitForAttachment(
  process: HybridClaudeProcess,
  options: HybridLaunchOptions,
  dependencies: HybridLauncherDependencies,
): Promise<HybridBridgeEvidence> {
  const home = dependencies.env.HOME;
  if (!home) throw new Error('HOME is required to verify Remote Control attachment');
  const path = `${home}/.claude/sessions/${process.pid}.json`;
  const attempts = Math.ceil(HYBRID_ATTACHMENT_TIMEOUT_MS / HYBRID_ATTACHMENT_POLL_MS);
  let diagnostic: HybridBridgeDiagnostic | undefined;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const source = await dependencies.readTextFile(path);
      diagnostic = diagnoseHybridBridgeRecord(source, {
        pid: process.pid,
        cwd: options.cwd,
        name: options.name,
      });
      const evidence = parseHybridBridgeEvidence(
        source,
        { pid: process.pid, cwd: options.cwd, name: options.name },
      );
      if (evidence) return evidence;
    } catch {
      // The registry file is created asynchronously by native Claude.
    }
    const state = await Promise.race([
      dependencies.sleep(HYBRID_ATTACHMENT_POLL_MS).then(() => 'poll' as const),
      process.status.then(() => 'exited' as const),
    ]);
    if (state === 'exited') {
      throw new Error('Claude exited before Remote Control attachment was proven');
    }
  }
  throw new Error(
    `Claude stayed alive without matching bridge attachment evidence: ${
      JSON.stringify(
        diagnostic ?? { recordParsed: false },
      )
    }`,
  );
}

async function terminateClaude(
  process: HybridClaudeProcess,
  dependencies: HybridLauncherDependencies,
): Promise<void> {
  try {
    process.kill('SIGTERM');
  } catch {
    return;
  }
  const stopped = await Promise.race([
    process.status.then(() => true),
    dependencies.sleep(HYBRID_CLAUDE_TERMINATION_GRACE_MS).then(() => false),
  ]);
  if (!stopped) {
    try {
      process.kill('SIGKILL');
    } catch {
      // The process may have exited during escalation.
    }
  }
}

/** Owns config creation, native launch, attachment proof, signals, and cleanup. */
export async function launchHybridClaude(
  options: HybridLaunchOptions,
  dependencies: HybridLauncherDependencies = denoLauncherDependencies(),
): Promise<{ readonly code: number; readonly evidence: HybridBridgeEvidence }> {
  const home = dependencies.env.HOME?.trim();
  if (!home) throw new Error('HOME is required before hybrid launch');
  await dependencies.assertDirectory(options.cwd);
  const tempDir = await dependencies.makeTempDir();
  const configPath = `${tempDir}/mcp.json`;
  let process: HybridClaudeProcess | undefined;
  let signalTermination: Promise<void> | undefined;
  const signals: Deno.Signal[] = ['SIGINT', 'SIGTERM'];
  const listeners = new Map<Deno.Signal, () => void>();
  try {
    await dependencies.chmod(tempDir, 0o700);
    await dependencies.writeTextFile(
      configPath,
      hybridMcpConfig(
        dependencies.launcherPath,
        options.cwd,
        dependencies.denoExecutable,
        `${home.replace(/\/$/, '')}/${OPENCODE_TOOL.openRouterEnvRelativePath}`,
      ),
    );
    await dependencies.chmod(configPath, 0o600);
    const args = [
      '--remote-control',
      ...(options.name === undefined ? [] : [options.name]),
      '--dangerously-skip-permissions',
      '--mcp-config',
      configPath,
    ];
    process = dependencies.spawn(
      'claude',
      args,
      options.cwd,
      nativeClaudeEnvironment(dependencies.env),
    );
    for (const signal of signals) {
      const listener = () => {
        if (process && !signalTermination) {
          signalTermination = terminateClaude(process, dependencies);
          signalTermination.catch(() => {});
        }
      };
      listeners.set(signal, listener);
      dependencies.addSignalListener(signal, listener);
    }
    let evidence: HybridBridgeEvidence;
    try {
      evidence = await waitForAttachment(process, options, dependencies);
    } catch (error) {
      await terminateClaude(process, dependencies);
      throw error;
    }
    console.error(JSON.stringify({ event: 'hybrid_remote_control_attached', ...evidence }));
    const status = await process.status;
    await signalTermination;
    return { code: status.code, evidence };
  } finally {
    for (const [signal, listener] of listeners) {
      dependencies.removeSignalListener(signal, listener);
    }
    await dependencies.remove(tempDir).catch(() => {});
  }
}

function denoLauncherDependencies(): HybridLauncherDependencies {
  return {
    env: Deno.env.toObject(),
    launcherPath: import.meta.url.replace(/^file:\/\//, ''),
    denoExecutable: Deno.execPath(),
    makeTempDir: () => Deno.makeTempDir({ dir: '/tmp', prefix: 'netscript-hybrid-' }),
    async assertDirectory(path) {
      if (!(await Deno.stat(path)).isDirectory) throw new Error('--cwd must identify a directory');
    },
    writeTextFile: Deno.writeTextFile,
    chmod: Deno.chmod,
    remove: (path) => Deno.remove(path, { recursive: true }),
    readTextFile: Deno.readTextFile,
    spawn(command, args, cwd, env) {
      const child = new Deno.Command(command, {
        args: [...args],
        cwd,
        env,
        clearEnv: true,
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
      }).spawn();
      return { pid: child.pid, status: child.status, kill: (signal) => child.kill(signal) };
    },
    sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    addSignalListener: Deno.addSignalListener,
    removeSignalListener: Deno.removeSignalListener,
  };
}

if (import.meta.main) {
  try {
    const result = await launchHybridClaude(parseHybridLaunchOptions(Deno.args));
    Deno.exit(result.code);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'hybrid launch failed');
    Deno.exit(1);
  }
}
