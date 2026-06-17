import { Redis } from 'ioredis';
import type { SagaMessage } from '../domain/mod.ts';
import type { ListDelayedClient } from './list-transport-delayed.ts';
import {
  decodeListTransportMessage,
  encodeListTransportMessage,
  type ListBlockingClient,
} from './list-transport-subscription.ts';
import type { RedisConnectionOptions, RedisTransportLogger } from './redis-transport.ts';

/** Structural Redis/Garnet client used by `GarnetListTransport`. */
export interface ListTransportClient extends ListDelayedClient, ListBlockingClient {
  /** Create an independent client for blocking reads. */
  duplicate(): ListTransportClient;
  /** Verify that the backing Redis-compatible server is reachable. */
  ping(): Promise<unknown>;
  /** Push a message to the left side of a list. */
  lpush(key: string, value: string): Promise<unknown>;
  /** Remove matching messages from a list. */
  lrem(key: string, count: number, value: string): Promise<unknown>;
  /** Read a range of list entries. */
  lrange(key: string, start: number, stop: number): Promise<readonly string[]>;
  /** Read the current list length. */
  llen(key: string): Promise<number>;
  /** Store metadata fields for a processing message. */
  hset(key: string, value: Readonly<Record<string, string>>): Promise<unknown>;
  /** Read all metadata fields for a processing message. */
  hgetall(key: string): Promise<Readonly<Record<string, string>>>;
  /** Increment a numeric metadata field. */
  hincrby(key: string, field: string, increment: number): Promise<unknown>;
  /** Set a metadata key expiry. */
  expire(key: string, seconds: number): Promise<unknown>;
  /** Delete a metadata key. */
  del(key: string): Promise<unknown>;
}

/** List transport client factory for tests and connection policy injection. */
export type ListTransportClientFactory = (
  connection: RedisConnectionOptions,
) => ListTransportClient;

/** Options for the Garnet-compatible LIST saga transport. */
export type GarnetListTransportOptions = Readonly<{
  id?: string;
  redis?: ListTransportClient;
  connection?: RedisConnectionOptions;
  createRedis?: ListTransportClientFactory;
  keyPrefix?: string;
  consumerGroup?: string;
  consumerName?: string;
  blockTimeoutMs?: number;
  delayedPollIntervalMs?: number;
  delayedSetKey?: string;
  orphanClaimIntervalMs?: number;
  minProcessingTimeMs?: number;
  maxRetries?: number;
  logger?: RedisTransportLogger;
  now?: () => Date;
  createId?: () => string;
}>;

export type ResolvedGarnetListTransportOptions = Readonly<{
  id: string;
  redis?: ListTransportClient;
  connection?: RedisConnectionOptions;
  createRedis: ListTransportClientFactory;
  keyPrefix: string;
  consumerGroup: string;
  consumerName: string;
  blockTimeoutMs: number;
  delayedPollIntervalMs: number;
  delayedSetKey: string;
  orphanClaimIntervalMs: number;
  minProcessingTimeMs: number;
  maxRetries: number;
  logger?: RedisTransportLogger;
  now: () => Date;
  createId: () => string;
}>;

export function resolveGarnetListTransportOptions(
  options: GarnetListTransportOptions,
): ResolvedGarnetListTransportOptions {
  return Object.freeze({
    id: options.id ?? 'garnet-list-saga-transport',
    redis: options.redis,
    connection: options.connection,
    createRedis: options.createRedis ?? createDefaultListClient,
    keyPrefix: options.keyPrefix ?? 'saga-bus:',
    consumerGroup: options.consumerGroup ?? 'saga-processor',
    consumerName: options.consumerName ?? `consumer-${crypto.randomUUID()}`,
    blockTimeoutMs: options.blockTimeoutMs ?? 100,
    delayedPollIntervalMs: options.delayedPollIntervalMs ?? 1000,
    delayedSetKey: options.delayedSetKey ?? 'delayed',
    orphanClaimIntervalMs: options.orphanClaimIntervalMs ?? 30000,
    minProcessingTimeMs: options.minProcessingTimeMs ?? 60000,
    maxRetries: options.maxRetries ?? 5,
    logger: options.logger,
    now: options.now ?? (() => new Date()),
    createId: options.createId ?? (() => crypto.randomUUID()),
  });
}

