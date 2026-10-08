import { assert, assertEquals } from '@std/assert';
import {
  DurableStreamTestServer,
  encodeStreamPath,
  FileBackedStreamStore,
} from '@durable-streams/server';
import { createBoundedFileBackedStreamStore, createStreamsServer } from '../bounded-file-store.ts';
import { frameOffset } from '../bounded-segment-log.ts';

const encode = (value: string): Uint8Array => new TextEncoder().encode(value);
const decode = (data: Uint8Array): string => new TextDecoder().decode(data);

Deno.test({
  name: 'bounded native store: unreadable recovery preserves metadata instead of fabricating zero',
  // POSIX mode bits cannot make a file unreadable to root or on Windows.
  ignore: Deno.build.os === 'windows' || Deno.uid() === 0,
  async fn() {
    const dir = await Deno.makeTempDir({ prefix: 'streams-unreadable-' });
    let store = createBoundedFileBackedStreamStore(dir);
    let segment: string | undefined;
    try {
      await store.create('/protected', { contentType: 'text/plain' });
      await store.append('/protected', encode('preserved'));
      const expected = store.getCurrentOffset('/protected');
      assert(expected);
      assert(expected !== frameOffset(0));
      await store.close();
      const entry = Array.from(Deno.readDirSync(`${dir}/streams`)).find((e) =>
        e.name.startsWith(`${encodeStreamPath('/protected')}~`)
      );
      assert(entry);
      segment = `${dir}/streams/${entry.name}`;
      await Deno.chmod(segment, 0o000);
      store = createBoundedFileBackedStreamStore(dir);
      assertEquals(store.getCurrentOffset('/protected'), expected);
      await store.close();
      // The unchanged native recovery swallows this same I/O failure and
      // persists a fabricated reset, proving this fixture binds the repair.
      store = new FileBackedStreamStore({ dataDir: dir });
      assertEquals(store.getCurrentOffset('/protected'), frameOffset(0));
      await store.close();
      await Deno.chmod(segment, 0o600);
      store = createBoundedFileBackedStreamStore(dir);
      assertEquals(store.getCurrentOffset('/protected'), expected);
      assertEquals(store.read('/protected').messages.map((m) => decode(m.data)), ['preserved']);
    } finally {
      if (segment) await Deno.chmod(segment, 0o600);
      await store.close();
      await Deno.remove(dir, { recursive: true });
    }
  },
});

