/** Identity shared by Aspire generation and inspection. */
export const ASPIRE_SURFACE_GENERATOR = 'public.generate.aspire';
/** Wire contract version; digests cover UTF-8 output bytes including ownership markers. */
export const ASPIRE_SURFACE_VERSION = 1;
/** Producer declaration stored in each generated output. */
export const ASPIRE_SURFACE_MARKER = `// @netscript-generated ${ASPIRE_SURFACE_GENERATOR}\n`;
/** Finite reasons why a generated surface cannot be certified. */
export const ASPIRE_DRIFT_KINDS = [
  'missing',
  'extra',
  'ownership',
  'bytes',
  'inspection-failure',
] as const;
/** Typed failure reason. */
export type AspireDriftKind = typeof ASPIRE_DRIFT_KINDS[number];
/** One output or authored authority in the versioned inventory. */
export interface AspireSurfaceEntry {
  /** Producer for outputs, authority reader for inputs. */
  readonly generator: typeof ASPIRE_SURFACE_GENERATOR;
  /** Normalized project-relative path. */
  readonly path: string;
  /** Authored authorities are never outputs. */
  readonly ownership: 'generated' | 'authored';
  /** SHA-256 digest prefixed with its algorithm. */
  readonly digest: string;
}
/** Selected producer-owned output; authored authorities cannot inhabit this list. */
export interface AspireGeneratedOutput extends AspireSurfaceEntry {
  /** Output ownership. */
  readonly ownership: 'generated';
}
/** Authored input authority; generator writes cannot inhabit this list. */
export interface AspireAuthoredInput extends AspireSurfaceEntry {
  /** Input ownership. */
  readonly ownership: 'authored';
}
/** Versioned output inventory and authored input authorities. */
export interface AspireSurfaceInventory {
  /** Inventory/report wire version. */
  readonly version: typeof ASPIRE_SURFACE_VERSION;
  /** Generator identifier. */
  readonly generator: typeof ASPIRE_SURFACE_GENERATOR;
  /** Complete selected output surface. */
  readonly outputs: readonly AspireGeneratedOutput[];
  /** Authored selection authorities, including appsettings.json. */
  readonly inputs: readonly AspireAuthoredInput[];
}
/** One fail-closed finding. */
export interface AspireSurfaceDrift {
  /** Project-relative location, or the generator id for selection failure. */
  readonly path: string;
  /** Machine-readable drift classification. */
  readonly kind: AspireDriftKind;
}
/** Typed check result, emitted even if inspection fails. */
export interface AspireSurfaceReport extends AspireSurfaceInventory {
  /** Whether all selected outputs match their producer and bytes. */
  readonly status: 'current' | 'drift' | 'inspection-failure';
  /** Process verdict. */
  readonly exitCode: 0 | 1;
  /** Every discovered drift, or an explicit inspection failure. */
  readonly drift: readonly AspireSurfaceDrift[];
}
