import { assert, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { stub } from '@std/testing/mock';
import { FakeTime } from '@std/testing/time';
import { abortable } from 'jsr:@std/async@1/abortable';
import { fileURLToPath } from 'node:url';
import { FileBackedStreamStore } from '@durable-streams/server';
import { createBoundedFileBackedStreamStore } from '../bounded-file-store.ts';
import { type NativeStreamMetadata, SlidingStreamAccess } from '../sliding-stream-access.ts';
import { startExpiryCompanion } from './test_utils/expiry-companion.ts';

const PATH = '/retained';
const EPOCH = 2_000_000_000_000;
const TTL = { ttlSeconds: 1, contentType: 'text/plain' } as const;
const text = new TextEncoder().encode('appended');
const deadline = () => AbortSignal.timeout(5_000);

interface NativeDb {
  get(key: string): (NativeStreamMetadata & { currentOffset: string }) | undefined;
  putSync(key: string, value: NativeStreamMetadata): boolean;
  transactionAsync(callback: () => void): Promise<void>;
  readonly flushed: PromiseLike<unknown>;
}

function nativeDb(store: FileBackedStreamStore): NativeDb {
  return Reflect.get(store, 'db') as NativeDb;
}

function metadata(store: FileBackedStreamStore, path = PATH) {
  const record = nativeDb(store).get(`stream:${path}`);
  assert(record);
  return record;
}

function clock() {
  let elapsed = 0;
  const mock = stub(Date, 'now', () => EPOCH + elapsed);
  return { at: (ms: number) => elapsed = ms, restore: () => mock.restore() };
}

async function withStore(
  test: (
    store: FileBackedStreamStore,
    time: ReturnType<typeof clock>,
    dir: string,
  ) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'streams-expiry-' });
  const time = clock();
  try {
    const store = createBoundedFileBackedStreamStore(dir);
    try {
      await test(store, time, dir);
    } finally {
      await store.close();
    }
  } finally {
    time.restore();
    await Deno.remove(dir, { recursive: true });
  }
}

function pauseWriter(store: FileBackedStreamStore) {
  const db = nativeDb(store);
  const real = db.transactionAsync.bind(db);
  const started = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const written = Promise.withResolvers<void>();
  let transactions = 0;
  db.transactionAsync = async (callback) => {
    transactions++;
    started.resolve();
    await release.promise;
    await real(callback);
    await db.flushed;
    written.resolve();
  };
  return {
    started: started.promise,
    resume: release.resolve,
    written: written.promise,
    count: () => transactions,
  };
}

async function withServer(
  test: (
    store: FileBackedStreamStore,
    time: ReturnType<typeof clock>,
    url: string,
  ) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'streams-expiry-http-' });
  const time = clock();
  try {
    const server = await startExpiryCompanion(dir);
    try {
      await test(server.store, time, server.base + PATH);
    } finally {
      await server.stop();
    }
  } finally {
    time.restore();
    await Deno.remove(dir, { recursive: true });
  }
}

async function request(url: string, method: string, headers?: HeadersInit, body?: string) {
  const response = await fetch(url, { method, headers, body, signal: deadline() });
  await response.body?.cancel();
  return response.status;
}

