import { assert, assertEquals } from '@std/assert';
import {
  type NativeStreamMetadata,
  SlidingStreamAccess,
} from '../../services/src/sliding-stream-access.ts';

const ACTIVE_STORE_PROBES_SYMBOL = Symbol.for('@netscript/async-context/active-store-probes');

interface ActiveAsyncStoreProbe {
  readonly name: string;
  readonly isActive: () => boolean;
}

function getRegisteredProbes(): ActiveAsyncStoreProbe[] {
  const registry: unknown = Reflect.get(globalThis, ACTIVE_STORE_PROBES_SYMBOL);
  return registry instanceof Set ? Array.from(registry as Set<ActiveAsyncStoreProbe>) : [];
}

Deno.test('SlidingStreamAccess registers and unregisters its active async-context probe cleanly', async () => {
  const store = new Map<string, NativeStreamMetadata>();
  const fakeDb = {
    get: (key: string) => store.get(key),
    put: (key: string | symbol, value: unknown) => {
      if (typeof key === 'string') store.set(key, value as NativeStreamMetadata);
      return true;
    },
    putSync: (key: string, value: NativeStreamMetadata) => {
      store.set(key, value);
      return true;
    },
    transactionAsync: async (callback: () => void) => {
      await Promise.resolve();
      callback();
    },
  };

  const beforeCount = getRegisteredProbes().filter(
    (probe) => probe.name === '@netscript/plugin-streams.slidingStreamAccess',
  ).length;

  const access = new SlidingStreamAccess(fakeDb, () => {});
  try {
    const probes = getRegisteredProbes().filter(
      (probe) => probe.name === '@netscript/plugin-streams.slidingStreamAccess',
    );
    assertEquals(probes.length, beforeCount + 1);
    const probe = probes.at(-1)!;

    assertEquals(probe.isActive(), false, 'probe must be inactive outside appendRequest');

    const activeInside = access.appendRequest('/orders/events', () => probe.isActive());
    assertEquals(activeInside, true, 'probe must report active inside appendRequest');

    assertEquals(probe.isActive(), false, 'probe must return inactive after appendRequest');
  } finally {
    await access.close();
  }

  const afterCount = getRegisteredProbes().filter(
    (probe) => probe.name === '@netscript/plugin-streams.slidingStreamAccess',
  ).length;
  assert(
    afterCount === beforeCount,
    `expected probe count to return to ${beforeCount} after close(), got ${afterCount}`,
  );
});
