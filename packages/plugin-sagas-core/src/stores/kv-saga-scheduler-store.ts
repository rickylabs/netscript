import type { AtomicMutation, KvEntry, KvKey, KvStore } from '@netscript/kv';
import type { SagaInstanceId, SagaMessageId } from '../domain/mod.ts';
import type {
  SagaScheduledMessageRecord,
  SagaSchedulerStorePort,
} from '../runtime/saga-scheduler.ts';

/** KV scheduler configuration; the caller owns the supplied adapter and clock. */
export type KvSagaSchedulerStoreOptions = Readonly<{
  kv: KvStore;
  prefix?: KvKey;
  now?: () => Date;
  /** Claimed messages become eligible for retry after this lease, default 30 seconds. */
  claimLeaseMs?: number;
}>;

type Cursor = Readonly<{ start?: KvKey }>;

/**
 * Durable scheduler store with bounded scans, CAS claims, and originating instance retention.
 *
 * @example
 * ```ts
 * import { DenoKvAdapter } from '@netscript/kv';
 * import { KvSagaSchedulerStore } from '@netscript/plugin-sagas-core/stores';
 *
 * await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
 * const store = new KvSagaSchedulerStore({ kv });
 * await store.claimDue(new Date(), 10);
 * ```
 */
export class KvSagaSchedulerStore implements SagaSchedulerStorePort {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #now: () => Date;
  readonly #lease: number;

