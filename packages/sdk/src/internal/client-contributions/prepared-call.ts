/**
 * Immutable SDK client-call preparation and header composition.
 *
 * @module
 */

import type {
  SdkClientPrepareOptions,
  SdkClientProcedureDescriptor,
} from '../../ports/sdk-client-contribution.ts';
import type {
  PreparedOutboundHeadersPort,
  PreparedSdkClientCall,
  ProcedureMetadataPort,
  SdkClientLogicalCall,
} from './adapter-ports.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function contributionContextKeys(contribution: object): readonly string[] {
  if (!('context' in contribution) || !isRecord(contribution.context)) {
    throw new TypeError('SDK client contribution context must be a record');
  }
  return Object.keys(contribution.context);
}

function projectContributionContext(
  contributions: readonly object[],
  context: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const projection: Record<string, unknown> = {};
  for (const contribution of contributions) {
    for (const key of contributionContextKeys(contribution)) {
      if (key in context) projection[key] = context[key];
    }
  }
  return Object.freeze(projection);
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

async function awaitWithSignal(value: unknown, signal?: AbortSignal): Promise<unknown> {
  if (signal === undefined) return await value;
  if (signal.aborted) throw abortReason(signal);

  return await new Promise((resolve, reject) => {
    const onAbort = (): void => reject(abortReason(signal));
    signal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve(value).then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', onAbort);
    });
  });
}

async function invokeContribution(
  contribution: object,
  options: SdkClientPrepareOptions<Record<string, unknown>>,
): Promise<unknown> {
  if (!('prepare' in contribution) || typeof contribution.prepare !== 'function') {
    throw new TypeError('SDK client contribution prepare must be a function');
  }
  return await awaitWithSignal(contribution.prepare(options), options.signal);
}

function mergePatchHeaders(target: Record<string, string>, patch: unknown): void {
  if (!isRecord(patch)) {
    throw new TypeError('SDK client contribution patch must be a record');
  }
  if (patch.headers === undefined) return;
  if (!isRecord(patch.headers)) {
    throw new TypeError('SDK client contribution headers must be a record');
  }

  for (const [name, value] of Object.entries(patch.headers)) {
    if (typeof value !== 'string') {
      throw new TypeError('SDK client contribution header values must be strings');
    }
    target[name] = value;
  }
}

function freezeProcedure(
  procedure: SdkClientProcedureDescriptor,
): SdkClientProcedureDescriptor {
  return Object.freeze({
    path: Object.freeze([...procedure.path]),
    meta: Object.freeze({ ...procedure.meta }),
  });
}

/** Create the private preparation port for one validated contribution tuple. */
export function createPreparedOutboundHeadersPort(
  contributions: readonly object[],
  procedureMetadata: ProcedureMetadataPort,
): PreparedOutboundHeadersPort {
  const tuple = Object.freeze([...contributions]);

  return {
    async prepare<TContext extends object>(
      call: SdkClientLogicalCall<TContext>,
    ): Promise<PreparedSdkClientCall<TContext>> {
      if (call.signal?.aborted) throw abortReason(call.signal);

      const procedure = freezeProcedure(
        procedureMetadata.describe(call.procedureNode, call.procedurePath),
      );
      const context = projectContributionContext(
        tuple,
        call.context as Readonly<Record<string, unknown>>,
      );
      const snapshot = Object.freeze({
        context,
        signal: call.signal,
        procedure,
        transport: call.transport,
        input: call.input,
      }) satisfies SdkClientPrepareOptions<Record<string, unknown>>;
      const values: Record<string, string> = {};

      for (const contribution of tuple) {
        if (call.signal?.aborted) throw abortReason(call.signal);
        mergePatchHeaders(values, await invokeContribution(contribution, snapshot));
      }

      const immutableCall = Object.freeze({
        ...call,
        procedurePath: Object.freeze([...call.procedurePath]),
      });
      const contributedHeaders = Object.freeze({
        values: Object.freeze({ ...values }),
      });
      return Object.freeze({
        call: immutableCall,
        procedure,
        contributedHeaders,
      });
    },
  };
}
