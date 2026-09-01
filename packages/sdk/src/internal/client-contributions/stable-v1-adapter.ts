/**
 * Private stable-oRPC-v1 adapter for SDK client contribution epochs.
 *
 * @module
 */

import { AsyncIteratorClass, getEventMeta } from '@orpc/client';
import { isContractProcedure } from '@orpc/contract';
import type { NetScriptProcedureMeta } from '@netscript/contracts';
import type { SdkClientTransportDescriptor } from '../../ports/sdk-client-contribution.ts';
import type { ClientLinkCallOptions, ClientLinkPort } from '../../ports/client-link-factory.ts';
import type { ServiceClientContext } from '../../ports/service-client.ts';
import type {
  ClientTransportPolicyPort,
  PreparedOutboundHeadersPort,
  PreparedSdkClientCall,
  ProcedureMetadataPort,
  SdkClientLogicalCall,
} from './adapter-ports.ts';

/** Package-private transport-context key carrying only an already prepared call. */
export const stableV1PreparedCall: unique symbol = Symbol('netscript.sdk.prepared-call');

export type StableV1TransportContext<TContext extends object> =
  & ServiceClientContext
  & TContext
  & {
    readonly [stableV1PreparedCall]?: PreparedSdkClientCall<TContext>;
  };

interface RetryState {
  readonly maxAttempts: number;
  attemptIndex: number;
  lastEventRetry?: number;
}

/** Inputs needed to compose the private stable-v1 logical-call wrapper. */
export interface StableV1ClientLinkOptions {
  readonly contract: object;
  readonly link: ClientLinkPort<
    StableV1TransportContext<object>,
    PreparedSdkClientCall<object>
  >;
  readonly preparation: PreparedOutboundHeadersPort;
  readonly resolveTransport: () => SdkClientTransportDescriptor;
  readonly hasContributions: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isAsyncIterator(value: unknown): value is AsyncIteratorObject<unknown> {
  if (!isRecord(value)) return false;
  const candidate: {
    readonly next?: unknown;
    readonly [Symbol.asyncIterator]?: unknown;
  } = value;
  return typeof candidate.next === 'function' &&
    typeof candidate[Symbol.asyncIterator] === 'function';
}

function resolveProcedureNode(contract: object, path: readonly string[]): unknown {
  let node: unknown = contract;
  for (const segment of path) {
    if (!isRecord(node) || !(segment in node)) {
      throw new TypeError(`Service client procedure does not exist: ${path.join('.')}`);
    }
    node = node[segment];
  }
  return node;
}

function normalizeProcedureMeta(value: unknown): Readonly<NetScriptProcedureMeta> {
  if (!isRecord(value)) return Object.freeze({});

  let access: NetScriptProcedureMeta['access'];
  if (isRecord(value.access)) {
    const authentication = value.access.authentication;
    if (
      authentication === 'none' ||
      authentication === 'optional' ||
      authentication === 'required'
    ) {
      access = Object.freeze({ authentication });
    }
  }

  let policy: NetScriptProcedureMeta['policy'];
  if (isRecord(value.policy)) {
    const cache = value.policy.cache;
    if (cache === 'no-store' || cache === 'default' || cache === 'force-cache') {
      policy = Object.freeze({ cache });
    }
  }

  return Object.freeze({
    ...(access === undefined ? {} : { access }),
    ...(policy === undefined ? {} : { policy }),
  });
}

/** Create the sole stable-v1 translator for upstream procedure metadata. */
export function createStableV1ProcedureMetadataPort(): ProcedureMetadataPort {
  return {
    describe(procedureNode, procedurePath) {
      if (!isContractProcedure(procedureNode)) {
        throw new TypeError(`Service client path is not a procedure: ${procedurePath.join('.')}`);
      }
      return Object.freeze({
        path: Object.freeze([...procedurePath]),
        meta: normalizeProcedureMeta(procedureNode['~orpc'].meta),
      });
    },
  };
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

async function resolveRetryCount(
  retry: ServiceClientContext['retry'],
): Promise<number> {
  const value = typeof retry === 'function' ? await retry(0) : await retry;
  if (value === Number.POSITIVE_INFINITY) return value;
  return Math.max(0, Number.isFinite(value) ? Math.floor(value ?? 0) : 0);
}

async function waitForRetry(
  context: Readonly<ServiceClientContext>,
  state: RetryState,
  error: unknown,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) throw abortReason(signal);
  if (state.attemptIndex >= state.maxAttempts) throw error;

  const shouldRetry = typeof context.shouldRetry === 'function'
    ? await context.shouldRetry(state.attemptIndex, error)
    : await context.shouldRetry ?? true;
  if (!shouldRetry) throw error;

  await context.onRetry?.(state.attemptIndex, error);
  const delay = typeof context.retryDelay === 'function'
    ? await context.retryDelay(state.attemptIndex, error)
    : await context.retryDelay ?? state.lastEventRetry ?? 2_000;
  state.attemptIndex += 1;
  if (delay <= 0) return;

  await new Promise<void>((resolve, reject) => {
    const finish = (): void => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };
    const timer = setTimeout(finish, delay);
    const onAbort = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(signal === undefined ? error : abortReason(signal));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    Promise.resolve().then(() => {
      if (signal?.aborted) onAbort();
    });
  });
}

