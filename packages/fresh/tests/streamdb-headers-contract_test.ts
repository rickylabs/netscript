/** U3 caller-header forwarding contract for `createNetScriptStreamDB`. @module */

import { assert, assertEquals, assertExists, assertRejects, assertThrows } from '@std/assert';
import { DurableStream } from '@durable-streams/client';
import { createStateSchema } from '@durable-streams/state';
import { createStreamDB } from '@durable-streams/state/db';
import { fromFileUrl } from '@std/path';
import { z } from 'zod';
import {
  createNetScriptStreamDB,
  type NetScriptStreamDB,
  type NetScriptStreamDBFactoryInput,
} from '../src/runtime/streams/create-stream-db.ts';
import { startReferenceServer } from './_fixtures/stream-db-test-runtime.ts';

const stateDefinition = {
  events: { schema: z.object({ id: z.string() }), type: 'event', primaryKey: 'id' },
};
type TestState = typeof stateDefinition;
const schema = createStateSchema(stateDefinition);

async function eventually(predicate: () => boolean, attempts = 200): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert(predicate(), 'StreamDB did not reach the expected state within the recovery window.');
}

async function preloadDeadline(pending: Promise<void>, ms = 5_000): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Preload deadline exceeded.')), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function upToDateStub() {
  return Deno.serve({ port: 0, hostname: '127.0.0.1', onListen() {} }, () =>
    new Response('[]', {
      headers: {
        'content-type': 'application/json',
        'stream-next-offset': 'end',
        'stream-up-to-date': 'true',
      },
    }));
}

function test(
  name: string,
  fn: Deno.TestDefinition['fn'],
  permissions?: Deno.TestDefinition['permissions'],
) {
  Deno.test({
    name,
    fn,
    permissions,
    sanitizeOps: true,
    sanitizeResources: true,
    sanitizeExit: true,
  });
}