async function crash(child: Deno.ChildProcess): Promise<void> {
  // Send SIGKILL before closing stdin so the child cannot drain or flush.
  try {
    child.kill('SIGKILL');
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
  await child.stdin.close();
  await child.stdout.cancel();
  assertEquals((await abortable(child.status, deadline())).signal, 'SIGKILL');
}

Deno.test('file access skips persistence for unbounded and absolute-expiry streams', () =>
  withStore(async (store, time) => {
    const expiresAt = new Date(EPOCH + 1_000).toISOString();
    await store.create(PATH);
    await store.create('/fixed', { expiresAt });
    const db = nativeDb(store);
    const nativePut = db.putSync.bind(db);
    const nativeTransaction = db.transactionAsync.bind(db);
    let puts = 0;
    let transactions = 0;
    db.putSync = (key, value) => {
      puts++;
      return nativePut(key, value);
    };
    db.transactionAsync = (callback) => {
      transactions++;
      return nativeTransaction(callback);
    };
    time.at(999);
    for (const path of [PATH, '/fixed']) {
      store.touchAccess(path);
      assertEquals(metadata(store, path).lastAccessedAt, EPOCH);
    }
    assertEquals(store.get('/fixed')?.expiresAt, expiresAt);
    await store.close();
    assertEquals(puts, 0);
    assertEquals(transactions, 0);
  }));

Deno.test('absolute expiry is fixed and inclusive across access', () =>
  withStore(async (store, time) => {
    await store.create(PATH, { expiresAt: new Date(EPOCH + 1_000).toISOString() });
    time.at(999);
    assert(store.has(PATH));
    store.touchAccess(PATH);
    time.at(1_000);
    assertEquals(store.has(PATH), false);
  }));

Deno.test('a wave of renewals writes the latest access once at the coalescing interval', async () => {
  using time = new FakeTime(EPOCH);
  let persisted: NativeStreamMetadata = {
    path: PATH,
    directoryName: 'generation',
    ttlSeconds: 1,
    createdAt: EPOCH,
  };
  const writes: NativeStreamMetadata[] = [];
  const access = new SlidingStreamAccess({
    get: () => persisted,
    put: () => undefined,
    putSync: (_key: string, record: NativeStreamMetadata) => {
      writes.push(record);
      persisted = record;
      return true;
    },
    transactionAsync: (callback: () => void) => {
      callback();
      return Promise.resolve();
    },
    flushed: Promise.resolve(),
  }, (error) => {
    throw error;
  });
  try {
    time.tick(1);
    access.touch(PATH);
    time.tick(9);
    access.touch(PATH);
    time.tick(15);
    assertEquals(writes, []);
    assertEquals(access.current(persisted).lastAccessedAt, EPOCH + 10);
    await time.tickAsync(1);
    assertEquals(writes.map((record) => record.lastAccessedAt), [EPOCH + 10]);
  } finally {
    await access.close();
  }
});

Deno.test('sliding store HTTP semantics renew for reads and appends at the native boundary', () =>
  withServer(async (store, time, url) => {
    const createHeaders = { 'content-type': 'text/plain', 'stream-ttl': '1' };
    assertEquals(await request(url, 'PUT', createHeaders), 201);
    time.at(800);
    assertEquals(await request(url, 'HEAD'), 200);
    assertEquals(await request(url, 'PUT', createHeaders), 200);
    assertEquals(store.get(PATH)?.lastAccessedAt, EPOCH);

    const head = await fetch(url, { method: 'HEAD', signal: deadline() });
    const etag = head.headers.get('etag');
    assert(etag);
    time.at(900);
    assertEquals(await request(url, 'GET', { 'if-none-match': etag }), 304);
    assertEquals(metadata(store).lastAccessedAt, EPOCH + 900);
    assertEquals(store.get(PATH)?.lastAccessedAt, EPOCH + 900);
    time.at(1_000);
    assertEquals(await request(url, 'HEAD'), 200);
    assertEquals(store.read(PATH).messages, []);
    assertEquals(await request(url, 'PUT', createHeaders), 200);
    assertEquals(store.get(PATH)?.lastAccessedAt, EPOCH + 900);

    time.at(1_899);
    assertEquals(await request(url, 'POST', { 'content-type': 'text/plain' }, 'append'), 204);
    assertEquals(store.get(PATH)?.lastAccessedAt, EPOCH + 1_899);
    time.at(2_898);
    assertEquals(await request(url, 'HEAD'), 200);
    assertEquals(await request(url, 'PUT', createHeaders), 200);
    time.at(2_899);
    assertEquals(await request(url, 'HEAD'), 404);
  }));

Deno.test('a delayed SSE renewal does not hold the append acknowledgement', () =>
  withServer(async (store, time, url) => {
    await store.create(PATH, TTL);
    time.at(900);
    const writer = pauseWriter(store);
    const signal = new AbortController();
    try {
      const response = await fetch(`${url}?offset=-1&live=sse`, {
        signal: AbortSignal.any([signal.signal, deadline()]),
      });
      assertEquals(response.status, 200);
      const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
      assert(reader);
      let delivered = false;
      const opening = reader.read().then((chunk) => {
        delivered = true;
        return chunk;
      });
      await abortable(writer.started, deadline());
      assertEquals(metadata(store).lastAccessedAt, EPOCH);
      assertEquals(delivered, false);
      for (let offset = 901; offset <= 999; offset++) {
        time.at(offset);
        store.touchAccess(PATH);
      }
      assertEquals(writer.count(), 1);
      assertEquals(store.get(PATH)?.lastAccessedAt, EPOCH + 999);

      time.at(1_100);
      assertEquals(await request(url, 'POST', { 'content-type': 'text/plain' }, 'append'), 204);
      assertEquals(metadata(store).lastAccessedAt, EPOCH + 1_100);
      assertEquals(store.get(PATH)?.lastAccessedAt, EPOCH + 1_100);
      const control = await abortable(opening, deadline());
      assert(control.value?.startsWith('event: control\n'));
      assertEquals(writer.count(), 1);
      writer.resume();
      await reader.cancel();
    } finally {
      signal.abort();
      writer.resume();
    }
  }));

Deno.test('a failed renewal withholds successful HTTP completion and leaves live expiry intact', () =>
  withServer(async (store, time, url) => {
    await store.create(PATH, TTL);
    const db = nativeDb(store);
    const native = db.transactionAsync.bind(db);
    const failure = new Error('injected read renewal failure');
    let attempts = 0;
    db.transactionAsync = (callback) =>
      ++attempts === 1 ? Promise.reject(failure) : native(callback);
    time.at(900);
    assertEquals(await request(url, 'GET'), 502);
    time.at(1_000);
    assertEquals(await request(url, 'HEAD'), 200);
    assertEquals(await request(url, 'GET'), 200);
    assertEquals(metadata(store).lastAccessedAt, EPOCH + 1_000);
  }));

Deno.test('a queued renewal cannot update a recreated stream generation', () =>
  withStore(async (store, time) => {
    await store.create(PATH, TTL);
    const old = metadata(store);
    const writer = pauseWriter(store);
    try {
      time.at(900);
      store.touchAccess(PATH);
      await abortable(writer.started, deadline());
      assert(store.delete(PATH));
      // Reuse the old creation timestamp to ensure generation safety is independent of it.
      time.at(0);
      await store.create(PATH, TTL);
      const replacement = metadata(store);
      assertEquals(replacement.createdAt, old.createdAt);
      assertNotEquals(replacement.directoryName, old.directoryName);
      writer.resume();
      await abortable(writer.written, deadline());
      assertEquals(metadata(store), replacement);
      time.at(1_000);
      assertEquals(store.has(PATH), false);
    } finally {
      writer.resume();
    }
  }));

Deno.test('native append snapshots preserve a renewal that commits during file I/O', () =>
  withStore(async (store, time) => {
    await store.create(PATH, TTL);
    const pool = Reflect.get(store, 'fileHandlePool') as { fsyncFile(path: string): Promise<void> };
    const fsync = pool.fsyncFile.bind(pool);
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    using _fsync = stub(pool, 'fsyncFile', async (path) => {
      entered.resolve();
      await resume.promise;
      await fsync(path);
    });
    const writer = pauseWriter(store);
    const append = store.appendWithProducer(PATH, text, {
      producerId: 'expiry-test',
      producerEpoch: 1,
      producerSeq: 0,
    });
    try {
      await abortable(entered.promise, deadline());
      time.at(900);
      for (let i = 0; i < 32; i++) store.touchAccess(PATH);
      await abortable(writer.started, deadline());
      writer.resume();
      await abortable(writer.written, deadline());
      assertEquals(metadata(store).lastAccessedAt, EPOCH + 900);
    } finally {
      resume.resolve();
      writer.resume();
      await append;
    }
    assertEquals(store.getProducerEpoch(PATH, 'expiry-test'), 1);
    assertEquals(store.getCurrentOffset(PATH), (await append).message?.offset);
    assertEquals(metadata(store).lastAccessedAt, EPOCH + 900);
  }));

Deno.test('renewal failures leave live expiry intact, report and retry', () =>
  withStore(async (store, time) => {
    await store.create(PATH, TTL);
    const db = nativeDb(store);
    const real = db.transactionAsync.bind(db);
    const renewed = Promise.withResolvers<void>();
    const reported = Promise.withResolvers<void>();
    const failure = new Error('injected renewal write failure');
    let attempts = 0;
    using report = stub(console, 'error', (_message, error) => {
      assertEquals(error, failure);
      reported.resolve();
    });
    using _transaction = stub(db, 'transactionAsync', async (callback) => {
      if (++attempts === 1) throw failure;
      await real(callback);
      await db.flushed;
      renewed.resolve();
    });
    time.at(900);
    store.touchAccess(PATH);
    await abortable(reported.promise, deadline());
    time.at(1_000);
    assertEquals(store.get(PATH)?.lastAccessedAt, EPOCH + 900);
    assertEquals(report.calls.length, 1);
    await abortable(renewed.promise, deadline());
    assertEquals(attempts, 2);
    assertEquals(metadata(store).lastAccessedAt, EPOCH + 900);
  }));

Deno.test('clean shutdown flushes a queued renewal before restart', () =>
  withStore(async (store, time, dir) => {
    await store.create(PATH, TTL);
    time.at(900);
    store.touchAccess(PATH);
    assertEquals(metadata(store).lastAccessedAt, EPOCH);
    await store.close();
    // Reopen with the upstream store to prove the timestamp is in its existing LMDB record.
    const recovered = new FileBackedStreamStore({ dataDir: dir });
    try {
      time.at(1_000);
      assertEquals(recovered.get(PATH)?.lastAccessedAt, EPOCH + 900);
      time.at(1_900);
      assertEquals(recovered.has(PATH), false);
    } finally {
      await recovered.close();
    }
  }));

Deno.test('shutdown reports a failed final flush and still closes the native store', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'streams-expiry-error-' });
  const time = clock();
  try {
    const store = createBoundedFileBackedStreamStore(dir);
    await store.create(PATH, TTL);
    time.at(900);
    store.touchAccess(PATH);
    const failure = new Error('injected terminal disk failure');
    nativeDb(store).transactionAsync = () => Promise.reject(failure);
    const error = await assertRejects(() => store.close(), Error, 'at shutdown');
    assertEquals(error.cause, failure);
    const recovered = new FileBackedStreamStore({ dataDir: dir });
    try {
      assertEquals(recovered.get(PATH)?.lastAccessedAt, EPOCH);
    } finally {
      await recovered.close();
    }
  } finally {
    time.restore();
    await Deno.remove(dir, { recursive: true });
  }
});

