import { assert, assertEquals, assertExists, assertRejects } from '@std/assert';
import { BaseQueryBuilder } from '@tanstack/react-db';
import { workersStreamSchema } from '../../../../plugin-workers-core/src/streams/schema.ts';
import { createQueryCollection } from '../../../../sdk/src/collections/create-query-collection.ts';
import { createNetScriptQueryClient } from '../../../../sdk/src/query-client/query-client-factory.ts';
import { DurableStream } from '@durable-streams/client';
import { fromFileUrl } from '@std/path';
import { TextLineStream } from 'jsr:@std/streams@^1/text-line-stream';
import { createStateSchema } from '@durable-streams/state';
import { createStreamDB } from '@durable-streams/state/db';
import { z } from 'zod';
import { createNetScriptStreamDB, type NetScriptStreamDBFactoryInput } from './create-stream-db.ts';

const stateDefinition = {
  events: {
    schema: z.object({ id: z.string() }),
    type: 'event',
    primaryKey: 'id',
  },
};
type TestState = typeof stateDefinition;

Deno.test('createNetScriptStreamDB wires stream URL, schema, and lifecycle handle through the factory', () => {
  const schema = createStateSchema(stateDefinition);
  let captured: NetScriptStreamDBFactoryInput<TestState> | undefined;
  let stopped = false;

  const db = createNetScriptStreamDB<TestState>({
    baseUrl: 'https://streams.example.test',
    streamPath: '/workers/executions',
    schema,
    createStreamDB(input) {
      captured = input;
      return Object.assign(createStreamDB(input), {
        stop() {
          stopped = true;
        },
      });
    },
  });

  db.stop?.();

  assertEquals(
    captured?.streamOptions.url,
    'https://streams.example.test/v1/stream/netscript/workers/executions',
  );
  assertEquals(captured?.streamOptions.contentType, 'application/json');
  assertEquals(captured?.state, schema);
  assertEquals(Object.keys(db.collections), ['events']);
  assertEquals(stopped, true);
});

async function eventually(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert(predicate(), 'StreamDB did not reach the expected state within the recovery window.');
}

async function startReferenceServer(dataDir: string, port = 0) {
  const fixture = new URL('../../../tests/_fixtures/stream-db-server.ts', import.meta.url);
  const config = new URL('../../../../../deno.json', import.meta.url);
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-all',
      '--config',
      fromFileUrl(config),
      fromFileUrl(fixture),
      JSON.stringify({
        dataDir,
        port,
      }),
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let stderr = '';
  const errors = child.stderr.pipeTo(
    new WritableStream<Uint8Array>({
      write(bytes) {
        stderr += new TextDecoder().decode(bytes);
      },
    }),
  );
  let resolveReady!: (url: string) => void;
  let rejectReady!: (error: Error) => void;
  const ready = new Promise<string>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const output = (async () => {
    for await (
      const line of child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
        new TextLineStream(),
      )
    ) {
      if (!line.startsWith('{')) continue;
      const message = JSON.parse(line);
      if (typeof message.ready === 'string') resolveReady(message.ready);
    }
    rejectReady(new Error(`Reference server exited before readiness: ${stderr}`));
  })();
  try {
    return {
      url: await Promise.race([
        ready,
        new Promise<never>((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error('Reference server readiness deadline exceeded.')),
            10_000,
          );
          void ready.finally(() => clearTimeout(timer)).catch(() => {});
        }),
      ]),
      async kill() {
        child.kill('SIGKILL');
        await child.status;
        await Promise.all([output, errors]);
      },
    };
  } catch (error) {
    try {
      child.kill('SIGKILL');
    } catch { /* Child may already have exited. */ }
    await child.status;
    await Promise.all([output, errors]);
    throw error;
  }
}

Deno.test('createNetScriptStreamDB recovers after the persistent stream server is killed without replay', async () => {
  const dataDir = await Deno.makeTempDir();
  const schema = createStateSchema(stateDefinition);
  const originalFetch = globalThis.fetch;
  const reads: Array<{ offset: string | null; live: string | null }> = [];
  let server: Awaited<ReturnType<typeof startReferenceServer>> | undefined;
  let db: ReturnType<typeof createNetScriptStreamDB<TestState>> | undefined;
  try {
    server = await startReferenceServer(dataDir);
    const endpoint = new URL(server.url);
    const streamUrl = new URL('/v1/stream/netscript/recovery', server.url);
    globalThis.fetch = (input, init) => {
      const request = new Request(input, init);
      if (request.method === 'GET') {
        const url = new URL(request.url);
        reads.push({ offset: url.searchParams.get('offset'), live: url.searchParams.get('live') });
      }
      return originalFetch(input, init);
    };
    const producer = new DurableStream({
      url: streamUrl.href,
      contentType: 'application/json',
      backoffOptions: { initialDelay: 1, maxDelay: 1, multiplier: 1, maxRetries: 0 },
    });
    await producer.create();
    const before = crypto.randomUUID();
    await producer.append(JSON.stringify(schema.events.insert({ value: { id: before } })));
    db = createNetScriptStreamDB({
      baseUrl: server.url,
      streamPath: '/recovery',
      schema,
    });
    const collection = db.collections.events;
    assertExists(db.preload);
    await preloadDeadline(db.preload());
    await eventually(() => reads.some((read) => read.live === 'long-poll'));
    const checkpoint = reads.at(-1)!.offset;
    assert(checkpoint !== '-1');
    assertEquals(collection.get(before)?.id, before);
    await server.kill();
    server = undefined;
    await eventually(() => db!.status === 'retrying' || db!.status === 'failed');
    const reconnectStart = reads.length;
    server = await startReferenceServer(dataDir, Number(endpoint.port));
    const after = crypto.randomUUID();
    await producer.append(JSON.stringify(schema.events.insert({ value: { id: after } })));
    await eventually(() => collection.get(after)?.id === after);
    assert(db.collections.events === collection);
    assertEquals(collection.get(before)?.id, before);
    assertEquals(db.status, 'live');
    assertEquals(reads[reconnectStart]?.offset, checkpoint);
    assert(reads.slice(reconnectStart).every((read) => read.offset !== '-1'));
    db.stop?.();
    db.dispose?.();
    assertEquals(db.status, 'stopped');
  } finally {
    db?.stop?.();
    globalThis.fetch = originalFetch;
    await server?.kill();
    await Deno.remove(dataDir, { recursive: true });
  }
});

