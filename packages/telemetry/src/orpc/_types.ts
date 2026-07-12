/**
 * Shared compatibility types for oRPC handler plugins.
 */

/**
 * Generic interceptor shape compatible with the oRPC plugin lifecycle.
 */
export type AnyInterceptor = (...args: unknown[]) => Promise<unknown>;

/**
 * Minimal handler options surface used by telemetry plugins.
 */
export interface GenericHandlerOptions {
  /** Root-level oRPC interceptors. */
  rootInterceptors?: AnyInterceptor[];
  /** Client/procedure-level oRPC interceptors. */
  clientInterceptors?: AnyInterceptor[];
}
