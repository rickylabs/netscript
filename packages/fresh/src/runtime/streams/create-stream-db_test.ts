import { assert, assertEquals, assertExists } from '@std/assert';
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
      url: await ready,
      async kill() {
        child.kill('SIGKILL');
        await child.status;
        await Promise.all([output, errors]);
      },
    };
  } catch (error) {
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
    await db.preload();
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
