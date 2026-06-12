/**
 * `@netscript/sdk/telemetry` middleware helpers.
 *
 * This subpath exposes the lightweight OpenTelemetry middleware type surface
 * used by NetScript services. It is intentionally narrow: client transport
 * trace propagation is wired through `@netscript/sdk/client`, while this subpath
 * keeps middleware composition imports stable for service packages.
 *
 * @module
 */

export {
  type MiddlewareHandler,
  type MiddlewareNext,
  otelMiddleware,
} from '../src/telemetry/otel-middleware.ts';
