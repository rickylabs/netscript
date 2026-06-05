/**
 * Lightweight Prisma OpenTelemetry tracing helper.
 *
 * Drop-in replacement for `@prisma/instrumentation` that avoids the heavy
 * `@opentelemetry/instrumentation` dependency (which pulls in CJS-only
 * `require-in-the-middle` and `import-in-the-middle`, breaking Deno bundle/compile).
 *
 * Uses only:
 *   - `@prisma/instrumentation-contract` (0 deps, pure ESM, 28 kB)
 *   - `@opentelemetry/api` (already in the dependency graph)
 *
 * This is a faithful re-implementation of the `ActiveTracingHelper` class from
 * `@prisma/instrumentation@7.3.0` — same span naming, same traceparent format,
 * same engine span dispatch logic.
 *
 * @module
 */

import {
  setGlobalTracingHelper,
  clearGlobalTracingHelper,
  getGlobalTracingHelper,
  type TracingHelper,
  type EngineSpan,
  type ExtendedSpanOptions,
  type SpanCallback,
} from '@prisma/instrumentation-contract';

import {
  context as _context,
  trace,
  SpanKind,
  type Context,
  type Span,
  type SpanOptions,
  type TracerProvider,
  type Tracer,
} from '@opentelemetry/api';

// ---------------------------------------------------------------------------
// ActiveTracingHelper — ported from @prisma/instrumentation@7.3.0
// ---------------------------------------------------------------------------

const maybeProcess = (globalThis as Record<string, unknown>).process;
const processEnv = maybeProcess && typeof maybeProcess === 'object'
  ? (maybeProcess as { env?: Record<string, string | undefined> }).env
  : undefined;

const showAllTraces = processEnv
  ? processEnv.PRISMA_SHOW_ALL_TRACES === 'true'
  : Deno.env.get('PRISMA_SHOW_ALL_TRACES') === 'true';

const nonSampledTraceParent = '00-10-10-00';

function engineSpanKindToOtelSpanKind(
  engineSpanKind: string | undefined,
): SpanKind {
  switch (engineSpanKind) {
    case 'client':
      return SpanKind.CLIENT;
    case 'internal':
    default:
      return SpanKind.INTERNAL;
  }
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return value != null && typeof (value as PromiseLike<T>)['then'] === 'function';
}

function endSpan<T>(span: Span, result: T): T {
  if (isPromiseLike(result)) {
    return result.then(
      (value) => {
        span.end();
        return value;
      },
      (reason) => {
        span.end();
        throw reason;
      },
    ) as unknown as T;
  }
  span.end();
  return result;
}

function shouldIgnoreSpan(
  spanName: string,
  ignoreSpanTypes: (string | RegExp)[],
): boolean {
  return ignoreSpanTypes.some(
    (pattern) =>
      typeof pattern === 'string'
        ? pattern === spanName
        : pattern.test(spanName),
  );
}

function dispatchEngineSpan(
  tracer: Tracer,
  engineSpan: EngineSpan,
  allSpans: EngineSpan[],
  linkIds: Map<string, string>,
  ignoreSpanTypes: (string | RegExp)[],
): void {
  if (shouldIgnoreSpan(engineSpan.name, ignoreSpanTypes)) return;

  const spanOptions: SpanOptions = {
    attributes: engineSpan.attributes as SpanOptions['attributes'],
    kind: engineSpanKindToOtelSpanKind(engineSpan.kind),
    startTime: engineSpan.startTime,
  };

  tracer.startActiveSpan(engineSpan.name, spanOptions, (span: Span) => {
    linkIds.set(engineSpan.id, span.spanContext().spanId);

    if (engineSpan.links) {
      span.addLinks(
        engineSpan.links.flatMap((link: string) => {
          const linkedId = linkIds.get(link);
          if (!linkedId) return [];
          return {
            context: {
              spanId: linkedId,
              traceId: span.spanContext().traceId,
              traceFlags: span.spanContext().traceFlags,
            },
          };
        }),
      );
    }

    const children = allSpans.filter((s) => s.parentId === engineSpan.id);
    for (const child of children) {
      dispatchEngineSpan(tracer, child, allSpans, linkIds, ignoreSpanTypes);
    }

    span.end(engineSpan.endTime);
  });
}

class ActiveTracingHelper implements TracingHelper {
  private tracerProvider: TracerProvider;
  private ignoreSpanTypes: (string | RegExp)[];

  constructor(options: {
    tracerProvider: TracerProvider;
    ignoreSpanTypes: (string | RegExp)[];
  }) {
    this.tracerProvider = options.tracerProvider;
    this.ignoreSpanTypes = options.ignoreSpanTypes;
  }

  isEnabled(): boolean {
    return true;
  }

  getTraceParent(context?: Context): string {
    const span = trace.getSpanContext(context ?? _context.active());
    if (span) {
      return `00-${span.traceId}-${span.spanId}-0${span.traceFlags}`;
    }
    return nonSampledTraceParent;
  }

  dispatchEngineSpans(spans: EngineSpan[]): void {
    const tracer = this.tracerProvider.getTracer('prisma');
    const linkIds = new Map<string, string>();
    const roots = spans.filter((span) => span.parentId === null);
    for (const root of roots) {
      dispatchEngineSpan(tracer, root, spans, linkIds, this.ignoreSpanTypes);
    }
  }

  getActiveContext(): Context | undefined {
    return _context.active();
  }

  runInChildSpan<R>(
    options: string | ExtendedSpanOptions,
    callback: SpanCallback<R>,
  ): R {
    if (typeof options === 'string') {
      options = { name: options };
    }
    if (options.internal && !showAllTraces) {
      return callback();
    }

    const tracer = this.tracerProvider.getTracer('prisma');
    const context = options.context ?? this.getActiveContext();
    const name = `prisma:client:${options.name}`;

    if (shouldIgnoreSpan(name, this.ignoreSpanTypes)) {
      return callback();
    }

    if (options.active === false) {
      const span = tracer.startSpan(name, options, context);
      return endSpan(span, callback(span, context));
    }

    return tracer.startActiveSpan(name, options, (span: Span) =>
      endSpan(span, callback(span, context)),
    );
  }
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacement for PrismaInstrumentation
// ---------------------------------------------------------------------------

export interface PrismaTracingConfig {
  /** TracerProvider to use. Defaults to the globally registered provider. */
  tracerProvider?: TracerProvider;
  /** Span name patterns to ignore. */
  ignoreSpanTypes?: (string | RegExp)[];
}

/**
 * Enable Prisma OTEL tracing.
 *
 * Equivalent to `new PrismaInstrumentation().enable()` but without pulling in
 * the CJS-heavy `@opentelemetry/instrumentation` dependency.
 *
 * Call this once before creating any Prisma clients.
 */
export function enablePrismaTracing(config: PrismaTracingConfig = {}): void {
  setGlobalTracingHelper(
    new ActiveTracingHelper({
      tracerProvider: config.tracerProvider ?? trace.getTracerProvider(),
      ignoreSpanTypes: config.ignoreSpanTypes ?? [],
    }),
  );
}

/**
 * Disable Prisma OTEL tracing.
 */
export function disablePrismaTracing(): void {
  clearGlobalTracingHelper();
}

/**
 * Check whether Prisma OTEL tracing is currently enabled.
 */
export function isPrismaTracingEnabled(): boolean {
  return getGlobalTracingHelper() !== undefined;
}

// Re-export contract types for consumers
export type { TracingHelper, EngineSpan, ExtendedSpanOptions, SpanCallback };
