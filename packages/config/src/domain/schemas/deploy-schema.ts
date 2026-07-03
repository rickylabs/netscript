import { z } from 'zod';
import type {
  DenoDeployTarget,
  DeployConfig,
  DeployTargetBase,
  DockerComposeDeployTarget,
  LinuxDeployTarget,
  WindowsDeployTarget,
} from '../config-section-types.ts';

/**
 * Fields shared by every deployment target under `deploy.targets.*`.
 *
 * Windows (and future targets such as linux, deno-deploy, docker) extend this
 * shape. Kept as a plain Zod raw shape so member schemas compose it by spread
 * without relying on `.extend()` (which the `z.ZodType` export annotation hides).
 */
const deployTargetBaseShape = {
  // ── Compilation ─────────────────────────────────────────────────────────
  /**
   * Deploy mode.
   * - 'compile': compile services to standalone .exe binaries (default)
   * - 'script':  run services via deno.exe + source files (no compilation)
   */
  mode: z.enum(['compile', 'script']).optional(),
  /** Path to deno.exe for script mode. Default: 'deno' */
  denoPath: z.string().optional(),
  /** deno compile target triple. Default: 'x86_64-pc-windows-msvc' */
  compileTarget: z.string().optional(),
  /** Max parallel compilations. Default: 4 */
  concurrency: z.number().int().min(1).optional(),
  /** Compilation timeout in ms per service. Default: 300_000 (5 min) */
  compileTimeoutMs: z.number().optional(),
  /** Bundle (deno bundle) timeout in ms per service. Default: 60_000 (1 min) */
  bundleTimeoutMs: z.number().optional(),

  // ── Bundle optimisation ─────────────────────────────────────────────────
  /**
   * Additional npm package names to pass as --external to deno bundle.
   * Merged with the built-in defaults (tslib, web-streams-polyfill, etc.).
   * Use this when a transitive dependency causes bundle failures.
   */
  bundleExternal: z.array(z.string()).optional(),
  /**
   * Additional import specifier rewrites for external packages.
   * Merged with built-in defaults. Keys are bare package names,
   * values are the npm: specifier to use in the compile config.
   */
  bundleExternalImports: z.record(z.string(), z.string()).optional(),
  /**
   * Workspace members to include in the deno compile config.
   * Auto-derived from root deno.json (excluding apps/*) when omitted.
   * Set explicitly if your project structure differs from the default.
   */
  workspace: z.array(z.string()).optional(),

  // ── V8 heap tuning per service type ─────────────────────────────────────
  /** Per-type V8 max-old-space-size in MB. Defaults: service=256, plugin=256, worker=512, app=128 */
  v8HeapMb: z
    .object({
      service: z.number().int().min(64).optional(),
      plugin: z.number().int().min(64).optional(),
      worker: z.number().int().min(64).optional(),
      app: z.number().int().min(64).optional(),
    })
    .optional(),

  // ── Env file generation ─────────────────────────────────────────────────
  /**
   * Generate .deploy/<target>/config/.env and .env.template during build.
   * Default: true. Override per-run with --no-env-file on the CLI.
   */
  generateEnvFile: z.boolean().optional(),

  // ── Log rotation ────────────────────────────────────────────────────────
  logging: z
    .object({
      /** Max log file size before rotation in MB. Default: 10 */
      rotationSizeMb: z.number().optional(),
      /** Number of rotated files to keep. Default: 30 */
      maxRotations: z.number().int().optional(),
      /** Date-based rotation schedule. Default: 'Daily' */
      dateRotation: z.enum(['Daily', 'Weekly', 'Monthly']).optional(),
    })
    .optional(),

  // ── Health monitoring ───────────────────────────────────────────────────
  health: z
    .object({
      /** Health check interval in seconds. Default: 30 */
      intervalSeconds: z.number().int().optional(),
      /** Failed checks before recovery action. Default: 3 */
      maxFailedChecks: z.number().int().optional(),
      /** Max restart attempts before giving up. Default: 3 */
      maxRestartAttempts: z.number().int().optional(),
    })
    .optional(),

  // ── Docker (container) image config ─────────────────────────────────────
  docker: z
    .object({
      denoBaseImage: z.string().default('denoland/deno:2'),
      dotnetBaseImage: z.string().default('mcr.microsoft.com/dotnet/aspnet:9.0'),
    })
    .optional(),

  // ── Health-gated activation + release retention (R-DEPLOY-3) ─────────────
  activation: z
    .object({
      /** Prior releases retained before pruning. Default: 3. */
      retain: z.number().int().min(0).optional(),
      /** Atomic activation strategy. */
      strategy: z.enum(['symlink', 'dir-swap']).optional(),
      /** Health probe that gates a new release taking traffic. */
      healthGate: z
        .object({
          path: z.string().optional(),
          port: z.number().int().optional(),
          timeoutMs: z.number().int().optional(),
          intervalMs: z.number().int().optional(),
          retries: z.number().int().min(1).optional(),
          expectStatus: z.number().int().optional(),
        })
        .optional(),
    })
    .optional(),

  // ── Secret material convention (R-DEPLOY-3) ──────────────────────────────
  secrets: z
    .object({
      /** Relative path of the generated restricted secret env file. */
      envFile: z.string().optional(),
      /** POSIX file mode for the secret file. Default: 0o600. */
      mode: z.number().int().optional(),
    })
    .optional(),

  // ── OpenTelemetry convention (R-DEPLOY-3) ────────────────────────────────
  otel: z
    .object({
      enabled: z.boolean().optional(),
      endpoint: z.string().optional(),
      protocol: z.string().optional(),
      serviceNamePrefix: z.string().optional(),
    })
    .optional(),
} as const;

