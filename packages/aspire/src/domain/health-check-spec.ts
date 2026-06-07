/** Health check expectation declared by a plugin contribution. */
export interface HealthCheckSpec {
  /** Resource name checked by the health probe. */
  readonly resource: string;
  /** URL to probe. */
  readonly url: string;
  /** Expected HTTP status code. */
  readonly expect: number;
  /** Optional timeout in milliseconds. */
  readonly timeoutMs?: number;
}
