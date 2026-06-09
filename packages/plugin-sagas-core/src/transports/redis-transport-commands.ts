import { Redis } from 'ioredis';
import type { RedisDelayedClient } from './redis-transport-delayed.ts';
import type {
  RedisClaimedMessageResult,
  RedisPendingMessageResult,
  RedisStreamReadGroupResult,
  RedisTransportSubscriptionRecord,
} from './redis-transport-subscription.ts';

/** Structural Redis Streams client used by `NetScriptRedisTransport`. */
export interface RedisStreamClient extends RedisDelayedClient {
  /** Create an independent client for subscription reads. */
  duplicate(): RedisStreamClient;
  /** Close the Redis client connection. */
  quit(): Promise<unknown>;
  /** Add a serialized message envelope to a Redis Stream. */
  xadd(...args: (string | number)[]): Promise<unknown>;
  /** Acknowledge one Redis Stream message. */
  xack(streamKey: string, group: string, messageId: string): Promise<unknown>;
  /** Run an XGROUP command used to create consumer groups. */
  xgroup(
    command: 'CREATE',
    streamKey: string,
    group: string,
    id: string,
    mkstream: 'MKSTREAM',
  ): Promise<unknown>;
  /** Read messages for the configured consumer group. */
  xreadgroup(
    groupCommand: 'GROUP',
    group: string,
    consumer: string,
    countCommand: 'COUNT',
    count: number,
    blockCommand: 'BLOCK',
    blockMs: number,
    streamsCommand: 'STREAMS',
    ...keysAndIds: string[]
  ): Promise<RedisStreamReadGroupResult | null>;
  /** Read pending message metadata for recovery. */
  xpending(
    streamKey: string,
    group: string,
    start: string,
    end: string,
    count: number,
  ): Promise<RedisPendingMessageResult>;
  /** Claim one idle pending message for this consumer. */
  xclaim(
    streamKey: string,
    group: string,
    consumer: string,
    minIdleMs: number,
    messageId: string,
  ): Promise<RedisClaimedMessageResult>;
}

/** Redis client factory for tests and custom connection policies. */
export type RedisStreamClientFactory = (
  connection: RedisConnectionOptions,
) => RedisStreamClient;

/** Transport logger hook; no global console usage in framework code. */
export interface RedisTransportLogger {
  /** Record diagnostic transport details. */
  debug(message: string, metadata?: Readonly<Record<string, unknown>>): void;
  /** Record recoverable transport warnings. */
  warn(message: string, metadata?: Readonly<Record<string, unknown>>): void;
  /** Record transport errors. */
  error(message: string, metadata?: Readonly<Record<string, unknown>>): void;
}

/** Redis connection options accepted by the default ioredis factory. */
export type RedisConnectionOptions = Readonly<{
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  tls?: Readonly<{
    rejectUnauthorized?: boolean;
  }>;
}>;

export type ResolvedRedisTransportOptions = Readonly<{
  id: string;
  redis?: RedisStreamClient;
  connection?: RedisConnectionOptions;
  createRedis: RedisStreamClientFactory;
  keyPrefix: string;
  consumerGroup: string;
  consumerName: string;
  autoCreateGroup: boolean;
  batchSize: number;
  blockTimeoutMs: number;
  maxStreamLength: number;
  approximateMaxLen: boolean;
  delayedPollIntervalMs: number;
  delayedSetKey: string;
  pendingClaimIntervalMs: number;
  minIdleTimeMs: number;
  logger?: RedisTransportLogger;
  now: () => Date;
}>;

export type RedisTransportInputOptions = Readonly<{
  id?: string;
  redis?: RedisStreamClient;
  connection?: RedisConnectionOptions;
  createRedis?: RedisStreamClientFactory;
  keyPrefix?: string;
  consumerGroup?: string;
  consumerName?: string;
  autoCreateGroup?: boolean;
  batchSize?: number;
  blockTimeoutMs?: number;
  maxStreamLength?: number;
  approximateMaxLen?: boolean;
  delayedPollIntervalMs?: number;
  delayedSetKey?: string;
  pendingClaimIntervalMs?: number;
  minIdleTimeMs?: number;
  logger?: RedisTransportLogger;
  now?: () => Date;
}>;

export function resolveRedisTransportOptions(
  options: RedisTransportInputOptions,
): ResolvedRedisTransportOptions {
  return Object.freeze({
    id: options.id ?? 'redis-saga-transport',
    redis: options.redis,
    connection: options.connection,
    createRedis: options.createRedis ?? createDefaultRedisClient,
    keyPrefix: options.keyPrefix ?? 'saga-bus:',
    consumerGroup: options.consumerGroup ?? 'saga-processor',
    consumerName: options.consumerName ?? `consumer-${crypto.randomUUID()}`,
    autoCreateGroup: options.autoCreateGroup ?? true,
    batchSize: options.batchSize ?? 10,
    blockTimeoutMs: options.blockTimeoutMs ?? 5000,
    maxStreamLength: options.maxStreamLength ?? 0,
    approximateMaxLen: options.approximateMaxLen ?? true,
    delayedPollIntervalMs: options.delayedPollIntervalMs ?? 1000,
    delayedSetKey: options.delayedSetKey ?? 'saga-bus:delayed',
    pendingClaimIntervalMs: options.pendingClaimIntervalMs ?? 30000,
    minIdleTimeMs: options.minIdleTimeMs ?? 60000,
    logger: options.logger,
    now: options.now ?? (() => new Date()),
  });
}

