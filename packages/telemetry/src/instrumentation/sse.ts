/**
 * SSE (Server-Sent Events) Instrumentation
 *
 * Provides tracing for SSE connections and events.
 * Enables linking SSE events to job executions for full distributed tracing.
 *
 * @module
 */

import {
  addSpanEvent,
  type Attributes,
  type Context,
  createSpan,
  getActiveSpan,
  getSSETracer,
  setSpanError,
  setSpanOk,
  type Span,
  SpanKind,
  withSpan,
} from '../core/mod.ts';
import type { SerializedTraceContext } from '../context/mod.ts';
import { SpanNames, SSEAttributes } from '../attributes/mod.ts';

// ============================================================================
// TYPES
// ============================================================================

/**
 * SSE connection context for tracing
 */
export interface SSEConnectionContext {
  /** Unique client connection ID */
  clientId: string;

  /** Remote address if available */
  remoteAddr?: string;

  /** User agent if available */
  userAgent?: string;

  /** Keys being watched */
  watchKeys?: string[];

  /** Connection start time */
  startTime: Date;
}

/**
 * SSE event context for tracing
 */
export interface SSEEventContext {
  /** Event type (e.g., 'execution-update', 'jobs', 'connected') */
  eventType: string;

  /** Size of event data in bytes */
  dataSize?: number;

  /** Related job ID if applicable */
  jobId?: string;

  /** Related execution ID if applicable */
  executionId?: string;

  /** Trace context from the related operation (e.g., job completion) */
  relatedTraceContext?: SerializedTraceContext;
}

/**
 * Traced SSE connection wrapper
 */
export interface TracedSSEConnection {
  /** Connection span */
  span: Span;

  /** Client ID */
  clientId: string;

  /** Number of events sent */
  eventsSent: number;

  /** Record an event being sent */
  recordEvent(event: SSEEventContext): void;

  /** Record an error */
  recordError(error: Error | string): void;

  /** Close the connection and end the span */
  close(): void;
}

/**
 * Options for creating a traced SSE connection
 */
export interface TracedSSEOptions {
  /** Parent context (e.g., from incoming HTTP request) */
  parentContext?: Context;

  /** Additional attributes */
  attributes?: Attributes;
}

// ============================================================================
// SSE CONNECTION TRACING
// ============================================================================

/**
 * Start a traced SSE connection.
 *
 * Creates a long-running span that tracks the entire SSE connection lifecycle.
 *
 * @param context - Connection context
 * @param options - Tracing options
 * @returns Traced connection wrapper
 *
 * @example
 * ```ts
 * const connection = startSSEConnection({
 *   clientId: crypto.randomUUID(),
 *   watchKeys: ['executions'],
 *   startTime: new Date(),
 * });
 *
 * // Send events
 * connection.recordEvent({ eventType: 'connected' });
 * connection.recordEvent({ eventType: 'execution-update', jobId: 'my-job' });
 *
 * // On disconnect
 * connection.close();
 * ```
 */
export function startSSEConnection(
  context: SSEConnectionContext,
  options: TracedSSEOptions = {},
): TracedSSEConnection {
  const tracer = getSSETracer();

  // Build initial attributes
  const attributes: Attributes = {
    [SSEAttributes.SSE_CLIENT_ID]: context.clientId,
    [SSEAttributes.SSE_EVENTS_SENT]: 0,
  };

  if (context.remoteAddr) {
    attributes['client.address'] = context.remoteAddr;
  }
  if (context.userAgent) {
    attributes['user_agent.original'] = context.userAgent;
  }
  if (context.watchKeys && context.watchKeys.length > 0) {
    attributes[SSEAttributes.SSE_WATCH_KEYS] = context.watchKeys.join(',');
  }
  if (options.attributes) {
    Object.assign(attributes, options.attributes);
  }

  // Create the connection span
  const span = createSpan(tracer, SpanNames.SSE_CONNECTION, {
    kind: SpanKind.SERVER,
    attributes,
    parentContext: options.parentContext,
  });

  addSpanEvent(span, 'sse.connected', {
    [SSEAttributes.SSE_CLIENT_ID]: context.clientId,
  });

  let eventsSent = 0;
  let closed = false;

  return {
    span,
    clientId: context.clientId,
    get eventsSent() {
      return eventsSent;
    },

    recordEvent(event: SSEEventContext): void {
      if (closed) return;

      eventsSent++;

      const eventAttrs: Attributes = {
        [SSEAttributes.SSE_EVENT_TYPE]: event.eventType,
        [SSEAttributes.SSE_EVENTS_SENT]: eventsSent,
      };

      if (event.dataSize !== undefined) {
        eventAttrs['sse.event.data_size'] = event.dataSize;
      }
      if (event.jobId) {
        eventAttrs['job.id'] = event.jobId;
      }
      if (event.executionId) {
        eventAttrs['execution.id'] = event.executionId;
      }

      // If we have related trace context, add it as a link or attribute
      if (event.relatedTraceContext) {
        eventAttrs['sse.event.related_trace'] = event.relatedTraceContext.traceparent;
      }

      addSpanEvent(span, `sse.event.${event.eventType}`, eventAttrs);

      // Update span attribute with total events sent
      span.setAttribute(SSEAttributes.SSE_EVENTS_SENT, eventsSent);
    },

    recordError(error: Error | string): void {
      if (closed) return;

      const message = error instanceof Error ? error.message : error;
      setSpanError(span, message, error instanceof Error ? error : undefined);

      addSpanEvent(span, 'sse.error', {
        'error.message': message,
      });
    },

    close(): void {
      if (closed) return;
      closed = true;

      const durationMs = Date.now() - context.startTime.getTime();

      span.setAttribute(SSEAttributes.SSE_DURATION_MS, durationMs);
      span.setAttribute(SSEAttributes.SSE_EVENTS_SENT, eventsSent);

      addSpanEvent(span, 'sse.disconnected', {
        [SSEAttributes.SSE_DURATION_MS]: durationMs,
        [SSEAttributes.SSE_EVENTS_SENT]: eventsSent,
      });

      setSpanOk(span);
      span.end();
    },
  };
}

