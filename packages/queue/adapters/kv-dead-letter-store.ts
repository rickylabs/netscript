/**
 * KV-backed dead-letter store for queue terminal failures.
 *
 * @module
 */

import { DenoKvAdapter, getKv, type KvKey, type WatchableKv } from '@netscript/kv';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';
import { QueueConfigurationError } from '../ports/errors.ts';

const DLQ_PREFIX = 'queue:dlq';
const DLQ_IDENTITY_PREFIX = 'queue:dlq:identity';

/**
 * Options for {@link KvDeadLetterStore}.
 */
export interface KvDeadLetterStoreOptions {
  /**
   * Queue namespace whose dead-letter records are stored.
   */
  queueName: string;

  /**
   * Caller-owned `@netscript/kv` adapter supporting atomic compare-and-swap.
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
   * Persist the first terminal record for a message, retaining the ordered DLQ key layout.
   *
   * @param record - Record to append.
   */
  async append(record: DeadLetterRecord<T>): Promise<void> {
    const kv = await this.ensureKv();
    if (!kv.atomic) {
      throw new QueueConfigurationError('KV dead-letter storage requires atomic compare-and-swap');
    }
    // A redelivery has a new failedAt; the identity index makes concurrent appends idempotent.
    // Both writes commit together, so no marker can suppress a record that was never persisted.
    await kv.atomic(
      [{ key: this.identityKey(record.messageId), versionstamp: null }],
      [
        { type: 'set', key: this.identityKey(record.messageId), value: this.recordKey(record) },
        { type: 'set', key: this.recordKey(record), value: record },
      ],
    );
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
   * Claim stored records before requeue, restoring them when the callback rejects.
   * A message that fails again during requeue keeps its new terminal record.
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
    if (!kv.atomic) {
      throw new QueueConfigurationError('KV dead-letter storage requires atomic compare-and-swap');
    }
    // Bound the streaming traversal to the current tail. Later failures stay for the next call,
    // even when the KV iterator fetches another batch after a requeue callback runs.
    let end: KvKey | undefined;
    for await (const entry of kv.list({ prefix: this.prefix, reverse: true, limit: 1 })) {
      end = [...entry.key, ''];
    }
    if (!end) return 0;
    let count = 0;
    for await (
      const entry of kv.list<DeadLetterRecord<T>>({
        prefix: this.prefix,
        limit: options.limit,
        end,
      })
    ) {
      const identityKey = this.identityKey(entry.value.messageId);
      const identity = await kv.get<KvKey>(identityKey);
      // Legacy rows have no index. Never delete an index that points to a different row.
      const ownsIdentity = identity !== null &&
        identity.value.length === entry.key.length &&
        identity.value.every((part, index) => part === entry.key[index]);
      const removed = await kv.atomic(
        [
          { key: entry.key, versionstamp: entry.versionstamp },
          ...(ownsIdentity ? [{ key: identityKey, versionstamp: identity.versionstamp }] : []),
        ],
        [
          { type: 'delete', key: entry.key },
          ...(ownsIdentity ? [{ type: 'delete' as const, key: identityKey }] : []),
        ],
      );
      // Only the CAS winner may requeue: competing reprocessors skip stale entries before
      // invoking the callback. Releasing the identity also lets immediate re-failures append.
      if (!removed.ok) continue;
      try {
        await reenqueue(entry.value);
      } catch (error) {
        if (ownsIdentity) {
          // Idempotent append restores both keys without overwriting a newer failure.
          await this.append(entry.value);
        } else {
          // A legacy row must be restored even if a different row already owns the identity.
          await kv.atomic(
            [{ key: entry.key, versionstamp: null }],
            [{ type: 'set', key: entry.key, value: entry.value }],
          );
        }
        throw error;
      }
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

  /**
   * Resolve the configured KV adapter or lazily open the shared KV adapter.
   */
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

  /**
   * Key prefix used to list this queue's DLQ records.
   */
  private get prefix(): KvKey {
    return [DLQ_PREFIX, this.queueName];
  }

  /**
   * Build the stable KV key for one DLQ record.
   */
  private recordKey(record: DeadLetterRecord<T>): KvKey {
    return [DLQ_PREFIX, this.queueName, record.failedAt, record.messageId];
  }

  /** Identity index lives only as long as its stored dead-letter record. */
  private identityKey(messageId: string): KvKey {
    return [DLQ_IDENTITY_PREFIX, this.queueName, messageId];
  }
}
