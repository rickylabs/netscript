import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  CacheAttributes,
  type CacheOperation,
  CacheOperations,
  CacheOutcomes,
} from '@netscript/telemetry/attributes';
import type { Attributes, Tracer } from '@netscript/telemetry/tracer';
import {
  getActiveContext,
  SpanKind,
  withSpan as withTelemetrySpan,
} from '@netscript/telemetry/tracer';
import { withContextAsync } from '@netscript/telemetry/context';
import { context, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { CacheQuery } from '../../src/cache/cache-query.ts';
import { type CacheProvider, createProviderBoundary } from '../../src/cache/cache-provider.ts';
import {
  CACHE_NAMESPACE_MAX_LENGTH,
  CacheEvents,
  type CacheSpanAttributes,
  type CacheTelemetry,
  type CacheTelemetrySpan,
  normalizeCacheNamespace,
} from '../../src/cache/cache-telemetry.ts';
import type { CacheEntry } from '../../src/ports/cache-entry.ts';
import type { CacheKey, CacheStoreEntry } from '../../src/ports/cache-store.ts';
import type { CacheProviderDescriptor } from '../../src/ports/cache-topology.ts';
import { MemoryCacheStore, nextTurn } from '../test-helpers.ts';

type RecordedEvent = {
  readonly name: string;
  readonly attributes: CacheSpanAttributes;
};

type RecordedCacheSpan = {
  readonly name: string;
  readonly attributes: Attributes;
  readonly events: RecordedEvent[];
  readonly exceptions: unknown[];
  status: 'unset' | 'error';
  ended: boolean;
};

class RecordingCacheTelemetry implements CacheTelemetry {
  readonly spans: RecordedCacheSpan[] = [];

  async withSpan<T>(
    name: typeof CacheOperations[keyof typeof CacheOperations],
    attributes: CacheSpanAttributes,
    operation: (span: CacheTelemetrySpan) => Promise<T>,
  ): Promise<T> {
    const recorded: RecordedCacheSpan = {
      name,
      attributes: { ...attributes },
      events: [],
      exceptions: [],
      status: 'unset',
      ended: false,
    };
    this.spans.push(recorded);
    const span: CacheTelemetrySpan = {
      setAttributes: (values) => Object.assign(recorded.attributes, values),
      addEvent: (eventName, values = {}) => {
        recorded.events.push({ name: eventName, attributes: { ...values } });
      },
    };
    try {
      return await operation(span);
    } catch (error) {
      recorded.status = 'error';
      recorded.exceptions.push(error);
      throw error;
    } finally {
      recorded.ended = true;
    }
  }

  captureParent() {
    return { run: <T>(operation: () => Promise<T>): Promise<T> => operation() };
  }
}

function makeCache(store = new MemoryCacheStore()) {
  const telemetry = new RecordingCacheTelemetry();
  return { cache: new CacheQuery(store, new Map(), telemetry), store, telemetry };
}

function findEvent(span: RecordedCacheSpan, name: string): RecordedEvent {
  const event = span.events.find((candidate) => candidate.name === name);
  assert(event, `expected ${name} event`);
  return event;
}

Deno.test('cache telemetry distinguishes a cold miss and measured backend write', async () => {
  const { cache, telemetry } = makeCache();
  let loaderCalls = 0;

  assertEquals(
    await cache.query(['orders', 'tenant-secret'], {
      operationId: 'orders.list',
      queryFn: () => {
        loaderCalls += 1;
        return Promise.resolve('fresh');
      },
    }),
    'fresh',
  );

  assertEquals(telemetry.spans.length, 1);
  const span = telemetry.spans[0];
  assertEquals(span.name, CacheOperations.READ);
  assertEquals(span.attributes[CacheAttributes.NAMESPACE], 'orders.list');
  assertEquals(span.attributes[CacheAttributes.OUTCOME], CacheOutcomes.MISS);
  assertEquals(span.attributes[CacheAttributes.BACKEND_EXECUTED], true);
  assertEquals(findEvent(span, CacheEvents.LOOKUP).attributes[CacheAttributes.OUTCOME], 'miss');
  assertEquals(findEvent(span, CacheEvents.WRITE).attributes[CacheAttributes.TIER], 'l1');
  assertEquals(loaderCalls, 1);
  assert(!JSON.stringify(telemetry.spans).includes('tenant-secret'));
});

Deno.test('cache telemetry distinguishes a warm-fresh hit without backend execution', async () => {
  const { cache, store, telemetry } = makeCache();
  store.setRaw(
    ['cache_query', 'orders'],
    { data: 'warm', timestamp: Date.now() } satisfies CacheEntry<string>,
  );
  let loaderCalls = 0;

  assertEquals(
    await cache.query(['orders'], {
      operationId: 'orders.list',
      staleTime: 5_000,
      cacheTime: 60_000,
      queryFn: () => {
        loaderCalls += 1;
        return Promise.resolve('unexpected');
      },
    }),
    'warm',
  );

  const span = telemetry.spans[0];
  assertEquals(span.attributes[CacheAttributes.OUTCOME], CacheOutcomes.HIT);
  assertEquals(span.attributes[CacheAttributes.BACKEND_EXECUTED], false);
  assertEquals(span.attributes[CacheAttributes.TTL_MS], 60_000);
  assertEquals(typeof span.attributes[CacheAttributes.ENTRY_AGE_MS], 'number');
  assertEquals(loaderCalls, 0);
});

Deno.test('cache telemetry distinguishes warm-stale background revalidation', async () => {
  const { cache, store, telemetry } = makeCache();
  store.setRaw(
    ['cache_query', 'orders'],
    { data: 'stale', timestamp: Date.now() - 100 } satisfies CacheEntry<string>,
  );

  assertEquals(
    await cache.query(['orders'], {
      operationId: 'orders.list',
      staleTime: 1,
      cacheTime: 60_000,
      queryFn: () => Promise.resolve('fresh'),
    }),
    'stale',
  );
  await nextTurn();

  assertEquals(telemetry.spans.length, 2);
  const read = telemetry.spans.find((span) => span.name === CacheOperations.READ);
  const write = telemetry.spans.find((span) => span.name === CacheOperations.WRITE);
  assert(read);
  assert(write);
  assertEquals(read.attributes[CacheAttributes.OUTCOME], CacheOutcomes.STALE);
  assertEquals(read.attributes[CacheAttributes.BACKEND_EXECUTED], true);
  assertEquals(write.attributes[CacheAttributes.BACKEND_EXECUTED], true);
  assertEquals(findEvent(write, CacheEvents.WRITE).attributes[CacheAttributes.TIER], 'l1');
});

Deno.test('cache telemetry distinguishes a provider error before the backend loader', async () => {
  class ErrorStore extends MemoryCacheStore {
    override get<T>(_key: CacheKey): Promise<CacheStoreEntry<T>> {
      return Promise.reject(new Error('provider unavailable'));
    }
  }
  const { cache, telemetry } = makeCache(new ErrorStore());
  let loaderCalls = 0;

  await assertRejects(
    () =>
      cache.query(['orders'], {
        operationId: 'orders.list',
        queryFn: () => {
          loaderCalls += 1;
          return Promise.resolve('unexpected');
        },
      }),
    Error,
    'provider unavailable',
  );

  const span = telemetry.spans[0];
  assertEquals(span.attributes[CacheAttributes.OUTCOME], CacheOutcomes.ERROR);
  assertEquals(span.attributes[CacheAttributes.TOPOLOGY_COMPLETE], false);
  assertEquals(span.attributes[CacheAttributes.BACKEND_EXECUTED], false);
  assertEquals(span.status, 'error');
  assertEquals(span.exceptions.length, 1);
  assertEquals(loaderCalls, 0);
});

Deno.test('cache telemetry measures backend entry when the loader throws', async () => {
  const { cache, telemetry } = makeCache();

  await assertRejects(
    () =>
      cache.query(['orders'], {
        operationId: 'orders.list',
        queryFn: () => Promise.reject(new Error('database unavailable')),
      }),
    Error,
    'database unavailable',
  );

  const span = telemetry.spans[0];
  assertEquals(span.attributes[CacheAttributes.OUTCOME], CacheOutcomes.MISS);
  assertEquals(span.attributes[CacheAttributes.BACKEND_EXECUTED], true);
  assertEquals(span.status, 'error');
  assertEquals(span.exceptions.length, 1);
});

Deno.test('cache telemetry rejects incomplete or unbounded provider evidence', async () => {
  class UnboundedStore extends MemoryCacheStore {
    override get<T>(_key: CacheKey): Promise<CacheStoreEntry<T>> {
      return Promise.resolve({
        value: null,
        report: {
          lookups: [
            { system: 'memory', tier: 'l1', lookupIndex: 0, outcome: 'miss' },
            { system: 'redis', tier: 'l2', lookupIndex: 1, outcome: 'miss' },
            { system: 'deno-kv', tier: 'durable', lookupIndex: 2, outcome: 'miss' },
            { system: 'duplicate', tier: 'l1', lookupIndex: 3, outcome: 'miss' },
          ],
          promotions: [],
          topologyComplete: true,
        },
      });
    }
  }
  const { cache, telemetry } = makeCache(new UnboundedStore());

  await assertRejects(
    () =>
      cache.query(['orders'], {
        operationId: 'orders.list',
        queryFn: () => Promise.resolve('unexpected'),
      }),
    TypeError,
    'missing or invalid topology evidence',
  );

  const span = telemetry.spans[0];
  assertEquals(span.attributes[CacheAttributes.OUTCOME], CacheOutcomes.ERROR);
  assertEquals(span.attributes[CacheAttributes.TOPOLOGY_COMPLETE], false);
  assertEquals(span.attributes[CacheAttributes.BACKEND_EXECUTED], false);
});

Deno.test('cache telemetry distinguishes a tier promotion and write-through', async () => {
  class PromotingStore extends MemoryCacheStore {
    override readonly descriptor: CacheProviderDescriptor = { system: 'hybrid', tier: 'l1' };

    override get<T>(_key: CacheKey): Promise<CacheStoreEntry<T>> {
      return Promise.resolve({
        value: { data: 'from-l2', timestamp: Date.now() } as T,
        report: {
          lookups: [
            { system: 'memory', tier: 'l1', lookupIndex: 0, outcome: 'miss' },
            { system: 'redis', tier: 'l2', lookupIndex: 1, outcome: 'hit' },
          ],
          promotions: [{ system: 'memory', tier: 'l1', writeThrough: true }],
          topologyComplete: true,
        },
      });
    }
  }
  const { cache, telemetry } = makeCache(new PromotingStore());

  assertEquals(
    await cache.query(['orders'], {
      operationId: 'orders.list',
      queryFn: () => Promise.resolve('unexpected'),
    }),
    'from-l2',
  );

  const span = telemetry.spans[0];
  assertEquals(span.events.filter((event) => event.name === CacheEvents.LOOKUP).length, 2);
  const promotion = findEvent(span, CacheEvents.PROMOTE);
  assertEquals(promotion.attributes[CacheAttributes.TIER], 'l1');
  assertEquals(promotion.attributes[CacheAttributes.WRITE_THROUGH], true);
  assertEquals(span.attributes[CacheAttributes.BACKEND_EXECUTED], false);
});

Deno.test('cache telemetry distinguishes invalidation from read and write operations', async () => {
  const { cache, store, telemetry } = makeCache();
  store.setRaw(['cache_query', 'orders', 'one'], { data: 1, timestamp: Date.now() });
  store.setRaw(['cache_query', 'orders', 'two'], { data: 2, timestamp: Date.now() });

  await cache.invalidateQueries(['orders']);

  assertEquals(telemetry.spans.length, 1);
  const span = telemetry.spans[0];
  assertEquals(span.name, CacheOperations.INVALIDATE);
  assertEquals(span.attributes[CacheAttributes.NAMESPACE], 'cache.invalidate.prefix');
  assertEquals(findEvent(span, CacheEvents.INVALIDATE).attributes[CacheAttributes.TIER], 'l1');
  assertEquals(span.events.filter((event) => event.name === CacheEvents.INVALIDATE).length, 1);
  assertEquals(span.attributes[CacheAttributes.BACKEND_EXECUTED], false);
});

Deno.test('cache telemetry measures the in-flight join loser without inferring backend work', async () => {
  const telemetry = new RecordingCacheTelemetry();
  const cache = new CacheQuery(new MemoryCacheStore(), new Map(), telemetry);
  let release!: (value: string) => void;
  const pending = new Promise<string>((resolve) => {
    release = resolve;
  });
  let loaderCalls = 0;
  const queryFn = (): Promise<string> => {
    loaderCalls += 1;
    return pending;
  };

  const first = cache.query(['orders'], { operationId: 'orders.list', queryFn });
  const second = cache.query(['orders'], { operationId: 'orders.list', queryFn });
  await nextTurn();
  release('fresh');
  assertEquals(await Promise.all([first, second]), ['fresh', 'fresh']);

  assertEquals(loaderCalls, 1);
  const joined = telemetry.spans.find((span) =>
    span.attributes[CacheAttributes.INFLIGHT_JOINED] === true
  );
  assert(joined);
  assertEquals(joined.attributes[CacheAttributes.BACKEND_EXECUTED], false);
  const owner = telemetry.spans.find((span) =>
    span.attributes[CacheAttributes.BACKEND_EXECUTED] === true
  );
  assert(owner);
  assertEquals(owner.attributes[CacheAttributes.INFLIGHT_JOINED], false);
});

Deno.test('cache-only reads report backend_executed=false', async () => {
  const { cache, telemetry } = makeCache();
  assertEquals(await cache.getCachedData(['missing']), null);
  assertEquals(telemetry.spans[0].attributes[CacheAttributes.BACKEND_EXECUTED], false);
});

Deno.test('cache namespaces are bounded normalized operation identities', () => {
  assertEquals(normalizeCacheNamespace('  Orders :: LIST  '), 'orders.list');
  const bounded = normalizeCacheNamespace(`ORDERS.${'A'.repeat(200)}`);
  assertEquals(bounded.length, CACHE_NAMESPACE_MAX_LENGTH);
  assert(/^[a-z0-9.]+$/.test(bounded));
  assertEquals(normalizeCacheNamespace(undefined), 'direct');
  assertEquals(normalizeCacheNamespace(undefined, ' Composite View '), 'composite.view');
});

Deno.test('registered custom providers cannot bypass the telemetry boundary', async () => {
  const telemetry = new RecordingCacheTelemetry();
  const customProvider: CacheProvider = {
    descriptor: { system: 'custom', tier: 'l2' },
    query: (_key, options) => options.queryFn(),
    prefetch: async (_key, options) => {
      await options.queryFn();
    },
    getCachedData: () => Promise.resolve(null),
    getCachedEntry: () => Promise.resolve(null),
    invalidateQueries: () => Promise.resolve(),
  };
  const boundary = createProviderBoundary(customProvider, telemetry);

  assertEquals(
    await boundary.query(['private-key'], {
      operationId: 'orders.list',
      queryFn: () => Promise.resolve('loaded'),
    }),
    'loaded',
  );

  assertEquals(telemetry.spans.length, 1);
  const span = telemetry.spans[0];
  assertEquals(span.attributes[CacheAttributes.BACKEND_EXECUTED], true);
  assertEquals(span.attributes[CacheAttributes.TOPOLOGY_COMPLETE], false);
  assertEquals(span.attributes[CacheAttributes.OUTCOME], CacheOutcomes.ERROR);
  assertEquals(findEvent(span, CacheEvents.LOOKUP).attributes[CacheAttributes.SYSTEM], 'custom');
  assert(!JSON.stringify(span).includes('private-key'));
});

function createOtelCacheTelemetry(tracer: Tracer): CacheTelemetry {
  return {
    withSpan: <T>(
      name: CacheOperation,
      attributes: CacheSpanAttributes,
      operation: (span: CacheTelemetrySpan) => Promise<T>,
    ): Promise<T> =>
      withTelemetrySpan(tracer, name, operation, { kind: SpanKind.INTERNAL, attributes }),
    captureParent: () => {
      const parent = getActiveContext();
      return { run: <T>(operation: () => Promise<T>) => withContextAsync(parent, operation) };
    },
  };
}

Deno.test('page/defer topology and the cache lookup chain share one trace', async () => {
  context.disable();
  const contextManager = new AsyncLocalStorageContextManager().enable();
  context.setGlobalContextManager(contextManager);
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  const tracer = provider.getTracer('cache-topology-test');
  const cache = new CacheQuery(
    new MemoryCacheStore(),
    new Map(),
    createOtelCacheTelemetry(tracer as Tracer),
  );

  try {
    await tracer.startActiveSpan('defer.cache.read', async (deferSpan) => {
      deferSpan.setAttribute('netscript.operation', 'defer.cache.read');
      await cache.query(['orders'], {
        operationId: 'orders.list',
        queryFn: () => Promise.resolve('fresh'),
      });
      deferSpan.end();
    });
    await provider.forceFlush();

    const spans = exporter.getFinishedSpans();
    const deferSpan = spans.find((span) => span.name === 'defer.cache.read');
    const cacheSpan = spans.find((span) => span.name === CacheOperations.READ);
    assert(deferSpan);
    assert(cacheSpan);
    assertEquals(cacheSpan.spanContext().traceId, deferSpan.spanContext().traceId);
    assertEquals(cacheSpan.parentSpanContext?.spanId, deferSpan.spanContext().spanId);
    assertEquals(
      cacheSpan.events.filter((event) => event.name === CacheEvents.LOOKUP).length,
      1,
    );
    assertEquals(spans.filter((span) => span.name === CacheOperations.READ).length, 1);
  } finally {
    await provider.shutdown();
    context.disable();
    contextManager.disable();
    trace.disable();
  }
});