type ListCommandClient = Readonly<{
  rpush(key: string, value: string): Promise<unknown>;
  lpush(key: string, value: string): Promise<unknown>;
  lrem(key: string, count: number, value: string): Promise<unknown>;
  lrange(key: string, start: number, stop: number): Promise<readonly string[]>;
  hset(key: string, value: Readonly<Record<string, string>>): Promise<unknown>;
  hgetall(key: string): Promise<Readonly<Record<string, string>>>;
  hincrby(key: string, field: string, increment: number): Promise<unknown>;
  expire(key: string, seconds: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
}>;

type ListBlockingCommandClient = Readonly<{
  blmove(
    source: string,
    destination: string,
    sourceDirection: 'RIGHT',
    destinationDirection: 'LEFT',
    timeoutSeconds: number,
  ): Promise<string | null>;
  brpoplpush(source: string, destination: string, timeoutSeconds: number): Promise<string | null>;
}>;

type ListCommandRecord = Readonly<{
  topic: string;
  queueKey: string;
  processingKey: string;
}>;

type ListCommandOptions = Readonly<{
  keyPrefix: string;
  consumerGroup: string;
  consumerName: string;
  blockTimeoutMs: number;
  minProcessingTimeMs: number;
  maxRetries: number;
  now: () => Date;
  logger?: RedisTransportLogger;
}>;

export function listQueueKey(keyPrefix: string, topic: string): string {
  return `${keyPrefix}queue:${topic}`;
}

export function listProcessingKey(
  keyPrefix: string,
  consumerGroup: string,
  consumerName: string,
  topic: string,
): string {
  return `${keyPrefix}processing:${topic}:${consumerGroup}:${consumerName}`;
}

export function listDeadLetterKey(keyPrefix: string, topic: string): string {
  return `${keyPrefix}dlq:${topic}`;
}

export function listMetadataKey(keyPrefix: string, envelopeId: string): string {
  return `${keyPrefix}meta:${envelopeId}`;
}

export function listDelayedKey(keyPrefix: string, delayedSetKey: string): string {
  return `${keyPrefix}${delayedSetKey}`;
}

export async function publishListMessage(
  redis: ListCommandClient,
  queueKey: string,
  topic: string,
  message: SagaMessage,
  now: Date,
  createId: () => string,
): Promise<void> {
  await redis.rpush(queueKey, encodeListTransportMessage(createId(), topic, message, now));
}

export async function moveNextListMessage(
  client: ListBlockingCommandClient | undefined,
  record: ListCommandRecord,
  blockTimeoutMs: number,
): Promise<string | undefined> {
  if (!client) return undefined;
  try {
    return await client.blmove(
      record.queueKey,
      record.processingKey,
      'RIGHT',
      'LEFT',
      blockTimeoutMs / 1000,
    ) ?? undefined;
  } catch {
    return await client.brpoplpush(record.queueKey, record.processingKey, blockTimeoutMs / 1000) ??
      undefined;
  }
}

export async function acknowledgeListMessage(
  redis: ListCommandClient,
  processingKey: string,
  messageJson: string,
  metadataKey: string,
): Promise<void> {
  await redis.lrem(processingKey, 1, messageJson);
  await redis.del(metadataKey);
}

export async function storeListMetadata(
  redis: ListCommandClient,
  metadataKey: string,
  retryCount: number,
  now: Date,
): Promise<void> {
  await redis.hset(metadataKey, {
    startedAt: now.getTime().toString(),
    retryCount: retryCount.toString(),
  });
  await redis.expire(metadataKey, 86400);
}

export async function reclaimListRecords(
  redis: ListCommandClient,
  records: readonly ListCommandRecord[],
  options: ListCommandOptions,
): Promise<void> {
  await Promise.all(records.map((record) => reclaimListRecord(redis, record, options)));
}

export async function reclaimListRecord(
  redis: ListCommandClient,
  record: ListCommandRecord,
  options: ListCommandOptions,
): Promise<void> {
  try {
    const messages = await redis.lrange(record.processingKey, 0, -1);
    await Promise.all(
      messages.map((messageJson) => reclaimListMessage(redis, record, messageJson, options)),
    );
  } catch (error) {
    options.logger?.error('List saga transport orphan reclaim error.', { error });
  }
}

export async function reclaimListMessage(
  redis: ListCommandClient,
  record: ListCommandRecord,
  messageJson: string,
  options: ListCommandOptions,
): Promise<void> {
  const decoded = decodeListTransportMessage(messageJson);
  const metadataKey = listMetadataKey(options.keyPrefix, decoded.envelopeId);
  const metadata = await redis.hgetall(metadataKey);
  const retryCount = Number.parseInt(metadata.retryCount ?? '0', 10);
  const startedAt = Number.parseInt(metadata.startedAt ?? '0', 10);
  const processingTime = options.now().getTime() - startedAt;
  if (processingTime <= options.minProcessingTimeMs) return;

  if (retryCount >= options.maxRetries) {
    await moveListMessageToDeadLetter(redis, record, messageJson, metadataKey, options);
    return;
  }

  await requeueListMessage(redis, record, messageJson, metadataKey, retryCount + 1, options);
}

export async function requeueListMessage(
  redis: ListCommandClient,
  record: ListCommandRecord,
  messageJson: string,
  metadataKey: string,
  retryCount: number,
  options: ListCommandOptions,
): Promise<void> {
  await storeListMetadata(redis, metadataKey, retryCount, options.now());
  await redis.lrem(record.processingKey, 1, messageJson);
  await redis.lpush(record.queueKey, messageJson);
}

export async function moveListMessageToDeadLetter(
  redis: ListCommandClient,
  record: ListCommandRecord,
  messageJson: string,
  metadataKey: string,
  options: ListCommandOptions,
): Promise<void> {
  await redis.lrem(record.processingKey, 1, messageJson);
  await redis.rpush(listDeadLetterKey(options.keyPrefix, record.topic), messageJson);
  await redis.del(metadataKey);
}

function createDefaultListClient(connection: RedisConnectionOptions): ListTransportClient {
  return new Redis({
    host: connection.host ?? 'localhost',
    port: connection.port ?? 6379,
    password: connection.password,
    db: connection.db ?? 0,
    tls: connection.tls,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }) as unknown as ListTransportClient;
}