// ============================================================================
// SSE EVENT TRACING
// ============================================================================

/**
 * Create a span for a single SSE event.
 *
 * Use this for detailed tracing of individual events.
 *
 * @param eventType - Type of SSE event
 * @param options - Event options
 * @returns Span for the event
 */
export function createSSEEventSpan(
  eventType: string,
  options: {
    clientId?: string;
    jobId?: string;
    executionId?: string;
    dataSize?: number;
    parentContext?: Context;
  } = {},
): Span {
  const tracer = getSSETracer();

  const attributes: Attributes = {
    [SSEAttributes.SSE_EVENT_TYPE]: eventType,
  };

  if (options.clientId) {
    attributes[SSEAttributes.SSE_CLIENT_ID] = options.clientId;
  }
  if (options.jobId) {
    attributes['job.id'] = options.jobId;
  }
  if (options.executionId) {
    attributes['execution.id'] = options.executionId;
  }
  if (options.dataSize !== undefined) {
    attributes['sse.event.data_size'] = options.dataSize;
  }

  return createSpan(tracer, SpanNames.SSE_EVENT, {
    kind: SpanKind.INTERNAL,
    attributes,
    parentContext: options.parentContext,
  });
}

/**
 * Trace sending an SSE event.
 *
 * @param eventType - Event type
 * @param fn - Function that sends the event
 * @param options - Tracing options
 */
export async function traceSSEEvent<T>(
  eventType: string,
  fn: (span: Span) => Promise<T> | T,
  options: {
    clientId?: string;
    jobId?: string;
    executionId?: string;
    dataSize?: number;
    parentContext?: Context;
  } = {},
): Promise<T> {
  const tracer = getSSETracer();

  return await withSpan(
    tracer,
    SpanNames.SSE_EVENT,
    async (span) => {
      span.setAttribute(SSEAttributes.SSE_EVENT_TYPE, eventType);

      if (options.clientId) {
        span.setAttribute(SSEAttributes.SSE_CLIENT_ID, options.clientId);
      }
      if (options.jobId) {
        span.setAttribute('job.id', options.jobId);
      }
      if (options.executionId) {
        span.setAttribute('execution.id', options.executionId);
      }

      const result = await fn(span);

      if (options.dataSize !== undefined) {
        span.setAttribute('sse.event.data_size', options.dataSize);
      }

      return result;
    },
    {
      kind: SpanKind.INTERNAL,
      parentContext: options.parentContext,
    },
  );
}

// ============================================================================
// SSE SUBSCRIPTION TRACING
// ============================================================================

/**
 * Create a span for SSE subscription setup.
 *
 * @param channel - Channel being subscribed to
 * @param clientId - Client ID
 * @returns Span for the subscription
 */
export function createSSESubscribeSpan(channel: string, clientId?: string): Span {
  const tracer = getSSETracer();

  const attributes: Attributes = {
    'sse.subscription.channel': channel,
  };

  if (clientId) {
    attributes[SSEAttributes.SSE_CLIENT_ID] = clientId;
  }

  return createSpan(tracer, SpanNames.SSE_SUBSCRIBE, {
    kind: SpanKind.INTERNAL,
    attributes,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract trace context from an execution record or job completion event.
 *
 * Use this to link SSE events to the original job execution.
 *
 * @param record - Record that may contain trace context
 * @returns Serialized trace context or null
 */
export function extractTraceContextFromRecord(
  record:
    | {
      traceparent?: string;
      tracestate?: string;
      correlationId?: string;
    }
    | null
    | undefined,
): SerializedTraceContext | null {
  if (!record) return null;

  if (record.traceparent) {
    return {
      traceparent: record.traceparent,
      tracestate: record.tracestate,
    };
  }

  return null;
}

/**
 * Create a span link attributes for linking SSE event to a job execution.
 *
 * @param traceContext - Trace context from the job
 * @returns Attributes for span link
 */
export function createJobLinkAttributes(
  traceContext: SerializedTraceContext,
): Attributes {
  return {
    'link.relationship': 'job_execution',
    'link.traceparent': traceContext.traceparent,
  };
}

/**
 * Generate a unique SSE client ID.
 */
export function generateSSEClientId(): string {
  return `sse-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Record SSE metrics in the current span.
 *
 * @param metrics - SSE metrics
 */
export function recordSSEMetrics(metrics: {
  activeConnections?: number;
  totalEventsSent?: number;
  avgEventsPerConnection?: number;
}): void {
  const span = getActiveSpan();
  if (!span) return;

  if (metrics.activeConnections !== undefined) {
    span.setAttribute('sse.metrics.active_connections', metrics.activeConnections);
  }
  if (metrics.totalEventsSent !== undefined) {
    span.setAttribute('sse.metrics.total_events_sent', metrics.totalEventsSent);
  }
  if (metrics.avgEventsPerConnection !== undefined) {
    span.setAttribute('sse.metrics.avg_events_per_connection', metrics.avgEventsPerConnection);
  }
}
