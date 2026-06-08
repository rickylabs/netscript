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
  clearGlobalTracingHelper,
  getGlobalTracingHelper,
  setGlobalTracingHelper,
  type TracingHelper as PrismaTracingHelperContract,
} from '@prisma/instrumentation-contract';

import {
  type Context,
  context as _context,
  SpanKind,
  type SpanOptions,
  trace,
} from '@opentelemetry/api';

/**
 * Span context fields used by Prisma tracing propagation.
 */
export interface PrismaTracingSpanContext {
  /** Current span identifier. */
  readonly spanId: string;
  /** Current trace identifier. */
  readonly traceId: string;
  /** OpenTelemetry trace flags for the span. */
  readonly traceFlags: number;
}

/**
 * Span link shape consumed by Prisma tracing helpers.
 */
export interface PrismaTracingSpanLink {
  /** Linked span context. */
  readonly context: PrismaTracingSpanContext;
}

/**
 * Minimum OpenTelemetry span shape used by Prisma tracing helpers.
 */
export interface PrismaTracingSpan {
  /** Return the span context identifiers used for propagation and links. */
  spanContext(): PrismaTracingSpanContext;
  /** Add links to related spans. */
  addLinks(links: readonly PrismaTracingSpanLink[]): void;
  /** End the span, optionally at a specific timestamp. */
  end(endTime?: unknown): void;
}

/**
 * Minimum OpenTelemetry tracer shape used by Prisma tracing helpers.
 */
export interface PrismaTracingTracer {
  /** Start a span without making it active. */
  startSpan(name: string, options?: unknown, context?: unknown): PrismaTracingSpan;
  /** Start an active span and run a callback in that span. */
  startActiveSpan<R>(
    name: string,
    options: unknown,
    callback: (span: PrismaTracingSpan) => R,
  ): R;
  /** Start an active span with an explicit context and run a callback. */
  startActiveSpan<R>(
    name: string,
    options: unknown,
    context: unknown,
    callback: (span: PrismaTracingSpan) => R,
  ): R;
}

// ---------------------------------------------------------------------------
// ActiveTracingHelper — ported from @prisma/instrumentation@7.3.0
// ---------------------------------------------------------------------------

type PrismaSpanTime = NonNullable<SpanOptions['startTime']>;

type PrismaEngineSpanKind = 'client' | 'internal';

interface PrismaEngineSpan {
  /** Stable engine span identifier. */
  id: string;
  /** Parent engine span identifier, or null for root spans. */
  parentId: string | null;
  /** Engine span name. */
  name: string;
  /** Span start timestamp. */
  startTime: PrismaSpanTime;
  /** Span end timestamp. */
  endTime: PrismaSpanTime;
  /** Engine span kind. */
  kind: PrismaEngineSpanKind;
  /** Optional span attributes. */
  attributes?: Record<string, unknown>;
  /** Optional linked engine span identifiers. */
  links?: string[];
}

interface PrismaExtendedSpanOptions extends SpanOptions {
  /** Child span name without the `prisma:client:` prefix. */
  name: string;
  /** Whether the span is internal and hidden unless Prisma trace debugging is enabled. */
  internal?: boolean;
  /** Whether the span should become the active OpenTelemetry span. */
  active?: boolean;
  /** Context to attach the child span to. */
  context?: Context;
}

type PrismaSpanCallback<R> = (span?: PrismaTracingSpan, context?: Context) => R;

interface PrismaTracingHelper {
  /** Return whether tracing is enabled. */
  isEnabled(): boolean;
  /** Return the current W3C traceparent header value. */
  getTraceParent(context?: Context): string;
  /** Dispatch Prisma engine spans to OpenTelemetry. */
  dispatchEngineSpans(spans: PrismaEngineSpan[]): void;
  /** Return the active OpenTelemetry context, if any. */
  getActiveContext(): Context | undefined;
  /** Run work inside a Prisma child span. */
  runInChildSpan<R>(
    nameOrOptions: string | PrismaExtendedSpanOptions,
    callback: PrismaSpanCallback<R>,
  ): R;
}

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

function endSpan<T>(span: PrismaTracingSpan, result: T): T {
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
    (pattern) => typeof pattern === 'string' ? pattern === spanName : pattern.test(spanName),
  );
}

function dispatchEngineSpan(
  tracer: PrismaTracingTracer,
  engineSpan: PrismaEngineSpan,
  allSpans: PrismaEngineSpan[],
  linkIds: Map<string, string>,
  ignoreSpanTypes: (string | RegExp)[],
): void {
  if (shouldIgnoreSpan(engineSpan.name, ignoreSpanTypes)) return;

  const spanOptions: SpanOptions = {
    attributes: engineSpan.attributes as SpanOptions['attributes'],
    kind: engineSpanKindToOtelSpanKind(engineSpan.kind),
    startTime: engineSpan.startTime,
  };

  tracer.startActiveSpan(engineSpan.name, spanOptions, (span: PrismaTracingSpan) => {
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

class ActiveTracingHelper implements PrismaTracingHelper {
  private tracerProvider: PrismaTracingProvider;
  private ignoreSpanTypes: (string | RegExp)[];

  constructor(options: {
    tracerProvider: PrismaTracingProvider;
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

  dispatchEngineSpans(spans: PrismaEngineSpan[]): void {
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
    options: string | PrismaExtendedSpanOptions,
    callback: PrismaSpanCallback<R>,
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

    return tracer.startActiveSpan(
      name,
      options,
      (span: PrismaTracingSpan) => endSpan(span, callback(span, context)),
    );
  }
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacement for PrismaInstrumentation
// ---------------------------------------------------------------------------

/**
 * Tracer provider shape accepted by {@linkcode enablePrismaTracing}.
 */
export interface PrismaTracingProvider {
  /** Return an OpenTelemetry-compatible tracer. */
  getTracer(name: string, version?: string, options?: unknown): PrismaTracingTracer;
}

/**
 * Configuration for Prisma OpenTelemetry tracing.
 */
export interface PrismaTracingConfig {
  /** Tracer provider to use. Defaults to the globally registered provider. */
  tracerProvider?: PrismaTracingProvider;
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
      tracerProvider: config.tracerProvider ?? (trace.getTracerProvider() as PrismaTracingProvider),
      ignoreSpanTypes: config.ignoreSpanTypes ?? [],
    }) as PrismaTracingHelperContract,
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
