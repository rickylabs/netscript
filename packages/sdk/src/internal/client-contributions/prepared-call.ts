/**
 * Immutable SDK client-call preparation, validation, and cache partitioning.
 *
 * @module
 */

import { SdkClientContributionError } from '../../client/errors.ts';
import type { SdkClientContributionErrorCode } from '../../client/errors.ts';
import type {
  SdkClientCachePartitionOptions,
  SdkClientContributionId,
  SdkClientPrepareOptions,
  SdkClientProcedureDescriptor,
} from '../../ports/sdk-client-contribution.ts';
import type {
  PreparedOutboundHeadersPort,
  PreparedSdkClientCall,
  SdkClientLogicalCall,
} from './adapter-ports.ts';
import {
  getSdkClientContributionDiagnosticId,
  parseSdkClientContributionDiagnosticId,
} from './contribution-diagnostic-id.ts';

const CONTRIBUTION_FIELDS = new Set([
  'protocol',
  'id',
  'context',
  'headerKeys',
  'responseCache',
  'prepare',
]);
const PROTOCOL_FIELDS = new Set(['family', 'major']);
const PATCH_FIELDS = new Set(['headers']);
const PARTITIONED_CACHE_FIELDS = new Set(['mode', 'partition']);
const SIMPLE_CACHE_FIELDS = new Set(['mode']);
const RESERVED_CONTEXT_KEYS = new Set(
  'signal cache retry retryDelay shouldRetry onRetry traceHeaders'.split(' '),
);
const RESERVED_HEADERS = new Set(
  (
    'accept-charset accept-encoding access-control-request-headers ' +
    'access-control-request-method connection content-length content-type cookie cookie2 date dnt ' +
    'expect host keep-alive origin permissions-policy referer set-cookie te traceparent tracestate ' +
    'trailer transfer-encoding upgrade via x-http-method x-http-method-override x-method-override'
  ).split(' '),
);
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9a-z]+$/;
const PRINTABLE_ASCII_PATTERN = /^[\x20-\x7e]{1,64}$/;

type CacheMode = 'invariant' | 'partitioned' | 'direct-only';
type ContextMode = 'optional' | 'required';

/** Package-private validated contribution shape used by runtime adapters. */
export interface ValidatedSdkClientContribution {
  readonly protocol: Readonly<{ family: 'netscript.sdk-client'; major: 1 }>;
  readonly id: SdkClientContributionId;
  readonly context: Readonly<Record<string, ContextMode>>;
  readonly headerKeys: readonly string[];
  readonly responseCache: Readonly<{
    readonly mode: CacheMode;
    readonly partition?: (
      options: SdkClientCachePartitionOptions<Record<string, unknown>>,
    ) => unknown;
  }>;
  readonly prepare: (options: SdkClientPrepareOptions<Record<string, unknown>>) => unknown;
}

/** Canonical cache partition values derived from one contribution tuple. */
export interface SdkClientCachePartition {
  readonly pairs: readonly (readonly [SdkClientContributionId, string])[];
  readonly serverSuffix: readonly [] | readonly ['$netscript.sdk-context', string];
  readonly querySuffix: readonly unknown[];
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function fail(
  code: SdkClientContributionErrorCode,
  phase: 'construction' | 'partition' | 'preparation',
  fields: {
    readonly contributionId?: SdkClientContributionId;
    readonly conflictingContributionId?: SdkClientContributionId;
    readonly procedurePath?: string;
    readonly headerName?: string;
  } = {},
): never {
  throw new SdkClientContributionError({ code, phase, ...fields });
}

function hasExactFields(record: Record<string, unknown>, fields: ReadonlySet<string>): boolean {
  return Object.keys(record).every((key) => fields.has(key)) &&
    [...fields].every((key) => key in record);
}

function hasOnlyFields(record: Record<string, unknown>, fields: ReadonlySet<string>): boolean {
  return Object.keys(record).every((key) => fields.has(key));
}

function isForbiddenHeader(name: string): boolean {
  return RESERVED_HEADERS.has(name) || name.startsWith('proxy-') || name.startsWith('sec-');
}

function validatedContributionId(value: unknown): SdkClientContributionId {
  const contributionId = parseSdkClientContributionDiagnosticId(value);
  if (contributionId === undefined) fail('SDK_CONTRIBUTION_INVALID', 'construction');
  return contributionId;
}

function validateProtocol(value: unknown, contributionId: SdkClientContributionId): void {
  if (!isPlainRecord(value) || !hasExactFields(value, PROTOCOL_FIELDS)) {
    fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId });
  }
  if (value.family !== 'netscript.sdk-client' || value.major !== 1) {
    fail('SDK_CONTRIBUTION_VERSION', 'construction', { contributionId });
  }
}

