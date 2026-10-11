import type { AtomicCheck, AtomicMutation, KvEntry, KvKey, KvStore } from '@netscript/kv';
import type { SagaStateEnvelope } from '../domain/mod.ts';

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
      ? String((entry.value as Projection).instanceId)
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
