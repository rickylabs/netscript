import { dirname, join } from '@std/path';

export const WINDOWS_SINGLETON_SERVICE_URLS = {
  eischat: 'http://127.0.0.1:3001',
  streams: 'http://127.0.0.1:4437',
  'workers-api': 'http://127.0.0.1:8091',
  'legacy-archeo-mcp': 'http://127.0.0.1:8095',
  'excalidraw-mcp': 'http://127.0.0.1:8096',
} as const;

const URLS = WINDOWS_SINGLETON_SERVICE_URLS;

export const WINDOWS_SINGLETON_ASPIRE_ENDPOINTS = {
  frontend: 'http://127.0.0.1:18888',
  otlpGrpc: 'http://127.0.0.1:4317',
  otlpHttp: 'http://127.0.0.1:4318',
} as const;

/**
 * Build the complete Deno OpenTelemetry environment for compiled processes.
 *
 * Deno embeds the OTEL enablement flags and propagators in `deno compile` and
 * `deno desktop` metadata, so this environment must be present both while the
 * executables are built and while they run. Exporter endpoints, resource
 * attributes, sampling and batching remain runtime configuration.
 */
export function windowsSingletonTelemetryEnvironment(
  options: { readonly serviceName?: string } = {},
): Record<string, string> {
  const env: Record<string, string> = {
    OTEL_DENO: 'true',
    OTEL_DENO_TRACING: 'true',
    OTEL_DENO_METRICS: 'true',
    OTEL_DENO_CONSOLE: 'capture',
    OTEL_PROPAGATORS: 'tracecontext,baggage',
    OTEL_EXPORTER_OTLP_ENDPOINT: WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.otlpHttp,
    OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
    OTEL_RESOURCE_ATTRIBUTES:
      'service.namespace=eis-chat,service.version=1.0.0,deployment.environment.name=windows-singleton',
    OTEL_TRACES_SAMPLER: 'always_on',
    OTEL_BSP_SCHEDULE_DELAY: '1000',
    OTEL_BLRP_SCHEDULE_DELAY: '1000',
    OTEL_METRIC_EXPORT_INTERVAL: '1000',
  };
  if (options.serviceName) env.OTEL_SERVICE_NAME = options.serviceName;
  return env;
}

/**
 * Build the service-discovery environment used by the packaged singleton.
 *
 * NetScript resolves `services__<name>__http__0` in Deno, while browser code
 * must receive the corresponding `VITE_services__...` value during the Vite
 * build. Hyphenated service names use the SDK's `VITE_<NAME>_URL` fallback
 * because Vite cannot emit their canonical key as a dotted define expression.
 * The short `*_URL` aliases also cover the app's MCP / durable-stream
 * compatibility seams. Keeping the complete graph here prevents the build-time
 * and process-time environments from drifting.
 */
export function windowsSingletonServiceEnvironment(
  options: { readonly includeVite?: boolean } = {},
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [name, url] of Object.entries(URLS)) {
    const alias = name.toUpperCase().replaceAll('-', '_');
    env[`services__${name}__http__0`] = url;
    env[`${alias}_URL`] = url;
    if (options.includeVite) {
      // Vite converts each VITE_* key into an esbuild define expression. A
      // hyphenated property is not valid dotted JavaScript, so use the SDK's
      // documented VITE_<NAME>_URL fallback for those service names.
      if (/^[A-Za-z0-9_]+$/.test(name)) env[`VITE_services__${name}__http__0`] = url;
      env[`VITE_${alias}_URL`] = url;
    }
  }
  env.DURABLE_STREAMS_URL = URLS.streams;
  if (options.includeVite) env.VITE_DURABLE_STREAMS_URL = URLS.streams;
  return env;
}

export interface WindowsSingletonPaths {
  readonly dataDir: string;
  readonly databaseUrl: string;
  readonly channelDataDir: string;
  readonly logDir: string;
  readonly sidecarPath: string;
}

export interface WindowsSingletonHandle {
  readonly children: readonly Deno.ChildProcess[];
  readonly serviceUrl: string;
  stop(): void;
}

interface SidecarSpec {
  readonly name: string;
  readonly executable: string;
  readonly args?: readonly string[];
  readonly url?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly ready?: 'http' | 'tcp' | 'process';
}

function desktopRuntime(): boolean {
  const runtime = Deno as typeof Deno & { readonly BrowserWindow?: unknown };
  return runtime.BrowserWindow !== undefined;
}

