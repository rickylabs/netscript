/**
 * Process graph for a scaffolded NetScript workspace, derived from its
 * `appsettings.json` (the same topology Aspire reads) and the launch
 * conventions observed under Aspire 13.5 (`evidence/realstack-aspire-runtime-graph.json`).
 *
 * This is the "singleton graph" a desktop host supervises without Aspire:
 * Garnet, the record service, plugin API services and plugin background
 * processors, all on loopback, sharing one SQLite file and one Garnet.
 *
 * @module
 */

export type NodeKind = 'cache' | 'service' | 'plugin-api' | 'background';

export interface GraphNode {
  readonly name: string;
  readonly kind: NodeKind;
  /** Executable and arguments. */
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
  /** Other nodes that must be ready first. */
  readonly dependsOn: readonly string[];
  /** HTTP path that answers 200 once the node is ready, or 'redis' (PING) for Garnet. */
  readonly readiness: string | 'redis';
}

export interface GraphOptions {
  /** Workspace root (contains appsettings.json, deno.json, services/, plugins). */
  readonly workspace: string;
  /** Per-instance data directory: SQLite file, installation secret, logs. */
  readonly dataDir: string;
  /** Deno executable used for every Deno node. */
  readonly deno: string;
  /** Extra Deno flags (packaged mode: `--cached-only`). */
  readonly denoFlags?: readonly string[];
  /** Garnet launch: command + leading args (before `--port`). */
  readonly garnet: { readonly command: string; readonly args: readonly string[] };
  /** Ports allocated by the supervisor, by node name. */
  readonly ports: Readonly<Record<string, number>>;
  /** Give Services the streams URL so record activity is published (default true). */
  readonly wireServiceStreams?: boolean;
  /** Extra environment for every Deno node (e.g. the bundled `DENO_DIR`). */
  readonly env?: Readonly<Record<string, string>>;
  /** Origins allowed by CORS (the webview host's origin, when any). */
  readonly corsOrigins?: readonly string[];
}

interface PluginEntry {
  Enabled?: boolean;
  Entrypoint: string;
  Permissions?: string[];
  RequiresKv?: boolean;
  RequiresDb?: boolean;
  PluginReferences?: string[];
  Concurrency?: number;
  ConcurrencyEnvVar?: string;
  Sagas?: { Store?: { Backend?: string }; Projection?: { Backend?: string } };
}

interface AppSettings {
  NetScript: {
    Services?: Record<string, { Entrypoint: string; Permissions?: string[] }>;
    Plugins?: Record<string, PluginEntry>;
    BackgroundProcessors?: Record<string, PluginEntry>;
  };
}

/** Aspire adds `--allow-ffi` to DB-backed nodes (SQLite is loaded over FFI). */
function permissions(entry: PluginEntry): string[] {
  const base = entry.Permissions ?? ['--allow-all'];
  return entry.RequiresDb && !base.includes('--allow-all') && !base.includes('--allow-ffi') ? [...base, '--allow-ffi'] : base;
}

const SERVICE_PERMISSIONS = ['--allow-net', '--allow-env', '--allow-read', '--allow-sys', '--allow-ffi'];

function fileUrl(path: string): string {
  const normalized = path.replaceAll('\\', '/');
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
}

function join(...parts: string[]): string {
  const sep = parts[0].includes('\\') && !parts[0].includes('/') ? '\\' : '/';
  return parts.map((part, index) => index === 0 ? part.replace(/[\\/]+$/, '') : part.replace(/^[\\/]+|[\\/]+$/g, '')).join(sep);
}

