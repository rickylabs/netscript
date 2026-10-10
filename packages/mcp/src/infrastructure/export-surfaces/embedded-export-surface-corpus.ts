import { MCP_PACKAGE_VERSION } from '../../publish-assets.generated.ts';
import {
  EXPORT_SURFACE_FRAMEWORK_VERSION,
  EXPORT_SURFACE_ROWS,
} from './export-surface-corpus.generated.ts';
import {
  EXPORT_SURFACE_SCHEMA_VERSION,
  type ExportSurfaceCorpus,
  type ExportSurfaceCorpusPort,
  type ExportSurfaceCorpusProvenance,
  type ExportSurfaceEntry,
  type ExportSurfaceSubpath,
} from '../../ports/export-surface-corpus-port.ts';

/** Compressed payload and pinned metadata accepted by the embedded corpus adapter. */
export interface EmbeddedExportSurfaceSource {
  /** Gzip/base64 encoded normalized corpus JSON. */
  readonly gzipBase64: string;
  /** Expected payload integrity, version, sizes, and counts. */
  readonly provenance: ExportSurfaceCorpusProvenance;
}

/** Construction options for the embedded export-surface corpus. */
export interface EmbeddedExportSurfaceCorpusOptions {
  /** Override the generated source for fixtures or outer embedders. */
  readonly source?: EmbeddedExportSurfaceSource;
  /** Version the caller expects; defaults to this MCP package version. */
  readonly expectedFrameworkVersion?: string;
}

/** Lazy, filesystem-independent adapter for the generated Deno export corpus. */
export class EmbeddedExportSurfaceCorpus implements ExportSurfaceCorpusPort {
  readonly #source: EmbeddedExportSurfaceSource | undefined;
  readonly #expectedFrameworkVersion: string;
  #cached?: Promise<ExportSurfaceCorpus>;

  /** Create a lazy adapter; no decompression occurs until the first query. */
  constructor(options: EmbeddedExportSurfaceCorpusOptions = {}) {
    this.#source = options.source;
    this.#expectedFrameworkVersion = options.expectedFrameworkVersion ?? MCP_PACKAGE_VERSION;
  }

  /** Decode and verify the embedded corpus once, then reuse it for later tool calls. */
  load(): Promise<ExportSurfaceCorpus> {
    this.#cached ??= this.#decode();
    return this.#cached;
  }

