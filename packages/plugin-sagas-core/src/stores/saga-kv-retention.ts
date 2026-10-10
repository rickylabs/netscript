import type { AtomicMutation, KvKey, KvStore } from '@netscript/kv';
import type { SagaInstanceId, SagaStateEnvelope } from '../domain/mod.ts';

type RetentionCursor = Readonly<{
  expiresAt: number;
  family: 'transition' | 'applied';
  start?: KvKey;
}>;

/** Internal bounded terminal-history migration over the shared saga KV keyspace. */
export class SagaKvRetention {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #now: () => Date;
  #start?: KvKey;

  constructor(kv: KvStore, prefix: KvKey, now: () => Date) {
    this.#kv = kv;
    this.#prefix = prefix;
    this.#now = now;
  }

  key(instanceId: SagaInstanceId): KvKey {
    return [...this.#prefix, 'retention', instanceId];
  }

  mutation(instanceId: SagaInstanceId, expiresAt: number): AtomicMutation {
    return {
      type: 'set',
      key: this.key(instanceId),
      value: { expiresAt, family: 'transition' } satisfies RetentionCursor,
    };
  }

  /** Process at most one page; its durable cursor survives process shutdown and restart. */
  async cleanup(limit: number): Promise<boolean> {
    if (!Number.isSafeInteger(limit) || limit <= 0 || limit > 100) {
      throw new RangeError('Saga retention page size must be between 1 and 100.');
    }
    // Ten full 64 KiB values plus the cursor and key/check overhead fit the 800 KiB
    // Deno KV mutation budget as well as its check and mutation count limits.
    const pageSize = Math.min(limit, 10);
    const iterator = this.#kv.list<RetentionCursor>({
      prefix: [...this.#prefix, 'retention'],
      limit: 1,
      start: this.#start,
    });
    for await (const pending of iterator) {
      const instanceId = String(pending.key.at(-1)) as SagaInstanceId;
      const stateKey: KvKey = [...this.#prefix, 'state', instanceId];
      const state = await this.#kv.get<SagaStateEnvelope>(stateKey);
      if (state && !isTerminalSaga(state.value)) {
        // A later open state invalidates the terminal sweep; never delete its replay data.
        await this.#atomic([
          { key: pending.key, versionstamp: pending.versionstamp },
          { key: stateKey, versionstamp: state.versionstamp },
        ], [
          { type: 'delete', key: pending.key },
        ]);
        this.#start = [...pending.key, ''];
        return true;
      }
      const cursor = pending.value;
      const entries = [];
      for await (
        const entry of this.#kv.list({
          prefix: [...this.#prefix, cursor.family, instanceId],
          limit: pageSize,
          start: cursor.start,
        })
      ) entries.push(entry);
      const remaining = cursor.expiresAt - this.#now().getTime();
      const mutations: AtomicMutation[] = entries.map((entry) =>
        remaining <= 0
          ? { type: 'delete', key: entry.key }
          : { type: 'set', key: entry.key, value: entry.value, expireIn: remaining }
      );
      const finishedFamily = entries.length < pageSize;
      const finished = finishedFamily && cursor.family === 'applied';
      mutations.push(
        finished ? { type: 'delete', key: pending.key } : {
          type: 'set',
          key: pending.key,
          value: {
            expiresAt: cursor.expiresAt,
            family: finishedFamily ? 'applied' : cursor.family,
            // These key families have no child keys: extending the key skips it on every adapter.
            start: finishedFamily ? undefined : [...entries.at(-1)!.key, ''],
          } satisfies RetentionCursor,
        },
      );
      const result = await this.#atomic([
        { key: pending.key, versionstamp: pending.versionstamp },
        { key: stateKey, versionstamp: state?.versionstamp ?? null },
        ...entries.map(({ key, versionstamp }) => ({ key, versionstamp })),
      ], mutations);
      if (result.ok) this.#start = [...pending.key, ''];
      return true;
    }
    const wrapped = this.#start !== undefined;
    this.#start = undefined;
    return wrapped;
  }

  #atomic(checks: Parameters<NonNullable<KvStore['atomic']>>[0], mutations: AtomicMutation[]) {
    if (!this.#kv.atomic) throw new Error('Saga retention requires atomic KV support.');
    return this.#kv.atomic(checks, mutations);
  }
}

/** Terminal states share one policy across canonical state, replay data, and read models. */
export function isTerminalSaga(envelope: SagaStateEnvelope): boolean {
  return ['completed', 'failed', 'cancelled', 'compensated'].includes(envelope.metadata.status);
}

/** Remaining time is anchored to terminal metadata rather than a later projection or replay. */
export function sagaRetentionRemaining(
  envelope: SagaStateEnvelope,
  days: number,
  now: Date,
): number | undefined {
  if (!isTerminalSaga(envelope)) return undefined;
  if (!Number.isFinite(days) || days <= 0) {
    throw new RangeError('Saga completedDays must be positive and finite.');
  }
  const settled = new Date(envelope.metadata.completedAt ?? envelope.metadata.updatedAt).getTime();
  if (!Number.isFinite(settled)) throw new TypeError('Saga terminal timestamp must be valid.');
  return settled + days * 86_400_000 - now.getTime();
}
