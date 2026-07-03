import { z } from 'zod';
import type {
  DeployConfig,
  DeployTargetBase,
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
 * Top-level deploy configuration section.
 * `targets` is a name-keyed map of deployment targets. This slice ships the
 * `windows` member only; future targets (linux, deno-deploy, docker) are added
 * as sibling keys by #339–#343.
 */
export const DeployConfigSchema: z.ZodType<DeployConfig | undefined> = z
  .object({
    /** Deployment targets keyed by name (currently `windows` only). */
    targets: z
      .object({
        /** Windows Services deployment via Servy. */
        windows: WindowsDeployTargetSchema.optional(),
      })
      .optional(),
  })
  .optional();
