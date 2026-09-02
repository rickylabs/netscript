/**
 * NetScript-owned SDK transport policy resolution.
 *
 * @module
 */

import {
  type AnyContractRouter as ORPCAnyContractRouter,
  inferRPCMethodFromContractRouter,
  isContractProcedure,
} from '@orpc/contract';
import { createStableV1ProcedureMetadataPort } from './client-contributions/stable-v1-adapter.ts';
import type { SdkClientProcedureDescriptor } from '../ports/sdk-client-contribution.ts';
import type {
  ContractLike,
  SdkClientHttpMethod,
  SdkClientTransportPolicy,
  ServiceClientContext,
} from '../ports/service-client.ts';

/** Cache modes that procedure metadata may contribute to transport resolution. */
export type SdkClientPolicyCache = 'no-store' | 'default' | 'force-cache';

/** One immutable transport decision for a logical SDK call epoch. */
export interface ResolvedCallTransportPolicy {
  /** Normalized contract procedure shared with contribution preparation. */
  readonly procedure: SdkClientProcedureDescriptor;
  /** Final contract-derived or explicitly overridden HTTP method. */
  readonly method: SdkClientHttpMethod;
  /** Cache mode selected from call context, procedure metadata, or the default. */
  readonly cache: SdkClientPolicyCache;
}

/** One immutable cache-group descriptor consumed by the stable-v1 adapter. */
export interface ResolvedTransportCacheGroup<
  TCache extends 'force-cache' | 'default',
> {
  /** Cache group identity represented by this descriptor. */
  readonly cache: TCache;
  /** Return whether one resolved call belongs to this group. */
  readonly condition: (call: ResolvedCallTransportPolicy) => boolean;
  /** Stable-v1 interceptor context projected for the selected group. */
  readonly context: TCache extends 'force-cache' ? Readonly<{ cache: 'force-cache' }>
    : Readonly<Record<never, never>>;
}

/** Package-private transport policy consumed by every SDK client transport. */
export interface ResolvedTransportPolicy {
  /** Resolve one immutable decision for a logical call epoch. */
  readonly resolveCall: (
    path: readonly string[],
    input: unknown,
    context: Readonly<ServiceClientContext>,
  ) => ResolvedCallTransportPolicy;
  /** Project the final HTTP method for the stable-v1 codec. */
  readonly method: (call: ResolvedCallTransportPolicy) => SdkClientHttpMethod;
  /** Stable-v1 URL-overflow method owned by NetScript. */
  readonly fallbackMethod: 'POST';
  /** Stable-v1 maximum encoded GET URL length owned by NetScript. */
  readonly maxUrlLength: 2083;
  /** Return whether one resolved call may be deduplicated. */
  readonly dedupePredicate: (call: ResolvedCallTransportPolicy) => boolean;
  /** Ordered stable-v1 cache group descriptors. */
  readonly cacheGroups: readonly [
    ResolvedTransportCacheGroup<'force-cache'>,
    ResolvedTransportCacheGroup<'default'>,
  ];
}

const HTTP_METHODS: ReadonlySet<string> = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'TRACE',
  'CONNECT',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSdkClientHttpMethod(value: unknown): value is SdkClientHttpMethod {
  return typeof value === 'string' && HTTP_METHODS.has(value);
}

interface ValidatedTransportPolicy {
  readonly method?: (
    options: Parameters<NonNullable<SdkClientTransportPolicy['method']>>[0],
  ) => unknown;
}

function validateTransportPolicy(value: unknown): Readonly<ValidatedTransportPolicy> {
  if (value === undefined) return Object.freeze({});
  if (!isRecord(value) || Object.keys(value).some((key) => key !== 'method')) {
    throw new TypeError('SDK transportPolicy must contain only the optional method override');
  }
  const candidate = value.method;
  if (candidate !== undefined && typeof candidate !== 'function') {
    throw new TypeError('SDK transportPolicy.method must be a function');
  }
  const method = typeof candidate === 'function'
    ? (options: Parameters<NonNullable<SdkClientTransportPolicy['method']>>[0]): unknown =>
      Reflect.apply(candidate, value, [options])
    : undefined;
  return Object.freeze({ ...(method === undefined ? {} : { method }) });
}

