import { type Attributes, getTracer, SpanKind, withSpan } from '@netscript/telemetry/tracer';

const deferTracer = getTracer('@netscript/fresh/defer');

export interface DeferPrewarmResult {
  status: number;
  ok: boolean;
  durationMs: number;
}

interface DeferPrewarmSpanInput {
  regionName: string;
  reason: 'stale' | 'miss';
  actionUrl: string;
  partialUrl: string;
}

export async function emitDeferPrewarmDispatchSpan<T extends DeferPrewarmResult>(
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

interface DeferCacheReadSpanInput {
  regionName: string;
  attributes: Attributes;
  eventAttributes: Attributes;
}

export function emitDeferCacheReadSpan(input: DeferCacheReadSpanInput): Promise<void> {
  return withSpan(
    deferTracer,
    'defer.cache.read',
    (span) => {
      span.setAttributes(input.attributes);
      span.addEvent('defer.cache.read.complete', input.eventAttributes);
    },
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'defer.region.name': input.regionName,
      },
    },
  );
}

export function emitDeferClientDecisionSpan(attributes: Attributes): Promise<void> {
  return withSpan(
    deferTracer,
    'defer.client.decision',
    (span) => {
      span.setAttributes(attributes);
      span.addEvent('defer.client.lifecycle', attributes);
    },
    {
      kind: SpanKind.INTERNAL,
      attributes,
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
