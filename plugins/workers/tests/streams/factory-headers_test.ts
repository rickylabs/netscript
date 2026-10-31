/** Native caller-header contracts for the workers StreamDB factory. @module */

import { assert, assertEquals, assertExists } from '@std/assert';
import { delay } from '@std/async';
import { fromFileUrl } from '@std/path';
import type { HeadersRecord } from '@durable-streams/client';
import { createWorkersStreamDB, type WorkersStreamDB } from '../../streams/factory.ts';

interface Reader {
  preload(): Promise<void>;
  close(): void;
}
interface Read {
  path: string;
  live: string | null;
  auth: string | null;
  static: string | null;
  sync: string | null;
}

function test(name: string, fn: () => Promise<void>) {
  Deno.test({ name, fn, sanitizeOps: true, sanitizeResources: true, sanitizeExit: true });
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
  if (failures.length) throw new AggregateError(failures, 'Workers header cleanup failed.');
}

async function deadline(pending: Promise<void>): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Workers preload deadline.')), 5_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function eventually(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 400; attempt++) {
    if (predicate()) return;
    await delay(10);
  }
  assert(predicate(), 'Expected a later native workers request.');
}

async function withServer(
  action: (
    baseUrl: string,
    reads: Read[],
    reader: (db: WorkersStreamDB) => Reader,
  ) => Promise<void>,
): Promise<void> {
  const previous = Deno.env.get('STREAMS_SECRET');
  const readers: Reader[] = [];
  const reads: Read[] = [];
  let server: Deno.HttpServer<Deno.NetAddr> | undefined;
  try {
    Deno.env.set('STREAMS_SECRET', 'u3-workers-synthetic');
    server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, async (request) => {
      const url = new URL(request.url);
      reads.push({
        path: url.pathname,
        live: url.searchParams.get('live'),
        auth: request.headers.get('authorization'),
        static: request.headers.get('x-u3-static'),
        sync: request.headers.get('x-u3-sync'),
      });
      if (url.searchParams.get('live') === 'long-poll') await delay(25);
      return new Response('[]', {
        headers: {
          'content-type': 'application/json',
          'stream-next-offset': '0',
          'stream-up-to-date': 'true',
        },
      });
    });
    await action(`http://127.0.0.1:${server.addr.port}`, reads, (db) => {
      const preload: unknown = Reflect.get(db, 'preload');
      const close: unknown = Reflect.get(db, 'close');
      assert(typeof preload === 'function');
      assert(typeof close === 'function');
      const reader = {
        preload: () => Promise.resolve(preload.call(db)).then(() => {}),
        close: () => {
          close.call(db);
        },
      };
      readers.push(reader);
      return reader;
    });
  } finally {
    await cleanup(
      ...readers.map((reader) => () => reader.close()),
      () => server?.shutdown(),
      () => {
        if (previous === undefined) Deno.env.delete('STREAMS_SECRET');
        else Deno.env.set('STREAMS_SECRET', previous);
      },
    );
  }
}

test('U3 workers native headers remain lazy and rotate on real requests', async () => {
  await withServer(async (baseUrl, reads, reader) => {
    let auth = 'Bearer workers-v1';
    let sync = 'workers-sync-v1';
    let asyncCalls = 0;
    let syncCalls = 0;
    const headers: HeadersRecord = {
      'x-u3-static': 'before-construction',
      'x-u3-sync': () => {
        syncCalls += 1;
        return sync;
      },
      authorization: () => {
        asyncCalls += 1;
        return Promise.resolve(auth);
      },
    };
    // A variable keeps the unchanged production RED runnable before the new option exists.
    const options = { baseUrl, headers };
    const db = createWorkersStreamDB(options);
    const active = reader(db);
    const collections = db.collections;
    const execution = collections.execution;
    assertEquals(syncCalls, 0);
    assertEquals(asyncCalls, 0);
    headers['x-u3-static'] = 'workers-static';
    await deadline(active.preload());
    const first = reads[0];
    assertExists(first);
    assertEquals(first.auth, 'Bearer workers-v1');
    assertEquals(first.static, 'workers-static');
    assertEquals(first.sync, 'workers-sync-v1');
    const seen = reads.length;
    auth = 'Bearer workers-v2';
    sync = 'workers-sync-v2';
    await eventually(() => reads.slice(seen).some((read) => read.auth === auth));
    const rotated = reads.slice(seen).find((read) => read.auth === auth);
    assertExists(rotated);
    assertEquals(rotated.live, 'long-poll');
    assertEquals(rotated.static, 'workers-static');
    assertEquals(rotated.sync, 'workers-sync-v2');
    assert(reads.every((read) => read.path === '/v1/stream/netscript/workers/executions'));
    assert(syncCalls >= 2);
    assert(asyncCalls >= 2);
    assert(db.collections === collections);
    assert(db.collections.execution === execution);
    active.close();
  });
});

test('U3 workers empty headers replace ambient auth and omission preserves legacy', async () => {
  await withServer(async (baseUrl, reads, reader) => {
    const options = { baseUrl, headers: {} };
    const explicit = reader(createWorkersStreamDB(options));
    await deadline(explicit.preload());
    explicit.close();
    assert(reads.length > 0);
    assert(reads.every((read) => read.auth === null));
  });
  await withServer(async (baseUrl, reads, reader) => {
    const legacy = reader(createWorkersStreamDB({ baseUrl }));
    await deadline(legacy.preload());
    assert(reads.length > 0);
    assert(reads.every((read) => read.auth === 'Bearer u3-workers-synthetic'));
    legacy.close();
  });
});

test('U3 workers public compiler target accepts headers and rejects three invalid shapes', async () => {
  const tempDir = await Deno.makeTempDir({
    dir: fromFileUrl(new URL('./', import.meta.url)),
    prefix: 'u3-headers-',
  });
  try {
    const positiveFile = fromFileUrl(new URL('./live-query-consumer_type.ts', import.meta.url));
    const config = fromFileUrl(new URL('../../../../deno.json', import.meta.url));
    assert(positiveFile.length > 0 && (await Deno.stat(positiveFile)).size > 0);
    const positive = await check(positiveFile, config);
    assertEquals(positive.code, 0, positive.text);
    assert(!/TS\d+|No matching|No target/.test(positive.text), positive.text);
    for (
      const [name, headers] of [
        ['number', '{ authorization: 1 }'],
        ['callback', '{ authorization: () => 1 }'],
        ['map', "() => ({ authorization: 'x' })"],
      ]
    ) {
      const file = `${tempDir}/workers-headers-${name}.ts`;
      await Deno.writeTextFile(
        file,
        `import { createWorkersStreamDB } from '@netscript/plugin-workers/streams';
createWorkersStreamDB({ headers: ${headers} });
`,
      );
      const negative = await check(file, config);
      assert(negative.code !== 0, `${name}: ${negative.text}`);
      assert(negative.text.includes(`workers-headers-${name}.ts`), negative.text);
      assert(negative.text.includes('TS2322'), negative.text);
      assert(/MaybePromise|HeadersRecord|not assignable/.test(negative.text), negative.text);
      assert(!/TS2307|TS2305|No matching|No target/.test(negative.text), negative.text);
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

async function check(file: string, config: string): Promise<{ code: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Compiler deadline: ${file}`)), 30_000);
  try {
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['check', '--unstable-kv', '--frozen', '--config', config, file],
      signal: controller.signal,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    controller.signal.throwIfAborted();
    return { code: output.code, text: new TextDecoder().decode(output.stderr) };
  } finally {
    clearTimeout(timer);
  }
}
