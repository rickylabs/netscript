/** Aspire resource kinds produced by plugin contributions. */
export type AspireResourceKind =
  | 'deno-service'
  | 'deno-background'
  | 'container'
  | 'database'
  | 'cache';

/** Resource descriptor returned by Aspire builder ports. */
export interface AspireResource {
  readonly name: string;
  readonly kind: AspireResourceKind;
  readonly port?: number;
  readonly metadata?: Record<string, unknown>;
}
