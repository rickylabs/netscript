import { getTracer, type Tracer, withSpan } from '@netscript/telemetry/tracer';
import type { WorkosWorkerFailure } from './workos-revocation-worker.ts';

/** Report only finite failure stages, never provider error text or caller credentials. */
export function createWorkosWorkerObserver(
  logger: unknown,
  tracer: Tracer = getTracer('@netscript/auth'),
): (stage: WorkosWorkerFailure) => Promise<void> {
  return async (stage) => {
    const message = 'WorkOS revocation worker retrying after failure.';
    const fields = { component: 'workos-revocation', stage };
    try {
      if (hasErrorLogger(logger)) logger.error(message, fields);
    } catch {
      // A failing log sink cannot stop revocation processing or its telemetry.
    }
    await withSpan(tracer, 'auth.workos.revocation.retry', (span) => {
      span.setAttributes(fields);
      // withSpan classifies thrown errors; this error contains only a fixed safe message.
      throw new Error(message);
    }).catch(() => {});
  };
}

function hasErrorLogger(value: unknown): value is {
  error(message: string, fields: Record<string, unknown>): void;
} {
  return typeof value === 'object' && value !== null &&
    'error' in value && typeof value.error === 'function';
}
