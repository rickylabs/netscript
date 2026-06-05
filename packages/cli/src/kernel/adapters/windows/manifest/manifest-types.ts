/** Aspire manifest shapes consumed by Windows deploy env resolution. */
// ============================================================================
// MANIFEST TYPES
// ============================================================================

export interface ManifestBinding {
  scheme?: string;
  protocol?: string;
  transport?: string;
  port?: number;
  targetPort?: number;
  external?: boolean;
}

export interface ManifestResource {
  type: string;
  connectionString?: string;
  env?: Record<string, string>;
  bindings?: Record<string, ManifestBinding>;
  inputs?: Record<string, unknown>;
  value?: string;
}

export interface AspireManifest {
  resources: Record<string, ManifestResource>;
}
