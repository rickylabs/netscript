/**
 * Internal service-client link factory seam.
 *
 * @module
 */

/** Options passed to an internal client link call. */
export interface ClientLinkCallOptions<TContext> {
  /** Abort signal forwarded to the transport. */
  signal?: AbortSignal;
  /** Event-stream cursor forwarded to streaming transports. */
  lastEventId?: string | undefined;
  /** Per-call client context. */
  context: TContext;
}

/** Structural oRPC-compatible client link used by service clients. */
export interface ClientLinkPort<TContext> {
  /** Invoke one RPC path over the configured transport. */
  call(
    path: readonly string[],
    input: unknown,
    options: ClientLinkCallOptions<TContext>,
  ): Promise<unknown>;
}
