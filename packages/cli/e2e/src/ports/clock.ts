/** Time seam for deterministic tests and real runtime delays. */
export interface Clock {
  now(): Date;
  monotonicMs(): number;
}
