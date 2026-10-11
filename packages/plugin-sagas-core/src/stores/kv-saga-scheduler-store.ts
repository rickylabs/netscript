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
type StoredRecord = SagaScheduledMessageRecord & Readonly<{ revision: string }>;

/**
 * Durable scheduler store with a time-ordered due index, CAS claims, and bounded retention scans.
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
  readonly #claims = new WeakMap<SagaScheduledMessageRecord, string>();

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
    const stored: StoredRecord = { ...record, revision: crypto.randomUUID() };
    const mutations = this.#mutations(undefined, stored, this.#now());
    await this.#kv.atomic!([{ key: this.#key(record.id), versionstamp: null }], mutations);
  }

  /** Claim up to the caller's limit from the time-ordered due/lease index with CAS. */
  async claimDue(now: Date, limit: number): Promise<readonly SagaScheduledMessageRecord[]> {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new RangeError('Invalid claim limit.');
    const indexes: KvEntry<SagaMessageId>[] = [];
    for await (
      const index of this.#kv.list<SagaMessageId>({
        prefix: [...this.#prefix, 'due'],
        end: [...this.#prefix, 'due', now.getTime() + 1],
        limit,
      })
    ) indexes.push(index);
    const due: SagaScheduledMessageRecord[] = [];
    // Native Deno KV batch reads accept at most ten keys, independent of the claim limit.
    for (let offset = 0; offset < indexes.length; offset += 10) {
      const page = indexes.slice(offset, offset + 10);
      const keys = page.map((index) => this.#key(index.value));
      const entries = this.#kv.getMany
        ? await this.#kv.getMany<StoredRecord>(keys)
        : await Promise.all(keys.map((key) => this.#kv.get<StoredRecord>(key)));
      for (let index = 0; index < page.length; index++) {
        const indexed = page[index]!;
        const entry = entries[index];
        const record = entry?.value;
        const dueKey = record && this.#dueKey(record);
        const checks = [
          { key: indexed.key, versionstamp: indexed.versionstamp },
          { key: keys[index]!, versionstamp: entry?.versionstamp ?? null },
        ];
        // The list selector already guarantees the prefix; compare the time and id suffix.
        if (
          !record || !dueKey || dueKey.at(-2) !== indexed.key.at(-2) ||
          record.id !== indexed.key.at(-1)
        ) {
          // Repair stale index entries without deleting a concurrent replacement.
          await this.#kv.atomic!(checks, [{ type: 'delete', key: indexed.key }]);
          continue;
        }
        if (record.expiresAt && record.expiresAt.getTime() <= now.getTime()) {
          await this.#kv.atomic!(checks, this.#mutations(record, undefined, now));
          continue;
        }
        const claimed: StoredRecord = {
          ...record,
          status: 'claimed',
          claimedAt: now,
          attempts: record.attempts + 1,
          revision: crypto.randomUUID(),
        };
        const result = await this.#kv.atomic!(checks, this.#mutations(record, claimed, now));
        if (result.ok) {
          const { revision, ...snapshot } = claimed;
          this.#claims.set(snapshot, revision);
          due.push(snapshot);
        }
      }
    }
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

  /** Delete only the adapter's supplied claim snapshot, preserving concurrent rewrites. */
  async cancel(record: SagaScheduledMessageRecord): Promise<boolean> {
    const revision = this.#claims.get(record);
    if (!revision) return false;
    const entry = await this.#kv.get<StoredRecord>(this.#key(record.id));
    if (!entry || entry.value.revision !== revision) return false;
    return (await this.#kv.atomic!([
      { key: entry.key, versionstamp: entry.versionstamp },
    ], this.#mutations(entry.value, undefined, this.#now()))).ok;
  }

  /** Assign TTL or delete at most ten scoped records, persisting progress across restart. */
  async cleanupRetention(
    deadlines: (ids: readonly SagaInstanceId[]) => Promise<readonly (Date | undefined)[]>,
    now: Date,
  ): Promise<boolean> {
    const { entries, cursor, key } = await this.#page();
    const scoped = entries.filter((entry) => entry.value.instanceId !== undefined);
    const resolved = await deadlines(scoped.map((entry) => entry.value.instanceId!));
    for (let index = 0; index < scoped.length; index++) {
      const entry = scoped[index]!;
      const deadline = resolved[index];
      const expiresAt = deadline && entry.value.expiresAt
        ? new Date(Math.min(deadline.getTime(), entry.value.expiresAt.getTime()))
        : deadline;
      if (expiresAt && expiresAt.getTime() <= now.getTime()) {
        await this.#kv.atomic!(
          [{ key: entry.key, versionstamp: entry.versionstamp }],
          this.#mutations(entry.value, undefined, now),
        );
      } else {
        // A deadline update must not invalidate a live dispatch claim.
        const changed = entry.value.expiresAt?.getTime() !== expiresAt?.getTime();
        if (!changed) continue;
        await this.#replace(entry, {
          ...entry.value,
          expiresAt,
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
    const entry = await this.#kv.get<StoredRecord>(this.#key(id));
    if (!entry || entry.value.status !== 'claimed') return;
    if (claim && entry.value.revision !== this.#claims.get(claim)) return;
    await this.#replace(entry, { ...entry.value, ...outcome, revision: crypto.randomUUID() });
  }

  async #replace(
    entry: KvEntry<StoredRecord>,
    value: StoredRecord,
    now = this.#now(),
  ): Promise<boolean> {
    return (await this.#kv.atomic!([
      { key: entry.key, versionstamp: entry.versionstamp },
    ], this.#mutations(entry.value, value, now))).ok;
  }

  #dueKey(record: SagaScheduledMessageRecord): KvKey | undefined {
    const at = record.status === 'pending'
      ? record.scheduledFor.getTime()
      : record.status === 'claimed'
      ? (record.claimedAt ?? record.createdAt).getTime() + this.#lease
      : undefined;
    return at === undefined ? undefined : [...this.#prefix, 'due', at, record.id];
  }

  #mutations(
    previous: StoredRecord | undefined,
    next: StoredRecord | undefined,
    now: Date,
  ): AtomicMutation[] {
    const mutations: AtomicMutation[] = [];
    const oldDue = previous && this.#dueKey(previous);
    if (oldDue) mutations.push({ type: 'delete', key: oldDue });
    const remaining = next?.expiresAt && next.expiresAt.getTime() - now.getTime();
    if (!next || (remaining !== undefined && remaining <= 0)) {
      mutations.push({ type: 'delete', key: this.#key((previous ?? next)!.id) });
    } else {
      const ttl = remaining === undefined ? {} : { expireIn: remaining };
      mutations.push({ type: 'set', key: this.#key(next.id), value: next, ...ttl });
      const due = this.#dueKey(next);
      if (due) mutations.push({ type: 'set', key: due, value: next.id, ...ttl });
    }
    return mutations;
  }

  #key(id: SagaMessageId): KvKey {
    return [...this.#prefix, 'records', id];
  }

  async #page() {
    const key: KvKey = [...this.#prefix, 'cursor', 'retention'];
    const cursor = await this.#kv.get<Cursor>(key);
    const entries: KvEntry<StoredRecord>[] = [];
    for await (
      const entry of this.#kv.list<StoredRecord>({
        prefix: [...this.#prefix, 'records'],
        start: cursor?.value.start,
        limit: 10,
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
    const start = backlog ? [...entries.at(-1)!.key, ''] : undefined;
    // Both cursor keys have this store's prefix and the same trailing start sentinel.
    if (start?.at(-2) === cursor?.value.start?.at(-2)) return backlog;
    const mutation: AtomicMutation = start
      ? { type: 'set', key, value: { start } satisfies Cursor }
      : { type: 'delete', key };
    const result = await this.#kv.atomic!([
      { key, versionstamp: cursor?.versionstamp ?? null },
    ], [mutation]);
    return backlog || !result.ok;
  }
}
