import { getParentContextFromHeaders, injectContext } from '@netscript/telemetry';
import { withContextAsync } from '@netscript/telemetry/context';
import type { CommandTelemetryStart } from '../domain/execution.ts';
import type { CommandTelemetrySpan } from '../ports/executor-ports.ts';
import type { CommandOutboxDelivery, CommandRelayTelemetryPort } from './relay-ports.ts';
import { commandTraceContext } from '../application/command-identity.ts';

const silent: CommandTelemetrySpan = Object.freeze({ finish() {} });
/** Observer errors never change the once-only operation's result or error identity. */
export async function observeRelay<T>(
  telemetry: CommandRelayTelemetryPort | undefined,
  method: 'traceRelay' | 'tracePublish',
  start: CommandTelemetryStart,
  operation: () => Promise<T>,
  success: (result: T) => boolean,
): Promise<T> {
  let pending: Promise<T> | undefined;
  function invoke(span: CommandTelemetrySpan = silent): Promise<T> {
    if (!pending) {
      pending = (async () => {
        let applied = false;
        try {
          const result = await operation();
          applied = success(result);
          return result;
        } finally {
          try {
            span.finish({
              outcome: applied ? 'applied' : 'failed',
              idempotency: 'claimed',
              auditCount: 0,
              outboxCount: applied ? 1 : 0,
              ...(applied ? {} : { errorType: 'store_failure' }),
            });
          } catch { /* Best-effort observer. */ }
        }
      })();
    }
    return pending;
  }
  try {
    if (telemetry) await telemetry[method](start, invoke);
  } catch { /* The operation owns its result. */ }
  return await (pending ?? invoke());
}
/** Restore the validated persisted parent for deferred publication, without a new span by default. */
export async function withRelayParent<T>(
  delivery: CommandOutboxDelivery,
  operation: () => Promise<T>,
): Promise<T> {
  let called: Promise<T> | undefined;
  const invoke = () => called ??= operation();
  try {
    if (delivery.trace) {
      return await withContextAsync(getParentContextFromHeaders({ ...delivery.trace }), invoke);
    }
  } catch {
    if (called) return await called;
  }
  return await invoke();
}
/** Inject the active producer context, retaining the original when observers are absent. */
export function relayPublicationContext(
  delivery: CommandOutboxDelivery,
  observed: boolean,
): CommandOutboxDelivery {
  if (observed) {
    try {
      const headers = injectContext();
      if (headers.traceparent) {
        return Object.freeze({
          ...delivery,
          trace: commandTraceContext({
            traceparent: headers.traceparent,
            ...(headers.tracestate === undefined ? {} : { tracestate: headers.tracestate }),
          }),
        });
      }
    } catch { /* Propagation is best effort; valid original context remains. */ }
  }
  return delivery;
}
