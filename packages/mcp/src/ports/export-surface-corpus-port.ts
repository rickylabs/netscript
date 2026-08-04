/** Schema revision of the generated export-surface corpus. */
export const EXPORT_SURFACE_SCHEMA_VERSION = 1 as const;

/** One public symbol declaration emitted by one package export subpath. */
export interface ExportSurfaceEntry {
  /** Published package name such as `@netscript/fresh`. */
  readonly packageName: string;
  /** Export-map key such as `.` or `./builders`. */
  readonly subpath: string;
  /** Exported symbol name. */
  readonly symbol: string;
  /** Deno declaration kind such as `function` or `interface`. */
  readonly kind: string;
  /** Compact declaration signature rendered from `deno doc --json`. */
  readonly signature: string;
  /** Symbol-level JSDoc, or an empty string when none was published. */
  readonly jsDoc: string;
}

/** One package export-map location included even when it exports no named symbols. */
export interface ExportSurfaceSubpath {
  /** Published package name. */
  readonly packageName: string;
  /** Export-map key. */
  readonly subpath: string;
}

/** Version-pinned normalized data loaded by the export-surface port. */
export interface ExportSurfaceCorpus {
  /** Corpus schema revision. */
  readonly schemaVersion: typeof EXPORT_SURFACE_SCHEMA_VERSION;
  /** NetScript version used to generate every entry. */
  readonly frameworkVersion: string;
  /** Deterministically ordered package export-map locations. */
  readonly surfaces: readonly ExportSurfaceSubpath[];
  /** Deterministically ordered exported declarations. */
  readonly entries: readonly ExportSurfaceEntry[];
}

/** Integrity and cardinality metadata for an embedded corpus payload. */
export interface ExportSurfaceCorpusProvenance {
  /** Corpus schema revision. */
  readonly schemaVersion: typeof EXPORT_SURFACE_SCHEMA_VERSION;
  /** NetScript version used to generate every entry. */
  readonly frameworkVersion: string;
  /** SHA-256 of the compressed corpus bytes. */
  readonly sha256: string;
  /** Serialized JSON byte count before compression. */
  readonly uncompressedBytes: number;
  /** Embedded gzip byte count. */
  readonly compressedBytes: number;
  /** Number of publishable first-party packages indexed. */
  readonly packageCount: number;
  /** Number of export-map subpaths indexed. */
  readonly subpathCount: number;
  /** Number of exported symbol declarations indexed. */
  readonly symbolCount: number;
}

/** Port for loading the generated, version-pinned public export surface. */
export interface ExportSurfaceCorpusPort {
  /** Load and verify the normalized corpus, caching is adapter-defined. */
  load(): Promise<ExportSurfaceCorpus>;
}
