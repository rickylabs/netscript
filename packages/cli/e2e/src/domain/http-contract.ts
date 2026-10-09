/**
 * @module
 *
 * The exact HTTP exchange a runtime gate asserts: the request it sends and the response it
 * requires. One serializable contract serves both the in-process `HttpGate` and the
 * plugin-resource probe subprocess, so a gate states "expect 401" or "send this header" once
 * and both probe paths judge the response the same way.
 *
 * A served response that breaks the contract is final: the endpoint is up and answered wrong,
 * so retrying only burns the deadline. Retries are reserved for an endpoint that is not up
 * yet — a connection failure, or a gateway/unavailable status it did not promise.
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

/** A served response, with its body read up to {@link HTTP_CONTRACT_BODY_LIMIT_BYTES}. */
export interface ServedHttpResponse {
  readonly status: number;
  readonly body: string;
  readonly bodyTruncated: boolean;
}

/** Verdict for one served response against an exchange contract. */
export type HttpExchangeOutcome =
  | { readonly kind: 'matched' }
  /** The endpoint is not up yet; the attempt may be retried within the deadline. */
  | { readonly kind: 'pending'; readonly reason: string }
  /** The endpoint answered and broke the contract; the gate fails without retrying. */
  | { readonly kind: 'mismatch'; readonly reason: string };

/** Upper bound on body bytes read for a contract; contract bodies are small by design. */
export const HTTP_CONTRACT_BODY_LIMIT_BYTES = 65_536;

/** Statuses meaning "not up yet" when the contract did not ask for them. */
const NOT_YET_UP_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);

/** Judge one served response against the exchange contract. */
export function evaluateHttpExchange(
  contract: HttpExchangeContract,
  response: ServedHttpResponse,
): HttpExchangeOutcome {
  if (response.status !== contract.expectStatus) {
    const reason = `expected HTTP ${contract.expectStatus}, served ${response.status}: ${
      response.body.slice(0, 200)
    }`;
    return NOT_YET_UP_STATUSES.has(response.status)
      ? { kind: 'pending', reason }
      : { kind: 'mismatch', reason };
  }
  if (!contract.expectBody) return { kind: 'matched' };
  return evaluateBody(contract.expectBody, response);
}

/** Parse an exchange contract received as JSON, for example on a probe command line. */
export function parseHttpExchangeContract(raw: string): HttpExchangeContract {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value)) throw new Error('HTTP exchange contract must be a JSON object');
  const { method, headers, expectStatus, expectBody } = value;
  if (method !== 'GET' && method !== 'POST') {
    throw new Error(`HTTP exchange contract has unsupported method: ${String(method)}`);
  }
  if (!Number.isInteger(expectStatus) || (expectStatus as number) < 100) {
    throw new Error('HTTP exchange contract requires an integer expectStatus');
  }
  if (headers !== undefined && !isStringRecord(headers)) {
    throw new Error('HTTP exchange contract headers must map names to strings');
  }
  if (
    expectBody !== undefined &&
    (!isRecord(expectBody) || expectBody.kind !== 'json-equals' || !('value' in expectBody))
  ) {
    throw new Error("HTTP exchange contract expectBody must be { kind: 'json-equals', value }");
  }
  return {
    method,
    expectStatus: expectStatus as number,
    ...(headers === undefined ? {} : { headers }),
    ...(expectBody === undefined ? {} : { expectBody: expectBody as unknown as HttpBodyPredicate }),
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
      await reader.cancel();
      return { body, bodyTruncated: true };
    }
    received += value.byteLength;
    body += decoder.decode(value, { stream: true });
  }
}

function evaluateBody(
  predicate: HttpBodyPredicate,
  response: ServedHttpResponse,
): HttpExchangeOutcome {
  if (response.bodyTruncated) {
    return {
      kind: 'mismatch',
      reason: `body exceeds ${HTTP_CONTRACT_BODY_LIMIT_BYTES} bytes; cannot match ${predicate.kind}`,
    };
  }
  let actual: unknown;
  try {
    actual = JSON.parse(response.body);
  } catch {
    return {
      kind: 'mismatch',
      reason: `expected a JSON body, served: ${response.body.slice(0, 200)}`,
    };
  }
  return equal(actual, predicate.value) ? { kind: 'matched' } : {
    kind: 'mismatch',
    reason: `expected body ${JSON.stringify(predicate.value)}, served: ${
      response.body.slice(0, 200)
    }`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}
