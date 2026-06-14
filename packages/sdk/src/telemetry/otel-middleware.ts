/**
 * OpenTelemetry Middleware for oRPC
 *
 * Typed passthrough middleware that preserves the input/output contract of the
 * wrapped middleware chain. Deno's built-in OTEL integration owns span
 * creation when `OTEL_DENO=true`; this middleware exists as a typed extension
 * point so SDK consumers can compose telemetry-aware middleware without
 * widening the public surface to `any`.
 *
 * @example
 * ```ts
 * import { otelMiddleware } from '@netscript/sdk';
 *
 * const middleware = otelMiddleware();
 * ```
 */

export type MiddlewareNext<TContext, TResult> = (context: TContext) => Promise<TResult>;

/**
 * Minimal async middleware signature used by the SDK.
 *
 * @typeParam TContext - Per-call context passed through the middleware chain.
 * @typeParam TResult - Procedure result produced by the next middleware.
 */
export type MiddlewareHandler<TContext, TResult> = (
  next: MiddlewareNext<TContext, TResult>,
  context: TContext,
) => Promise<TResult>;

/**
 * Create a typed passthrough middleware for telemetry-aware composition.
 *
 * @returns Middleware function that forwards the call to `next` unchanged.
 */
export function otelMiddleware<TContext = unknown, TResult = unknown>(): (
  next: MiddlewareNext<TContext, TResult>,
  context: TContext,
) => Promise<TResult> {
  return async (next, context) => {
    return await next(context);
  };
}
