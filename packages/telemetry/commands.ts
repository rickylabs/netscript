/**
 * Privacy-first command OpenTelemetry adapter. Registration bounds definition cardinality;
 * observers never receive envelopes or exception text. Requires only exporter permissions.
 *
 * @example
 * ```ts
 * import { createOtelCommandTelemetryPort } from '@netscript/telemetry/commands';
 * const telemetry = createOtelCommandTelemetryPort({
 *   definitions: [{ name: 'values.update', definitionVersion: 1 }],
 * });
 * ```
 * @module
 */
export {
  createOtelCommandTelemetryPort,
  type CreateOtelCommandTelemetryPortOptions,
  type OtelCommandTelemetryPort,
  type OtelCommandTelemetrySpan,
} from './src/adapters/commands/otel-command-telemetry.ts';
export type {
  CommandTelemetryDefinition,
  OtelCommandTelemetryResult,
  OtelCommandTelemetryStart,
} from './src/attributes/command.ts';
export type {
  Attributes,
  AttributeValue,
  Context,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanKind,
  SpanOptions,
  SpanStatus,
  SpanStatusCode,
  TimeInput,
  Tracer,
  TraceState,
} from './src/domain/types.ts';

export {
  CommandErrorTypes,
  CommandIdempotencyStates,
  CommandIsolationLevels,
  CommandOutcomes,
  CommandStoreProviders,
} from './src/attributes/command.ts';