function createAttemptContext<TContext extends object>(
  context: Readonly<ServiceClientContext & TContext>,
  preparedCall: PreparedSdkClientCall<TContext>,
): StableV1TransportContext<TContext> {
  const attemptContext = {
    ...context,
    retry: 0,
    [stableV1PreparedCall]: preparedCall,
  };
  return attemptContext;
}

function createTransportPolicy(
  link: ClientLinkPort<
    StableV1TransportContext<object>,
    PreparedSdkClientCall<object>
  >,
  hasContributions: boolean,
  lastEventId: string | undefined,
  state: RetryState,
): ClientTransportPolicyPort {
  return {
    async dispatch<TOutput, TCallContext extends object>(
      preparedCall: PreparedSdkClientCall<TCallContext>,
    ): Promise<TOutput> {
      const call: PreparedSdkClientCall<object> = preparedCall;
      const baseOptions: ClientLinkCallOptions<
        StableV1TransportContext<object>,
        PreparedSdkClientCall<object>
      > = {
        signal: call.call.signal,
        lastEventId,
        context: hasContributions
          ? createAttemptContext(call.call.context, call)
          : call.call.context,
        preparedCall: call,
      };

      while (true) {
        try {
          return await link.call(
            call.call.procedurePath,
            call.call.input,
            baseOptions,
          ) as TOutput;
        } catch (error) {
          if (!hasContributions) throw error;
          await waitForRetry(call.call.context, state, error, call.call.signal);
        }
      }
    },
  };
}

/** Create the stable-v1 link that makes preparation an outer logical-call epoch. */
export function createStableV1ClientLink<TContext extends object = object>(
  options: StableV1ClientLinkOptions,
): ClientLinkPort<ServiceClientContext & TContext> {
  return {
    async call(path, input, callOptions): Promise<unknown> {
      const signal = callOptions.signal ?? callOptions.context.signal;
      if (signal?.aborted) throw abortReason(signal);
      const state: RetryState = {
        maxAttempts: options.hasContributions
          ? await resolveRetryCount(callOptions.context.retry)
          : 0,
        attemptIndex: 0,
      };

      const startEpoch = async (lastEventId?: string): Promise<unknown> => {
        if (signal?.aborted) throw abortReason(signal);
        const logicalCall: SdkClientLogicalCall<TContext> = Object.freeze({
          context: callOptions.context,
          procedurePath: Object.freeze([...path]),
          procedureNode: resolveProcedureNode(options.contract, path),
          transport: options.resolveTransport(),
          input,
          signal,
        });
        const prepared = await options.preparation.prepare(logicalCall);
        return await createTransportPolicy(
          options.link,
          options.hasContributions,
          lastEventId,
          state,
        ).dispatch(prepared);
      };

      const output = await startEpoch(callOptions.lastEventId);
      if (!options.hasContributions || !isAsyncIterator(output)) return output;

      let current = output;
      let lastEventId = callOptions.lastEventId;
      return new AsyncIteratorClass<unknown>(
        async () => {
          while (true) {
            try {
              const item = await current.next();
              const meta = getEventMeta(item.value);
              lastEventId = meta?.id ?? lastEventId;
              state.lastEventRetry = meta?.retry ?? state.lastEventRetry;
              return item;
            } catch (error) {
              const meta = getEventMeta(error);
              lastEventId = meta?.id ?? lastEventId;
              state.lastEventRetry = meta?.retry ?? state.lastEventRetry;
              await waitForRetry(callOptions.context, state, error, signal);
              const reconnected = await startEpoch(lastEventId);
              if (!isAsyncIterator(reconnected)) {
                throw new TypeError('Stable-v1 stream reconnect did not return an async iterator');
              }
              current = reconnected;
            }
          }
        },
        async () => {
          await current.return?.();
        },
      );
    },
  };
}
