/**
 * @module
 *
 * The exact HTTP exchange a runtime gate asserts: the request it sends and the response it
 * requires. One serializable contract serves both the in-process `HttpGate` and the
 * plugin-resource probe subprocess, so a gate states "expect 401" or "send this header" once
 * and both probe paths judge the response the same way.
 *
 * Any served response that breaks the contract is final — including 502/503/504: the endpoint
 * answered, so retrying only burns the deadline. Only a connection-level failure (refused,
 * reset, timed out, aborted mid-body) is retried. Waiting for a warming service is a separate
 * readiness contract — the `runtime.wait.<resource>` gate on Aspire's health check — never an
 * exception folded into an exact exchange.
 *
 * The status is judged as soon as headers arrive, on the original response: redirects are
 * not followed (`redirect: 'manual'`), and a wrong status cancels the body unread, so a slow or
 * stalled body can never turn a served mismatch into a timeout.
 */

import { equal } from '@std/assert/equal';

/** JSON value a body predicate compares against. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** Serializable predicate over a served response body. */
export interface HttpBodyPredicate {
  /** The body must parse as JSON deeply equal to `value`. */
  readonly kind: 'json-equals';
  readonly value: JsonValue;
}

/** Request and response contract for one HTTP gate exchange. */
export interface HttpExchangeContract {
  readonly method: 'GET' | 'POST';
  /** Request headers sent with every attempt. */
  readonly headers?: Readonly<Record<string, string>>;
  /** The exact status the endpoint must serve; any other served status fails the gate. */
  readonly expectStatus: number;
  /** Optional predicate the served body must satisfy. */
  readonly expectBody?: HttpBodyPredicate;
}

/** Verdict for one served response against an exchange contract. */
export type HttpExchangeOutcome =
  | { readonly kind: 'matched'; readonly status: number; readonly bodyPreview: string }
  /** The endpoint answered and broke the contract; the gate fails without retrying. */
  | {
    readonly kind: 'mismatch';
    readonly status: number;
    readonly bodyPreview: string;
    readonly reason: string;
  };

/** Upper bound on body bytes read for a contract; contract bodies are small by design. */
export const HTTP_CONTRACT_BODY_LIMIT_BYTES = 65_536;

/** Body characters kept as gate evidence. */
const BODY_PREVIEW_CHARS = 1_000;

/** Fetch options every contract probe uses: the original response is judged, never a redirect target. */
export function httpExchangeInit(
  contract: Pick<HttpExchangeContract, 'method' | 'headers'>,
  signal: AbortSignal,
): RequestInit {
  return { method: contract.method, headers: contract.headers, redirect: 'manual', signal };
}

/**
 * Judge one served response against the exchange contract. The status is decided from the
 * headers alone; on a mismatch the body is cancelled unread. The body is read (bounded) only
 * when the contract has a body predicate to check.
 *
 * @throws When reading a body the contract needs fails at the transport level; callers treat
 * that as a connection failure.
 */
export async function judgeHttpResponse(
  contract: HttpExchangeContract,
  response: Response,
): Promise<HttpExchangeOutcome> {
  const status = response.status;
  if (status !== contract.expectStatus) {
    discardBody(response);
    return {
      kind: 'mismatch',
      status,
      bodyPreview: '',
      reason: `expected HTTP ${contract.expectStatus}, served ${status}${location(response)}`,
    };
  }
  if (!contract.expectBody) {
    discardBody(response);
    return { kind: 'matched', status, bodyPreview: '' };
  }
  const { body, bodyTruncated } = await readBoundedBody(response);
  const bodyPreview = body.slice(0, BODY_PREVIEW_CHARS);
  const reason = bodyMismatch(contract.expectBody, body, bodyTruncated);
  return reason === undefined
    ? { kind: 'matched', status, bodyPreview }
    : { kind: 'mismatch', status, bodyPreview, reason };
}

/** Parse an exchange contract received as JSON, for example on a probe command line. */
export function parseHttpExchangeContract(raw: string): HttpExchangeContract {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value)) throw new Error('HTTP exchange contract must be a JSON object');
  const { method, headers, expectStatus, expectBody } = value;
  if (method !== 'GET' && method !== 'POST') {
    throw new Error(`HTTP exchange contract has unsupported method: ${String(method)}`);
  }
  if (typeof expectStatus !== 'number' || !Number.isInteger(expectStatus) || expectStatus < 100) {
    throw new Error('HTTP exchange contract requires an integer expectStatus');
  }
  if (headers !== undefined && !isStringRecord(headers)) {
    throw new Error('HTTP exchange contract headers must map names to strings');
  }
  if (expectBody !== undefined && !isBodyPredicate(expectBody)) {
    throw new Error("HTTP exchange contract expectBody must be { kind: 'json-equals', value }");
  }
  return {
    method,
    expectStatus,
    ...(headers === undefined ? {} : { headers }),
    ...(expectBody === undefined ? {} : { expectBody }),
  };
}

/** Read a response body as text, stopping after `limitBytes` instead of buffering it all. */
export async function readBoundedBody(
  response: Response,
  limitBytes: number = HTTP_CONTRACT_BODY_LIMIT_BYTES,
): Promise<{ readonly body: string; readonly bodyTruncated: boolean }> {
  if (!response.body) return { body: '', bodyTruncated: false };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = '';
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return { body: body + decoder.decode(), bodyTruncated: false };
    const remaining = limitBytes - received;
    if (value.byteLength > remaining) {
      body += decoder.decode(value.subarray(0, remaining));
      settleQuietly(reader.cancel());
      return { body, bodyTruncated: true };
    }
    received += value.byteLength;
    body += decoder.decode(value, { stream: true });
  }
}

function bodyMismatch(
  predicate: HttpBodyPredicate,
  body: string,
  bodyTruncated: boolean,
): string | undefined {
  if (bodyTruncated) {
    return `body exceeds ${HTTP_CONTRACT_BODY_LIMIT_BYTES} bytes; cannot match ${predicate.kind}`;
  }
  let actual: unknown;
  try {
    actual = JSON.parse(body);
  } catch {
    return `expected a JSON body, served: ${body.slice(0, 200)}`;
  }
  return equal(actual, predicate.value)
    ? undefined
    : `expected body ${JSON.stringify(predicate.value)}, served: ${body.slice(0, 200)}`;
}

/**
 * Release a body the verdict does not need. Cleanup runs after the verdict is decided and is
 * never awaited: a cancel that rejects (an already-errored stream) or never settles must not
 * alter or delay that verdict.
 */
function discardBody(response: Response): void {
  if (response.body) settleQuietly(response.body.cancel());
}

function settleQuietly(cleanup: Promise<unknown>): void {
  cleanup.catch(() => {});
}

function location(response: Response): string {
  const target = response.headers.get('location');
  return target === null ? '' : ` (redirect to ${target} not followed)`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Values reaching this guard come from `JSON.parse`, so `value` is already a JSON value. */
function isBodyPredicate(value: unknown): value is HttpBodyPredicate {
  return isRecord(value) && value.kind === 'json-equals' && 'value' in value;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}
