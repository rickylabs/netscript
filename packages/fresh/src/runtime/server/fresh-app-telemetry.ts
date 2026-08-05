import type { Middleware } from 'fresh';
import { SpanKind } from '@netscript/telemetry/tracer';
import { emitFreshError, withFreshSpan } from '../../internal/package-telemetry/telemetry.ts';
import type { FreshAppTelemetryOptions } from './define-fresh-app.ts';

const DEFAULT_FRESH_APP_SERVICE_NAME = 'fresh-app';
const FRESH_REQUEST_OPERATION = 'fresh.request';
const FRESH_REQUEST_SPAN_NAME = 'fresh.request';

/** Options used to materialize Fresh app request telemetry defaults. */
export interface FreshAppTelemetryMiddlewareOptions {
  /** Stable app name used when telemetry does not override the service name. */
  name?: string;
  /** Caller telemetry configuration; `true` and omission select defaults. */
  telemetry?: boolean | FreshAppTelemetryOptions;
}

/** Create the request middleware backing `defineFreshApp` telemetry defaults. */
export function createFreshAppTelemetryMiddleware<State>(
  options: FreshAppTelemetryMiddlewareOptions,
): Middleware<State> {
  const telemetry = typeof options.telemetry === 'object' ? options.telemetry : undefined;
  const serviceName = telemetry?.serviceName ?? options.name ?? DEFAULT_FRESH_APP_SERVICE_NAME;
  const staticAttributes = telemetry?.attributes ?? {};

  return async (ctx) => {
    return await withFreshSpan(
      {
        scope: 'app',
        name: FRESH_REQUEST_SPAN_NAME,
        operation: FRESH_REQUEST_OPERATION,
        kind: SpanKind.SERVER,
        attributes: {
          ...staticAttributes,
          'service.name': serviceName,
          'http.request.method': ctx.req.method,
          'url.path': ctx.url.pathname,
        },
      },
      async (span) => {
        try {
          const response = await ctx.next();
          span.setAttribute('http.response.status_code', response.status);
          return response;
        } catch (error) {
          emitFreshError(span, error, { 'netscript.operation': FRESH_REQUEST_OPERATION });
          throw error;
        }
      },
    );
  };
}
