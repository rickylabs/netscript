/**
 * @module types/manifest
 * Service discovery manifest types.
 * Written to .deploy/windows/config/services.json after build.
 */

/**
 * A single service entry in the discovery manifest.
 */
export interface ManifestServiceEntry {
  /** Service HTTP URL (absent for background workers without an HTTP port) */
  url?: string;
  /** Health check URL (absent for background workers without an HTTP port) */
  health?: string;
  /** Service category */
  type: 'service' | 'plugin' | 'worker' | 'app';
}

/**
 * Service discovery manifest — human-readable and machine-parseable
 * deployment summary written to .deploy/windows/config/services.json.
 */
export interface ServiceManifest {
  name: string;
  version: string;
  generatedAt: string;
  deployedAt?: string;
  /** Services keyed by logical name */
  services: Record<string, ManifestServiceEntry>;
  /** Infrastructure connection details (passwords masked) */
  infrastructure: {
    database?: string;
    additionalDatabases?: Record<string, string>;
    cache?: string;
    otlp?: string;
  };
  /** Aspire dashboard info */
  dashboard?: {
    url: string;
  };
}
