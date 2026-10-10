import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import type { MessageContext } from '@netscript/queue';
import { getTraceContext } from '@netscript/telemetry/context';

/** W3C trace headers carried by a queued job or task message. */
export type MessageTraceHeaders = Record<string, string>;

/**
 * Correlation and trace options forwarded to a task executor.
 *
 * `runProcess` injects these as `CORRELATION_ID`, `TRACEPARENT`, and
 * `TRACESTATE` into the subprocess environment.
 */
export type SubprocessTraceOptions = Readonly<{
  /** Correlation identifier for the originating request or event. */
  correlationId?: string;
  /** W3C traceparent the subprocess continues from. */
  traceparent?: string;
  /** W3C tracestate paired with {@link SubprocessTraceOptions.traceparent}. */
  tracestate?: string;
}>;

/**
 * Collect trace headers from the delivery context and the message body.
 *
 * Message headers win over delivery headers; the message's top-level
 * `traceparent`/`tracestate` fields fill only what neither header set carries.
 */
export function getMessageTraceHeaders(
  message: JobMessage | TaskMessage,
  delivery?: Pick<MessageContext, 'headers'>,
): MessageTraceHeaders {
  const messageWithHeaders = message as typeof message & { headers?: Record<string, string> };

  const traceHeaders: MessageTraceHeaders = {
    ...(delivery?.headers ?? {}),
    ...(messageWithHeaders.headers ?? {}),
  };
  if (message.traceparent && !traceHeaders['traceparent']) {
    traceHeaders['traceparent'] = message.traceparent;
  }
  if (message.tracestate && !traceHeaders['tracestate']) {
    traceHeaders['tracestate'] = message.tracestate;
  }
  return traceHeaders;
}

/**
 * Resolve the trace headers a subprocess should continue from.
 *
 * The active span (the queue consumer or job execution span) is preferred so
 * the subprocess becomes its child; the message headers are the fallback when
 * no span is active.
 */
export function resolveSubprocessTraceHeaders(
  fallback: MessageTraceHeaders,
): MessageTraceHeaders {
  const active = getTraceContext();
  if (!active) return fallback;
  return {
    traceparent: active.traceparent,
    ...(active.tracestate ? { tracestate: active.tracestate } : {}),
  };
}

/** Build the executor options that carry correlation and trace context. */
export function toSubprocessTraceOptions(
  traceHeaders: MessageTraceHeaders,
  correlationId?: string,
): SubprocessTraceOptions {
  return {
    ...(correlationId ? { correlationId } : {}),
    ...(traceHeaders['traceparent'] ? { traceparent: traceHeaders['traceparent'] } : {}),
    ...(traceHeaders['tracestate'] ? { tracestate: traceHeaders['tracestate'] } : {}),
  };
}
