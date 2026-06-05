/**
 * @module public/ports/service-manifest-port
 *
 * Public deployment manifest access port.
 */

import type {
  ManifestServiceEntry,
  ServiceManifest,
} from '../../kernel/domain/service-manifest.ts';

/** Manifest resolved with the effective installation directory. */
export interface ResolvedServiceManifest {
  /** Parsed service manifest. */
  readonly manifest: ServiceManifest;

  /** Directory where the manifest was found. */
  readonly manifestDir: string;

  /** Effective install directory for service operations. */
  readonly installDir: string;
}

/** Options for resolving a deployed service manifest. */
export interface ResolveServiceManifestOptions {
  /** Optional installed application directory. */
  readonly installDir?: string;

  /** Optional build output directory. */
  readonly deployDir?: string;
}

/** Abstraction over services.json manifest resolution. */
export interface ServiceManifestPort {
  /** Resolve and parse the active service manifest. */
  resolve(options: ResolveServiceManifestOptions): Promise<ResolvedServiceManifest>;
}

export type { ManifestServiceEntry, ServiceManifest };