  async #decode(): Promise<ExportSurfaceCorpus> {
    if (!this.#source) return await this.#decodeRows();
    const provenance = this.#source.provenance;
    if (provenance.schemaVersion !== EXPORT_SURFACE_SCHEMA_VERSION) {
      throw new Error(`unsupported export corpus schema: ${provenance.schemaVersion}`);
    }
    if (provenance.frameworkVersion !== this.#expectedFrameworkVersion) {
      throw new Error(
        `export corpus version ${provenance.frameworkVersion} does not match ${this.#expectedFrameworkVersion}`,
      );
    }
    const compressed = Uint8Array.fromBase64(this.#source.gzipBase64);
    if (compressed.byteLength !== provenance.compressedBytes) {
      throw new Error('export corpus compressed byte count does not match provenance');
    }
    const hashBytes = new Uint8Array(compressed.byteLength);
    hashBytes.set(compressed);
    const actualHash = hex(await crypto.subtle.digest('SHA-256', hashBytes.buffer));
    if (actualHash !== provenance.sha256) throw new Error('export corpus hash does not match');

    const copied = new Uint8Array(compressed.byteLength);
    copied.set(compressed);
    const stream = new Blob([copied.buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    const uncompressed = new Uint8Array(await new Response(stream).arrayBuffer());
    if (uncompressed.byteLength !== provenance.uncompressedBytes) {
      throw new Error('export corpus uncompressed byte count does not match provenance');
    }
    const parsed = JSON.parse(new TextDecoder().decode(uncompressed)) as unknown;
    return validateCorpus(parsed, provenance, this.#expectedFrameworkVersion);
  }
  async #decodeRows(): Promise<ExportSurfaceCorpus> {
    if (EXPORT_SURFACE_FRAMEWORK_VERSION !== this.#expectedFrameworkVersion) {
      throw new Error(
        `export corpus version ${EXPORT_SURFACE_FRAMEWORK_VERSION} does not match ${this.#expectedFrameworkVersion}`,
      );
    }
    const surfaces: ExportSurfaceSubpath[] = [];
    const entries: ExportSurfaceEntry[] = [];
    for (const [packageSuffix, subpath, base64, hash, size, count] of EXPORT_SURFACE_ROWS) {
      const packageName = `@netscript/${packageSuffix}`;
      const compressed = Uint8Array.fromBase64(base64);
      if (
        new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(compressed).buffer))
          .toBase64() !== hash
      ) {
        throw new Error('export corpus hash does not match');
      }
      const decoded = new Uint8Array(
        await new Response(
          new Blob([new Uint8Array(compressed).buffer]).stream().pipeThrough(
            new DecompressionStream('deflate-raw'),
          ),
        ).arrayBuffer(),
      );
      if (decoded.byteLength !== size) {
        throw new Error('export corpus uncompressed byte count does not match provenance');
      }
      const parsed: unknown = JSON.parse(new TextDecoder().decode(decoded));
      if (
        !Array.isArray(parsed) || parsed.length !== 4 ||
        parsed.some((column) =>
          !Array.isArray(column) || column.length !== count ||
          column.some((value: unknown) => typeof value !== 'string')
        )
      ) throw new Error('export corpus cardinality does not match provenance');
      const columns = parsed as string[][];
      const declarations = Array.from(
        { length: count },
        (_, index) =>
          validateEntry({
            packageName,
            subpath,
            symbol: columns[0]?.[index],
            kind: columns[1]?.[index],
            signature: columns[2]?.[index],
            jsDoc: columns[3]?.[index],
          }),
      );
      surfaces.push({ packageName, subpath });
      entries.push(...declarations);
    }
    const provenance: ExportSurfaceCorpusProvenance = {
      schemaVersion: EXPORT_SURFACE_SCHEMA_VERSION,
      frameworkVersion: this.#expectedFrameworkVersion,
      packageCount: new Set(surfaces.map((surface) => surface.packageName)).size,
      subpathCount: surfaces.length,
      symbolCount: entries.length,
      compressedBytes: 0,
      uncompressedBytes: 0,
      sha256: '',
    };
    return validateCorpus(
      {
        schemaVersion: EXPORT_SURFACE_SCHEMA_VERSION,
        frameworkVersion: this.#expectedFrameworkVersion,
        surfaces,
        entries,
      },
      provenance,
      this.#expectedFrameworkVersion,
    );
  }
}

function validateCorpus(
  value: unknown,
  provenance: ExportSurfaceCorpusProvenance,
  expectedFrameworkVersion: string,
): ExportSurfaceCorpus {
  if (
    !isRecord(value) || value.schemaVersion !== EXPORT_SURFACE_SCHEMA_VERSION ||
    value.frameworkVersion !== expectedFrameworkVersion || !Array.isArray(value.surfaces) ||
    !Array.isArray(value.entries)
  ) {
    throw new Error('export corpus payload does not match the version-1 schema');
  }
  const surfaces = value.surfaces.map(validateSurface);
  const entries = value.entries.map(validateEntry);
  const packages = new Set(surfaces.map((surface) => surface.packageName));
  const surfaceKeys = new Set(surfaces.map(surfaceKey));
  if (
    packages.size !== provenance.packageCount || surfaces.length !== provenance.subpathCount ||
    entries.length !== provenance.symbolCount
  ) {
    throw new Error('export corpus cardinality does not match provenance');
  }
  if (
    surfaceKeys.size !== surfaces.length ||
    entries.some((entry) => !surfaceKeys.has(surfaceKey(entry)))
  ) {
    throw new Error('export corpus contains duplicate or undeclared package subpaths');
  }
  return Object.freeze({
    schemaVersion: EXPORT_SURFACE_SCHEMA_VERSION,
    frameworkVersion: expectedFrameworkVersion,
    surfaces: Object.freeze(surfaces),
    entries: Object.freeze(entries),
  });
}

function validateSurface(value: unknown): ExportSurfaceSubpath {
  if (
    !isRecord(value) || typeof value.packageName !== 'string' ||
    typeof value.subpath !== 'string'
  ) {
    throw new Error('export corpus contains an invalid package subpath');
  }
  return Object.freeze({ packageName: value.packageName, subpath: value.subpath });
}

function validateEntry(value: unknown): ExportSurfaceEntry {
  if (
    !isRecord(value) || typeof value.packageName !== 'string' ||
    typeof value.subpath !== 'string' || typeof value.symbol !== 'string' ||
    typeof value.kind !== 'string' || typeof value.signature !== 'string' ||
    typeof value.jsDoc !== 'string'
  ) {
    throw new Error('export corpus contains an invalid symbol declaration');
  }
  return Object.freeze({
    packageName: value.packageName,
    subpath: value.subpath,
    symbol: value.symbol,
    kind: value.kind,
    signature: value.signature,
    jsDoc: value.jsDoc,
  });
}

function surfaceKey(value: ExportSurfaceSubpath): string {
  return `${value.packageName}\0${value.subpath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
