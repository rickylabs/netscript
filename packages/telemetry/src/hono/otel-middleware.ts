/**
 * Hono OpenTelemetry middleware integration.
 *
 * This adapter delegates HTTP SERVER span creation, lifecycle, route naming,
 * and W3C propagation to Hono's first-party `@hono/otel` middleware. NetScript
 * only enriches the active span with framework-owned attributes.
 *
 * @module
 */

import { httpInstrumentationMiddleware } from '@hono/otel';
import { type AttributeValue, trace } from '@opentelemetry/api';

type UpstreamHonoOtelConfig = NonNullable<Parameters<typeof httpInstrumentationMiddleware>[0]>;

/** Middleware returned by {@linkcode createHonoTracingMiddleware}. */
export type HonoTracingMiddleware = ReturnType<typeof httpInstrumentationMiddleware>;

/**
 * Options for NetScript's Hono tracing middleware.
 */
export interface HonoTracingMiddlewareOptions extends Omit<UpstreamHonoOtelConfig, 'serviceName'> {
  /** Service name forwarded to `@hono/otel` and recorded as `rpc.service`. */
  readonly serviceName: string;

  /**
   * Optional prefix for NetScript-owned attributes.
   *
   * @default "" (no prefix)
   */
  readonly attributePrefix?: string;
}

/**
 * Create Hono HTTP tracing middleware backed by Hono's first-party OTel package.
 *
 * @param options - NetScript service name plus transparent `@hono/otel` options.
 * @returns A Hono middleware handler.
 *
 * @example
 * ```ts
 * import { createHonoTracingMiddleware } from "@netscript/telemetry/hono";
 *
 * app.use("*", createHonoTracingMiddleware({ serviceName: "users" }));
 * ```
 */
export function createHonoTracingMiddleware(
  options: HonoTracingMiddlewareOptions,
): HonoTracingMiddleware {
  const { attributePrefix = '', serviceName, ...upstreamConfig } = options;
  const middleware = httpInstrumentationMiddleware({
    ...upstreamConfig,
    serviceName,
  });

  return async (context, next) => {
    return await middleware(context, async () => {
      setActiveHonoAttributes({
        attributes: {
          [`${attributePrefix}netscript.http.service`]: serviceName,
          [`${attributePrefix}netscript.http.method`]: context.req.method,
          [`${attributePrefix}rpc.service`]: serviceName,
        },
      });

      try {
        await next();
      } finally {
        setActiveHonoAttributes({
          attributes: {
            [`${attributePrefix}netscript.http.status_code`]: context.res.status,
          },
        });
      }
    });
  };
}

function setActiveHonoAttributes(
  options: {
    readonly attributes: Readonly<Record<string, AttributeValue | undefined>>;
  },
): void {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }

  span.setAttributes(options.attributes);
}
