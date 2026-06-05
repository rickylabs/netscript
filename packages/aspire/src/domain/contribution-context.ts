import type { AspireResource } from './aspire-resource.ts';
import type { EnvSource } from './env-source.ts';

/** Context passed to plugin Aspire contributions during AppHost composition. */
export interface ContributionContext {
  readonly projectRoot: string;
  readonly port: (key: string, fallback?: number) => number;
  readonly env: (source: EnvSource | string) => string;
  readonly resource: (name: string) => AspireResource | undefined;
  readonly manifest: unknown;
  readonly logger?: {
    readonly debug?: (message: string, fields?: Record<string, unknown>) => void;
    readonly error?: (message: string, fields?: Record<string, unknown>) => void;
  };
}
