/**
 * Desktop-side entry for the real stack: locate the bundled resources, start
 * the supervised graph, project discovery, and hand the BFF its backend.
 *
 * Resource layout (packaged, next to the app executable):
 *
 *   stack/deno[.exe]                     shared Deno runtime for every node
 *   stack/deno-dir/                      DENO_DIR with every JSR/npm dependency cached
 *   stack/garnet/GarnetServer[.exe]      self-contained Garnet
 *   stack/workspace/                     the scaffolded NetScript workspace
 *   stack/seed.db                        seeded SQLite database
 *
 * Development falls back to `realstack/workspace` (symlink to the scaffold),
 * the current Deno, and Garnet from the NuGet tool cache via `dotnet`.
 *
 * @module
 */
import type { WorkspaceBackend } from '../app/service/backend.ts';
import { createRealStackBackend } from './backend.ts';
import { projectDiscovery } from './clients.ts';
import { type RunningGraph, startGraph, type SupervisorEvent } from './supervisor.ts';
import { sampleTree } from '../bench/probe.ts';

export interface RealStackHandle {
  readonly graph: RunningGraph;
  readonly backend: () => Promise<WorkspaceBackend>;
  readonly layout: StackLayout;
  stop(): Promise<void>;
}

export interface StackLayout {
  readonly mode: 'packaged' | 'dev';
  readonly workspace: string;
  readonly seedDatabase: string;
  readonly deno: string;
  readonly denoDir?: string;
  readonly garnet: { command: string; args: string[] };
}

function exists(path: string): boolean {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
}

export function resolveLayout(): StackLayout {
  const win = Deno.build.os === 'windows';
  const sep = win ? '\\' : '/';
  const exeDir = Deno.execPath().replace(/[\\/][^\\/]+$/, '');
  // Next to the executable, or one level up (the webview baseline lives in `webview/`).
  const stack = Deno.env.get('NETSCRIPT_STACK_DIR') ??
    [`${exeDir}${sep}stack`, `${exeDir}${sep}..${sep}stack`].find((dir) => exists(`${dir}${sep}workspace`)) ??
    `${exeDir}${sep}stack`;
  if (exists(`${stack}${sep}workspace`)) {
    return {
      mode: 'packaged',
      workspace: `${stack}${sep}workspace`,
      seedDatabase: `${stack}${sep}seed.db`,
      deno: `${stack}${sep}deno${win ? '.exe' : ''}`,
      denoDir: `${stack}${sep}deno-dir`,
      garnet: { command: `${stack}${sep}garnet${sep}GarnetServer${win ? '.exe' : ''}`, args: [] },
    };
  }
  const here = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
  const seed = `${here}/seed/workspace.db`;
  const garnetDll = Deno.env.get('NETSCRIPT_GARNET') ??
    `${Deno.env.get('HOME')}/.nuget/packages/garnet-server/2.2.1/tools/net10.0/any/GarnetServer.dll`;
  return {
    mode: 'dev',
    workspace: Deno.realPathSync(`${here}/workspace`),
    seedDatabase: exists(seed) ? seed : `${here}/workspace/database/sqlite/workspace.db`,
    deno: Deno.execPath(),
    garnet: garnetDll.endsWith('.dll') ? { command: 'dotnet', args: [garnetDll] } : { command: garnetDll, args: [] },
  };
}

export async function startRealStack(options: {
  readonly dataDir: string;
  readonly corsOrigins?: readonly string[];
  readonly onEvent?: (event: SupervisorEvent) => void;
}): Promise<RealStackHandle> {
  const layout = resolveLayout();
  const graph = await startGraph({
    workspace: layout.workspace,
    dataDir: options.dataDir,
    seedDatabase: layout.seedDatabase,
    deno: layout.deno,
    // Packaged builds run offline from the bundled cache (NETSCRIPT_STACK_ONLINE=1 warms it).
    denoFlags: layout.mode === 'packaged' && Deno.env.get('NETSCRIPT_STACK_ONLINE') !== '1' ? ['--cached-only'] : [],
    garnet: layout.garnet,
    // Every node resolves its dependencies from the bundled cache, offline.
    env: layout.denoDir ? { DENO_DIR: layout.denoDir } : undefined,
    corsOrigins: options.corsOrigins,
    onEvent: options.onEvent,
  });
  // A crash or a closed window must not orphan nine processes.
  globalThis.addEventListener('unload', () => graph.killSync());
  projectDiscovery(graph.urls);
  return {
    graph,
    layout,
    backend: () => Promise.resolve(createRealStackBackend()),
    stop: () => graph.stop(),
  };
}

/** Graph nodes plus resident memory per process, for the in-app System health view. */
export async function stackDiagnostics(graph: RunningGraph) {
  const tree = await sampleTree(Deno.pid).catch(() => undefined);
  const rss = new Map((tree?.processes ?? []).map((process) => [process.pid, process.rssMb]));
  const nodes = graph.nodes().map((node) => ({ ...node, rssMb: node.pid ? rss.get(node.pid) ?? null : null }));
  return {
    readyMs: graph.readyMs,
    hostRssMb: rss.get(Deno.pid) ?? null,
    totalRssMb: tree?.rssMb ?? null,
    processes: tree?.processes.length ?? null,
    nodes,
  };
}
