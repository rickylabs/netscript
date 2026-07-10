import type {
  CodexAppServerProcess,
  CodexRecoveryEvidence,
  CodexRemoteObservation,
  CodexRemoteRepairPort,
} from '../codex-remote-repair.ts';

export const CODEX_CONTROL_SOCKET_RELATIVE =
  '.codex/app-server-control/app-server-control.sock' as const;

interface CommandOutput {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function command(executable: string, args: readonly string[]): Promise<CommandOutput> {
  const output = await new Deno.Command(executable, {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

async function recentActiveSessions(root: string): Promise<string[]> {
  const files: Array<{ path: string; modified: number }> = [];
  async function walk(directory: string): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory) await walk(path);
      else if (entry.isFile && entry.name.endsWith('.jsonl')) {
        const stat = await Deno.stat(path);
        files.push({ path, modified: stat.mtime?.getTime() ?? 0 });
      }
    }
  }
  try {
    await walk(root);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
  const active: string[] = [];
  for (const file of files.sort((a, b) => b.modified - a.modified).slice(0, 20)) {
    const content = await Deno.readTextFile(file.path);
    const tail = content.slice(-64 * 1024);
    const sessionId = file.path.match(/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\.jsonl$/i)
      ?.[1];
    if (sessionId && !tail.includes('"type":"task_complete"')) active.push(sessionId);
  }
  return active;
}

/** Matches only a user's real Codex package binary followed by `app-server`. */
export function isAnchoredCodexAppServer(argv: string, home: string): boolean {
  const prefix = `${home}/.codex/`;
  if (!argv.startsWith(prefix)) return false;
  const executable = argv.slice(0, argv.indexOf(' '));
  return executable.endsWith('/codex') && argv.slice(executable.length).startsWith(' app-server');
}

export function parseProcessTable(output: string, home: string): Readonly<{
  appServers: readonly CodexAppServerProcess[];
  childCommands: readonly string[];
}> {
  const appServers: CodexAppServerProcess[] = [];
  const childCommands: string[] = [];
  for (const line of output.split('\n')) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
    if (!match) continue;
    const pid = Number(match[1]);
    const argv = match[3];
    if (argv.includes('codex') && argv.includes('app-server')) {
      appServers.push({ pid, argv, anchored: isAnchoredCodexAppServer(argv, home) });
    } else if (/\b(deno|dotnet|aspire|docker|npm|node|git)\b/.test(argv)) {
      childCommands.push(argv.split(' ')[0]);
    }
  }
  return { appServers, childCommands };
}

/** Local effect adapter; every destructive operation repeats its exact allowlist check. */
export class LocalCodexRemoteAdapter implements CodexRemoteRepairPort {
  private readonly socket: string;

  constructor(
    private readonly home: string,
    private readonly evidenceDirectory: string,
  ) {
    this.socket = `${home}/${CODEX_CONTROL_SOCKET_RELATIVE}`;
  }

  async inspect(_worktree: string): Promise<CodexRemoteObservation> {
    const [cli, daemon, remote, processes, socket, activeSessions] = await Promise.all([
      command('codex', ['--version']),
      command('codex', ['app-server', 'daemon', 'version']),
      command('codex', ['remote-control', 'status', '--json']),
      command('ps', ['-eo', 'pid=,ppid=,args=']),
      Deno.stat(this.socket).then(() => true).catch((error) => {
        if (error instanceof Deno.errors.NotFound) return false;
        throw error;
      }),
      recentActiveSessions(`${this.home}/.codex/sessions`),
    ]);
    const table = parseProcessTable(processes.stdout, this.home);
    const version = (value: string): string | null => value.match(/\d+\.\d+\.\d+/)?.[0] ?? null;
    let remoteValue: Record<string, unknown> = {};
    try {
      remoteValue = JSON.parse(remote.stdout);
    } catch {
      // Non-JSON output is an honest disconnected observation.
    }
    return {
      cliVersion: version(cli.stdout),
      daemonVersion: version(daemon.stdout),
      daemonManaged: daemon.code === 0 && !/not managed/i.test(`${daemon.stdout}${daemon.stderr}`),
      remoteConnected: remote.code === 0 && remoteValue.status === 'connected' &&
        remoteValue.remoteControlEnabled === true,
      controlSocketPresent: socket,
      controlSocketPath: this.socket,
      appServers: table.appServers,
      activeSessionIds: activeSessions,
      activeChildCommands: table.childCommands,
    };
  }

  terminateAnchored(pids: readonly number[]): Promise<void> {
    return this.inspect('').then((observation) => {
      const anchored = new Set(
        observation.appServers.filter((entry) => entry.anchored).map((entry) => entry.pid),
      );
      if (pids.some((pid) => !anchored.has(pid))) throw new Error('unanchored app-server PID');
      for (const pid of pids) Deno.kill(pid, 'SIGTERM');
    });
  }

  async removeKnownControlSocket(path: string): Promise<void> {
    if (path !== this.socket) throw new Error('unknown control socket');
    await Deno.remove(path);
  }

  async restartAndPair(): Promise<void> {
    const result = await command('codex', ['remote-control', 'start', '--json']);
    if (result.code !== 0) throw new Error('remote-control restart failed');
  }

  async persistEvidence(evidence: CodexRecoveryEvidence): Promise<void> {
    await Deno.mkdir(this.evidenceDirectory, { recursive: true, mode: 0o700 });
    await Deno.writeTextFile(
      `${this.evidenceDirectory}/codex-remote-recovery.json`,
      `${JSON.stringify(evidence, null, 2)}\n`,
      { mode: 0o600 },
    );
  }

  now(): string {
    return new Date().toISOString();
  }
}
