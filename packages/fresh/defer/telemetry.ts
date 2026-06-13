import { type Attributes, SpanKind } from '@netscript/telemetry/tracer';
import { emitFreshError, withFreshSpan } from '../_internal/telemetry.ts';

/** Result metrics captured by a defer prewarm dispatch. */
export interface DeferPrewarmResult {
  /** HTTP response status returned by the prewarm action. */
  status: number;
  /** Whether the prewarm action completed successfully. */
  ok: boolean;
  /** Total prewarm dispatch duration in milliseconds. */
  durationMs: number;
}

/** Input attributes used by a defer prewarm dispatch span. */
export interface DeferPrewarmSpanInput {
  /** Defer region name being prewarmed. */
  regionName: string;
  /** Reason the prewarm operation was scheduled. */
  reason: 'stale' | 'miss';
  /** Action URL submitted for prewarm. */
  actionUrl: string;
  /** Partial URL refreshed by the prewarm. */
  partialUrl: string;
}

/** Emit a span that wraps a defer prewarm dispatch operation. */
export async function emitDeferPrewarmDispatchSpan<T extends DeferPrewarmResult>(
  input: DeferPrewarmSpanInput,
  run: () => Promise<T>,
): Promise<T> {
  return await withFreshSpan(
    {
      scope: 'defer',
      name: 'defer.prewarm.dispatch',
      operation: 'defer.prewarm',
      kind: SpanKind.INTERNAL,
      attributes: {
        'defer.region.name': input.regionName,
        'defer.reason': input.reason,
        'defer.action_url': input.actionUrl,
        'defer.partial_url': input.partialUrl,
      },
    },
    async (span) => {
      try {
        const result = await run();
        const completeAttributes: Attributes = {
          'http.response.status_code': result.status,
          'defer.region.name': input.regionName,
          'defer.reason': input.reason,
          'defer.partial_url': input.partialUrl,
          'defer.prewarm.ok': result.ok,
          'defer.partial.complete_ms': result.durationMs,
          'netscript.operation': 'defer.prewarm',
        };

        span.setAttributes(completeAttributes);
        span.addEvent('defer.prewarm.complete', completeAttributes);
        return result;
      } catch (error: unknown) {
        emitFreshError(span, error, {
          'defer.region.name': input.regionName,
          'defer.reason': input.reason,
          'defer.partial_url': input.partialUrl,
          'defer.prewarm.ok': false,
          'netscript.operation': 'defer.prewarm',
        });
        throw error;
      }
    },
  );
}

/** Input attributes used by a defer cache-read span. */
export interface DeferCacheReadSpanInput {
  /** Defer region name being read from cache. */
  regionName: string;
  /** Span attributes for cache-read state. */
  attributes: Attributes;
  /** Event attributes for cache-read completion. */
  eventAttributes: Attributes;
}

/** Emit a span for reading a defer region from cache. */
export function emitDeferCacheReadSpan(input: DeferCacheReadSpanInput): Promise<void> {
  return withFreshSpan(
    {
      scope: 'defer',
      name: 'defer.cache.read',
      operation: 'defer.cache.read',
      kind: SpanKind.INTERNAL,
      attributes: {
        'defer.region.name': input.regionName,
        'netscript.operation': 'defer.cache.read',
      },
    },
    (span) => {
      const attributes = {
        ...input.attributes,
        'netscript.operation': 'defer.cache.read',
      };
      span.setAttributes(attributes);
      span.addEvent('defer.cache.read.complete', {
        ...input.eventAttributes,
        'netscript.operation': 'defer.cache.read',
      });
    },
  );
}

/** Emit a span for a client-side defer decision. */
export function emitDeferClientDecisionSpan(attributes: Attributes): Promise<void> {
  return withFreshSpan(
    {
      scope: 'defer',
      name: 'defer.client.decision',
      operation: 'defer.client.decision',
      kind: SpanKind.INTERNAL,
      attributes: {
        ...attributes,
        'netscript.operation': 'defer.client.decision',
      },
    },
    (span) => {
      const eventAttributes = {
        ...attributes,
        'netscript.operation': 'defer.client.decision',
      };
      span.setAttributes(eventAttributes);
      span.addEvent('defer.client.lifecycle', eventAttributes);
    },
  );
}

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

/** Emit an OpenTelemetry span that wraps a streaming SSR render. */
export function emitStreamRenderSpan<T>(
  input: StreamRenderSpanInput,
  run: () => Promise<T & StreamRenderSpanResult>,
): Promise<T & StreamRenderSpanResult> {
  return withFreshSpan(
    {
      scope: 'stream',
      name: 'stream.render',
      operation: 'stream.render',
      kind: SpanKind.INTERNAL,
      attributes: {
        'stream.route_pattern': input.routePattern,
        'netscript.operation': 'stream.render',
      },
    },
    async (span) => {
      span.setAttributes({
        'stream.route_pattern': input.routePattern,
        'stream.suspense_boundary_count': input.suspenseBoundaryCount,
        'stream.layer_count': input.streamLayerCount,
        'netscript.operation': 'stream.render',
      });

      try {
        const result = await run();
        const completeAttributes: Attributes = {
          'stream.route_pattern': input.routePattern,
          'stream.duration_ms': result.durationMs,
          'stream.error_count': result.errorCount,
          'netscript.operation': 'stream.render',
        };

        span.setAttributes(completeAttributes);
        span.addEvent('stream.render.complete', completeAttributes);
        return result;
      } catch (error: unknown) {
        emitFreshError(span, error, {
          'stream.error': true,
          'stream.route_pattern': input.routePattern,
          'netscript.operation': 'stream.render',
        });
        throw error;
      }
    },
  );
}
