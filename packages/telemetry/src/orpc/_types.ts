/**
 * Shared compatibility types for oRPC handler plugins.
 */

/**
 * Root-handler interceptor input consumed by telemetry plugins.
 */
export interface RootInterceptorOptions {
  /** Continue the root request pipeline. */
  next(): Promise<unknown>;
}

/** Root-handler interceptor shape consumed by oRPC handler plugins. */
export type RootInterceptor = (options: RootInterceptorOptions) => Promise<unknown>;

/** Procedure-client interceptor input consumed by telemetry plugins. */
export interface ClientInterceptorOptions {
  /** Validated procedure input, intentionally opaque to instrumentation. */
  readonly input: unknown;
  /** Router path segments for the invoked procedure. */
  readonly path: readonly string[];
  /** Continue the procedure client pipeline. */
  next(): Promise<unknown>;
}

/** Procedure-client interceptor shape consumed by oRPC handler plugins. */
export type AnyInterceptor = (options: ClientInterceptorOptions) => Promise<unknown>;

/**
 * Minimal handler options surface used by telemetry plugins.
 */
export interface GenericHandlerOptions {
  /** Root-level oRPC interceptors. */
  rootInterceptors?: RootInterceptor[];
  /** Client/procedure-level oRPC interceptors. */
  clientInterceptors?: AnyInterceptor[];
}
