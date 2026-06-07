/**
 * oRPC Trace Context Helper
 *
 * Provides a minimal, typed API for handlers to interact with the current trace.
 * This is optional — most handlers don't need it, but it's available for custom events.
 *
 * @module
 */

import { type Attributes, trace } from '@opentelemetry/api';
import type { Span } from '../core/mod.ts';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Trace context interface for oRPC handlers.
 *
 * Provides a minimal, typed API for adding custom events and attributes
 * to the current span without needing to understand OpenTelemetry internals.
 */
export interface TraceContext {
  /**
   * Add a custom event to the current span.
   *
   * Events are timestamped markers that appear in the trace timeline.
   * Use them to mark significant points in your handler's execution.
   *
   * @param name - Event name (e.g., 'user.lookup.start', 'cache.hit')
   * @param attributes - Optional event attributes
   *
   * @example
   * ```ts
   * trace.addEvent('user.validation.complete', { validFields: 5 });
   * ```
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void;

  /**
   * Set custom attributes on the current span.
   *
   * Attributes are key-value pairs that provide context about the operation.
   * Use them for searchable/filterable metadata.
   *
   * @param attributes - Attributes to set
   *
   * @example
   * ```ts
   * trace.setAttributes({
   *   'user.role': 'admin',
   *   'request.source': 'mobile',
   * });
   * ```
   */
  setAttributes(attributes: Record<string, unknown>): void;

  /**
   * Get the current trace ID.
   *
   * Useful for correlating logs with traces or returning trace IDs to clients.
   *
   * @returns Trace ID string, or undefined if no active span
   *
   * @example
   * ```ts
   * const traceId = trace.getTraceId();
   * console.log(`[${traceId}] Processing request...`);
   * ```
   */
  getTraceId(): string | undefined;

  /**
   * Get the current span ID.
   *
   * @returns Span ID string, or undefined if no active span
   */
  getSpanId(): string | undefined;

  /**
   * Check if there is an active span.
   *
   * @returns true if there is an active span
   */
  isActive(): boolean;

  /**
   * Get the underlying OpenTelemetry span.
   *
   * For advanced use cases that need direct span access.
   * Prefer the helper methods above for most use cases.
   *
   * @returns The active Span, or undefined if none
   */
  getSpan(): Span | undefined;

  /**
   * Record an exception on the current span.
   *
   * This marks the span with error information without changing its status.
   * The TracingPlugin will set the error status automatically.
   *
   * @param error - The error to record
   */
  recordException(error: Error): void;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Create a TraceContext instance for use in oRPC handlers.
 *
 * This provides a simple, typed API for handlers that need custom tracing.
 * Most handlers won't need this — the TracingPlugin handles basic tracing automatically.
 *
 * @returns TraceContext instance
 *
 * @example
 * ```ts
 * // In an oRPC handler
 * getById: v1.users.getById.handler(async ({ input }) => {
 *   const trace = createTraceContext();
 *
 *   trace.addEvent('user.lookup.start', { userId: input.id });
 *   const user = await db.mssql.user.findUnique({ where: { id: input.id } });
 *   trace.addEvent('user.lookup.complete', { found: !!user });
 *
 *   if (!user) {
 *     trace.setAttributes({ 'user.notFound': true });
 *     throw new NotFoundError('User not found');
 *   }
 *
 *   return user;
 * }),
 * ```
 */
export function createTraceContext(): TraceContext {
  return {
    addEvent(name: string, attributes?: Record<string, unknown>): void {
      const span = trace.getActiveSpan();
      if (span) {
        span.addEvent(name, attributes as Attributes);
      }
    },

    setAttributes(attributes: Record<string, unknown>): void {
      const span = trace.getActiveSpan();
      if (span) {
        span.setAttributes(attributes as Attributes);
      }
    },

    getTraceId(): string | undefined {
      const span = trace.getActiveSpan();
      return span?.spanContext().traceId;
    },

    getSpanId(): string | undefined {
      const span = trace.getActiveSpan();
      return span?.spanContext().spanId;
    },

    isActive(): boolean {
      return trace.getActiveSpan() !== undefined;
    },

    getSpan(): Span | undefined {
      return trace.getActiveSpan() as Span | undefined;
    },

    recordException(error: Error): void {
      const span = trace.getActiveSpan();
      if (span) {
        span.recordException(error);
      }
    },
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get the current trace ID from the active span.
 *
 * Convenience function for logging correlation.
 *
 * @returns Trace ID string, or undefined if no active span
 *
 * @example
 * ```ts
 * import { getTraceId } from '@netscript/telemetry/orpc';
 *
 * console.log(`[trace:${getTraceId() ?? 'none'}] Processing request`);
 * ```
 */
export function getTraceId(): string | undefined {
  return trace.getActiveSpan()?.spanContext().traceId;
}

/**
 * Get the current span ID from the active span.
 *
 * @returns Span ID string, or undefined if no active span
 */
export function getSpanId(): string | undefined {
  return trace.getActiveSpan()?.spanContext().spanId;
}

/**
 * Add an event to the current span.
 *
 * Convenience function for quick event logging.
 *
 * @param name - Event name
 * @param attributes - Optional event attributes
 *
 * @example
 * ```ts
 * import { addEvent } from '@netscript/telemetry/orpc';
 *
 * addEvent('cache.miss', { key: 'user:123' });
 * ```
 */
export function addEvent(name: string, attributes?: Record<string, unknown>): void {
  const span = trace.getActiveSpan();
  span?.addEvent(name, attributes as Attributes);
}

/**
 * Set attributes on the current span.
 *
 * Convenience function for setting span attributes.
 *
 * @param attributes - Attributes to set
 *
 * @example
 * ```ts
 * import { setAttributes } from '@netscript/telemetry/orpc';
 *
 * setAttributes({ 'user.tier': 'premium', 'request.priority': 'high' });
 * ```
 */
export function setAttributes(attributes: Record<string, unknown>): void {
  const span = trace.getActiveSpan();
  span?.setAttributes(attributes as Attributes);
}