async function preloadDeadline(pending: Promise<void>): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Preload deadline exceeded.')), 1_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

Deno.test('createNetScriptStreamDB immediate stop and dispose settle pending preload on a healthy server', async () => {
  const server = Deno.serve(
    { port: 0, hostname: '127.0.0.1', onListen() {} },
    () =>
      new Response('[]', {
        headers: {
          'content-type': 'application/json',
          'stream-next-offset': 'end',
          'stream-up-to-date': 'true',
        },
      }),
  );
  try {
    for (const stop of ['stop', 'dispose'] as const) {
      const db = createNetScriptStreamDB({
        baseUrl: `http://127.0.0.1:${server.addr.port}`,
        streamPath: '/shutdown',
        schema: createStateSchema(stateDefinition),
      });
      try {
        const pending = db.preload!();
        db[stop]!();
        await assertRejects(() => preloadDeadline(pending), DOMException, 'aborted');
        assertEquals(db.status, 'stopped');
        await assertRejects(() => preloadDeadline(db.preload!()), DOMException);
        assertEquals(db.status, 'stopped');
      } finally {
        db.stop!();
      }
    }
  } finally {
    await server.shutdown();
  }
});

Deno.test('createNetScriptStreamDB stop settles concurrent preloads while response headers are pending', async () => {
  const originalFetch = globalThis.fetch;
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const requestStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  globalThis.fetch = async () => {
    started();
    await blocked;
    return new Response('[]', {
      headers: {
        'content-type': 'application/json',
        'stream-next-offset': 'end',
        'stream-up-to-date': 'true',
      },
    });
  };
  const db = createNetScriptStreamDB({
    baseUrl: 'https://streams.example.test',
    streamPath: '/pending-headers',
    schema: createStateSchema(stateDefinition),
  });
  try {
    const first = db.preload!();
    await preloadDeadline(requestStarted);
    const second = db.preload!();
    const results = [first, second].map((pending) =>
      assertRejects(() => preloadDeadline(pending), DOMException)
    );
    db.stop!();
    await Promise.all(results);
    assertEquals(db.status, 'stopped');
  } finally {
    release();
    db.stop!();
    globalThis.fetch = originalFetch;
    // Let the delayed upstream connection cancel before this test exits.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
});

Deno.test('default worker stream Collection enters the actual Fresh adapter and SDK query family', async () => {
  const server = Deno.serve({ port: 0, onListen() {} }, () =>
    new Response('[]', {
      headers: {
        'Content-Type': 'application/json',
        'Stream-Next-Offset': '0',
        'Stream-Up-To-Date': 'true',
      },
    }));
  const baseUrl = new URL(`http://${server.addr.hostname}:${server.addr.port}`).origin;
  const db = createNetScriptStreamDB({
    baseUrl,
    streamPath: '/workers',
    schema: createStateSchema(workersStreamSchema),
  });
  const client = createNetScriptQueryClient({ gcTime: 0 });
  const query = createQueryCollection({
    resource: 'collection-identity',
    queryKey: ['collection-identity'],
    queryClient: client,
    queryFn: () => Promise.resolve([{ id: 'sdk-item' }]),
    getKey: (item) => item.id,
  });
  try {
    const builder = new BaseQueryBuilder().from({ execution: db.collections.execution });
    assert(builder !== undefined);
    const sdkConstructor: unknown = Reflect.get(query, 'constructor');
    assert(typeof sdkConstructor === 'function');
    assertEquals(Reflect.get(db.collections.execution, 'constructor'), sdkConstructor);
    assert(typeof db.preload === 'function');
    assert(typeof db.close === 'function');
    await db.preload();
    await query.preload();
    assertEquals(query.toArray.map((item) => item.id), ['sdk-item']);
    assertEquals(db.collections.execution.size, 0);
  } finally {
    db.close?.();
    const cleanup: unknown = Reflect.get(query, 'cleanup');
    assert(typeof cleanup === 'function');
    await cleanup.call(query);
    client.clear();
    await server.shutdown();
  }
  assertEquals(query.subscriberCount, 0);
  assertEquals(db.collections.execution.subscriberCount, 0);
});
