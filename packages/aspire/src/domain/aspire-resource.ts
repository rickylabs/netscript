/** Aspire resource kinds produced by plugin contributions. */
export type AspireResourceKind =
  | 'deno-service'
  | 'deno-background'
  | 'container'
  | 'database'
  | 'cache';

/** Resource descriptor returned by Aspire builder ports. */
export interface AspireResource {
  /** Resource name in the AppHost graph. */
  readonly name: string;
  /** Resource kind. */
  readonly kind: AspireResourceKind;
  /** TCP port exposed by the resource, when applicable. */
  readonly port?: number;
  /** Adapter-specific resource metadata. */
  readonly metadata?: Record<string, unknown>;
}
