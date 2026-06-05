/**
 * Shared compatibility types for oRPC handler plugins.
 */

/**
 * Generic interceptor shape compatible with the oRPC plugin lifecycle.
 */
// deno-lint-ignore no-explicit-any -- oRPC does not expose a public generic interceptor type here.
export type AnyInterceptor = (...args: any[]) => Promise<any>;

/**
 * Minimal handler options surface used by telemetry plugins.
 */
export interface GenericHandlerOptions {
  rootInterceptors?: AnyInterceptor[];
  clientInterceptors?: AnyInterceptor[];
}
