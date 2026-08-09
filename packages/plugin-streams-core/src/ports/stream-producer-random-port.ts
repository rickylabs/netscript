/** Randomness edge used only to jitter reconnect delays. */
export interface StreamProducerRandomPort {
  /** Return a value in the half-open interval [0, 1). */
  next(): number;
}