function validateContextDeclaration(
  value: unknown,
  contributionId: SdkClientContributionId,
): Readonly<Record<string, ContextMode>> {
  if (!isPlainRecord(value)) {
    fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId });
  }
  const entries = Object.entries(value);
  if (entries.length > 8) {
    fail('SDK_CONTRIBUTION_LIMIT', 'construction', { contributionId });
  }
  const declaration: Record<string, ContextMode> = {};
  for (const [key, mode] of entries) {
    if (mode !== 'optional' && mode !== 'required') {
      fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId });
    }
    if (RESERVED_CONTEXT_KEYS.has(key)) {
      fail('SDK_CONTRIBUTION_CONFLICT', 'construction', { contributionId });
    }
    declaration[key] = mode;
  }
  return Object.freeze(declaration);
}

function validateHeaderKeys(
  value: unknown,
  contributionId: SdkClientContributionId,
): readonly string[] {
  if (!Array.isArray(value)) {
    fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId });
  }
  if (value.length > 16) {
    fail('SDK_CONTRIBUTION_LIMIT', 'construction', { contributionId });
  }
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const candidate of value) {
    if (
      typeof candidate !== 'string' || candidate !== candidate.toLowerCase() ||
      !HEADER_NAME_PATTERN.test(candidate) || isForbiddenHeader(candidate)
    ) {
      fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId });
    }
    if (seen.has(candidate)) {
      fail('SDK_CONTRIBUTION_CONFLICT', 'construction', {
        contributionId,
        conflictingContributionId: contributionId,
        headerName: candidate,
      });
    }
    seen.add(candidate);
    keys.push(candidate);
  }
  return Object.freeze(keys);
}

function validateResponseCache(
  value: unknown,
  contributionId: SdkClientContributionId,
): ValidatedSdkClientContribution['responseCache'] {
  if (!isPlainRecord(value) || typeof value.mode !== 'string') {
    fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId });
  }
  if (value.mode === 'invariant' || value.mode === 'direct-only') {
    if (!hasExactFields(value, SIMPLE_CACHE_FIELDS)) {
      fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId });
    }
    return Object.freeze({ mode: value.mode });
  }
  if (
    value.mode !== 'partitioned' || !hasExactFields(value, PARTITIONED_CACHE_FIELDS) ||
    typeof value.partition !== 'function'
  ) {
    fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId });
  }
  return Object.freeze({
    mode: 'partitioned',
    partition: value.partition as (
      options: SdkClientCachePartitionOptions<Record<string, unknown>>,
    ) => unknown,
  });
}

function validateContribution(value: unknown): ValidatedSdkClientContribution {
  if (!isPlainRecord(value)) {
    fail('SDK_CONTRIBUTION_INVALID', 'construction');
  }
  const diagnosticId = getSdkClientContributionDiagnosticId(value);
  if (!hasExactFields(value, CONTRIBUTION_FIELDS)) {
    fail('SDK_CONTRIBUTION_INVALID', 'construction', {
      contributionId: diagnosticId,
    });
  }
  const id = validatedContributionId(value.id);
  validateProtocol(value.protocol, id);
  const context = validateContextDeclaration(value.context, id);
  const headerKeys = validateHeaderKeys(value.headerKeys, id);
  const responseCache = validateResponseCache(value.responseCache, id);
  if (typeof value.prepare !== 'function') {
    fail('SDK_CONTRIBUTION_INVALID', 'construction', { contributionId: id });
  }
  return Object.freeze({
    protocol: Object.freeze({ family: 'netscript.sdk-client', major: 1 }),
    id,
    context,
    headerKeys,
    responseCache,
    prepare: value.prepare as (
      options: SdkClientPrepareOptions<Record<string, unknown>>,
    ) => unknown,
  });
}

