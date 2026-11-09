/**
 * Minimal singleton supervisor: the desktop process owns the whole NetScript
 * graph (Garnet + services + plugin APIs + background processors). It does
 * what Aspire does in development, and nothing more:
 *
 * - allocate loopback ports and project discovery env (`services__<name>__http__0`),
 * - prepare a per-instance data dir (SQLite copy, installation secret, logs),
 * - start nodes as soon as their dependencies are ready (parallel waves),
 * - wait for readiness (`GET /health` → 200, Garnet `PING` → `+PONG`),
 * - stop everything in reverse order on exit.
 *
 * @module
 */

import { buildGraph, type GraphNode, type GraphOptions, graphNodeNames } from './graph.ts';

export interface SupervisorOptions extends Omit<GraphOptions, 'ports' | 'dataDir'> {
  /** Per-instance data dir. Created when missing; the seed DB is copied once. */
  readonly dataDir: string;
  /** Seed SQLite database copied into the data dir on first start. */
  readonly seedDatabase: string;
  /** Per-node readiness timeout (ms). */
  readonly readyTimeoutMs?: number;
  /** Called on every node state change. */
  readonly onEvent?: (event: SupervisorEvent) => void;
  /**
   * Run against a per-instance copy of the workspace (default true). The scaffold's processors
   * write restart history relative to their working directory and the plugin runtimes resolve
   * generated registries from `Deno.cwd()`, so instances sharing one install directory race on
   * the same files (and an install directory may be read-only).
   */
  readonly isolateWorkspace?: boolean;
}

export type NodeState = 'pending' | 'starting' | 'ready' | 'failed' | 'stopped';

export interface SupervisorEvent {
  readonly node: string;
  readonly state: NodeState;
  /** ms since the supervisor started. */
  readonly at: number;
  readonly detail?: string;
}

export interface NodeReport {
  readonly name: string;
  readonly kind: GraphNode['kind'];
  readonly port: number;
  readonly pid?: number;
  readonly state: NodeState;
  readonly spawnedAt?: number;
  readonly readyAt?: number;
}

export interface RunningGraph {
  /** `http://127.0.0.1:<port>` per HTTP node. */
  readonly urls: Readonly<Record<string, string>>;
  readonly garnet: string;
  readonly nodes: () => NodeReport[];
  /** ms from start() to every node ready. */
  readonly readyMs: number;
  readonly pids: () => number[];
  readonly stop: () => Promise<void>;
  /** Synchronous last-resort kill (for `unload`, where nothing can be awaited). */
  readonly killSync: () => void;
  /** How each node exited during `stop()` (SIGTERM honoured or killed). */
  readonly stopReport: () => Array<{ node: string; graceful: boolean; ms: number }>;
}

/**
 * Reserve an unused loopback port, unique within this graph, and keep it bound until the node
 * spawns (narrows the window in which another instance can take it).
 *
 * - Explicit random ports, not `port: 0`: inside `deno desktop`, port-0 listeners are taken over by
 *   the window's auto-binding, so every node would receive the same port.
 * - 20000–31999: below the ephemeral ranges of Linux (32768+) and Windows (49152+), so outgoing
 *   connections of other processes cannot occupy a chosen port.
 */
function reservePort(taken: Set<number>): { port: number; listener: Deno.Listener } {
  for (let attempt = 0; attempt < 500; attempt++) {
    const port = 20_000 + Math.floor(Math.random() * 12_000);
    if (taken.has(port)) continue;
    try {
      const listener = Deno.listen({ hostname: '127.0.0.1', port });
      taken.add(port);
      return { port, listener };
    } catch {
      // In use: try another.
    }
  }
  throw new Error('No free loopback port found');
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyTree(from: string, to: string, s: string): Promise<void> {
  await Deno.mkdir(to, { recursive: true });
  for await (const entry of Deno.readDir(from)) {
    if (entry.name === 'node_modules' || entry.name === '.data') continue;
    const source = `${from}${s}${entry.name}`;
    const target = `${to}${s}${entry.name}`;
    if (entry.isDirectory) await copyTree(source, target, s);
    else if (entry.isFile) await Deno.copyFile(source, target);
  }
}

/** Copy the workspace into the data dir once per installed workspace version. */
async function isolate(workspace: string, dataDir: string, s: string): Promise<string> {
  const target = `${dataDir}${s}workspace`;
  const stamp = JSON.stringify({ source: workspace, mtime: (await Deno.stat(`${workspace}${s}appsettings.json`)).mtime?.getTime() ?? 0 });
  const marker = `${target}${s}.netscript-desktop-source`;
  const current = await Deno.readTextFile(marker).catch(() => '');
  if (current !== stamp) {
    await Deno.remove(target, { recursive: true }).catch(() => {});
    await copyTree(workspace, target, s);
    await Deno.writeTextFile(marker, stamp);
  }
  return target;
}

function sep(path: string): string {
  return path.includes('\\') && !path.includes('/') ? '\\' : '/';
}

async function redisPing(port: number): Promise<boolean> {
  try {
    const conn = await Deno.connect({ hostname: '127.0.0.1', port });
    try {
      await conn.write(new TextEncoder().encode('PING\r\n'));
      const buf = new Uint8Array(16);
      const n = await conn.read(buf);
      return n !== null && new TextDecoder().decode(buf.subarray(0, n)).startsWith('+PONG');
    } finally {
      conn.close();
    }
  } catch {
    return false;
  }
}

async function httpReady(port: number, path: string): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(2_000) });
    await response.body?.cancel();
    return response.status === 200;
  } catch {
    return false;
  }
}