export async function buildGraph(options: GraphOptions): Promise<GraphNode[]> {
  const settings = JSON.parse(await Deno.readTextFile(join(options.workspace, 'appsettings.json'))) as AppSettings;
  const ns = settings.NetScript;
  const url = (name: string) => `http://127.0.0.1:${options.ports[name]}`;
  const sqlite = fileUrl(join(options.dataDir, 'workspace.db'));
  const garnetPort = options.ports.garnet;
  const denoFlags = ['--minimum-dependency-age=0', '--node-modules-dir=none', ...(options.denoFlags ?? [])];
  const common: Record<string, string> = {
    NETSCRIPT_INSTALLATION_SECRET_FILE: join(options.dataDir, 'installation.secret'),
    NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE: fileUrl(join(options.workspace, 'services', '_shared', 'plugin-service-context.ts')),
    DENO_ENV: 'production',
    NO_COLOR: '1',
    // `deno desktop` exports DENO_SERVE_ADDRESS (its window's auto-binding) and children inherit it,
    // so the first Deno.serve of every node would bind the window's port. Empty disables the override.
    DENO_SERVE_ADDRESS: '',
    ...options.env,
  };
  const dbEnv = { DATABASE_PROVIDER: 'sqlite', DATABASE_URL: sqlite, SQLITE_URI: sqlite };
  const kvEnv = {
    CACHE_PROVIDER: 'garnet',
    GARNET_URI: `127.0.0.1:${garnetPort}`,
    GARNET_TCP: `tcp://127.0.0.1:${garnetPort}`,
    REDIS_URI: `127.0.0.1:${garnetPort}`,
    'services__garnet__tcp__0': `tcp://127.0.0.1:${garnetPort}`,
  };
  const cors: Record<string, string> = options.corsOrigins?.length ? { NETSCRIPT_CORS_ORIGINS: options.corsOrigins.join(',') } : {};
  const serviceStreams: Record<string, string> = options.ports.streams && options.wireServiceStreams !== false
    ? { 'services__streams__http__0': url('streams') }
    : {};
  const refs = (entry: PluginEntry): Record<string, string> =>
    Object.fromEntries((entry.PluginReferences ?? []).filter((name) => options.ports[name]).map((name) => [`services__${name}__http__0`, url(name)]));
  const pluginSpecific = (name: string, entry: PluginEntry): Record<string, string> => {
    const env: Record<string, string> = {};
    if (entry.Sagas) {
      env.NETSCRIPT_SAGA_STORE = entry.Sagas.Store?.Backend ?? 'kv';
      env.NETSCRIPT_SAGA_PROJECTION = entry.Sagas.Projection?.Backend ?? 'kv';
    }
    if (name.startsWith('triggers')) {
      env.NETSCRIPT_TRIGGER_REGISTRY_MODULE = fileUrl(join(options.workspace, '.netscript', 'generated', 'plugin-triggers', 'triggers.registry.ts'));
    }
    if (entry.ConcurrencyEnvVar && entry.Concurrency) env[entry.ConcurrencyEnvVar] = String(entry.Concurrency);
    return env;
  };

  const nodes: GraphNode[] = [{
    name: 'garnet',
    kind: 'cache',
    command: options.garnet.command,
    args: [...options.garnet.args, '--port', String(garnetPort), '--lua', '--lua-transaction-mode'],
    cwd: options.dataDir,
    // Desktop profile: workstation GC. Server GC (the .NET default for Garnet) reserves a heap per core.
    env: { DOTNET_gcServer: '0' },
    dependsOn: [],
    readiness: 'redis',
  }];

  for (const [name, entry] of Object.entries(ns.Plugins ?? {})) {
    if (entry.Enabled === false) continue;
    nodes.push({
      name,
      kind: 'plugin-api',
      command: options.deno,
      args: ['run', '--config', 'deno.json', ...denoFlags, '--unstable-no-legacy-abort', ...permissions(entry), entry.Entrypoint],
      cwd: options.workspace,
      env: {
        ...common, ...cors, PORT: String(options.ports[name]), OTEL_SERVICE_NAME: name,
        ...(entry.RequiresDb ? dbEnv : {}), ...(entry.RequiresKv ? kvEnv : {}), ...refs(entry), ...pluginSpecific(name, entry),
      },
      dependsOn: [...(entry.RequiresKv ? ['garnet'] : []), ...(entry.PluginReferences ?? []).filter((ref) => ref !== name && ns.Plugins?.[ref])],
      readiness: '/health',
    });
  }

  for (const [name, entry] of Object.entries(ns.BackgroundProcessors ?? {})) {
    if (entry.Enabled === false) continue;
    nodes.push({
      name,
      kind: 'background',
      command: options.deno,
      args: ['run', ...denoFlags, '--unstable-worker-options', ...permissions(entry), entry.Entrypoint],
      cwd: options.workspace,
      env: {
        ...common, PORT: String(options.ports[name]), OTEL_SERVICE_NAME: name,
        ...(entry.RequiresDb ? dbEnv : {}), ...(entry.RequiresKv ? kvEnv : {}), ...refs(entry), ...pluginSpecific(name, entry),
      },
      dependsOn: [...(entry.RequiresKv ? ['garnet'] : []), ...(entry.PluginReferences ?? []).filter((ref) => ns.Plugins?.[ref])],
      readiness: '/health',
    });
  }

  for (const [name, entry] of Object.entries(ns.Services ?? {})) {
    nodes.push({
      name,
      kind: 'service',
      command: options.deno,
      args: ['run', ...denoFlags, ...(entry.Permissions ?? SERVICE_PERMISSIONS), entry.Entrypoint],
      cwd: join(options.workspace, 'services', name),
      env: {
        ...common, ...cors, ...dbEnv, PORT: String(options.ports[name]), OTEL_SERVICE_NAME: name,
        // Deviation from the 0.0.9 AppHost (which projects no plugin reference into Services):
        // without the streams URL the scaffold's record-activity publisher is disabled.
        ...serviceStreams,
      },
      dependsOn: options.ports.streams && options.wireServiceStreams !== false ? ['streams'] : [],
      readiness: '/health',
    });
  }

  return nodes;
}

/** Node names in the order the graph needs ports for (all of them). */
export async function graphNodeNames(workspace: string): Promise<string[]> {
  const settings = JSON.parse(await Deno.readTextFile(join(workspace, 'appsettings.json'))) as AppSettings;
  const ns = settings.NetScript;
  return [
    'garnet',
    ...Object.entries(ns.Plugins ?? {}).filter(([, entry]) => entry.Enabled !== false).map(([name]) => name),
    ...Object.entries(ns.BackgroundProcessors ?? {}).filter(([, entry]) => entry.Enabled !== false).map(([name]) => name),
    ...Object.keys(ns.Services ?? {}),
  ];
}
