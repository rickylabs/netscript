/**
 * Shared options a composition root passes to a telemetry provider adapter.
 *
 * The options are resolved from telemetry configuration in the application
 * layer and handed to an adapter at construction time, so an adapter never
 * reaches back into `application/config`. This keeps the ports-and-adapters
 * layering intact: configuration flows _into_ the adapter, never the reverse.
 *
 * @module
 */

/**
 * Options describing where and how a provider adapter exports telemetry.
 *
 * Every field is optional; an adapter applies documented OpenTelemetry defaults
 * (OTLP over `http/protobuf` on port `4318`) when a field is omitted. The
 * Deno-native provider ignores the export fields because the runtime owns
 * exporter configuration; the SDK provider uses them to build its OTLP
 * exporters.
 */
export interface TelemetryProviderOptions {
  /**
   * OTLP endpoint the SDK exporters target.
   *
   * Defaults to `http://localhost:4318` — the OTLP/HTTP default the Aspire
   * dashboard listens on.
   */
  readonly endpoint?: string;
  /**
   * OTLP wire protocol. Only `http/protobuf` and `http/json` are supported;
   * gRPC is intentionally excluded to avoid the `@grpc/grpc-js` Deno friction.
   */
  readonly protocol?: 'http/protobuf' | 'http/json';
  /** Service name reported on the resource of every exported span and metric. */
  readonly serviceName?: string;
  /** Service version reported on the resource. */
  readonly serviceVersion?: string;
  /** Additional resource attributes merged onto the exported resource. */
  readonly resourceAttributes?: Readonly<Record<string, string>>;
}