export async function startGraph(options: SupervisorOptions): Promise<RunningGraph> {
  const t0 = performance.now();
  const at = () => Math.round(performance.now() - t0);
  const s = sep(options.dataDir);
  const logDir = `${options.dataDir}${s}logs`;
  await Deno.mkdir(logDir, { recursive: true });
  const dbPath = `${options.dataDir}${s}workspace.db`;
  if (!(await exists(dbPath))) await Deno.copyFile(options.seedDatabase, dbPath);
  const secretPath = `${options.dataDir}${s}installation.secret`;
  if (!(await exists(secretPath))) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    await Deno.writeTextFile(secretPath, Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''), { mode: 0o600 });
  }

  const workspace = options.isolateWorkspace === false ? options.workspace : await isolate(options.workspace, options.dataDir, s);
  const names = await graphNodeNames(workspace);
  const ports: Record<string, number> = {};
  const taken = new Set<number>();
  const reservations = new Map<string, Deno.Listener>();
  const reserve = (name: string) => {
    reservations.get(name)?.close();
    const { port, listener } = reservePort(taken);
    ports[name] = port;
    reservations.set(name, listener);
  };
  const release = (name: string) => {
    try {
      reservations.get(name)?.close();
    } catch { /* already closed */ }
    reservations.delete(name);
  };
  for (const name of names) reserve(name);
  let graph = await buildGraph({ ...options, workspace, ports });

  const state = new Map<string, { node: GraphNode; state: NodeState; child?: Deno.ChildProcess; spawnedAt?: number; readyAt?: number }>(
    graph.map((node) => [node.name, { node, state: 'pending' as NodeState }]),
  );
  const emit = (node: string, next: NodeState, detail?: string) => {
    const entry = state.get(node)!;
    entry.state = next;
    options.onEvent?.({ node, state: next, at: at(), detail });
  };
  const timeout = options.readyTimeoutMs ?? 120_000;
  let stopping = false;

  const stop = async () => {
    if (stopping) return;
    stopping = true;
    // Two phases, bounded so quitting the app stays fast: every compute node
    // (services, plugin APIs, processors) first, then the stores they write to
    // (streams, Garnet), so in-flight writes can still land.
    const running = [...state.values()].filter((entry) => entry.child);
    const isStore = (entry: { node: GraphNode }) => entry.node.kind === 'cache' || entry.node.name === 'streams';
    const phase = async (entries: typeof running, graceMs: number) => {
      await Promise.all(entries.map(async (entry) => {
        const t = performance.now();
        try {
          entry.child!.kill('SIGTERM');
        } catch { /* already exited */ }
        const exited = await Promise.race([entry.child!.status.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), graceMs))]);
        if (!exited) {
          try {
            entry.child!.kill('SIGKILL');
          } catch { /* gone */ }
          await entry.child!.status.catch(() => undefined);
        }
        stopReport.push({ node: entry.node.name, graceful: exited, ms: Math.round(performance.now() - t) });
        emit(entry.node.name, 'stopped', exited ? 'SIGTERM' : `SIGKILL after ${graceMs} ms`);
      }));
    };
    await phase(running.filter((entry) => !isStore(entry)), 2_000);
    await phase(running.filter(isStore), 1_000);
  };
  const stopReport: Array<{ node: string; graceful: boolean; ms: number }> = [];

  const startNode = async (entry: { node: GraphNode; state: NodeState; child?: Deno.ChildProcess; spawnedAt?: number; readyAt?: number }, attempt = 1): Promise<void> => {
    const { node } = entry;
    emit(node.name, 'starting', attempt > 1 ? `attempt ${attempt}` : undefined);
    entry.spawnedAt = at();
    release(node.name);
    const child = new Deno.Command(node.command, {
      args: [...node.args],
      cwd: node.cwd,
      env: node.env as Record<string, string>,
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    entry.child = child;
    const log = await Deno.open(`${logDir}${s}${node.name}.log`, { create: true, write: true, truncate: true });
    const writer = log.writable.getWriter();
    const pump = async (stream: ReadableStream<Uint8Array>) => {
      for await (const chunk of stream) await writer.write(chunk).catch(() => undefined);
    };
    Promise.all([pump(child.stdout), pump(child.stderr)]).finally(() => writer.close().catch(() => undefined));
    let exited = false;
    child.status.then((status) => {
      exited = true;
      if (!stopping) emit(node.name, 'failed', `exited with code ${status.code}`);
    });
    const deadline = performance.now() + timeout;
    while (performance.now() < deadline) {
      if (exited) {
        // Another instance can still win a port between release and bind: move this node (its
        // dependents have not started, so their discovery env can be rebuilt) and retry.
        await new Promise((r) => setTimeout(r, 100));
        const tail = await Deno.readTextFile(`${logDir}${s}${node.name}.log`).catch(() => '');
        if (attempt < 3 && /AddrInUse|address already in use/i.test(tail) && !stopping) {
          await Deno.rename(`${logDir}${s}${node.name}.log`, `${logDir}${s}${node.name}.attempt${attempt}.log`).catch(() => {});
          reserve(node.name);
          graph = await buildGraph({ ...options, workspace, ports });
          for (const fresh of graph) {
            const current = state.get(fresh.name)!;
            if (!current.child || fresh.name === node.name) current.node = fresh;
          }
          return startNode(entry, attempt + 1);
        }
        throw new Error(`${node.name} exited before becoming ready (see ${logDir}${s}${node.name}.log)`);
      }
      const ok = node.readiness === 'redis' ? await redisPing(ports[node.name]) : await httpReady(ports[node.name], node.readiness);
      if (ok) {
        entry.readyAt = at();
        emit(node.name, 'ready');
        return;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`${node.name} not ready after ${timeout} ms (see ${logDir}${s}${node.name}.log)`);
  };

  // Start each node as soon as all of its dependencies are ready.
  const started = new Map<string, Promise<void>>();
  const launch = (name: string): Promise<void> => {
    const existing = started.get(name);
    if (existing) return existing;
    const entry = state.get(name)!;
    const promise = Promise.all(entry.node.dependsOn.map(launch)).then(() => startNode(entry));
    started.set(name, promise);
    return promise;
  };
  try {
    await Promise.all(graph.map((node) => launch(node.name)));
  } catch (error) {
    for (const name of [...reservations.keys()]) release(name);
    await stop();
    throw error;
  }
  const readyMs = at();
  // Per-node timings next to the logs, for diagnosing slow starts after the fact.
  await Deno.writeTextFile(`${logDir}${s}supervisor.json`, JSON.stringify({
    readyMs,
    nodes: [...state.values()].map((entry) => ({ name: entry.node.name, port: ports[entry.node.name], pid: entry.child?.pid, spawnedAt: entry.spawnedAt, readyAt: entry.readyAt })),
  }, null, 2)).catch(() => {});

  return {
    urls: Object.fromEntries(graph.filter((node) => node.kind !== 'cache').map((node) => [node.name, `http://127.0.0.1:${ports[node.name]}`])),
    garnet: `127.0.0.1:${ports.garnet}`,
    readyMs,
    nodes: () =>
      [...state.values()].map((entry) => ({
        name: entry.node.name,
        kind: entry.node.kind,
        port: ports[entry.node.name],
        pid: entry.child?.pid,
        state: entry.state,
        spawnedAt: entry.spawnedAt,
        readyAt: entry.readyAt,
      })),
    pids: () => [...state.values()].flatMap((entry) => entry.child ? [entry.child.pid] : []),
    stop,
    stopReport: () => [...stopReport],
    killSync() {
      stopping = true;
      for (const entry of state.values()) {
        try {
          entry.child?.kill('SIGKILL');
        } catch { /* already gone */ }
      }
    },
  };
}
