/** Health check expectation declared by a plugin contribution. */
export interface HealthCheckSpec {
  readonly resource: string;
  readonly url: string;
  readonly expect: number;
  readonly timeoutMs?: number;
}