/** Validate an unknown contribution tuple and reserve all owned names deterministically. */
export function validateSdkClientContributions(
  value: unknown,
): readonly ValidatedSdkClientContribution[] {
  if (!Array.isArray(value)) fail('SDK_CONTRIBUTION_INVALID', 'construction');
  if (value.length > 16) {
    fail('SDK_CONTRIBUTION_LIMIT', 'construction', {
      contributionId: getSdkClientContributionDiagnosticId(value[16]),
    });
  }

  const ids = new Set<string>();
  const contexts = new Map<string, SdkClientContributionId>();
  const headers = new Map<string, SdkClientContributionId>();
  const tuple: ValidatedSdkClientContribution[] = [];

  for (const candidate of value) {
    const contribution = validateContribution(candidate);
    if (ids.has(contribution.id)) {
      fail('SDK_CONTRIBUTION_CONFLICT', 'construction', {
        contributionId: contribution.id,
        conflictingContributionId: contribution.id,
      });
    }
    ids.add(contribution.id);

    for (const key of Object.keys(contribution.context)) {
      const ownerId = contexts.get(key);
      if (ownerId !== undefined) {
        fail('SDK_CONTRIBUTION_CONFLICT', 'construction', {
          contributionId: contribution.id,
          conflictingContributionId: ownerId,
        });
      }
      contexts.set(key, contribution.id);
    }
    for (const name of contribution.headerKeys) {
      const ownerId = headers.get(name);
      if (ownerId !== undefined) {
        fail('SDK_CONTRIBUTION_CONFLICT', 'construction', {
          contributionId: contribution.id,
          conflictingContributionId: ownerId,
          headerName: name,
        });
      }
      headers.set(name, contribution.id);
    }
    tuple.push(contribution);
  }

  return Object.freeze(tuple);
}

