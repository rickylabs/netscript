/**
 * @module windows
 * Windows-specific defaults for the NetScript CLI.
 *
 * All values here are DEFAULTS — they can be overridden via the `deploy.windows`
 * section in netscript.config.ts, which is resolved into ResolvedConfig.deploy.
 */

/**
 * Default Servy service manager CLI path.
 */
export const DEFAULT_SERVY_CLI_PATH = 'C:\\Program Files\\Servy\\servy-cli.exe';

/**
 * Default Windows compile target triple for deno compile.
 */
export const DEFAULT_COMPILE_TARGET = 'x86_64-pc-windows-msvc';

/**
 * Default base installation directory for NetScript applications.
 * Falls back to %LOCALAPPDATA%\NetScript if the default is unavailable.
 */
export const DEFAULT_INSTALL_BASE = 'C:\\NetScript';

/**
 * Deno profile flag to suppress Sparkplug JIT (reduces startup latency for
 * services that don't benefit from JIT warm-up at the cost of peak throughput).
 */
export const NO_SPARKPLUG_FLAG = '--no-sparkplug';

/**
 * Default V8 heap size limits per service type (in MB).
 * Tuned for Windows service deployments where multiple processes coexist.
 */
export const DEFAULT_V8_HEAP_MB = {
  /** Microservices (users, products, orders) — oRPC, no heavy compute */
  service: 256,
  /** Plugin services (workers-api, sagas-api, triggers-api) */
  plugin: 256,
  /** Worker background processors — heavy job execution needs more headroom */
  worker: 512,
  /** Fresh frontend app — UI rendering is modest */
  app: 128,
} as const;

/**
 * Default compile timeout per service in milliseconds.
 */
export const DEFAULT_COMPILE_TIMEOUT_MS: number = 5 * 60 * 1000; // 5 minutes

/**
 * Default bundle timeout per service in milliseconds.
 */
export const DEFAULT_BUNDLE_TIMEOUT_MS: number = 60 * 1000; // 60 seconds

/**
 * Servy XML StartupType integer values.
 * @see https://github.com/aelassas/servy
 */
export const SERVY_STARTUP_TYPE = {
  Automatic: 2,
  Manual: 3,
  Disabled: 4,
  AutomaticDelayedStart: 5,
} as const;

/**
 * Servy XML Priority integer values.
 */
export const SERVY_PRIORITY = {
  Idle: 0,
  BelowNormal: 1,
  Normal: 2,
  AboveNormal: 3,
  High: 4,
  RealTime: 5,
} as const;

/**
 * Servy XML DateRotationType integer values.
 */
export const SERVY_DATE_ROTATION_TYPE = {
  Daily: 0,
  Weekly: 1,
  Monthly: 2,
} as const;

/**
 * Servy XML RecoveryAction integer values.
 */
export const SERVY_RECOVERY_ACTION = {
  None: 0,
  RestartService: 1,
  RestartProcess: 2,
  RestartComputer: 3,
} as const;

/**
 * Default log rotation settings for Servy-managed services.
 */
export const DEFAULT_LOG_ROTATION = {
  enableSizeRotation: true,
  rotationSizeMB: 10,
  enableDateRotation: true,
  dateRotationType: 'Daily' as const,
  maxRotations: 30,
} as const;

/**
 * Default health monitoring settings for Servy-managed services.
 */
export const DEFAULT_HEALTH_MONITORING = {
  enableHealthMonitoring: true,
  heartbeatIntervalSeconds: 30,
  maxFailedChecks: 3,
  recoveryAction: 'RestartService' as const,
  maxRestartAttempts: 3,
} as const;

/**
 * Default NetScript service name prefix used in Windows Service registry.
 */
export const DEFAULT_SERVICE_PREFIX = 'NetScript';

/**
 * Default external packages excluded from deno bundle (loaded at runtime).
 * These have native bindings or are problematic for bundling.
 */
export const DEFAULT_BUNDLE_EXTERNAL = [
  'tslib',
  'web-streams-polyfill',
  'rdf-canonize-native',
  'ioredis',
  'pg',
  '@orpc/server',
  '@orpc/contract',
  'lmdb',
  '@durable-streams/server',
] as const;

/**
 * Default npm specifier replacements for the external packages above.
 *
 * `deno bundle --external <pkg>` leaves bare `import "pkg"` specifiers in
 * the bundle output. These are rewritten directly in the bundle JS before
 * calling `deno compile`, so no import map or config changes are needed.
 */
export const DEFAULT_BUNDLE_EXTERNAL_IMPORTS: Record<string, string> = {
  'tslib': 'npm:tslib@^2.8.1',
  'web-streams-polyfill': 'npm:web-streams-polyfill@^4.0.0',
  'rdf-canonize-native': 'npm:rdf-canonize-native@^2.0.0',
  'ioredis': 'npm:ioredis@^5',
  'pg': 'npm:pg@^8.13.1',
  '@orpc/server': 'npm:@orpc/server@^1.14.6',
  '@orpc/contract': 'npm:@orpc/contract@^1.14.6',
  'lmdb': 'npm:lmdb@^3.5.3',
  '@durable-streams/server': 'npm:@durable-streams/server@^0.2.3',
};

/**
 * Temporary compile config written at build time for deno bundle + deno compile.
 *
 * Key differences from the root deno.json:
 *   - `nodeModulesDir: "none"` — prevents deno compile from embedding the entire
 *     node_modules directory (~280 MB per binary). With "none", only modules
 *     reachable from the bundle entrypoint are included (~85 MB savings).
 *   - No `apps/*` workspace member — excludes frontend packages (Vite, Tailwind,
 *     Taurify …) from the resolution graph used by workers/services/plugins.
 *   - External package imports (tslib, web-streams-polyfill, rdf-canonize-native)
 *     so `deno compile` can resolve the npm: specifiers we patched into the bundle.
 *
 * Without this config, `--config=deno.json` (nodeModulesDir: "auto") causes
 * binaries to balloon from ~97 MB to ~880 MB.
 *
 * Workspace members are injected at build time from the discovered Deno
 * workspace (or an explicit deploy.windows.workspace override).
 */
export const COMPILE_CONFIG: { readonly content: string } = {
  /**
   * JSON content for the per-target temp compile config.
   * Written as `.compile-<target>.json` in projectRoot during build (cleaned up after).
   */
  content: JSON.stringify(
    {
      version: '1.0.0',
      nodeModulesDir: 'none',
      imports: {
        tslib: 'npm:tslib@^2.8.1',
        'web-streams-polyfill': 'npm:web-streams-polyfill@^4.0.0',
        'rdf-canonize-native': 'npm:rdf-canonize-native@^2.0.0',
        'ioredis': 'npm:ioredis@^5',
        'pg': 'npm:pg@^8.13.1',
        '@orpc/server': 'npm:@orpc/server@^1.14.6',
        '@orpc/contract': 'npm:@orpc/contract@^1.14.6',
        'lmdb': 'npm:lmdb@^3.5.3',
        '@durable-streams/server': 'npm:@durable-streams/server@^0.2.3',
      },
      unstable: ['kv', 'temporal', 'tsgo', 'worker-options', 'raw-imports'],
      compilerOptions: {
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
      },
    },
    null,
    2,
  ),
} as const;

/** @deprecated Use DEFAULT_V8_HEAP_MB */
export const V8_HEAP_MB: typeof DEFAULT_V8_HEAP_MB = DEFAULT_V8_HEAP_MB;