export function redisStreamKey(keyPrefix: string, topic: string): string {
  return `${keyPrefix}stream:${topic}`;
}

export async function addRedisStreamMessage(
  redis: RedisStreamClient,
  streamKey: string,
  envelope: string,
  options: ResolvedRedisTransportOptions,
): Promise<void> {
  await redis.xadd(...redisXaddArgs(streamKey, envelope, options));
}

export function redisXaddArgs(
  streamKey: string,
  envelope: string,
  options: ResolvedRedisTransportOptions,
): (string | number)[] {
  if (options.maxStreamLength <= 0) {
    return [streamKey, '*', 'data', envelope];
  }
  if (options.approximateMaxLen) {
    return [streamKey, 'MAXLEN', '~', options.maxStreamLength, '*', 'data', envelope];
  }
  return [streamKey, 'MAXLEN', options.maxStreamLength, '*', 'data', envelope];
}

export async function ensureRedisGroup(
  redis: RedisStreamClient,
  record: RedisTransportSubscriptionRecord,
  options: ResolvedRedisTransportOptions,
): Promise<void> {
  if (!options.autoCreateGroup) return;
  try {
    await redis.xgroup('CREATE', record.streamKey, options.consumerGroup, '0', 'MKSTREAM');
  } catch (error) {
    if (!isBusyGroupError(error)) throw error;
  }
}

export function readRedisGroupMessages(
  redis: RedisStreamClient,
  subscriptions: readonly RedisTransportSubscriptionRecord[],
  options: ResolvedRedisTransportOptions,
): Promise<RedisStreamReadGroupResult | null> {
  const streams = subscriptions.map((item) => item.streamKey);
  return redis.xreadgroup(
    'GROUP',
    options.consumerGroup,
    options.consumerName,
    'COUNT',
    options.batchSize,
    'BLOCK',
    options.blockTimeoutMs,
    'STREAMS',
    ...streams,
    ...streams.map(() => '>'),
  );
}

export async function acknowledgeRedisStreamMessage(
  redis: RedisStreamClient,
  streamKey: string,
  messageId: string,
  options: ResolvedRedisTransportOptions,
): Promise<void> {
  await redis.xack(streamKey, options.consumerGroup, messageId);
}

export async function claimRedisPendingMessages(
  redis: RedisStreamClient,
  records: readonly RedisTransportSubscriptionRecord[],
  options: ResolvedRedisTransportOptions,
  processMessage: (
    record: RedisTransportSubscriptionRecord,
    messageId: string,
    fields: readonly string[],
  ) => Promise<void>,
): Promise<void> {
  await Promise.all(
    records.map((record) => claimRedisPendingFor(redis, record, options, processMessage)),
  );
}

export async function claimRedisPendingFor(
  redis: RedisStreamClient,
  record: RedisTransportSubscriptionRecord,
  options: ResolvedRedisTransportOptions,
  processMessage: (
    record: RedisTransportSubscriptionRecord,
    messageId: string,
    fields: readonly string[],
  ) => Promise<void>,
): Promise<void> {
  try {
    const pending = await redis.xpending(
      record.streamKey,
      options.consumerGroup,
      '-',
      '+',
      options.batchSize,
    );
    await Promise.all(
      pending.map((entry) => claimRedisPendingEntry(redis, record, entry, options, processMessage)),
    );
  } catch (error) {
    options.logger?.error('Redis saga transport pending-claim error.', { error });
  }
}

export async function claimRedisPendingEntry(
  redis: RedisStreamClient,
  record: RedisTransportSubscriptionRecord,
  entry: RedisPendingMessageResult[number],
  options: ResolvedRedisTransportOptions,
  processMessage: (
    record: RedisTransportSubscriptionRecord,
    messageId: string,
    fields: readonly string[],
  ) => Promise<void>,
): Promise<void> {
  const [messageId, , idleMs] = entry;
  if (idleMs < options.minIdleTimeMs) return;

  const claimed = await redis.xclaim(
    record.streamKey,
    options.consumerGroup,
    options.consumerName,
    options.minIdleTimeMs,
    messageId,
  );
  await Promise.all(
    claimed.map(([claimedId, fields]) => processMessage(record, claimedId, fields)),
  );
}

function createDefaultRedisClient(connection: RedisConnectionOptions): RedisStreamClient {
  return new Redis(connection) as unknown as RedisStreamClient;
}

function isBusyGroupError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('BUSYGROUP');
}