Deno.test('bounded native store: recovery reconciles incomplete frames without changing fork offsets', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'streams-framing-' });
  let store = createBoundedFileBackedStreamStore(dir);
  try {
    await store.create('/source', { contentType: 'text/plain' });
    await store.append('/source', encode('one'));
    const firstOffset = store.getCurrentOffset('/source');
    assert(firstOffset);
    await store.create('/fork', { forkedFrom: '/source', forkOffset: firstOffset });
    await store.append('/source', encode('later-source'));
    await store.append('/fork', encode('own'));
    await store.create('/chain', { forkedFrom: '/fork' });
    await store.append('/chain', encode('chain'));
    const forkOffset = store.getCurrentOffset('/fork');
    const chainOffset = store.getCurrentOffset('/chain');
    const sourceOffset = store.getCurrentOffset('/source');
    await store.create('/truncated', { contentType: 'text/plain' });
    await store.append('/truncated', encode('kept'));
    const completeOffset = store.getCurrentOffset('/truncated');
    await store.append('/truncated', encode('lost-in-crash'));
    await store.close();
    // A crash can leave an incomplete frame after the native metadata commit.
    const sourceEntry = Array.from(Deno.readDirSync(`${dir}/streams`)).find((e) =>
      e.name.startsWith(`${encodeStreamPath('/source')}~`)
    );
    assert(sourceEntry);
    await Deno.writeFile(
      `${dir}/streams/${sourceEntry.name}`,
      new Uint8Array([0, 0, 0, 8, 97, 98]),
      { append: true },
    );
    const truncatedEntry = Array.from(Deno.readDirSync(`${dir}/streams`)).find((e) =>
      e.name.startsWith(`${encodeStreamPath('/truncated')}~`)
    );
    assert(truncatedEntry);
    // Metadata can also be ahead of a truncated log. Reconcile backwards to
    // the last complete frame, including when only two header bytes survive.
    await Deno.truncate(`${dir}/streams/${truncatedEntry.name}`, encode('kept').length + 5 + 2);
    store = createBoundedFileBackedStreamStore(dir);
    assertEquals(store.getCurrentOffset('/truncated'), completeOffset);
    assertEquals(store.read('/truncated').messages.map((m) => decode(m.data)), ['kept']);
    assertEquals(store.getCurrentOffset('/source'), sourceOffset);
    assertEquals(store.getCurrentOffset('/fork'), forkOffset);
    assertEquals(store.getCurrentOffset('/chain'), chainOffset);
    assertEquals(store.read('/fork').messages.map((m) => decode(m.data)), ['one', 'own']);
    assertEquals(store.read('/chain').messages.map((m) => decode(m.data)), ['one', 'own', 'chain']);
    assertEquals(store.read('/fork', firstOffset).messages.map((m) => decode(m.data)), ['own']);
    assertEquals(store.read('/source').messages.map((m) => decode(m.data)), [
      'one',
      'later-source',
    ]);
    assertEquals(store.read('/fork', forkOffset).messages, []);
    assertEquals(store.read('/fork', frameOffset(99999)).messages, []);
  } finally {
    await store.close();
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('bounded native store: native JSON formatting, sub-offset forks and producer state survive restart', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'streams-native-' });
  let store = createBoundedFileBackedStreamStore(dir);
  try {
    await store.create('/json', { contentType: 'application/json' });
    await store.append('/json', encode('[1,2,3]'));
    await store.create('/sub', {
      forkedFrom: '/json',
      forkOffset: frameOffset(0),
      forkSubOffset: 2,
    });
    assertEquals(decode(store.formatResponse('/sub', store.read('/sub').messages)), '[1,2]');
    await store.create('/producer', { contentType: 'text/plain' });
    const result = await store.appendWithProducer('/producer', encode('durable'), {
      producerId: 'writer',
      producerEpoch: 1,
      producerSeq: 0,
    });
    assert(result);
    const offset = store.getCurrentOffset('/producer');
    store.closeStream('/producer');
    await store.close();
    store = createBoundedFileBackedStreamStore(dir);
    assertEquals(store.getProducerEpoch('/producer', 'writer'), 1);
    assertEquals(store.getCurrentOffset('/producer'), offset);
    assertEquals(store.get('/producer')?.closed, true);
    assertEquals(store.read('/producer').messages.map((m) => decode(m.data)), ['durable']);
    assertEquals(decode(store.formatResponse('/sub', store.read('/sub').messages)), '[1,2]');
  } finally {
    await store.close();
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('streams server seam: native HTTP append, tail and durable restart use an isolated bounded store', async () => {
  const nativeScan = Object.getOwnPropertyDescriptor(
    FileBackedStreamStore.prototype,
    'scanFileForTrueOffset',
  )?.value;
  const nativeRead = Object.getOwnPropertyDescriptor(
    FileBackedStreamStore.prototype,
    'readMessagesFromSegmentFile',
  )?.value;
  assert(createStreamsServer({ port: 0 }) instanceof DurableStreamTestServer);
  const dir = await Deno.makeTempDir({ prefix: 'streams-http-' });
  let server = createStreamsServer({ port: 0, dataDir: dir, compression: false });
  try {
    assert(server.store instanceof FileBackedStreamStore);
    let url = await server.start();
    const created = await fetch(`${url}/events`, {
      method: 'PUT',
      headers: { 'content-type': 'text/plain' },
      body: 'before',
    });
    assertEquals(created.status, 201);
    const offset = created.headers.get('stream-next-offset');
    assert(offset);
    await created.body?.cancel();
    const append = await fetch(`${url}/events`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'after',
    });
    assertEquals(append.status, 204);
    await append.body?.cancel();
    await server.stop();
    server = createStreamsServer({ port: 0, dataDir: dir, compression: false });
    url = await server.start();
    const tail = await fetch(`${url}/events?offset=${offset}`);
    assertEquals(tail.status, 200);
    assertEquals(await tail.text(), 'after');
    const all = await fetch(`${url}/events?offset=-1`);
    assertEquals(await all.text(), 'beforeafter');
    assertEquals(
      Object.getOwnPropertyDescriptor(FileBackedStreamStore.prototype, 'scanFileForTrueOffset')
        ?.value,
      nativeScan,
    );
    assertEquals(
      Object.getOwnPropertyDescriptor(
        FileBackedStreamStore.prototype,
        'readMessagesFromSegmentFile',
      )?.value,
      nativeRead,
    );
  } finally {
    await server.stop();
    await Deno.remove(dir, { recursive: true });
  }
});
