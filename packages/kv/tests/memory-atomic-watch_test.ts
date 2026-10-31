import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { FakeTime } from '@std/testing/time';
import { keyToString } from '../application/keys.ts';
import { type AtomicMutation, type KvEntry, MemoryKvAdapter, type WatchEvent } from '../mod.ts';

const HEAD = ['index', 'head'] as const;
const MANIFEST = ['index', 'manifest'] as const;
const PREFIX = ['index'] as const;
const MISSING = ['index', 'missing'] as const;
const TTL_MS = 20;
const DELIVERY_TIMEOUT_MS = 2_000;

const scenarios: {
  name: string;
  mutations: AtomicMutation[];
  values: (bigint | null)[];
  previousValues: bigint[];
  final: bigint | null;
  expires?: true;
}[] = [
  {
    name: 'set with TTL',
    mutations: [{ type: 'set', key: HEAD, value: 11n, expireIn: TTL_MS }],
    values: [11n],
    previousValues: [10n],
    final: 11n,
    expires: true,
  },
  {
    name: 'delete',
    mutations: [{ type: 'delete', key: HEAD }],
    values: [null],
    previousValues: [10n],
    final: null,
  },
  ...(['sum', 'min', 'max'] as const).map((type) => ({
    name: type,
    mutations: [{ type, key: HEAD, value: 15n }],
    values: [type === 'sum' ? 25n : type === 'min' ? 10n : 15n],
    previousValues: [10n],
    final: type === 'sum' ? 25n : type === 'min' ? 10n : 15n,
  })),
  {
    name: 'repeated key',
    mutations: [
      { type: 'set', key: HEAD, value: 11n },
      { type: 'sum', key: HEAD, value: 2n },
      { type: 'delete', key: HEAD },
    ],
    values: [11n, 13n, null],
    previousValues: [10n, 11n, 13n],
    final: null,
  },
];

for (const mode of ['keys', 'prefix'] as const) {
  for (const scenario of scenarios) {
    Deno.test(`MemoryKvAdapter atomic ${mode} notifications follow all writes: ${scenario.name}`, async () => {
      using time = new FakeTime();
      await using kv = new MemoryKvAdapter();
      const controller = new AbortController();
      await kv.set(HEAD, 10n);
      await kv.set(MANIFEST, 20n);

      const stream: AsyncIterable<WatchEvent<bigint>[] | WatchEvent<bigint>> = mode === 'keys'
        ? kv.watch<bigint>([HEAD, MANIFEST], { signal: controller.signal })
        : kv.watchPrefix<bigint>(PREFIX, { signal: controller.signal, skipInitial: true });
      const iterator = stream[Symbol.asyncIterator]();
      const pending = iterator.next();
      const readsAtNotification: Promise<(KvEntry<bigint> | null)[]>[] = [];

      // Public consumers resume after atomic() even on the broken adapter. Tap
      // the real synchronous subscription to capture reads at notification time.
      const handlers = mode === 'keys'
        ? kv['watchers'].get(keyToString(HEAD))
        : kv['prefixWatchers'].get(keyToString(PREFIX))?.handlers;
      assert(handlers);
      const capture = (event: WatchEvent): void => {
        if (keyToString(event.key) === keyToString(HEAD)) {
          readsAtNotification.push(Promise.all([kv.get<bigint>(HEAD), kv.get<bigint>(MANIFEST)]));
        }
      };
      handlers.add(capture);

      try {
        const result = await kv.atomic([], [
          ...scenario.mutations,
          { type: 'delete', key: MISSING },
          { type: 'set', key: MANIFEST, value: 200n },
        ]);
        assert(result.ok);

        const delivered: WatchEvent<bigint>[] = [];
        for (
          let next = await FakeTime.restoreFor(() => deadline(pending, DELIVERY_TIMEOUT_MS));
          !next.done;
        ) {
          delivered.push(...(Array.isArray(next.value) ? next.value : [next.value]));
          if (mode === 'keys' || delivered.length === scenario.values.length + 1) break;
          next = await FakeTime.restoreFor(() => deadline(iterator.next(), DELIVERY_TIMEOUT_MS));
        }
        assertEquals(delivered.map((event) => event.key), [
          ...scenario.values.map(() => HEAD),
          MANIFEST,
        ]);
        assertEquals(delivered.map((event) => event.value), [...scenario.values, 200n]);
        assertEquals(delivered.map((event) => event.previousValue), [
          ...scenario.previousValues,
          20n,
        ]);
        assertEquals(delivered.map((event) => event.type), [
          ...scenario.values.map((value) => value === null ? 'delete' : 'set'),
          'set',
        ]);
        assert(delivered.every((event) => event.versionstamp === result.versionstamp));

        // Assert outside callbacks: notification dispatch intentionally swallows
        // handler errors. Each read must capture the complete committed state.
        assertEquals(readsAtNotification.length, scenario.values.length);
        for (const reads of readsAtNotification) {
          const [head, manifest] = await reads;
          assertEquals(head?.value ?? null, scenario.final);
          assertEquals(manifest?.value, 200n, 'sibling must exist before the first notification');
          assertEquals(manifest?.versionstamp, result.versionstamp);
          if (head) assertEquals(head.versionstamp, result.versionstamp);
        }
        const [head, manifest] = await Promise.all([
          kv.get<bigint>(HEAD),
          kv.get<bigint>(MANIFEST),
        ]);
        assertEquals(head?.value ?? null, scenario.final);
        assertEquals(manifest?.value, 200n);

        if (scenario.expires) {
          time.tick(1_000); // Run the existing expiration sweep, not just lazy reads.
          const expired = await FakeTime.restoreFor(() =>
            deadline(iterator.next(), DELIVERY_TIMEOUT_MS)
          );
          assert(!expired.done);
          const events = Array.isArray(expired.value) ? expired.value : [expired.value];
          assertEquals(
            events.map(({ key, type, value, previousValue }) => ({
              key,
              type,
              value,
              previousValue,
            })),
            [{ key: HEAD, type: 'delete', value: null, previousValue: 11n }],
          );
          assertEquals(await kv.get(HEAD), null);
          assertEquals((await kv.get<bigint>(MANIFEST))?.value, 200n);
        }

        const standaloneEvents: WatchEvent[] = [];
        const observe = (event: WatchEvent): void => {
          standaloneEvents.push(event);
        };
        handlers.add(observe);
        await kv.set(HEAD, 300n);
        await kv.delete(HEAD);
        await kv.delete(HEAD);
        handlers.delete(observe);
        assertEquals(
          standaloneEvents.map(({ type, value, previousValue }) => ({
            type,
            value,
            previousValue,
          })),
          [
            { type: 'set', value: 300n, previousValue: scenario.expires ? null : scenario.final },
            { type: 'delete', value: null, previousValue: 300n },
          ],
        );
      } finally {
        handlers.delete(capture);
        controller.abort();
        time.tick(1_000); // Wake a prefix poll even when delivery failed.
        await iterator.return?.();
      }
    });
  }
}