for (
  const mode of [
    'native',
    'completed',
    'uncompleted',
    'graceful',
    'append',
    'bare close',
    'repeated bare close',
  ] as const
) {
  Deno.test(`sliding TTL survives recovery at the access checkpoint (${mode})`, async () => {
    const dir = await Deno.makeTempDir({ prefix: 'streams-expiry-crash-' });
    const time = clock();
    const child = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--frozen',
        '-A',
        fileURLToPath(new URL('./test_utils/sliding-access-worker.ts', import.meta.url)),
        dir,
        mode,
        String(EPOCH),
      ],
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'inherit',
    }).spawn();
    try {
      const reader = child.stdout.getReader();
      let output = '';
      try {
        while (!output.includes('RENEWAL_CHECKPOINT')) {
          const chunk = await abortable(reader.read(), deadline());
          assert(!chunk.done, 'Child exited before reaching the renewal checkpoint');
          output += new TextDecoder().decode(chunk.value);
        }
      } finally {
        reader.releaseLock();
        if (mode === 'graceful') {
          await child.stdin.close();
          await child.stdout.cancel();
          assertEquals((await abortable(child.status, deadline())).code, 0);
        } else {
          await crash(child);
        }
      }
      const recovered = createBoundedFileBackedStreamStore(dir);
      try {
        time.at(999);
        assertEquals(
          recovered.get(PATH)?.lastAccessedAt,
          EPOCH + (mode === 'uncompleted' ? 0 : 900),
        );
        if (mode === 'bare close' || mode === 'repeated bare close') {
          assertEquals(recovered.get(PATH)?.closed, true);
        }
        time.at(mode === 'uncompleted' ? 1_000 : 1_899);
        assertEquals(recovered.has(PATH), mode !== 'uncompleted');
        time.at(1_900);
        assertEquals(recovered.has(PATH), false);
      } finally {
        await recovered.close();
      }
    } finally {
      time.restore();
      await Deno.remove(dir, { recursive: true });
    }
  });
}
