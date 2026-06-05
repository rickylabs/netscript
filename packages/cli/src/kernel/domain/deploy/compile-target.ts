/**
 * @module types/compile
 * Types for the deno compile pipeline.
 */

/**
 * A single compilation target (service, plugin, worker, or app).
 */
export interface CompileTarget {
  /** Short service name (e.g., "users", "workers-api") */
  name: string;
  /** Service category affects V8 heap sizing and compile flags */
  type: 'service' | 'plugin' | 'worker' | 'app';
  /** Path to the entry-point TypeScript file */
  entrypoint: string;
  /** Working directory for the service (used as compile cwd) */
  workdir: string;
  /** Deno permission flags to embed in the binary */
  permissions: string[];
  /** HTTP port the service listens on (used in Servy XML and manifest) */
  port?: number;
  /** Logical dependency names (other service names) */
  dependsOn?: string[];
  /** Human-readable description */
  description?: string;
  /** Extra files/directories to embed via --include (relative to projectRoot) */
  include?: string[];
  /** Source plugin name when the target originates from the plugin registry */
  pluginName?: string;
  /** Named entrypoint key from plugin metadata (combined, worker, scheduler, …) */
  entrypointName?: string;
  /** Aspire manifest resource name override */
  manifestResourceName?: string;
  /** Additional environment variables injected by deploy tooling */
  environment?: Record<string, string>;
  /** Concurrency env var exposed by plugin infrastructure metadata */
  concurrencyEnvVar?: string;
  /** Default concurrency value exposed by plugin infrastructure metadata */
  defaultConcurrency?: number;
  /** Whether deploy tooling should assign a WORKER_ID */
  assignWorkerId?: boolean;
}

/**
 * Result of compiling a single target.
 */
export interface CompileResult {
  /** Service name */
  name: string;
  /** Whether compilation succeeded */
  success: boolean;
  /** Absolute path to the produced .exe */
  outputPath: string;
  /** Binary size in bytes (0 on failure) */
  sizeBytes: number;
  /** Wall-clock duration in milliseconds */
  durationMs: number;
  /** Error message if compilation failed */
  error?: string;
}

/**
 * Aggregated build result after compiling all targets.
 */
export interface BuildResult {
  /** Whether all targets compiled successfully */
  success: boolean;
  /** Absolute path to the deploy output directory */
  outputDir: string;
  /** Individual compilation results */
  compilations: CompileResult[];
  /** Total wall-clock duration in milliseconds */
  durationMs: number;
  /** Accumulated error messages from failed compilations */
  errors: string[];
}
