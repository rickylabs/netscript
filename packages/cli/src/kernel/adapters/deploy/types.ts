/**
 * @module commands/deploy/types
 *
 * Shared deploy command contracts.
 */

/** A single service entry from services.json. */
export interface ManifestService {
  url?: string;
  health?: string;
  type: string;
}

/** The full services.json manifest produced by `deploy build`. */
export interface Manifest {
  name: string;
  version: string;
  generatedAt?: string;
  services: Record<string, ManifestService>;
  infrastructure?: Record<string, string>;
  dashboard?: { url?: string };
}

/** Result of a single servy-cli invocation. */
export interface ServyResult {
  /** Whether the process exited with code 0. */
  success: boolean;
  /** Human-readable output from servy-cli. */
  message: string;
  /** Raw exit code. */
  code: number;
}

/** Common options shared by all operational deploy commands. */
export interface OperationalOptions {
  installDir?: string;
  deployDir: string;
  servyCli: string;
  verbose?: boolean;
}
