/**
 * Redis connection lifecycle management for the `@netscript/kv` Redis adapter.
 *
 * Encapsulates client creation, retry logic (via `@std/async/retry`), and
 * subscriber management. Extracted from `redis.adapter.ts` so that the adapter
 * class can focus on KV semantics (CRUD, watch, atomic) rather than connection
 * plumbing.
 *
 * @module
 */

import { retry } from '@std/async/retry';
import { createPackageLogger } from '@netscript/logger';
import { maskRedisUrl } from '../../core/auto-detect.ts';
import { KvClosedError, KvConnectionError } from '../../core/errors.ts';
import { toErrorMessage } from './serialization.ts';
import {
  DEFAULT_REDIS_URL,
  REDIS_CONNECT_TIMEOUT_MS,
  REDIS_KEEPALIVE_MS,
} from './types.ts';
import { Redis, type RedisOptions } from 'ioredis';

const logger = createPackageLogger('kv');

/**
 * Retry configuration shared by both client and subscriber connections.
 *
 * - **3 attempts** covers transient container startup delays.
 * - **500 ms → 5 s** exponential backoff with jitter prevents thundering herd.
 */
const RETRY_OPTIONS = {
  maxAttempts: 3,
  minTimeout: 500,
  maxTimeout: 5_000,
  jitter: 1,
} as const;

/**
 * Manages the lifecycle of ioredis client and subscriber connections for the
 * Redis KV adapter.
 *
 * The manager owns two independent Redis connections:
 *
 * 1. **Primary client** — used for all CRUD, SCAN, and MULTI/EXEC operations.
 * 2. **Subscriber** — a dedicated connection required by Redis pub/sub (a
 *    client in subscribe mode cannot issue normal commands).
 *
 * Both connections use `@std/async/retry` to handle transient failures common
 * in containerized environments (Aspire, Docker Compose) where Redis/Garnet
 * may not be ready at adapter startup.
 *
 * @example
 * ```ts
 * const mgr = new RedisConnectionManager("redis://localhost:6379", {});
 * const client = await mgr.ensureClient();
 * await client.set("key", "value");
 * await mgr.close();
 * ```
 */
export class RedisConnectionManager {
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private clientPromise: Promise<Redis> | null = null;
  private closed = false;

  /**
   * @param url     - Redis connection URL.
   * @param options - Additional ioredis client options.
   */
  constructor(
    private readonly url: string,
    private readonly options: RedisOptions,
  ) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Resolve the primary Redis client, connecting on first access.
   *
   * Concurrent callers share the same connection promise so that only one
   * physical connection is established.
   *
   * @returns Connected Redis client.
   * @throws {KvClosedError} If the manager has been closed.
   */
  async ensureClient(): Promise<Redis> {
    if (this.closed) {
      throw new KvClosedError('RedisKvAdapter is closed.');
    }

    if (this.client) {
      return this.client;
    }

    if (!this.clientPromise) {
      this.clientPromise = this.connect();
    }

    this.client = await this.clientPromise;
    return this.client;
  }

  /**
   * Resolve the dedicated subscriber client, connecting on first access.
   *
   * A separate ioredis instance is required because Redis pub/sub locks the
   * connection into subscribe mode.
   *
   * @returns Connected Redis subscriber client.
   */
  async ensureSubscriber(): Promise<Redis> {
    if (this.subscriber) {
      return this.subscriber;
    }

    const subscriber = await retry(
      () => this.connectSubscriberOnce(),
      RETRY_OPTIONS,
    );

    this.subscriber = subscriber;
    return subscriber;
  }

  /**
   * Gracefully close both the primary and subscriber connections.
   *
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }

    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Whether the manager has been closed.
   */
  get isClosed(): boolean {
    return this.closed;
  }

  // ---------------------------------------------------------------------------
  // Private — Connection Establishment
  // ---------------------------------------------------------------------------

  /**
   * Connect the primary Redis client with automatic retry.
   *
   * Wraps {@linkcode connectOnce} with `@std/async/retry` to handle transient
   * connection failures.
   *
   * @returns Connected Redis client.
   */
  private async connect(): Promise<Redis> {
    return await retry(() => this.connectOnce(), RETRY_OPTIONS);
  }

  /**
   * Attempt a single primary client connection.
   *
   * @returns Connected Redis client.
   * @throws {KvConnectionError} When the connection attempt fails.
   */
  private async connectOnce(): Promise<Redis> {
    const client = new Redis(this.url, this.createRedisOptions());

    await new Promise<void>((resolve, reject) => {
      client.once('ready', () => resolve());
      client.once('error', (error: Error) => reject(error));
    }).catch((error: unknown) => {
      throw new KvConnectionError(
        `Failed to connect RedisKvAdapter to ${maskRedisUrl(this.url)}: ${toErrorMessage(error)}`,
        { cause: error },
      );
    });

    logger.info('Connected Redis KV adapter', { url: maskRedisUrl(this.url) });

    client.on('error', (error: Error) => {
      logger.error('Redis KV client reported an error', { error: error.message });
    });

    return client;
  }

  /**
   * Attempt a single subscriber connection.
   *
   * @returns Connected Redis subscriber.
   * @throws {KvConnectionError} When the connection attempt fails.
   */
  private async connectSubscriberOnce(): Promise<Redis> {
    const subscriber = new Redis(this.url, this.createRedisOptions());

    await new Promise<void>((resolve, reject) => {
      subscriber.once('ready', () => resolve());
      subscriber.once('error', (error: Error) => reject(error));
    }).catch((error: unknown) => {
      throw new KvConnectionError(
        `Failed to connect RedisKvAdapter subscriber to ${maskRedisUrl(this.url)}: ${
          toErrorMessage(error)
        }`,
        { cause: error },
      );
    });

    subscriber.on('error', (error: Error) => {
      logger.error('Redis KV subscriber reported an error', { error: error.message });
    });

    logger.debug('Connected Redis KV subscriber', { url: maskRedisUrl(this.url) });
    return subscriber;
  }

  // ---------------------------------------------------------------------------
  // Private — Configuration
  // ---------------------------------------------------------------------------

  /**
   * Build the ioredis options object used by both clients.
   *
   * @returns Normalized Redis client options.
   */
  private createRedisOptions(): RedisOptions {
    const options: RedisOptions = {
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      enableReadyCheck: true,
      keepAlive: REDIS_KEEPALIVE_MS,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      ...this.options,
    };

    if (this.url.startsWith('rediss://') && !options.tls) {
      options.tls = { rejectUnauthorized: false };
      logger.warn('Using rediss:// with rejectUnauthorized=false for Redis KV adapter', {
        url: maskRedisUrl(this.url),
      });
    }

    return options;
  }
}
