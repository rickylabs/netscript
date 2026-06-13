import type { Attributes } from '@netscript/telemetry/tracer';
import { getTracer, SpanKind, withSpan } from '@netscript/telemetry/tracer';

const deferTracer = getTracer('@netscript/fresh/defer');

/** Attribute map accepted by Fresh defer telemetry helpers. */
export type FreshDeferTelemetryAttributes = Record<string, string | number | boolean | undefined>;

/** Result returned by a defer prewarm request span. */
export interface DeferPrewarmResult {
  /** HTTP status returned by the partial request. */
  status: number;
  /** True when the partial request completed with a successful status. */
  ok: boolean;
  /** Total partial request duration in milliseconds. */
  durationMs: number;
}

/** Input used to describe a defer prewarm telemetry span. */
export interface DeferPrewarmSpanInput {
  /** Deferred region name being prewarmed. */
  regionName: string;
  /** Reason the prewarm was scheduled. */
  reason: 'stale' | 'miss';
  /** Full action URL associated with the page render. */
  actionUrl: string;
  /** Partial URL requested by the prewarm. */
  partialUrl: string;
}

/** Emit a telemetry span around a background deferred partial prewarm request. */
export function emitDeferPrewarmDispatchSpan<T extends DeferPrewarmResult>(
  input: DeferPrewarmSpanInput,
  run: () => Promise<T>,
): Promise<T> {
  return withSpan(
    deferTracer,
    'defer.prewarm.dispatch',
    async (span) => {
      span.setAttributes({
        'defer.region.name': input.regionName,
        'defer.reason': input.reason,
        'defer.action_url': input.actionUrl,
        'defer.partial_url': input.partialUrl,
      });

      try {
        const result = await run();

        span.setAttributes({
          'http.response.status_code': result.status,
          'defer.prewarm.ok': result.ok,
          'defer.partial.complete_ms': result.durationMs,
        } as Attributes);

        span.addEvent('defer.prewarm.complete', {
          'defer.region.name': input.regionName,
          'defer.reason': input.reason,
          'defer.partial_url': input.partialUrl,
          'http.response.status_code': result.status,
          'defer.prewarm.ok': result.ok,
          'defer.partial.complete_ms': result.durationMs,
        });

        return result;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        span.recordException(error instanceof Error ? error : new Error(message));
        span.setAttributes({
          'defer.prewarm.ok': false,
          'defer.error.message': message,
        } as Attributes);

        span.addEvent('defer.prewarm.complete', {
          'defer.region.name': input.regionName,
          'defer.reason': input.reason,
          'defer.partial_url': input.partialUrl,
          'defer.prewarm.ok': false,
          'defer.error.message': message,
        });

        throw error;
      }
    },
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'defer.region.name': input.regionName,
        'defer.reason': input.reason,
      },
    },
  );
}

/** Input used to emit cache-read telemetry for a deferred region. */
export interface DeferCacheReadSpanInput {
  /** Deferred region name being rendered. */
  regionName: string;
  /** Span attributes describing cache state. */
  attributes: FreshDeferTelemetryAttributes;
  /** Event attributes emitted when the cache read decision completes. */
  eventAttributes: FreshDeferTelemetryAttributes;
}

/** Emit a telemetry span for a server-side defer cache read decision. */
export function emitDeferCacheReadSpan(input: DeferCacheReadSpanInput): Promise<void> {
  return withSpan(
    deferTracer,
    'defer.cache.read',
    (span) => {
      span.setAttributes(input.attributes as Attributes);
      span.addEvent('defer.cache.read.complete', input.eventAttributes as Attributes);
    },
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'defer.region.name': input.regionName,
      },
    },
  );
}

/** Emit a telemetry span for a client-side defer submit/skip decision. */
export function emitDeferClientDecisionSpan(
  attributes: FreshDeferTelemetryAttributes,
): Promise<void> {
  return withSpan(
    deferTracer,
    'defer.client.decision',
    (span) => {
      span.setAttributes(attributes as Attributes);
      span.addEvent('defer.client.lifecycle', attributes as Attributes);
    },
    {
      kind: SpanKind.INTERNAL,
      attributes: attributes as Attributes,
    },
  );
}

// ============================================================================
// STREAMING SSR TELEMETRY
// ============================================================================

const streamTracer = getTracer('@netscript/fresh/stream');

/** Input for a streaming render telemetry span. */
export interface StreamRenderSpanInput {
  /** Route pattern being streamed. */
  routePattern: string;
  /** Number of Suspense boundaries in the page tree. */
  suspenseBoundaryCount: number;
  /** Number of layers using `delivery: 'stream'`. */
  streamLayerCount: number;
}

/** Result metrics captured after the streaming render completes. */
export interface StreamRenderSpanResult {
  /** Total wall-clock duration of the stream in milliseconds. */
  durationMs: number;
  /** Number of errors encountered during streaming. */
  errorCount: number;
}

/**
 * Emit an OpenTelemetry span that wraps a streaming SSR render.
 *
 * The span records boundary counts, stream duration, and error counts
 * for observability.
 */
export function emitStreamRenderSpan<T>(
  input: StreamRenderSpanInput,
  run: () => Promise<T & StreamRenderSpanResult>,
): Promise<T & StreamRenderSpanResult> {
  return withSpan(
    streamTracer,
    'stream.render',
    async (span) => {
      span.setAttributes({
        'stream.route_pattern': input.routePattern,
        'stream.suspense_boundary_count': input.suspenseBoundaryCount,
        'stream.layer_count': input.streamLayerCount,
      });

      try {
        const result = await run();

        span.setAttributes({
          'stream.duration_ms': result.durationMs,
          'stream.error_count': result.errorCount,
        } as Attributes);

        span.addEvent('stream.render.complete', {
          'stream.route_pattern': input.routePattern,
          'stream.duration_ms': result.durationMs,
          'stream.error_count': result.errorCount,
        });

        return result;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        span.recordException(
          error instanceof Error ? error : new Error(message),
        );
        span.setAttributes({
          'stream.error': true,
          'stream.error.message': message,
        } as Attributes);
        throw error;
      }
    },
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'stream.route_pattern': input.routePattern,
      },
    },
  );
}
