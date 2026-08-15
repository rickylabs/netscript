import { assertEquals, assertRejects, assertStrictEquals } from '@std/assert';
import { CacheAttributes, CacheOperations, CacheOutcomes } from '@netscript/telemetry/attributes';
import { closeKv, getKv, resetKv } from '../../../kv/application/shared.ts';
import { CacheQuery } from '../../src/cache/cache-query.ts';
import {
  CacheEvents,
  type CacheSpanAttributes,
  type CacheTelemetry,
  type CacheTelemetrySpan,
} from '../../src/cache/cache-telemetry.ts';
import { KvCacheStore } from '../../src/cache/kv-cache-store.ts';

type RecordedEvent = {
  readonly name: string;
  readonly attributes: CacheSpanAttributes;
};

type RecordedSpan = {
  readonly attributes: CacheSpanAttributes;
  readonly events: RecordedEvent[];
};

class RecordingCacheTelemetry implements CacheTelemetry {
  readonly spans: RecordedSpan[] = [];

  async withSpan<T>(
    _name: typeof CacheOperations[keyof typeof CacheOperations],
    attributes: CacheSpanAttributes,
    operation: (span: CacheTelemetrySpan) => Promise<T>,
  ): Promise<T> {
    const recorded: RecordedSpan = { attributes: { ...attributes }, events: [] };
    this.spans.push(recorded);
    return await operation({
      setAttributes: (values) => Object.assign(recorded.attributes, values),
      addEvent: (name, values = {}) => {
        recorded.events.push({ name, attributes: { ...values } });
      },
    });
  }

  captureParent() {
    return { run: <T>(operation: () => Promise<T>): Promise<T> => operation() };
  }
}

Deno.test('CacheQuery returns loaded data when real Deno KV rejects an oversized cache write', async () => {
  const queryKey = ['kv-limit', 'oversized'];
  const payload = { value: 'x'.repeat(80_000) };
  let loaderCalls = 0;

  try {
    await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
    const store = new KvCacheStore();
    const telemetry = new RecordingCacheTelemetry();
    const cache = new CacheQuery(store, new Map(), telemetry);
    const result = await cache.query(queryKey, {
      operationId: 'kv-limit.oversized',
      queryFn: () => {
        loaderCalls += 1;
        return Promise.resolve(payload);
      },
    });

    assertStrictEquals(result, payload);
    assertEquals(loaderCalls, 1);
    const readSpan = telemetry.spans[0];
    const writeEvent = readSpan.events.find((event) => event.name === CacheEvents.WRITE);
    assertEquals(writeEvent?.attributes[CacheAttributes.OPERATION], CacheOperations.READ);
    assertEquals(writeEvent?.attributes[CacheAttributes.OUTCOME], CacheOutcomes.ERROR);
    assertEquals(writeEvent?.attributes[CacheAttributes.TOPOLOGY_COMPLETE], false);
    assertEquals(await cache.getCachedData(queryKey, 'kv-limit.verify-miss'), null);
    await assertRejects(
      () => cache.setCachedData(['kv-limit', 'explicit-write'], payload, 60_000),
      TypeError,
      'Value too large (max 65536 bytes)',
    );
  } finally {
    await closeKv();
    await resetKv();
  }
});