/** Resolve writable data and adjacent-sidecar paths without relying on the launch cwd. */
export function resolveWindowsSingletonPaths(
  env: Readonly<Record<string, string | undefined>>,
  executableDir: string,
): WindowsSingletonPaths {
  const appData = env.LOCALAPPDATA ?? env.APPDATA;
  if (!appData) throw new Error('windows-singleton requires LOCALAPPDATA or APPDATA.');
  const dataDir = join(appData, 'eis-chat');
  return {
    dataDir,
    databaseUrl: `file:${join(dataDir, 'eis_chat.db')}`,
    channelDataDir: join(dataDir, 'channels'),
    logDir: join(dataDir, 'logs'),
    sidecarPath: env.EISCHAT_SINGLETON_SIDECAR ?? join(executableDir, 'eischat-service.exe'),
  };
}

async function httpReachable(url: string): Promise<boolean> {
  try {
    await fetch(new URL('/health', url), { signal: AbortSignal.timeout(1_000) });
    return true;
  } catch {
    return false;
  }
}

async function endpointReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function tcpReachable(hostname: string, port: number): Promise<boolean> {
  try {
    const connection = await Deno.connect({ hostname, port });
    connection.close();
    return true;
  } catch {
    return false;
  }
}

async function waitUntilReady(child: Deno.ChildProcess, spec: SidecarSpec): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (spec.ready === 'process') {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      const status = await Promise.race([
        child.status,
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 10)),
      ]);
      if (!status) return;
    } else if (spec.ready === 'tcp') {
      if (await tcpReachable('127.0.0.1', 6379)) return;
    } else if (spec.url && await httpReachable(spec.url)) return;

    const status = await Promise.race([
      child.status,
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 250)),
    ]);
    if (status) throw new Error(`${spec.name} exited with code ${status.code}.`);
  }
  throw new Error(`${spec.name} did not become ready${spec.url ? ` at ${spec.url}` : ''}.`);
}

