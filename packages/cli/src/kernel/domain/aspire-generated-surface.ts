import {
  GENERATED_SURFACE_VERSION,
  type GeneratedSurfaceDrift,
  type GeneratedSurfaceEntry,
  type GeneratedSurfaceInput,
  type GeneratedSurfaceOutput,
} from './generated-surface.ts';

/** Identity shared by Aspire generation and inspection. */
export const ASPIRE_SURFACE_GENERATOR = 'public.generate.aspire';
/** Wire contract version; digests cover UTF-8 output bytes including ownership markers. */
export const ASPIRE_SURFACE_VERSION = GENERATED_SURFACE_VERSION;
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
export type AspireSurfaceEntry = GeneratedSurfaceEntry<typeof ASPIRE_SURFACE_GENERATOR>;
/** Selected producer-owned output; authored authorities cannot inhabit this list. */
export type AspireGeneratedOutput = GeneratedSurfaceOutput<typeof ASPIRE_SURFACE_GENERATOR>;
/** Authored input authority; generator writes cannot inhabit this list. */
export type AspireAuthoredInput = GeneratedSurfaceInput<typeof ASPIRE_SURFACE_GENERATOR>;
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
export type AspireSurfaceDrift = GeneratedSurfaceDrift;
/** Typed check result, emitted even if inspection fails. */
export interface AspireSurfaceReport extends AspireSurfaceInventory {
  /** Whether all selected outputs match their producer and bytes. */
  readonly status: 'current' | 'drift' | 'inspection-failure';
  /** Process verdict. */
  readonly exitCode: 0 | 1;
  /** Every discovered drift, or an explicit inspection failure. */
  readonly drift: readonly AspireSurfaceDrift[];
}
