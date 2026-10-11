/** Wire version shared by generator inventory reports. */
export const GENERATED_SURFACE_VERSION = 1;
/** Finite reasons why a generated surface cannot be certified. */
export type GeneratedSurfaceDriftKind =
  | 'missing'
  | 'extra'
  | 'ownership'
  | 'bytes'
  | 'inspection-failure';
/** One output or authored authority in a versioned inventory. */
export interface GeneratedSurfaceEntry<Generator extends string = string> {
  /** Producer for outputs, authority reader for inputs. */
  readonly generator: Generator;
  /** Normalized project-relative path. */
  readonly path: string;
  /** Authored authorities are never outputs. */
  readonly ownership: 'generated' | 'authored';
  /** SHA-256 digest prefixed with its algorithm. */
  readonly digest: string;
}
/** A selected producer-owned output. */
export interface GeneratedSurfaceOutput<Generator extends string = string>
  extends GeneratedSurfaceEntry<Generator> {
  /** Output ownership. */
  readonly ownership: 'generated';
}
/** An authored selection authority. */
export interface GeneratedSurfaceInput<Generator extends string = string>
  extends GeneratedSurfaceEntry<Generator> {
  /** Input ownership. */
  readonly ownership: 'authored';
}
/** One fail-closed finding shared by generator checks. */
export interface GeneratedSurfaceDrift {
  /** Project-relative location, or generator identity for inspection failure. */
  readonly path: string;
  /** Machine-readable drift classification. */
  readonly kind: GeneratedSurfaceDriftKind;
  /** Cause when inspection cannot certify the surface. */
  readonly message?: string;
}
