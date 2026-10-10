/**
 * Tracing and audit-outcome helpers shared by the v1 auth handlers.
 *
 * @module
 */

import {
  authErrorCodeForReason,
  type AuthOperationInput,
  type AuthOperationRecorder,
  authOutcomeForReason,
  type AuthTelemetryOperation,
  createAuthTelemetry,
} from '@netscript/plugin-auth-core/telemetry';
import type { AuthBackendPort } from '@netscript/plugin-auth-core/ports';
import { type Context, getParentContextFromHeaders } from '@netscript/telemetry/context';
import type { AuthServiceContext } from './v1-types.ts';

const FALLBACK_AUTH_TELEMETRY = createAuthTelemetry({ enabled: false });

/** Runs one auth operation inside its span, parented to the request's trace headers. */
export async function traceAuth<T>(
  context: AuthServiceContext,
  operation: AuthTelemetryOperation,
  backend: AuthBackendPort,
  providerId: string | undefined,
  sessionId: string | undefined,
  run: (audit: AuthOperationRecorder) => Promise<T>,
): Promise<T> {
  const telemetry = context.telemetry ?? FALLBACK_AUTH_TELEMETRY;
  const input: AuthOperationInput = {
    operation,
    backend: backend.name,
    method: context.request?.method ?? 'RPC',
    providerId,
    sessionId,
    parentContext: parentContextFromTraceHeaders(context.traceHeaders),
  };
  return await telemetry.traceOperation(input, run);
}

function parentContextFromTraceHeaders(
  traceHeaders: AuthServiceContext['traceHeaders'],
): Context | undefined {
  const traceparent = traceHeaders?.traceparent;
  const tracestate = traceHeaders?.tracestate;
  if (!traceparent && !tracestate) {
    return undefined;
  }
  const headers: Record<string, string> = {};
  if (traceparent) headers.traceparent = traceparent;
  if (tracestate) headers.tracestate = tracestate;
  return getParentContextFromHeaders(headers);
}

/** Marks the operation outcome derived from a failure reason. */
export async function recordAuthFailure(
  audit: AuthOperationRecorder,
  reason: string,
): Promise<void> {
  await audit.setOutcome({
    outcome: authOutcomeForReason(reason),
    errorCode: authErrorCodeForReason(reason),
  });
}
