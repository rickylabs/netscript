import type { TriggerRuntimeKvStoreOptions } from './kv-trigger-runtime-stores.ts';
import type { AtomicCheck, AtomicMutation, KvEntry, KvKey } from '@netscript/kv';
import type { TriggerEvent } from '../domain/mod.ts';
import type { TriggerDlqEntry } from '../ports/mod.ts';

type Cursor = Readonly<{ family: number; start?: KvKey; done?: boolean }>;

/** Internal receipt for one bounded terminal-family migration pass. */
export type TriggerBackfillResult = Readonly<{
  done: boolean;
  scanned: number;
  changed: number;
  retained: number;
  conflicted: boolean;
}>;

/** Backfill legacy events and DLQ families with the same policy as forward writes. */
export async function backfillTriggerRetention(
  options: TriggerRuntimeKvStoreOptions,
  migration = 'legacy-terminal-v1',
  limit = 10,
): Promise<TriggerBackfillResult> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10) {
    throw new RangeError('Trigger backfill page size must be between 1 and 10.');
  }
  if (!migration) throw new TypeError('A trigger backfill migration identity is required.');
  const { kv } = options;
  if (!kv.atomic) throw new Error('Trigger retention requires atomic KV support.');
  const prefix = options.prefix ?? ['triggers'];
  const now = (options.now ?? (() => new Date()))();
  const retention = options.kvRetentionDays ?? 7;
  const cursorKey: KvKey = [...prefix, 'retention-backfill', migration];
  const saved = await kv.get<Cursor>(cursorKey);
  const cursor = saved?.value ?? { family: 0 };
  const receipt = { done: !!cursor.done, scanned: 0, changed: 0, retained: 0, conflicted: false };
  if (cursor.done) return receipt;
  // Indexes are visited before records, which remain the terminal ownership proof.
  const families = [['by-trigger'], ['dlq', 'by-trigger'], ['dlq', 'entries'], ['events']];
  const family = families[cursor.family]!;
  const dlq = family[0] === 'dlq';
  const entries: KvEntry[] = [];
  for await (
    const entry of kv.list({ prefix: [...prefix, ...family], start: cursor.start, limit })
  ) {
    entries.push(entry);
  }
  const ownerKeys = entries.map((
    entry,
  ): KvKey => [...prefix, ...(dlq ? ['dlq', 'entries'] : ['events']), String(entry.key.at(-1))]);
  const eventKeys = entries.map((entry): KvKey => [...prefix, 'events', String(entry.key.at(-1))]);
  const read = <T>(keys: KvKey[]) =>
    kv.getMany ? kv.getMany<T>(keys) : Promise.all(keys.map((key) => kv.get<T>(key)));
  const owners = await read<TriggerEvent | TriggerDlqEntry>(ownerKeys);
  const events = dlq ? await read<TriggerEvent>(eventKeys) : [];
  const checks: AtomicCheck[] = [{ key: cursorKey, versionstamp: saved?.versionstamp ?? null }];
  const mutations: AtomicMutation[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const owner = owners[i];
    checks.push({ key: entry.key, versionstamp: entry.versionstamp }, {
      key: ownerKeys[i]!,
      versionstamp: owner?.versionstamp ?? null,
    });
    if (dlq) checks.push({ key: eventKeys[i]!, versionstamp: events[i]?.versionstamp ?? null });
    const event = dlq ? events[i]?.value : owner?.value as TriggerEvent | undefined;
    const open = event !== undefined && !['completed', 'failed', 'dlq'].includes(event.status);
    if (!owner || open) {
      receipt.retained++;
      continue;
    }
    const value = owner.value;
    const expireIn = remainingRetention(
      retention,
      value.triggerId,
      dlq ? (value as TriggerDlqEntry).failedAt : (value as TriggerEvent).updatedAt,
      now,
    );
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

/** Shared absolute deadline for forward writes and legacy backfill. */
export function remainingRetention(
  retention: number | ((triggerId: string) => number),
  triggerId: string,
  settledAt: string,
  now: Date,
): number {
  const days = typeof retention === 'number' ? retention : retention(triggerId);
  if (!Number.isFinite(days) || days <= 0) {
    throw new RangeError('Trigger kvRetentionDays must be positive and finite.');
  }
  const settled = Date.parse(settledAt);
  if (!Number.isFinite(settled)) throw new TypeError('Trigger settled timestamp must be valid.');
  return settled + days * 86_400_000 - now.getTime();
}