function isOrpcContractRouter(value: unknown): value is ORPCAnyContractRouter {
  if (isContractProcedure(value)) return true;
  if (!isRecord(value) || '~orpc' in value) return false;
  const children = Object.values(value);
  return children.length > 0 && children.every(isOrpcContractRouter);
}

function resolveProcedureNode(contract: object, path: readonly string[]): unknown {
  let node: unknown = contract;
  for (const segment of path) {
    if (!isRecord(node) || !(segment in node)) {
      throw new TypeError(`Service client procedure does not exist: ${path.join('.')}`);
    }
    node = node[segment];
  }
  if (!isContractProcedure(node)) {
    throw new TypeError(`Service client path is not a procedure: ${path.join('.')}`);
  }
  return node;
}

function resolveCache(
  context: Readonly<ServiceClientContext>,
  procedure: SdkClientProcedureDescriptor,
): SdkClientPolicyCache {
  const explicit = context.cache;
  if (explicit === 'no-store' || explicit === 'default' || explicit === 'force-cache') {
    return explicit;
  }
  return procedure.meta.policy?.cache ?? 'default';
}

/** Resolve the single NetScript-owned transport policy for a service contract. */
export function resolveTransportPolicy<TContract extends ContractLike>(
  contract: TContract,
  options: Readonly<{
    readonly transportPolicy?: SdkClientTransportPolicy;
  }> = {},
): ResolvedTransportPolicy {
  if (!isOrpcContractRouter(contract)) {
    throw new TypeError('Service client contracts must contain oRPC contract procedures');
  }
  const configuredPolicy = validateTransportPolicy(options.transportPolicy);
  const describeProcedure = createStableV1ProcedureMetadataPort();
  const inferMethod = inferRPCMethodFromContractRouter(contract);

  const resolveCall = (
    path: readonly string[],
    input: unknown,
    context: Readonly<ServiceClientContext>,
  ): ResolvedCallTransportPolicy => {
    const procedureNode = resolveProcedureNode(contract, path);
    const procedure = describeProcedure.describe(procedureNode, path);
    const inferredMethod = inferMethod({}, path);
    const method = configuredPolicy.method?.(
      Object.freeze({ procedure, input, inferredMethod }),
    ) ?? inferredMethod;
    if (!isSdkClientHttpMethod(method)) {
      throw new TypeError(`SDK transportPolicy.method returned an invalid HTTP method: ${method}`);
    }
    return Object.freeze({
      procedure,
      method,
      cache: resolveCache(context, procedure),
    });
  };

  const forceCacheGroup: ResolvedTransportCacheGroup<'force-cache'> = Object.freeze({
    cache: 'force-cache',
    condition: (call: ResolvedCallTransportPolicy): boolean => call.cache === 'force-cache',
    context: Object.freeze({ cache: 'force-cache' }),
  });
  const defaultGroup: ResolvedTransportCacheGroup<'default'> = Object.freeze({
    cache: 'default',
    condition: (): boolean => true,
    context: Object.freeze({}),
  });
  const cacheGroups: readonly [
    ResolvedTransportCacheGroup<'force-cache'>,
    ResolvedTransportCacheGroup<'default'>,
  ] = Object.freeze([forceCacheGroup, defaultGroup]);

  return Object.freeze({
    resolveCall,
    method: (call: ResolvedCallTransportPolicy): SdkClientHttpMethod => call.method,
    fallbackMethod: 'POST',
    maxUrlLength: 2083,
    dedupePredicate: (call: ResolvedCallTransportPolicy): boolean => call.method === 'GET',
    cacheGroups,
  });
}
