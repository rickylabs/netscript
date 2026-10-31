import type { ListenOptions } from '../ports/message-queue.ts';
import { QueueConfigurationError } from '../ports/errors.ts';
import { createEnvelope, isMessageEnvelope, type MessageEnvelope } from './_envelope.ts';

/** Durable counters shared by every consumer of a Redis queue. */
export interface RedisQueueMetrics {
  /** Expired claims returned to the ready queue. */
  reclaimed: number;
  /** Terminal failures persisted in the DLQ or its durable outbox. */
  deadLettered: number;
  /** Refused acknowledgements, nacks and heartbeats with expired or replaced receipts. */
  staleSettlements: number;
  /** Legacy processing entries given an initial recovery lease. */
  observedOrphans: number;
}

/** Queue depths and durable recovery counters for health reporting. */
export interface RedisQueueHealth extends RedisQueueMetrics {
  /** Ready messages awaiting a claim. */
  ready: number;
  /** Entries in the processing list. */
  processing: number;
  /** Records in the built-in Redis dead-letter list. */
  deadLetterDepth: number;
  /** Records waiting for the configured external dead-letter store. */
  outboxDepth: number;
}

/** Validated listener lease policy, persisted with each receipt. */
export interface RedisLeasePolicy {
  visibilityTimeout: number;
  maxDeliveries: number;
  recoveryGrace: number;
}

/** One committed claim; the encoded envelope stays opaque inside Redis Lua. */
export interface RedisLease<T> {
  key: string;
  fence: string;
  raw: string;
  deadline: number;
  timeout: number;
  grace: number;
  maxDeliveries: number;
  envelope: MessageEnvelope<T>;
}

/** Validate the finite integer values used by leases and recovery timers. */
export function leaseDuration(value: number, name: string, minimum = 1): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > 2_147_483_647) {
    throw new QueueConfigurationError(
      `${name} must be an integer between ${minimum} and 2147483647`,
    );
  }
  return value;
}

/** Resolve Redis defaults without changing other adapters' listener policy. */
export function leasePolicy(options?: ListenOptions): RedisLeasePolicy {
  return {
    visibilityTimeout: leaseDuration(options?.visibilityTimeout ?? 30_000, 'visibilityTimeout'),
    maxDeliveries: leaseDuration(options?.maxDeliveries ?? 5, 'maxDeliveries'),
    recoveryGrace: leaseDuration(options?.recoveryGrace ?? 1_000, 'recoveryGrace', 0),
  };
}

/** Validated per-listener admission, drain and pickup policy. */
export interface RedisListenerPolicy {
  concurrency: number;
  drainTimeout: number;
  pollIntervalMs: number;
  delayedPollIntervalMs: number;
}

const DEFAULT_POLL_INTERVAL_MS = 50;
const DEFAULT_DELAYED_POLL_INTERVAL_MS = 1_000;
const MIN_POLL_INTERVAL_MS = 10;
const MAX_POLL_INTERVAL_MS = 60_000;
const POLL_INTERVAL_ENV = 'NETSCRIPT_REDIS_QUEUE_POLL_INTERVAL_MS';
const DELAYED_POLL_INTERVAL_ENV = 'NETSCRIPT_REDIS_DELAYED_POLL_INTERVAL_MS';

/** Resolve Redis-only tuning before allocating any connections. */
export function redisListenerPolicy(options?: ListenOptions): RedisListenerPolicy {
  return {
    concurrency: leaseDuration(options?.concurrency ?? 1, 'concurrency'),
    drainTimeout: leaseDuration(options?.visibilityTimeout ?? 30_000, 'visibilityTimeout'),
    pollIntervalMs: pollInterval(
      options?.pollIntervalMs,
      POLL_INTERVAL_ENV,
      DEFAULT_POLL_INTERVAL_MS,
    ),
    delayedPollIntervalMs: pollInterval(
      options?.delayedPollIntervalMs,
      DELAYED_POLL_INTERVAL_ENV,
      DEFAULT_DELAYED_POLL_INTERVAL_MS,
    ),
  };
}

function pollInterval(explicit: number | undefined, variable: string, fallback: number): number {
  let value = explicit;
  let name = variable;
  if (value === undefined) {
    try {
      const environment = Deno.env.get(variable);
      value = environment === undefined ? fallback : Number(environment);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotCapable)) throw error;
      value = fallback;
    }
  } else {
    name = variable === POLL_INTERVAL_ENV ? 'pollIntervalMs' : 'delayedPollIntervalMs';
  }
  if (
    !Number.isSafeInteger(value) || value < MIN_POLL_INTERVAL_MS || value > MAX_POLL_INTERVAL_MS
  ) {
    throw new QueueConfigurationError(`${name} must be an integer between 10 and 60000`);
  }
  return value;
}

/** Normalize legacy JSON once and count the delivery about to begin. */
export function normalizeLeaseEnvelope(raw: string): {
  envelope: MessageEnvelope<unknown>;
  invalid: boolean;
} {
  let value: unknown;
  let invalid = false;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw;
    invalid = true;
  }
  const envelope = isMessageEnvelope(value) ? value : createEnvelope(value);
  return {
    envelope: {
      ...envelope,
      messageId: typeof envelope.messageId === 'string' ? envelope.messageId : crypto.randomUUID(),
      enqueuedAt: Number.isFinite(Date.parse(envelope.enqueuedAt))
        ? envelope.enqueuedAt
        : new Date().toISOString(),
      deliveryCount: Number.isSafeInteger(envelope.deliveryCount) && envelope.deliveryCount >= 0
        ? envelope.deliveryCount + 1
        : 1,
    },
    invalid,
  };
}

/** Decode only the metadata shape written by the lease scripts. */
export function parseLease<T>(key: string, encoded: string): RedisLease<T> {
  const value: unknown = JSON.parse(encoded);
  if (
    typeof value !== 'object' || value === null ||
    !('fence' in value) || typeof value.fence !== 'string' ||
    !('raw' in value) || typeof value.raw !== 'string' ||
    !('deadline' in value) || typeof value.deadline !== 'number' ||
    !('timeout' in value) || typeof value.timeout !== 'number' ||
    !('grace' in value) || typeof value.grace !== 'number' ||
    !('maxDeliveries' in value) || typeof value.maxDeliveries !== 'number' ||
    !('envelope' in value) || typeof value.envelope !== 'string'
  ) throw new Error('Invalid Redis lease record');
  const envelope: unknown = JSON.parse(value.envelope);
  if (!isMessageEnvelope<T>(envelope)) throw new Error('Invalid Redis lease envelope');
  return {
    key,
    envelope,
    fence: value.fence,
    raw: value.raw,
    deadline: value.deadline,
    timeout: value.timeout,
    grace: value.grace,
    maxDeliveries: value.maxDeliveries,
  };
}
