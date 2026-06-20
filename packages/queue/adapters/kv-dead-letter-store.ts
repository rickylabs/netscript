/**
 * KV-backed dead-letter store for queue terminal failures.
 *
 * @module
 */

import { DenoKvAdapter, getKv, type KvKey, type WatchableKv } from '@netscript/kv';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';

const DLQ_PREFIX = 'queue:dlq';

/**
 * Options for {@link KvDeadLetterStore}.
 */
export interface KvDeadLetterStoreOptions {
  /**
   * Queue namespace whose dead-letter records are stored.
   */
  queueName: string;

  /**
   * Caller-owned `@netscript/kv` adapter.
   */
  kv?: WatchableKv;

  /**
   * Caller-owned raw Deno KV instance.
   */
  denoKv?: Deno.Kv;
}

/**
 * Durable dead-letter store backed by the shared NetScript KV contract.
 *
 * @template T - Original message payload type.
 */
export class KvDeadLetterStore<T = unknown> implements DeadLetterStorePort<T> {
  private readonly queueName: string;
  private readonly explicitKv?: WatchableKv;
  private readonly explicitDenoKv?: Deno.Kv;
  private kv: WatchableKv | null = null;

  /**
   * Create a KV-backed dead-letter store.
   *
   * @param options - Queue name and optional caller-owned KV dependency.
   */
  constructor(options: KvDeadLetterStoreOptions) {
    this.queueName = options.queueName;
    this.explicitKv = options.kv;
    this.explicitDenoKv = options.denoKv;
  }

  /**
   * Persist a dead-letter record using the stable queue DLQ key layout.
   *
   * @param record - Record to append.
   */
  async append(record: DeadLetterRecord<T>): Promise<void> {
    const kv = await this.ensureKv();
    await kv.set(this.recordKey(record), record);
  }

  /**
   * List dead-letter records in KV key order.
   *
   * @param options - Optional maximum number of records.
   * @returns Stored records.
   */
  async list(options: { limit?: number } = {}): Promise<DeadLetterRecord<T>[]> {
    const kv = await this.ensureKv();
    const records: DeadLetterRecord<T>[] = [];
    for await (
      const entry of kv.list<DeadLetterRecord<T>>({
        prefix: this.prefix,
        limit: options.limit,
      })
    ) {
      records.push(entry.value);
    }
    return records;
  }

  /**
   * Re-enqueue stored records and delete each record after successful requeue.
   *
   * @param reenqueue - Adapter-owned requeue callback.
   * @param options - Optional maximum number of records.
   * @returns Number of records reprocessed.
   */
  async reprocess(
    reenqueue: (record: DeadLetterRecord<T>) => Promise<void>,
    options: { limit?: number } = {},
  ): Promise<number> {
    const kv = await this.ensureKv();
    let count = 0;
    for await (
      const entry of kv.list<DeadLetterRecord<T>>({
        prefix: this.prefix,
        limit: options.limit,
      })
    ) {
      await reenqueue(entry.value);
      await kv.delete(entry.key);
      count++;
    }
    return count;
  }

  /**
   * Count stored dead-letter records.
   *
   * @returns Number of records for this queue namespace.
   */
  async depth(): Promise<number> {
    const kv = await this.ensureKv();
    let count = 0;
    for await (const _entry of kv.list({ prefix: this.prefix })) {
      count++;
    }
    return count;
  }

  private async ensureKv(): Promise<WatchableKv> {
    if (this.kv) {
      return this.kv;
    }

    if (this.explicitKv) {
      this.kv = this.explicitKv;
      return this.kv;
    }

    if (this.explicitDenoKv) {
      this.kv = new DenoKvAdapter(this.explicitDenoKv);
      return this.kv;
    }

    this.kv = await getKv();
    return this.kv;
  }

  private get prefix(): KvKey {
    return [DLQ_PREFIX, this.queueName];
  }

  private recordKey(record: DeadLetterRecord<T>): KvKey {
    return [DLQ_PREFIX, this.queueName, record.failedAt, record.messageId];
  }
}
