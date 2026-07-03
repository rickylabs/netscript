import type { UnstableApiScanInput } from './unstable-api-guard.ts';

/**
 * Domain-facing ports for the Deno Deploy adapter (Archetype 7 / Arch-2).
 *
 * The `DenoDeployTarget` domain adapter depends only on these interfaces; the
 * concrete implementations shell the native `deno deploy` CLI through a
 * `ProcessPort` and read the filesystem — both of which live in
 * `kernel/adapters/deno-deploy/**` so side effects stay at the edge
 * (A11 / F-CLI-16). This mirrors how the Windows target keeps Servy shelling in
 * an adapter.
 */

/** Resolved Deno-Deploy invocation parameters mapped onto `deno deploy` flags. */
export interface DenoDeployInvocation {
  /** Project root the deploy runs from (`cwd`). */
  readonly projectRoot: string;
  /** Deno Deploy organization slug (`--org`). */
  readonly org?: string;
  /** Deno Deploy application/project name (`--app`). */
  readonly app?: string;
  /** Whether the push targets production (`--prod`). */
  readonly prod?: boolean;
  /** Entrypoint module argument passed to `deno deploy`. */
  readonly entrypoint?: string;
  /** Path to an env file loaded via `deno deploy env load`. */
  readonly envFile?: string;
}

/** Normalized result of a `deno deploy` invocation. */
export interface DenoDeployCliResult {
  /** Process exit code (0 = success). */
  readonly code: number;
  /** Captured standard output. */
  readonly stdout: string;
  /** Captured standard error. */
  readonly stderr: string;
}

/**
 * Port that shells the native `deno deploy` CLI. One method per deploy op the
 * adapter supports; argv construction and exit-code capture live in the adapter.
 */
export interface DenoDeployCliPort {
  /** `deno deploy [--prod] [--org] [--app] [--env-file] [entrypoint]`. */
  deploy(invocation: DenoDeployInvocation): Promise<DenoDeployCliResult>;
  /** `deno deploy logs [--org] [--app]`. */
  logs(invocation: DenoDeployInvocation): Promise<DenoDeployCliResult>;
  /** `deno deploy delete [--org] [--app]` (bring the deployment down). */
  remove(invocation: DenoDeployInvocation): Promise<DenoDeployCliResult>;
  /** `deno deploy show [--org] [--app]` (report deployment status). */
  status(invocation: DenoDeployInvocation): Promise<DenoDeployCliResult>;
}

/**
 * Port that reads already-parsed project sources for the unstable-API guard,
 * keeping filesystem access out of the domain.
 */
export interface DenoDeployPreflightPort {
  /** Read `deno.json` + entrypoint sources for {@link UnstableApiScanInput}. */
  readGuardInputs(projectRoot: string, entrypoint?: string): Promise<UnstableApiScanInput>;
}
