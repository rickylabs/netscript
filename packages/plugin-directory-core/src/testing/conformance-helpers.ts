/**
 * Shared assertion helpers and cross-provider hostile payload corpus for the conformance suite.
 *
 * @module
 */

import { assert, assertRejects } from '@std/assert';
import {
  type CallContext,
  DIRECTORY_MAX_TIMEOUT_MS,
  type DirectoryError,
  type DirectoryPort,
  DirectoryTimeout,
  type DirectoryUnauthorized,
  DirectoryUnavailable,
  type DirectoryUnsupported,
  isDirectoryError,
} from '../ports/mod.ts';
import { DIRECTORY_CONFORMANCE_DATASET } from './conformance-dataset.ts';

const DS = DIRECTORY_CONFORMANCE_DATASET;

/** Cross-provider hostile injection payloads covering LDAP, OData, SCIM, URL, and CR/LF vectors. */
export const HOSTILE_FILTER_PAYLOADS: readonly string[] = [
  '*',
  'a*',
  '*)(|(objectClass=*)',
  'alice)(|(uid=*',
  '\\2a',
  'admin\0ignored',
  "alice' or true eq true",
  "' or 1 eq 1 --",
  "a') or startswith(mail,'a",
  'userName sw "a" or id pr',
  '" or true or "',
  'alice&filter=true',
  '%2a',
  '%27',
  'alice?top=9999',
  'alice#frag',
  'alice\r\nX-Injected: 1',
  'alice\nbob',
];

/** Subset of hostile payloads that must never match any user or group in substring search. */
export const HOSTILE_SEARCH_NO_MATCH_PAYLOADS: readonly string[] = HOSTILE_FILTER_PAYLOADS.filter(
  (p) => p !== '*' && p !== 'a*',
);

export function assertIsoTimestamp(value: string, label: string): void {
  const parsed = Date.parse(value);
  assert(
    Number.isFinite(parsed) && value.includes('T'),
    `${label} must be a valid ISO-8601 timestamp, received: ${JSON.stringify(value)}`,
  );
}

export function assertNoSensitiveLeak(
  text: string,
  sensitiveValues: readonly string[] | undefined,
  context: string,
): void {
  assert(
    !/\b(?:cn|ou|dc|uid|o)=/i.test(text),
    `${context} must not leak directory DNs: ${text}`,
  );
  if (!sensitiveValues) return;
  const lower = text.toLowerCase();
  for (const secret of sensitiveValues) {
    if (secret.length === 0) continue;
    assert(
      !lower.includes(secret.toLowerCase()),
      `${context} leaked a configured sensitive value.`,
    );
  }
}

export function assertErrorRedacted(
  err: DirectoryError,
  sensitiveValues: readonly string[] | undefined,
  context: string,
): void {
  assertNoSensitiveLeak(err.message, sensitiveValues, `${context} error.message`);
  assertNoSensitiveLeak(err.reason, sensitiveValues, `${context} error.reason`);
}

export function createTimedOutSignal(): AbortSignal {
  const controller = new AbortController();
  controller.abort(new DOMException('Directory call timed out.', 'TimeoutError'));
  return controller.signal;
}

export function createCallerAbortedSignal(): AbortSignal {
  const controller = new AbortController();
  controller.abort(new Error('Caller cancelled request.'));
  return controller.signal;
}

type DirectoryErrorCtor =
  | typeof DirectoryTimeout
  | typeof DirectoryUnavailable
  | typeof DirectoryUnauthorized
  | typeof DirectoryUnsupported;

export async function assertAllMethodsReject(
  port: DirectoryPort,
  ctxFactory: () => CallContext,
  ErrorClass: DirectoryErrorCtor,
  includeHealth: boolean,
  sensitiveValues?: readonly string[],
): Promise<void> {
  const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };
  const calls: Array<() => Promise<unknown>> = [
    () => port.getUser(aliceRef, ctxFactory()),
    () =>
      port.memberOfAny(
        { user: aliceRef, candidateGroupIds: [DS.groupIds.domainUsers] },
        ctxFactory(),
      ),
  ];
  if (port.capabilities.has('search')) {
    calls.unshift(
      () => port.searchUsers({ text: 'alice', limit: 2 }, ctxFactory()),
      () => port.searchGroups({ text: 'Ops', limit: 2 }, ctxFactory()),
    );
  }
  if (includeHealth) {
    calls.push(() => port.health(ctxFactory()));
  }

  for (const call of calls) {
    const err = await assertRejects(call, ErrorClass);
    if (isDirectoryError(err)) {
      assertErrorRedacted(err, sensitiveValues, ErrorClass.name);
    }
  }
}

export async function assertMidFlightCallerAbort(
  timeoutPort: DirectoryPort,
  sensitiveValues: readonly string[] | undefined,
): Promise<void> {
  const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };
  const ops: Array<(signal: AbortSignal) => Promise<unknown>> = [
    (signal) => timeoutPort.getUser(aliceRef, { signal, timeoutMs: 2_000 }),
    (signal) =>
      timeoutPort.memberOfAny(
        { user: aliceRef, candidateGroupIds: [DS.groupIds.domainUsers] },
        { signal, timeoutMs: 2_000 },
      ),
    (signal) => timeoutPort.health({ signal, timeoutMs: 2_000 }),
  ];
  if (timeoutPort.capabilities.has('search')) {
    ops.unshift(
      (signal) =>
        timeoutPort.searchUsers({ text: 'alice', limit: 2 }, { signal, timeoutMs: 2_000 }),
      (signal) => timeoutPort.searchGroups({ text: 'Ops', limit: 2 }, { signal, timeoutMs: 2_000 }),
    );
  }

  for (const op of ops) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('caller cancelled mid-flight')), 15);
    try {
      const err = await assertRejects(() => op(controller.signal), DirectoryUnavailable);
      assertErrorRedacted(err, sensitiveValues, 'mid-flight abort');
    } finally {
      clearTimeout(timer);
    }
  }
}

export async function assertInvalidTimeoutRejected(port: DirectoryPort): Promise<void> {
  const aliceRef = { directoryInstance: DS.directoryInstance, immutableId: DS.userIds.alice };
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, DIRECTORY_MAX_TIMEOUT_MS + 1]) {
    await assertRejects(() => port.getUser(aliceRef, { timeoutMs: bad }), RangeError);
    await assertRejects(() => port.health({ timeoutMs: bad }), RangeError);
  }
  for (const exhausted of [0, -5]) {
    await assertRejects(() => port.getUser(aliceRef, { timeoutMs: exhausted }), DirectoryTimeout);
    await assertRejects(() => port.health({ timeoutMs: exhausted }), DirectoryTimeout);
  }
}