async function cleanup(...steps: Array<() => void | Promise<void>>) {
  const failures: unknown[] = [];
  for (const step of steps) {
    try {
      await step();
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length) throw new AggregateError(failures, 'StreamDB test cleanup failed.');
}

function observeFetch(onRead: (url: URL, headers: Headers) => void = () => {}) {
  const original = globalThis.fetch;
  const pending = new Set<Promise<Response>>();
  const responses: Array<{ response: Response; signal?: AbortSignal | null }> = [];
  globalThis.fetch = (input, init) => {
    const request = input instanceof Request ? input : undefined;
    let signal: AbortSignal | null | undefined;
    if ((init?.method ?? request?.method ?? 'GET').toUpperCase() === 'GET') {
      signal = init?.signal ?? request?.signal;
      onRead(
        new URL(request?.url ?? String(input)),
        new Headers(init?.headers ?? request?.headers),
      );
    }
    const fetched = original(input, init).then((response) => {
      responses.push({ response, signal });
      return response;
    });
    pending.add(fetched);
    void fetched.then(() => pending.delete(fetched), () => pending.delete(fetched));
    return fetched;
  };
  return async () => {
    globalThis.fetch = original;
    // Consumed bodies stay locked in Deno; native read abort closes transport.
    // Aggregate fetch-drain and body errors while still attempting every cleanup.
    await cleanup(
      () => preloadDeadline(Promise.allSettled(pending).then(() => {})),
      () =>
        cleanup(...responses.map(({ response, signal }) => async () => {
          if (!response.body) return;
          if (!response.body.locked) await response.body.cancel();
          else assert(response.bodyUsed || signal?.aborted, `Locked unread body: ${response.url}`);
          assert(!signal || signal.aborted, `Native read still active: ${response.url}`);
        })),
    );
  };
}

test('U3 explicit header record reaches the client port', async () => {
  const previousSecret = Deno.env.get('STREAMS_SECRET');
  let syncCalls = 0;
  let asyncCalls = 0;
  const suppliedHeaders = {
    'x-u3-static': 'red-static',
    'x-u3-sync': () => {
      syncCalls += 1;
      return 'red-sync';
    },
    authorization: () => {
      asyncCalls += 1;
      return Promise.resolve('Bearer red-async');
    },
  };
  let captured: NetScriptStreamDBFactoryInput<TestState> | undefined;
  const factoryOptions = {
    baseUrl: 'https://streams.example.test',
    streamPath: '/u3-red',
    schema,
    headers: suppliedHeaders,
    createStreamDB(input: NetScriptStreamDBFactoryInput<TestState>) {
      captured = input;
      return createStreamDB(input);
    },
  };
  let db: NetScriptStreamDB<TestState> | undefined;
  try {
    Deno.env.set('STREAMS_SECRET', 'u3-red-synthetic');
    db = createNetScriptStreamDB<TestState>(factoryOptions);
    assertExists(captured);
    assert(captured.streamOptions.headers === suppliedHeaders, 'Port retains the header record.');
    assertEquals(syncCalls, 0);
    assertEquals(asyncCalls, 0);
  } finally {
    await cleanup(() => db?.close?.(), () => {
      if (previousSecret === undefined) Deno.env.delete('STREAMS_SECRET');
      else Deno.env.set('STREAMS_SECRET', previousSecret);
    });
  }
});

test('U3 explicit per-request headers rotate across polls and reconnect at the retained offset', async () => {
  const dataDir = await Deno.makeTempDir();
  const reads: Array<
    Record<'offset' | 'live' | 'authorization' | 'static' | 'sync', string | null>
  > = [];
  let server: Awaited<ReturnType<typeof startReferenceServer>> | undefined;
  let db: NetScriptStreamDB<TestState> | undefined;
  let drain: (() => Promise<void>) | undefined;
  let current = 'Bearer u3-v1';
  let syncValue = 'u3-sync-v1';
  try {
    server = await startReferenceServer(dataDir);
    const endpoint = new URL(server.url);
    drain = observeFetch((url, headers) => {
      reads.push({
        offset: url.searchParams.get('offset'),
        live: url.searchParams.get('live'),
        authorization: headers.get('authorization'),
        static: headers.get('x-u3-static'),
        sync: headers.get('x-u3-sync'),
      });
    });
    const streamUrl = new URL('/v1/stream/netscript/rotation', server.url);
    const producer = new DurableStream({
      url: streamUrl.href,
      contentType: 'application/json',
      backoffOptions: { initialDelay: 1, maxDelay: 1, multiplier: 1, maxRetries: 0 },
    });
    await producer.create();
    const before = crypto.randomUUID();
    await producer.append(JSON.stringify(schema.events.insert({ value: { id: before } })));
    let syncCalls = 0;
    let asyncCalls = 0;
    db = createNetScriptStreamDB({
      baseUrl: server.url,
      streamPath: '/rotation',
      schema,
      headers: {
        'x-u3-static': 'u3-static',
        'x-u3-sync': () => {
          syncCalls += 1;
          return syncValue;
        },
        authorization: () => {
          asyncCalls += 1;
          return Promise.resolve(current);
        },
      },
    });
    const activeDb = db;
    const collection = activeDb.collections.events;
    assertExists(db.preload);
    assertEquals(syncCalls, 0);
    assertEquals(asyncCalls, 0);
    await preloadDeadline(db.preload());
    await eventually(() => reads.some((read) => read.authorization === 'Bearer u3-v1'));
    const first = reads.find((read) => read.authorization === 'Bearer u3-v1');
    assertExists(first);
    assertEquals(first.static, 'u3-static');
    assertEquals(first.sync, 'u3-sync-v1');
    const originalEntity = collection.get(before);
    assertExists(originalEntity);
    current = 'Bearer u3-v2';
    syncValue = 'u3-sync-v2';
    const seen = reads.length;
    const second = crypto.randomUUID();
    await producer.append(JSON.stringify(schema.events.insert({ value: { id: second } })));
    await eventually(
      () => reads.slice(seen).some((read) => read.authorization === 'Bearer u3-v2'),
      400,
    );
    const rotated = reads.slice(seen).find((read) => read.authorization === 'Bearer u3-v2');
    assertExists(rotated);
    assertEquals(rotated.static, 'u3-static');
    assertEquals(rotated.sync, 'u3-sync-v2');
    await eventually(() => collection.get(second)?.id === second);
    await eventually(() => reads.some((read) => read.live === 'long-poll'));
    const checkpointRead = reads.at(-1);
    assertExists(checkpointRead);
    const checkpoint = checkpointRead.offset;
    assert(typeof checkpoint === 'string' && checkpoint.length > 0 && checkpoint !== '-1');
    assertEquals(collection.get(before)?.id, before);
    await server.kill();
    server = undefined;
    current = 'Bearer u3-v3';
    await eventually(() => activeDb.status === 'retrying' || activeDb.status === 'failed');
    const reconnectStart = reads.length;
    server = await startReferenceServer(dataDir, Number(endpoint.port));
    const after = crypto.randomUUID();
    await producer.append(JSON.stringify(schema.events.insert({ value: { id: after } })));
    await eventually(() => collection.get(after)?.id === after);
    assert(db.collections.events === collection);
    assert(collection.get(before) === originalEntity);
    assertEquals(collection.get(before)?.id, before);
    assertEquals(db.status, 'live');
    assertEquals(reads[reconnectStart]?.offset, checkpoint);
    const reconnected = reads.slice(reconnectStart);
    assert(reconnected.every((read) => read.offset !== '-1'));
    assert(reconnected.some((read) => read.authorization === 'Bearer u3-v3'));
    db.stop?.();
    assertEquals(db.status, 'stopped');
  } finally {
    await cleanup(
      () => db?.stop?.(),
      () => drain?.(),
      () => server?.kill(),
      () => Deno.remove(dataDir, { recursive: true }),
    );
  }
});

test('U3 explicit empty headers replace ambient auth while absence keeps legacy', async () => {
  const previousSecret = Deno.env.get('STREAMS_SECRET');
  const authorizations: Array<string | null> = [];
  let drain: (() => Promise<void>) | undefined;
  let server: ReturnType<typeof upToDateStub> | undefined;
  let explicitDb: NetScriptStreamDB<TestState> | undefined;
  let legacyDb: NetScriptStreamDB<TestState> | undefined;
  try {
    Deno.env.set('STREAMS_SECRET', 'u3-synthetic-producer');
    drain = observeFetch((_, headers) => authorizations.push(headers.get('authorization')));
    server = upToDateStub();
    const baseUrl = `http://127.0.0.1:${server.addr.port}`;
    explicitDb = createNetScriptStreamDB({
      baseUrl,
      streamPath: '/explicit-empty',
      schema,
      headers: {},
    });
    assertExists(explicitDb.preload);
    await preloadDeadline(explicitDb.preload());
    assert(authorizations.length > 0, 'Expected observed wire requests.');
    assert(authorizations.every((value) => value === null), 'No ambient auth for {}.');
    legacyDb = createNetScriptStreamDB({ baseUrl, streamPath: '/legacy', schema });
    assertExists(legacyDb.preload);
    await preloadDeadline(legacyDb.preload());
    assert(
      authorizations.some((value) => value === 'Bearer u3-synthetic-producer'),
      'Absent headers must retain legacy env-resolved auth.',
    );
    explicitDb.stop?.();
    assertEquals(explicitDb.status, 'stopped');
    await legacyDb.dispose?.();
    assertEquals(legacyDb.status, 'stopped');
    const preloadLegacy = legacyDb.preload;
    await assertRejects(() => preloadDeadline(preloadLegacy()), DOMException);
  } finally {
    await cleanup(
      () => explicitDb?.stop?.(),
      () => legacyDb?.stop?.(),
      () => drain?.(),
      () => server?.shutdown(),
      () => {
        if (previousSecret === undefined) Deno.env.delete('STREAMS_SECRET');
        else Deno.env.set('STREAMS_SECRET', previousSecret);
      },
    );
  }
});

test(
  'U3 explicit headers work through the configured native port with all env denied',
  async () => {
    let server: ReturnType<typeof upToDateStub> | undefined;
    let db: NetScriptStreamDB<TestState> | undefined;
    let drain: (() => Promise<void>) | undefined;
    try {
      for (const variable of ['STREAMS_SECRET', 'NODE_ENV']) {
        assertThrows(() => Deno.env.get(variable), Deno.errors.NotCapable);
      }
      drain = observeFetch();
      server = upToDateStub();
      const baseUrl = `http://127.0.0.1:${server.addr.port}`;
      db = createNetScriptStreamDB({
        baseUrl,
        streamPath: '/denied-env',
        schema,
        headers: { authorization: 'Bearer u3-explicit-denied-env' },
        createStreamDB(input) {
          // Disable only the native HTTP warning, whose default reads NODE_ENV.
          return createStreamDB({
            ...input,
            streamOptions: { ...input.streamOptions, warnOnHttp: false },
          });
        },
      });
      assertExists(db.preload);
      await preloadDeadline(db.preload());
      assertExists(db.close);
      db.close();
      const denial = assertThrows(
        () => createNetScriptStreamDB({ baseUrl, streamPath: '/denied-env', schema }),
        Error,
      );
      assert(denial.message.includes('STREAMS_SECRET'), 'Framework auth read must fail.');
      assert(/env access|denied|NotCapable/i.test(denial.message), 'Missing env capability.');
    } finally {
      await cleanup(() => db?.close?.(), () => drain?.(), () => server?.shutdown());
    }
  },
  { env: false, net: true, read: true },
);

test('U3 failing header callbacks send no requests and never fall back to ambient auth', async () => {
  const previousSecret = Deno.env.get('STREAMS_SECRET');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  let db: NetScriptStreamDB<TestState> | undefined;
  try {
    Deno.env.set('STREAMS_SECRET', 'u3-synthetic-producer');
    globalThis.fetch = (...args: Parameters<typeof globalThis.fetch>) => {
      requests += 1;
      return originalFetch(...args);
    };
    for (const error of [new Error('u3 header boom'), new TypeError('u3 offline')]) {
      let calls = 0;
      db = createNetScriptStreamDB({
        baseUrl: 'https://streams.example.test',
        streamPath: '/failure',
        schema,
        reconnect: { maxRetries: 1, initialDelayMs: 1, maxDelayMs: 1 },
        headers: {
          authorization: () => {
            calls += 1;
            if (error instanceof TypeError) throw error;
            return Promise.reject<never>(error);
          },
        },
      });
      assertExists(db.preload);
      const preload = db.preload;
      const failure = await assertRejects(() => preloadDeadline(preload()), Error, error.message);
      assertEquals(failure, error, 'Original callback error.');
      assertEquals(failure instanceof TypeError, error instanceof TypeError);
      assertEquals(calls, error instanceof TypeError ? 2 : 1);
      assertEquals(requests, 0);
      assertEquals(db.status, 'failed');
      db.stop?.();
      assertEquals(db.status, 'stopped');
    }
  } finally {
    try {
      db?.stop?.();
    } finally {
      globalThis.fetch = originalFetch;
      if (previousSecret === undefined) Deno.env.delete('STREAMS_SECRET');
      else Deno.env.set('STREAMS_SECRET', previousSecret);
    }
  }
});

test('U3 header options satisfy the public compiler contract and reject invalid shapes', async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const fixtures = new URL('./type-fixtures/', import.meta.url);
    const fixturePath = (name: string) => fromFileUrl(new URL(name, fixtures));
    const config = fixturePath('streamdb-consumer-deno.json');
    const positiveFile = fixturePath('streamdb-wrapper_type.ts');
    assert(positiveFile.length > 0);
    const positive = await checkSource(positiveFile, config);
    assertEquals(positive.code, 0, positive.text);
    assert(!/TS\d+|No matching|No target/.test(positive.text), positive.text);
    const negatives = [
      { name: 'u3-headers-number.ts', headers: '{ authorization: 1 }' },
      { name: 'u3-headers-callback.ts', headers: '{ authorization: () => 1 }' },
      { name: 'u3-headers-map.ts', headers: "() => ({ authorization: 'x' })" },
    ];
    for (const negative of negatives) {
      const file = `${tempDir}/${negative.name}`;
      await Deno.writeTextFile(file, negativeSource(negative.headers));
      const result = await checkSource(file, config);
      assert(result.code !== 0, `Expected a contract type error for ${negative.name}.`);
      assert(result.text.includes(negative.name), `Expected ${negative.name} in diagnostics.`);
      assert(result.text.includes('TS2322'), `Expected TS2322 for ${negative.name}.`);
      assert(
        /MaybePromise|HeadersRecord|not assignable/.test(result.text),
        `Expected a header contract diagnostic for ${negative.name}.`,
      );
      assert(!/TS2307|TS2305/.test(result.text), 'Imports must resolve.');
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

function negativeSource(headers: string): string {
  return `import { createStateSchema } from '@durable-streams/state';
import { createNetScriptStreamDB } from '@netscript/fresh/streams';
import { z } from 'zod';
const schema = createStateSchema({ events: { schema: z.object({ id: z.string() }), type: 'event', primaryKey: 'id' } });
createNetScriptStreamDB({ baseUrl: 'https://streams.example.test', streamPath: '/negative', schema, headers: ${headers} });
`;
}

async function checkSource(
  file: string,
  config: string,
): Promise<{ code: number; text: string }> {
  const deadline = new AbortController();
  const timer = setTimeout(
    () => deadline.abort(new Error(`Compiler deadline exceeded: ${file}`)),
    30_000,
  );
  try {
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['check', '--no-lock', '--config', config, '--unstable-kv', file],
      signal: deadline.signal,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    deadline.signal.throwIfAborted();
    return { code: output.code, text: new TextDecoder().decode(output.stderr) };
  } finally {
    clearTimeout(timer);
  }
}
