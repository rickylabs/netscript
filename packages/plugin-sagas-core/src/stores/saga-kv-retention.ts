import type { AtomicCheck, AtomicMutation, KvEntry, KvKey, KvStore } from '@netscript/kv';
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

  /** Discover legacy families in a bounded operator pass using the live-write policy. */
  backfill(
    days: number | ((envelope: SagaStateEnvelope) => number),
    migration = 'legacy-terminal-v1',
    limit = 10,
  ): Promise<SagaBackfillResult> {
    return backfillSagaRetention(
      this.#kv,
      this.#prefix,
      (envelope) =>
        sagaRetentionRemaining(
          envelope,
          typeof days === 'number' ? days : days(envelope),
          this.#now(),
        ),
      migration,
      limit,
    );
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

type Cursor = Readonly<{ family: number; start?: KvKey; done?: boolean }>;
type Projection = Readonly<{
  instanceId: string;
  sagaId: string;
  status: SagaStateEnvelope['metadata']['status'];
  updatedAt: string;
  completedAt?: string;
}>;

/** Internal operator receipt for one bounded migration pass. */
export type SagaBackfillResult = Readonly<{
  done: boolean;
  scanned: number;
  changed: number;
  retained: number;
  conflicted: boolean;
}>;

/** Legacy discovery uses the same deadline policy as forward saga writes. */
export async function backfillSagaRetention(
  kv: KvStore,
  prefix: KvKey,
  remaining: (envelope: SagaStateEnvelope) => number | undefined,
  migration: string,
  limit: number,
): Promise<SagaBackfillResult> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10) {
    throw new RangeError('Saga backfill page size must be between 1 and 10.');
  }
  if (!migration) throw new TypeError('A saga backfill migration identity is required.');
  if (!kv.atomic) throw new Error('Saga retention requires atomic KV support.');
  const cursorKey: KvKey = [...prefix, 'retention-backfill', migration];
  const saved = await kv.get<Cursor>(cursorKey);
  const cursor = saved?.value ?? { family: 0 };
  const receipt = { done: !!cursor.done, scanned: 0, changed: 0, retained: 0, conflicted: false };
  if (cursor.done) return receipt;
  // Canonical state comes last so every ancillary family can still prove terminal ownership.
  const families = [
    'correlation',
    'correlation-instance',
    'transition',
    'applied',
    'projection',
    'state',
  ];
  const family = families[cursor.family]!;
  const scanPrefix = family === 'projection' ? ['saga_instances'] : [...prefix, family];
  const entries: KvEntry[] = [];
  for await (const entry of kv.list({ prefix: scanPrefix, start: cursor.start, limit })) {
    entries.push(entry);
  }
  const ownerKeys = entries.map((entry): KvKey => [
    ...prefix,
    'state',
    family === 'correlation'
      ? String(entry.value)
      : family === 'correlation-instance'
      ? String(entry.key.at(-1))
      : family === 'projection'
      ? String(entry.key.at(-1))
      : String(entry.key[prefix.length + 1]),
  ]);
  const owners = kv.getMany
    ? await kv.getMany<SagaStateEnvelope>(ownerKeys)
    : await Promise.all(ownerKeys.map((key) => kv.get<SagaStateEnvelope>(key)));
  const checks: AtomicCheck[] = [{ key: cursorKey, versionstamp: saved?.versionstamp ?? null }];
  const mutations: AtomicMutation[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const owner = owners[i];
    checks.push({ key: entry.key, versionstamp: entry.versionstamp }, {
      key: ownerKeys[i]!,
      versionstamp: owner?.versionstamp ?? null,
    });
    let envelope = owner?.value;
    if (family === 'projection' && (entry.value as Projection).instanceId !== entry.key.at(-1)) {
      receipt.retained++;
      continue;
    }
    // A terminal read model is evidence even if old canonical TTL has already elapsed.
    if (!envelope && family === 'projection') {
      const projection = entry.value as Projection;
      envelope = {
        state: {},
        metadata: {
          instanceId: projection.instanceId as SagaStateEnvelope['metadata']['instanceId'],
          sagaId: projection.sagaId,
          status: projection.status,
          version: 0,
          durability: 't3',
          createdAt: new Date(projection.updatedAt),
          updatedAt: new Date(projection.updatedAt),
          completedAt: projection.completedAt ? new Date(projection.completedAt) : undefined,
        },
      };
    }
    const expireIn = envelope ? remaining(envelope) : undefined;
    if (expireIn === undefined) receipt.retained++;
    else {
      mutations.push(
        expireIn <= 0 ? { type: 'delete', key: entry.key } : {
          type: 'set',
          key: entry.key,
          value: entry.value,
          expireIn,
        },
      );
      receipt.changed++;
    }
  }
  const finishedFamily = entries.length < limit;
  const next: Cursor = finishedFamily
    ? { family: cursor.family + 1, done: cursor.family + 1 === families.length }
    : { family: cursor.family, start: [...entries.at(-1)!.key, ''] };
  mutations.push({ type: 'set', key: cursorKey, value: next });
  const result = await kv.atomic(checks, mutations);
  return {
    ...receipt,
    done: result.ok && !!next.done,
    scanned: entries.length,
    changed: result.ok ? receipt.changed : 0,
    conflicted: !result.ok,
  };
}