  /** Construct a scheduler store over an atomic KV adapter. */
  constructor(options: KvSagaSchedulerStoreOptions) {
    if (!options.kv.atomic) throw new TypeError('Saga scheduler requires atomic KV support.');
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? ['sagas', 'scheduler'];
    this.#now = options.now ?? (() => new Date());
    this.#lease = options.claimLeaseMs ?? 30_000;
    if (!Number.isFinite(this.#lease) || this.#lease <= 0) {
      throw new RangeError('Scheduler claim lease must be positive and finite.');
    }
  }

  /** Insert once; replay cannot overwrite an existing claim, outcome, or deadline. */
  async save(record: SagaScheduledMessageRecord): Promise<void> {
    const remaining = record.expiresAt && record.expiresAt.getTime() - this.#now().getTime();
    if (remaining !== undefined && remaining <= 0) return;
    await this.#kv.atomic!([{ key: this.#key(record.id), versionstamp: null }], [{
      type: 'set',
      key: this.#key(record.id),
      value: { ...record, revision: crypto.randomUUID() },
      ...(remaining === undefined ? {} : { expireIn: remaining }),
    }]);
  }

  /** Scan at most ten records, claiming due work and recovering expired claims with CAS. */
  async claimDue(now: Date, limit: number): Promise<readonly SagaScheduledMessageRecord[]> {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new RangeError('Invalid claim limit.');
    const { entries, cursor, key } = await this.#page('due', Math.min(limit, 10));
    const due: SagaScheduledMessageRecord[] = [];
    for (const entry of entries) {
      const record = entry.value;
      if (record.expiresAt && record.expiresAt.getTime() <= now.getTime()) continue;
      const available = record.status === 'pending' ||
        (record.status === 'claimed' && record.claimedAt &&
          record.claimedAt.getTime() + this.#lease <= now.getTime());
      if (!available || record.scheduledFor.getTime() > now.getTime()) continue;
      const claimed: SagaScheduledMessageRecord = {
        ...record,
        status: 'claimed',
        claimedAt: now,
        attempts: record.attempts + 1,
        revision: crypto.randomUUID(),
      };
      if (await this.#replace(entry, claimed)) due.push(claimed);
    }
    await this.#advance(key, cursor, entries, Math.min(limit, 10));
    return due;
  }

  /** Mark an existing claim dispatched; a deleted record is never recreated. */
  markDispatched(
    id: SagaMessageId,
    dispatchedAt: Date,
    claim?: SagaScheduledMessageRecord,
  ): Promise<void> {
    return this.#mark(id, { status: 'dispatched', dispatchedAt }, claim);
  }

  /** Mark an existing claim failed; a deleted record is never recreated. */
  markFailed(
    id: SagaMessageId,
    failedAt: Date,
    error: string,
    claim?: SagaScheduledMessageRecord,
  ): Promise<void> {
    return this.#mark(id, { status: 'failed', failedAt, error }, claim);
  }

  /** Delete only the supplied revision, so concurrent rewrites survive cancellation. */
  async cancel(record: SagaScheduledMessageRecord): Promise<boolean> {
    const entry = await this.#kv.get<SagaScheduledMessageRecord>(this.#key(record.id));
    if (!entry || entry.value.revision !== record.revision) return false;
    return (await this.#kv.atomic!([
      { key: entry.key, versionstamp: entry.versionstamp },
    ], [{ type: 'delete', key: entry.key }])).ok;
  }

  /** Assign TTL or delete at most ten scoped records, persisting progress across restart. */
  async cleanupRetention(
    deadlines: (ids: readonly SagaInstanceId[]) => Promise<readonly (Date | undefined)[]>,
    now: Date,
  ): Promise<boolean> {
    const { entries, cursor, key } = await this.#page('retention', 10);
    const scoped = entries.filter((entry) => entry.value.instanceId !== undefined);
    const resolved = await deadlines(scoped.map((entry) => entry.value.instanceId!));
    for (let index = 0; index < scoped.length; index++) {
      const entry = scoped[index]!;
      const deadline = resolved[index];
      const expiresAt = deadline && entry.value.expiresAt
        ? new Date(Math.min(deadline.getTime(), entry.value.expiresAt.getTime()))
        : deadline;
      if (expiresAt && expiresAt.getTime() <= now.getTime()) {
        await this.#kv.atomic!([{ key: entry.key, versionstamp: entry.versionstamp }], [
          { type: 'delete', key: entry.key },
        ]);
      } else {
        // Keep a stable revision for a TTL refresh; changing ownership or deadline invalidates claims.
        const changed = entry.value.expiresAt?.getTime() !== expiresAt?.getTime();
        if (!changed) continue;
        await this.#replace(entry, {
          ...entry.value,
          expiresAt,
          revision: changed ? crypto.randomUUID() : entry.value.revision,
        }, now);
      }
    }
    return await this.#advance(key, cursor, entries, 10);
  }

  async #mark(
    id: SagaMessageId,
    outcome: Partial<SagaScheduledMessageRecord>,
    claim?: SagaScheduledMessageRecord,
  ): Promise<void> {
    const entry = await this.#kv.get<SagaScheduledMessageRecord>(this.#key(id));
    if (!entry || entry.value.status !== 'claimed') return;
    if (claim && entry.value.revision !== claim.revision) return;
    await this.#replace(entry, { ...entry.value, ...outcome });
  }

  async #replace(
    entry: KvEntry<SagaScheduledMessageRecord>,
    value: SagaScheduledMessageRecord,
    now = this.#now(),
  ): Promise<boolean> {
    const remaining = value.expiresAt && value.expiresAt.getTime() - now.getTime();
    const mutation: AtomicMutation = remaining !== undefined && remaining <= 0
      ? { type: 'delete', key: entry.key }
      : {
        type: 'set',
        key: entry.key,
        value,
        ...(remaining === undefined ? {} : { expireIn: remaining }),
      };
    return (await this.#kv.atomic!([
      { key: entry.key, versionstamp: entry.versionstamp },
    ], [mutation])).ok;
  }

  #key(id: SagaMessageId): KvKey {
    return [...this.#prefix, 'records', id];
  }

  async #page(name: string, limit: number) {
    const key: KvKey = [...this.#prefix, 'cursor', name];
    const cursor = await this.#kv.get<Cursor>(key);
    const entries: KvEntry<SagaScheduledMessageRecord>[] = [];
    for await (
      const entry of this.#kv.list<SagaScheduledMessageRecord>({
        prefix: [...this.#prefix, 'records'],
        start: cursor?.value.start,
        limit,
      })
    ) entries.push(entry);
    return { key, cursor, entries };
  }

  async #advance(
    key: KvKey,
    cursor: KvEntry<Cursor> | null,
    entries: readonly KvEntry<SagaScheduledMessageRecord>[],
    limit: number,
  ): Promise<boolean> {
    const backlog = entries.length === limit;
    const result = await this.#kv.atomic!([
      { key, versionstamp: cursor?.versionstamp ?? null },
    ], [{
      type: 'set',
      key,
      value: { start: backlog ? [...entries.at(-1)!.key, ''] : undefined } satisfies Cursor,
    }]);
    return backlog || !result.ok;
  }
}
