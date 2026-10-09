import { type Context, type Span, SpanKind, SpanStatusCode } from '../../domain/types.ts';
import { getActiveContext, getTracer } from '../../application/tracer.ts';
import { contextWithSpan, withContextAsync } from '../../context/helpers.ts';
import {
  commandResultAttributes,
  CommandSpanNames,
  commandStartAttributes,
} from '../../attributes/command.ts';
import type { Tracer } from '../../domain/types.ts';
import type {
  CommandTelemetryDefinition,
  OtelCommandTelemetryResult,
  OtelCommandTelemetryStart,
} from '../../attributes/command.ts';

/** Once-only privacy-safe completion observer. */
export interface OtelCommandTelemetrySpan {
  /** Observe a bounded completion without changing application behavior. */
  finish(result: OtelCommandTelemetryResult): void;
}
/** Structural executor port plus fixed relay lifecycle wrappers. */
export interface OtelCommandTelemetryPort {
  /** Trace INTERNAL command execution beneath the active request. */
  trace<T>(
    start: OtelCommandTelemetryStart,
    operation: (span: OtelCommandTelemetrySpan) => Promise<T>,
  ): Promise<T>;
  /** Trace INTERNAL relay lifecycle beneath the active context. */
  traceRelay<T>(
    start: OtelCommandTelemetryStart,
    operation: (span: OtelCommandTelemetrySpan) => Promise<T>,
  ): Promise<T>;
  /** Trace PRODUCER publication; operation propagates its active W3C context. */
  tracePublish<T>(
    start: OtelCommandTelemetryStart,
    operation: (span: OtelCommandTelemetrySpan) => Promise<T>,
  ): Promise<T>;
}
/** Construction-time cardinality configuration and native tracer seam. */
export type CreateOtelCommandTelemetryPortOptions = Readonly<{
  /** Copy 1..1024 registered name/version pairs; callers may pass actual definitions. */
  definitions: readonly CommandTelemetryDefinition[];
  /** Existing NetScript-compatible tracer; defaults to the telemetry tracer. */
  tracer?: Tracer;
}>;
/** Compose the command adapter without performing IO.
 * @param options Static registrations and optional native tracer.
 * @returns Executor-compatible port and relay wrappers.
 * @example
 * ```ts
 * const port = createOtelCommandTelemetryPort({ definitions: [{ name: 'values.update', definitionVersion: 1 }] });
 * ```
 */
export function createOtelCommandTelemetryPort(
  options: CreateOtelCommandTelemetryPortOptions,
): OtelCommandTelemetryPort {
  if (
    !Array.isArray(options.definitions) || options.definitions.length < 1 ||
    options.definitions.length > 1024
  ) {
    throw new TypeError('[netscript.command.telemetry] invalid registration');
  }
  const definitions = options.definitions.map((definition) =>
    Object.freeze({
      name: definition.name,
      definitionVersion: definition.definitionVersion,
    })
  );
  const pairs = new Set<string>();
  for (const definition of definitions) {
    commandStartAttributes({
      ...definition,
      isolation: 'default',
      provider: 'postgres',
      idempotency: 'claimed',
    }, definitions);
    const pair = JSON.stringify([definition.name, definition.definitionVersion]);
    if (pairs.has(pair)) {
      throw new TypeError('[netscript.command.telemetry] duplicate registration');
    }
    pairs.add(pair);
  }
  const tracer = options.tracer ?? getTracer();
  async function observe<T>(
    name: string,
    kind: SpanKind,
    start: OtelCommandTelemetryStart,
    operation: (span: OtelCommandTelemetrySpan) => Promise<T>,
  ): Promise<T> {
    let span: Span | undefined;
    let active: Context | undefined;
    let finished = false;
    let ended = false;
    let initialIdempotency: 'claimed' | 'not_requested' = 'not_requested';
    try {
      const attributes = commandStartAttributes(start, definitions);
      initialIdempotency = start.idempotency;
      const parent = getActiveContext();
      span = tracer.startSpan(name, { kind, attributes }, parent);
      active = contextWithSpan(span, parent);
    } catch {
      // Telemetry setup cannot prevent application execution.
    }
    const observer: OtelCommandTelemetrySpan = {
      finish(result): void {
        if (finished || ended) return;
        try {
          const attributes = commandResultAttributes(result);
          finished = true;
          span?.setAttributes(attributes);
          span?.setStatus({
            code: result.outcome === 'applied' || result.outcome === 'replayed'
              ? SpanStatusCode.OK
              : SpanStatusCode.ERROR,
          });
        } catch {
          // Malformed observations and exporter errors never replace the operation result.
        }
      },
    };
    let called = false;
    let application: Promise<T> | undefined;
    const invoke = (): Promise<T> => {
      if (called) return application!;
      called = true;
      application = (async () => await operation(observer))();
      return application;
    };
    try {
      let value: T;
      if (active === undefined) value = await invoke();
      else {
        try {
          value = await withContextAsync(active, invoke);
        } catch {
          // A context observer may fail before or after invoking; never replay the operation.
          if (!called) value = await invoke();
          else value = await application!;
        }
      }
      if (!finished) {
        observer.finish({
          outcome: 'applied',
          idempotency: initialIdempotency,
          auditCount: 0,
          outboxCount: 0,
        });
      }
      return value;
    } catch (error) {
      if (!finished) {
        observer.finish({
          outcome: 'failed',
          idempotency: initialIdempotency,
          auditCount: 0,
          outboxCount: 0,
        });
      }
      throw error;
    } finally {
      ended = true;
      try {
        span?.end();
      } catch { /* Exporter shutdown cannot replace the application outcome. */ }
    }
  }
  return Object.freeze({
    trace: <T>(
      start: OtelCommandTelemetryStart,
      operation: (span: OtelCommandTelemetrySpan) => Promise<T>,
    ): Promise<T> => observe(CommandSpanNames.EXECUTE, SpanKind.INTERNAL, start, operation),
    traceRelay: <T>(
      start: OtelCommandTelemetryStart,
      operation: (span: OtelCommandTelemetrySpan) => Promise<T>,
    ): Promise<T> => observe(CommandSpanNames.OUTBOX_RELAY, SpanKind.INTERNAL, start, operation),
    tracePublish: <T>(
      start: OtelCommandTelemetryStart,
      operation: (span: OtelCommandTelemetrySpan) => Promise<T>,
    ): Promise<T> => observe(CommandSpanNames.OUTBOX_PUBLISH, SpanKind.PRODUCER, start, operation),
  });
}
