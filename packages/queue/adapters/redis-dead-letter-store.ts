/**
 * Redis-backed dead-letter store for queue terminal failures.
 *
 * @module
 */

import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';

/**
 * Minimal Redis command surface consumed by {@link RedisDeadLetterStore}.
 */
export interface RedisDeadLetterCommands {
  /** Append one encoded record to the DLQ list. */
  rpush(key: string, value: string): Promise<number> | number;
  /** Read encoded records from the DLQ list. */
  lrange(key: string, start: number, stop: number): Promise<string[]> | string[];
  /** Return the DLQ list length. */
  llen(key: string): Promise<number> | number;
  /** Pop the oldest encoded record from the DLQ list. */
  lpop(key: string): Promise<string | null> | string | null;
}

/**
 * Options for {@link RedisDeadLetterStore}.
 */
export interface RedisDeadLetterStoreOptions {
  /** Redis command client shared with the queue adapter. */
  commands: RedisDeadLetterCommands;
  /** Queue namespace whose dead-letter records are stored. */
  queueName: string;
}

/**
 * Durable dead-letter store backed by a Redis LIST.
 *
 * @template T - Original message payload type.
 */
export class RedisDeadLetterStore<T = unknown> implements DeadLetterStorePort<T> {
  private readonly commands: RedisDeadLetterCommands;
  private readonly key: string;

  /**
   * Create a Redis-backed dead-letter store.
   *
   * @param options - Store configuration and Redis command client.
   */
  constructor(options: RedisDeadLetterStoreOptions) {
    this.commands = options.commands;
    this.key = `netscript:dlq:${options.queueName}`;
  }

  /**
   * Append a dead-letter record to the Redis list.
   *
   * @param record - Record to append.
   */
  async append(record: DeadLetterRecord<T>): Promise<void> {
    await this.commands.rpush(this.key, JSON.stringify(record));
  }

  /**
   * List records in Redis list order.
   *
   * @param options - Optional maximum number of records.
   * @returns Stored records.
   */
  async list(options: { limit?: number } = {}): Promise<DeadLetterRecord<T>[]> {
    const stop = options.limit === undefined ? -1 : Math.max(options.limit - 1, 0);
    const encoded = await this.commands.lrange(this.key, 0, stop);
    return encoded.map((entry) => JSON.parse(entry) as DeadLetterRecord<T>);
  }

  /**
   * Pop, re-enqueue, and count records sequentially.
   *
   * @param reenqueue - Adapter-owned requeue callback.
   * @param options - Optional maximum number of records.
   * @returns Number of records reprocessed.
   */
  async reprocess(
    reenqueue: (record: DeadLetterRecord<T>) => Promise<void>,
    options: { limit?: number } = {},
  ): Promise<number> {
    let count = 0;
    while (options.limit === undefined || count < options.limit) {
      const encoded = await this.commands.lpop(this.key);
      if (encoded === null) {
        break;
      }
      const record = JSON.parse(encoded) as DeadLetterRecord<T>;
      await reenqueue(record);
      count++;
    }
    return count;
  }

  /**
   * Count stored records.
   *
   * @returns Number of records for this queue namespace.
   */
  async depth(): Promise<number> {
    return await this.commands.llen(this.key);
  }
}
