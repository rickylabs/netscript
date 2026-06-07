import type { AspireResource } from './aspire-resource.ts';
import type { EnvSource } from './env-source.ts';

/** Context passed to plugin Aspire contributions during AppHost composition. */
export interface ContributionContext {
  /** Root directory of the NetScript project. */
  readonly projectRoot: string;
  /** Deterministic port allocator. */
  readonly port: (key: string, fallback?: number) => number;
  /** Environment source resolver. */
  readonly env: (source: EnvSource | string) => string;
  /** Lookup a composed resource by name. */
  readonly resource: (name: string) => AspireResource | undefined;
  /** Plugin manifest or host manifest data. */
  readonly manifest: unknown;
  /** Optional contribution logger. */
  readonly logger?: {
    /** Write a debug message. */
    readonly debug?: (message: string, fields?: Record<string, unknown>) => void;
    /** Write an error message. */
    readonly error?: (message: string, fields?: Record<string, unknown>) => void;
  };
}