async function spawnSidecar(
  spec: SidecarSpec,
  baseEnv: Record<string, string>,
  logDir: string,
): Promise<Deno.ChildProcess> {
  const child = new Deno.Command(spec.executable, {
    args: spec.args ? [...spec.args] : [],
    clearEnv: true,
    env: { ...baseEnv, OTEL_SERVICE_NAME: spec.name, ...spec.env },
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  await child.stdin.close();
  const stdout = await Deno.open(join(logDir, `${spec.name}.stdout.log`), {
    create: true,
    write: true,
    truncate: true,
  });
  const stderr = await Deno.open(join(logDir, `${spec.name}.stderr.log`), {
    create: true,
    write: true,
    truncate: true,
  });
  void child.stdout.pipeTo(stdout.writable).catch(() => undefined);
  void child.stderr.pipeTo(stderr.writable).catch(() => undefined);
  await waitUntilReady(child, spec);
  return child;
}

/** Start the complete adjacent process graph for a packaged Deno Desktop singleton. */
export async function startWindowsSingleton(): Promise<WindowsSingletonHandle | undefined> {
  if (!desktopRuntime() || Deno.env.get('EISCHAT_WINDOWS_SINGLETON') !== '1') return undefined;

  const serviceEnvironment = windowsSingletonServiceEnvironment();
  for (const [name, value] of Object.entries(serviceEnvironment)) Deno.env.set(name, value);
  if (await httpReachable(URLS.eischat) && await httpReachable(URLS.streams)) return undefined;

  const executableDir = dirname(Deno.execPath());
  const paths = resolveWindowsSingletonPaths(Deno.env.toObject(), executableDir);
  await Deno.mkdir(paths.channelDataDir, { recursive: true });
  await Deno.mkdir(paths.logDir, { recursive: true });
  await Deno.mkdir(join(paths.dataDir, 'streams'), { recursive: true });
  await Deno.mkdir(join(paths.dataDir, 'garnet'), { recursive: true });

  const permissions = Object.fromEntries(
    await Promise.all((['env', 'read', 'write', 'run', 'net'] as const).map(async (name) => [
      name,
      (await Deno.permissions.query({ name })).state,
    ])),
  );
  const baseEnv = Deno.env.toObject();
  const removedRuntimeEnv = Object.keys(baseEnv).filter((name) =>
    name.startsWith('DENO_') || name === 'NODE_CHANNEL_FD'
  );
  for (const name of removedRuntimeEnv) delete baseEnv[name];

  const common = {
    DATABASE_URL: paths.databaseUrl,
    SQLITE_URI: paths.databaseUrl,
    DB_PROVIDER: 'sqlite',
    DATABASE_PROVIDER: 'sqlite',
    GARNET_URI: '127.0.0.1:6379',
    REDIS_URI: '127.0.0.1:6379',
    CACHE_PROVIDER: 'garnet',
    LOG_LEVEL: 'debug',
    DEBUG: 'netscript:*',
    ...windowsSingletonTelemetryEnvironment(),
  };
  Object.assign(baseEnv, common);

  const dashboardRequested = Deno.env.get('EISCHAT_ASPIRE_DASHBOARD') === '1';
  const dashboardUrl = dashboardRequested ? WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.frontend : undefined;
  const dashboardAlreadyRunning = dashboardUrl ? await endpointReachable(dashboardUrl) : false;
  const specs: SidecarSpec[] = [];
  if (dashboardRequested && !dashboardAlreadyRunning) {
    specs.push({
      name: 'aspire-dashboard',
      executable: join(executableDir, 'tools', 'aspire', 'aspire.exe'),
      args: [
        'dashboard',
        'run',
        '--frontend-url',
        WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.frontend,
        '--otlp-grpc-url',
        WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.otlpGrpc,
        '--otlp-http-url',
        WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.otlpHttp,
        '--config-file-path',
        join(executableDir, 'tools', 'aspire', 'aspire-dashboard.json'),
        '--allow-anonymous',
        '--non-interactive',
      ],
      url: WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.frontend,
      env: {
        ASPNETCORE_URLS: WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.frontend,
        ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL: WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.otlpGrpc,
        ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL: WINDOWS_SINGLETON_ASPIRE_ENDPOINTS.otlpHttp,
        ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS: 'true',
        ASPIRE_DASHBOARD_CONFIG_FILE_PATH: join(
          executableDir,
          'tools',
          'aspire',
          'aspire-dashboard.json',
        ),
        // The receiver is loopback-only and anonymous. Preparing CORS here
        // makes it usable by a future browser OTEL SDK without changing the
        // bundled dashboard; Deno's server-side exporter does not need CORS.
        DASHBOARD__OTLP__CORS__ALLOWEDORIGINS: '*',
      },
    });
  }
  specs.push(
    {
      name: 'garnet',
      executable: join(executableDir, 'tools', 'garnet', 'garnet-server.exe'),
      args: ['--port', '6379'],
      ready: 'tcp',
    },
    {
      name: 'streams',
      executable: join(executableDir, 'streams-service.exe'),
      url: URLS.streams,
      env: { PORT: '4437', STREAMS_DATA_DIR: join(paths.dataDir, 'streams') },
    },
    {
      name: 'workers-api',
      executable: join(executableDir, 'workers-api-service.exe'),
      url: URLS['workers-api'],
      env: { PORT: '8091', services__streams__http__0: URLS.streams },
    },
    {
      name: 'eischat',
      executable: paths.sidecarPath,
      url: URLS.eischat,
      env: {
        PORT: '3001',
        CHANNEL_DATA_DIR: paths.channelDataDir,
        EISCHAT_NO_DOTENV: '1',
        'services__workers-api__http__0': URLS['workers-api'],
        services__streams__http__0: URLS.streams,
      },
    },
    {
      name: 'legacy-archeo-mcp',
      executable: join(executableDir, 'legacy-archeo-mcp-service.exe'),
      url: URLS['legacy-archeo-mcp'],
      env: { PORT: '8095', MCP_TRANSPORT: 'http' },
    },
    {
      name: 'excalidraw-mcp',
      executable: join(executableDir, 'excalidraw-mcp-service.exe'),
      url: URLS['excalidraw-mcp'],
      env: { PORT: '8096', MCP_TRANSPORT: 'http' },
    },
    {
      name: 'workers',
      executable: join(executableDir, 'workers-service.exe'),
      ready: 'process',
      env: {
        WORKER_CONCURRENCY: '2',
        services__eischat__http__0: URLS.eischat,
        services__workers_api__http__0: URLS['workers-api'],
        services__streams__http__0: URLS.streams,
      },
    },
  );

  await Deno.writeTextFile(
    join(paths.logDir, 'desktop-supervisor.log'),
    `${new Date().toISOString()} starting full stack\n` +
      `${
        JSON.stringify(
          {
            paths,
            permissions,
            removedRuntimeEnv,
            serviceEnvironment,
            telemetryEnvironment: common,
            dashboardUrl,
            dashboardAlreadyRunning,
            resources: specs,
          },
          null,
          2,
        )
      }\n`,
    { append: true },
  );

  const children: Deno.ChildProcess[] = [];
  try {
    for (const spec of specs) children.push(await spawnSidecar(spec, baseEnv, paths.logDir));
  } catch (error) {
    for (const child of children.toReversed()) {
      try {
        child.kill('SIGKILL');
      } catch { /* already stopped */ }
    }
    throw error;
  }

  const stop = () => {
    for (const child of children.toReversed()) {
      try {
        child.kill('SIGTERM');
      } catch { /* best effort */ }
    }
  };
  globalThis.addEventListener('unload', stop, { once: true });
  console.log(`[windows-singleton] full stack ready (${children.length} processes)`);
  return { children, serviceUrl: URLS.eischat, stop };
}
