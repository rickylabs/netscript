import {
  DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1,
  DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1,
  type StreamProducerBufferPolicyV1,
  type StreamProducerReconnectPolicyV1,
  type StreamProducerTransportFailureV1,
  type StreamWriteOutcomeV1,
  type StreamWriteReceiptV1,
  type StreamWriteRejectionReasonV1,
} from '../domain/producer-contract-v1.ts';
import type { StreamProducerWriteLifecycle } from './durable-stream-producer-supervisor-contract.ts';

/** Internal promise settlement owned by the producer supervisor. */
export interface ProducerDeferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: Error): void;
}

/** Create an already-settled rejected receipt and finish its telemetry. */
export function rejectedReceipt(
  id: number,
  reason: StreamWriteRejectionReasonV1,
  lifecycle?: StreamProducerWriteLifecycle,
): StreamWriteReceiptV1 {
  const outcome: StreamWriteOutcomeV1 = { status: 'rejected', reason };
  lifecycle?.finish(outcome);
  return { id, accepted: false, completion: Promise.resolve(outcome) };
}

/** Create a deferred completion controlled by the supervisor. */
export function createProducerDeferred<T>(): ProducerDeferred<T> {
  let resolvePromise: (value: T) => void = () => undefined;
  let rejectPromise: (reason: Error) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

/** Merge and validate a finite reconnect policy. */
export function reconnectPolicy(
  input: Partial<StreamProducerReconnectPolicyV1> | undefined,
): StreamProducerReconnectPolicyV1 {
  const policy = { ...DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1, ...input };
  if (
    !Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1 ||
    !Number.isFinite(policy.initialDelayMs) || policy.initialDelayMs < 0 ||
    !Number.isFinite(policy.multiplier) || policy.multiplier < 1 ||
    !Number.isFinite(policy.maxDelayMs) || policy.maxDelayMs < 0 ||
    !Number.isFinite(policy.jitterRatio) || policy.jitterRatio < 0 || policy.jitterRatio > 1
  ) {
    throw new TypeError('Reconnect policy must contain finite bounded values');
  }
  return policy;
}

/** Merge and validate the dual queue bounds. */
export function bufferPolicy(
  input: Partial<StreamProducerBufferPolicyV1> | undefined,
): StreamProducerBufferPolicyV1 {
  const policy = { ...DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1, ...input };
  if (
    !Number.isInteger(policy.maxEvents) || policy.maxEvents < 1 ||
    !Number.isInteger(policy.maxBytes) || policy.maxBytes < 1
  ) {
    throw new TypeError('Buffer policy must contain positive finite integer bounds');
  }
  return policy;
}

/** Compute one bounded exponential delay with symmetric jitter. */
export function backoffDelay(
  policy: StreamProducerReconnectPolicyV1,
  failedAttempt: number,
  random: number,
): number {
  const base = Math.min(
    policy.initialDelayMs * policy.multiplier ** Math.max(0, failedAttempt - 1),
    policy.maxDelayMs,
  );
  const boundedRandom = Math.min(Math.max(random, 0), 0.9999999999999999);
  const jitter = 1 + (boundedRandom * 2 - 1) * policy.jitterRatio;
  return Math.max(0, Math.round(base * jitter));
}

/** Whether a classified transport failure may consume another attempt. */
export function isRetryable(failure: StreamProducerTransportFailureV1): boolean {
  return failure.kind === 'retryable' || failure.kind === 'stale-epoch';
}

/** Convert an optional abort reason into an Error. */
export function abortError(signal?: AbortSignal): Error {
  const reason = signal?.reason;
  return reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
}