/**
 * Shared base schema for every `deploy.targets.*` member.
 * Downstream targets (#339+) compose these fields into their own member schema.
 */
export const DeployTargetBaseSchema: z.ZodType<DeployTargetBase> = z.object(deployTargetBaseShape);

/**
 * Windows Services deployment target (`deploy.targets.windows`).
 * Extends the shared base with Servy service-manager fields.
 * Consumed by `netscript deploy build` and `netscript deploy install`.
 */
export const WindowsDeployTargetSchema: z.ZodType<WindowsDeployTarget> = z.object({
  ...deployTargetBaseShape,

  // ── Service management (Servy) ──────────────────────────────────────────
  /** Path to servy-cli.exe. Default: 'C:\\Program Files\\Servy\\servy-cli.exe' */
  servyCliPath: z.string().optional(),
  /** Base directory for service installation. Default: 'C:\\NetScript' */
  installBase: z.string().optional(),
  /** Windows Service name prefix. Default: 'NetScript' */
  servicePrefix: z.string().optional(),
});

/**
 * Docker / Compose deployment target (`deploy.targets.docker` and
 * `deploy.targets.compose`).
 *
 * Spreads the shared base (which already carries the `docker` image sub-block
 * defaulting to `denoland/deno:2`) and adds compose/registry-specific fields.
 * Consumed by the Aspire-driven compose adapter behind `netscript deploy
 * docker|compose <verb>`; the compose YAML itself is emitted by `aspire
 * publish`, never hand-authored here.
 */
export const DockerComposeDeployTargetSchema: z.ZodType<DockerComposeDeployTarget> = z.object({
  ...deployTargetBaseShape,

  // ── Compose / image publish ─────────────────────────────────────────────
  /** Compose project name (`docker compose -p`). Default: the workspace name. */
  projectName: z.string().optional(),
  /** Directory for emitted compose artifacts. Default: `.deploy/compose`. */
  outputPath: z.string().optional(),
  /** Container image registry for the `docker` push path (e.g. `ghcr.io/acme`). */
  registry: z.string().optional(),
  /** Base image name/tag for built service images. Default: the service name. */
  imageName: z.string().optional(),
});

/**
 * Linux systemd deployment target (`deploy.targets.linux`).
 * Extends the shared base with systemd service-manager fields.
 * Consumed by the bare-metal Linux deploy target (#339 + #340).
 */
export const LinuxDeployTargetSchema: z.ZodType<LinuxDeployTarget> = z.object({
  ...deployTargetBaseShape,

  // ── Service management (systemd) ────────────────────────────────────────
  /** Path to systemctl. Default: 'systemctl' */
  systemctlPath: z.string().optional(),
  /** systemd unit name prefix. Default: 'netscript' */
  unitPrefix: z.string().optional(),
  /** Base directory for service installation. Default: '/opt/netscript' */
  installBase: z.string().optional(),
  /** System user that owns the generated units. */
  user: z.string().optional(),
  /** System group that owns the generated units. */
  group: z.string().optional(),
  /** Runtime directory for sockets and pid files. Default: '/run/netscript' */
  runtimeDir: z.string().optional(),
});

/**
 * Deno Deploy cloud deployment target (`deploy.targets['deno-deploy']`).
 * Extends the shared base with Deno-Deploy-specific push fields. Consumed by
 * `netscript deploy deno-deploy <verb>` via the native `deno deploy` CLI.
 */
export const DenoDeployTargetSchema: z.ZodType<DenoDeployTarget> = z.object({
  ...deployTargetBaseShape,

  // ── Deno Deploy platform ────────────────────────────────────────────────
  /** Deno Deploy organization slug (`deno deploy --org`). */
  org: z.string().optional(),
  /** Deno Deploy application/project name (`deno deploy --app`). */
  app: z.string().optional(),
  /** Entrypoint module passed to `deno deploy`. Default: 'main.ts' */
  entrypoint: z.string().optional(),
  /** Whether pushes target production (`deno deploy --prod`) by default. */
  prod: z.boolean().optional(),
  /** Path to an env file loaded via `deno deploy env load`. */
  envFile: z.string().optional(),
});

/**
 * Top-level deploy configuration section.
 * `targets` is a name-keyed map of deployment targets: `windows` (Servy),
 * `docker` (single-image build/push), `compose` (emit + self-host), `linux`
 * (systemd bare-metal) and `deno-deploy` (Deno Deploy cloud).
 */
export const DeployConfigSchema: z.ZodType<DeployConfig | undefined> = z
  .object({
    /** Deployment targets keyed by name. */
    targets: z
      .object({
        /** Windows Services deployment via Servy. */
        windows: WindowsDeployTargetSchema.optional(),
        /** Docker single-image (build/push) deployment via Aspire. */
        docker: DockerComposeDeployTargetSchema.optional(),
        /** Docker Compose (emit + self-host) deployment via Aspire. */
        compose: DockerComposeDeployTargetSchema.optional(),
        /** Linux systemd deployment. */
        linux: LinuxDeployTargetSchema.optional(),
        /** Deno Deploy cloud deployment via the native `deno deploy` CLI. */
        'deno-deploy': DenoDeployTargetSchema.optional(),
      })
      .optional(),
  })
  .optional();
