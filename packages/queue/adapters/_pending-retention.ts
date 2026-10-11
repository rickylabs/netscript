import type { KvEntry, KvKey, WatchableKv } from '@netscript/kv';

/** Internal bounded cancellation over the polling adapter's existing pending keys. */
export async function cancelPendingPage(
  kv: WatchableKv,
  queueName: string,
  resolve: (ids: readonly string[]) => Promise<readonly string[]>,
  onCancelled?: (retentionId: string) => void,
): Promise<boolean> {
  if (!kv.atomic) throw new TypeError('Pending cancellation requires atomic KV operations.');
  const cursorKey = ['queue:retention-cursor', queueName];
  const cursor = await kv.get<KvKey>(cursorKey);
  const page: KvEntry<{ retentionId?: string }>[] = [];
  for await (
    const entry of kv.list<{ retentionId?: string }>({
      prefix: ['queue:pending', queueName],
      start: cursor?.value,
      limit: 101,
    })
  ) {
    // KV start is inclusive. Never process the cursor entry twice.
    if (cursor && sameKey(entry.key, cursor.value)) continue;
    if (page.length === 100) break;
    page.push(entry);
  }
  const ids = [
    ...new Set(
      page.flatMap((entry) =>
        entry.value.retentionId === undefined ? [] : [entry.value.retentionId]
      ),
    ),
  ];
  const cancelled = new Set(ids.length === 0 ? [] : await resolve(ids));
  // One CAS per key avoids Deno KV check limits and never copies full-size queue values.
  for (const entry of page) {
    if (entry.value.retentionId !== undefined && cancelled.has(entry.value.retentionId)) {
      const deletion = await kv.atomic([{ key: entry.key, versionstamp: entry.versionstamp }], [
        { type: 'delete', key: entry.key },
      ]);
      if (deletion.ok) onCancelled?.(entry.value.retentionId);
    }
  }
  const more = page.length === 100;
  const result = await kv.atomic(
    [{ key: cursorKey, versionstamp: cursor?.versionstamp ?? null }],
    more
      ? [{ type: 'set', key: cursorKey, value: page.at(-1)!.key }]
      : [{ type: 'delete', key: cursorKey }],
  );
  return more || !result.ok;
}

function sameKey(left: KvKey, right: KvKey): boolean {
  return left.length === right.length && left.every((part, index) => part === right[index]);
}