function projectContributionContext(
  contribution: ValidatedSdkClientContribution,
  context: Readonly<Record<string, unknown>>,
  phase: 'partition' | 'preparation',
  procedurePath: string,
): Readonly<Record<string, unknown>> {
  const projection: Record<string, unknown> = {};
  for (const [key, mode] of Object.entries(contribution.context)) {
    if (!(key in context)) {
      if (mode === 'required') {
        fail('SDK_CONTEXT_MISSING', phase, {
          contributionId: contribution.id,
          procedurePath,
        });
      }
      continue;
    }
    projection[key] = context[key];
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

function validatePatchHeaders(
  contribution: ValidatedSdkClientContribution,
  patch: unknown,
  procedurePath: string,
): Readonly<Record<string, string>> {
  if (!isPlainRecord(patch) || !hasOnlyFields(patch, PATCH_FIELDS)) {
    fail('SDK_CONTRIBUTION_RUNTIME', 'preparation', {
      contributionId: contribution.id,
      procedurePath,
    });
  }
  if (patch.headers === undefined) return Object.freeze({});
  if (!isPlainRecord(patch.headers)) {
    fail('SDK_HEADER_INVALID', 'preparation', {
      contributionId: contribution.id,
      procedurePath,
    });
  }

  const declared = new Set(contribution.headerKeys);
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(patch.headers)) {
    const safeName = HEADER_NAME_PATTERN.test(name) && name === name.toLowerCase()
      ? name
      : undefined;
    if (
      safeName === undefined || isForbiddenHeader(name) || !declared.has(name) ||
      typeof value !== 'string' || /[\r\n]/.test(value)
    ) {
      fail('SDK_HEADER_INVALID', 'preparation', {
        contributionId: contribution.id,
        procedurePath,
        ...(safeName === undefined ? {} : { headerName: safeName }),
      });
    }
    headers[name] = value;
  }
  return Object.freeze(headers);
}

/** Resolve the contribution tuple's canonical, non-secret cache partitions. */
export function resolveSdkClientCachePartition(
  contributions: readonly ValidatedSdkClientContribution[],
  context: Readonly<Record<string, unknown>>,
  procedure: SdkClientProcedureDescriptor,
): SdkClientCachePartition {
  const procedurePath = procedure.path.join('.');
  const pairs: Array<readonly [SdkClientContributionId, string]> = [];

  for (const contribution of contributions) {
    if (contribution.responseCache.mode !== 'partitioned') continue;
    const projection = projectContributionContext(
      contribution,
      context,
      'partition',
      procedurePath,
    );
    const options = Object.freeze({
      context: projection,
      procedure,
    }) satisfies SdkClientCachePartitionOptions<Record<string, unknown>>;
    let value: unknown;
    try {
      value = contribution.responseCache.partition?.(options);
    } catch {
      fail('SDK_CACHE_PARTITION_INVALID', 'partition', {
        contributionId: contribution.id,
        procedurePath,
      });
    }
    if (typeof value !== 'string' || !PRINTABLE_ASCII_PATTERN.test(value)) {
      fail('SDK_CACHE_PARTITION_INVALID', 'partition', {
        contributionId: contribution.id,
        procedurePath,
      });
    }
    pairs.push(Object.freeze([contribution.id, value]));
  }

  pairs.sort(([left], [right]) => left.localeCompare(right));
  const immutablePairs = Object.freeze([...pairs]);
  if (immutablePairs.length === 0) {
    const serverSuffix: readonly [] = [];
    const querySuffix: readonly unknown[] = [];
    return Object.freeze({
      pairs: immutablePairs,
      serverSuffix: Object.freeze(serverSuffix),
      querySuffix: Object.freeze(querySuffix),
    });
  }
  const serverSuffix: readonly ['$netscript.sdk-context', string] = [
    '$netscript.sdk-context',
    JSON.stringify(immutablePairs),
  ];
  const querySuffix: readonly unknown[] = ['$netscript.sdk-context', ...immutablePairs];
  return Object.freeze({
    pairs: immutablePairs,
    serverSuffix: Object.freeze(serverSuffix),
    querySuffix: Object.freeze(querySuffix),
  });
}

/** Return whether a validated tuple forbids generated cache/query helpers. */
export function hasDirectOnlySdkClientContribution(
  contributions: readonly ValidatedSdkClientContribution[],
): boolean {
  return contributions.some((contribution) => contribution.responseCache.mode === 'direct-only');
}

/** Create the private preparation port for one validated contribution tuple. */
export function createPreparedOutboundHeadersPort(
  contributions: unknown,
): PreparedOutboundHeadersPort {
  const tuple = validateSdkClientContributions(contributions);

  return {
    async prepare<TContext extends object>(
      call: SdkClientLogicalCall<TContext>,
    ): Promise<PreparedSdkClientCall<TContext>> {
      if (call.signal?.aborted) throw abortReason(call.signal);

      const procedure = call.procedure;
      const procedurePath = procedure.path.join('.');
      const callContext = call.context as Readonly<Record<string, unknown>>;
      const values: Record<string, string> = {};

      for (const contribution of tuple) {
        if (call.signal?.aborted) throw abortReason(call.signal);
        const context = projectContributionContext(
          contribution,
          callContext,
          'preparation',
          procedurePath,
        );
        const snapshot = Object.freeze({
          context,
          signal: call.signal,
          procedure,
          transport: call.transport,
          input: call.input,
        }) satisfies SdkClientPrepareOptions<Record<string, unknown>>;
        let patch: unknown;
        try {
          patch = await awaitWithSignal(contribution.prepare(snapshot), call.signal);
        } catch {
          if (call.signal?.aborted) throw abortReason(call.signal);
          fail('SDK_PREPARATION_FAILED', 'preparation', {
            contributionId: contribution.id,
            procedurePath,
          });
        }
        Object.assign(
          values,
          validatePatchHeaders(contribution, patch, procedurePath),
        );
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
