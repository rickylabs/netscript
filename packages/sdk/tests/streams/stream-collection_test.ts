import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { deadline } from 'jsr:@std/async@^1/deadline';
import { createStreamCollectionV1 } from '@netscript/sdk/streams/collections';
import {
  and,
  createLiveQueryCollection,
  createTransaction,
  eq,
  isCollection,
  Query,
  toArray,
} from '@tanstack/db';
import type { Collection } from '@tanstack/db';
import type { StreamFetchV1, StreamSourceSchedulerV1 } from '@netscript/sdk/streams/consumer';

interface Task {
  id: string;
  title: string;
}
function parse(value: unknown): Task {
  if (
    !value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string' ||
    !('title' in value) || typeof value.title !== 'string'
  ) throw new TypeError('Invalid task');
  return { id: value.id, title: value.title };
}
async function settle() {
  for (let i = 0; i < 100; i++) await Promise.resolve();
}
class Transport {
  readonly urls: URL[] = [];
  readonly readers: ReadableStreamDefaultController<Uint8Array>[] = [];
  readonly fetch: StreamFetchV1 = (url) => {
    this.urls.push(new URL(url));
    return Promise.resolve(
      new Response(
        new ReadableStream<Uint8Array>({ start: (reader) => this.readers.push(reader) }),
        { headers: { 'content-type': 'text/event-stream' } },
      ),
    );
  };
  send(text: string) {
    this.readers.at(-1)!.enqueue(new TextEncoder().encode(text));
  }
  drop() {
    this.readers.at(-1)!.error(new Error('disconnect'));
  }
}
function change(id: string, title: string, operation = 'upsert', type = 'tasks') {
  return {
    type,
    key: id,
    ...(operation === 'delete' ? {} : { value: { id, title } }),
    headers: {
      operation,
      correlationId: id,
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    },
  };
}
function data(changes: unknown[]) {
  return `event: data\ndata: ${JSON.stringify(changes)}\n\n`;
}
function control(offset: string, upToDate = true) {
  return `event: control\ndata: ${JSON.stringify({ streamNextOffset: offset, upToDate })}\n\n`;
}
function create(transport: Transport, scheduler?: StreamSourceSchedulerV1) {
  return createStreamCollectionV1({
    type: 'tasks',
    url: 'https://api.example.com/v1/stream/netscript/tasks?offset=-1',
    fetch: transport.fetch,
    parse,
    getKey: (task) => task.id,
    scheduler,
  });
}
Deno.test('non-DOM stream collection updates a real TanStack live query without refetch', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'EventSource');
  Object.defineProperty(globalThis, 'EventSource', { value: undefined, configurable: true });
  const transport = new Transport();
  const binding = create(transport);
  const collection = binding.collection;
  if (!isCollection(collection)) throw new TypeError('Expected a TanStack collection');
  const tasks: Collection<Task, string> = collection;
  const live = createLiveQueryCollection({
    query: (q) =>
      q.from({ task: tasks }).select((
        { task },
      ) => ({
        id: task.id,
        title: task.title,
      })),
    startSync: true,
    gcTime: Infinity,
  });
  try {
    await settle();
    transport.send(data([change('1', 'first'), change('2', 'ignored', 'upsert', 'other')]));
    await settle();
    assertEquals(binding.collection.size, 0); // No writes before control.
    transport.send(control('opaque:1'));
    await binding.collection.preload();
    await live.preload();
    assertEquals(live.toArray.map(({ id, title }) => ({ id, title })), [{
      id: '1',
      title: 'first',
    }]);
    transport.send(data([change('1', 'updated'), change('2', 'second')]) + control('opaque:2'));
    await settle();
    assertEquals(live.toArray.map((row) => row.title).sort(), ['second', 'updated']);
    transport.send(
      data([change('1', '', 'delete'), change('missing', '', 'delete')]) + control('opaque:3'),
    );
    await settle();
    assertEquals(live.toArray.map(({ id, title }) => ({ id, title })), [{
      id: '2',
      title: 'second',
    }]);
    assertEquals(transport.urls.length, 1);
  } finally {
    await live.cleanup();
    await binding.dispose();
    if (descriptor) Object.defineProperty(globalThis, 'EventSource', descriptor);
    else Reflect.deleteProperty(globalThis, 'EventSource');
  }
});
Deno.test('collection resume preserves exact live-query updates with no gap or duplicate', async () => {
  let retry: (() => void) | undefined;
  const scheduler: StreamSourceSchedulerV1 = {
    schedule(callback, delay) {
      if (delay === 1000) retry = callback;
      return () => {};
    },
  };
  const transport = new Transport();
  const binding = create(transport, scheduler);
  const updates: string[] = [];
  const unsubscribe = binding.collection.subscribeChanges((changes) => {
    for (const entry of changes) if (entry.type !== 'delete') updates.push(entry.value.title);
  });
  try {
    await settle();
    transport.send(data([change('1', 'first')]) + control('opaque:1'));
    await settle();
    transport.send(data([change('1', 'second')]) + 'event: control\ndata: {');
    await settle();
    transport.drop();
    await settle();
    retry!();
    await settle();
    assertEquals(transport.urls[1].searchParams.get('offset'), 'opaque:1');
    transport.send(data([change('1', 'second')]) + control('opaque:2'));
    await settle();
    assertEquals(updates, ['first', 'second']);
    assertEquals(binding.collection.get('1')?.title, 'second');
  } finally {
    unsubscribe.unsubscribe();
    await binding.dispose();
  }
});
Deno.test('invalid entity batch rejects done before any collection writes', async () => {
  const transport = new Transport();
  const binding = create(transport);
  const rejected = assertRejects(() => binding.done, TypeError, 'Invalid task');
  const preloadRejected = assertRejects(
    () => deadline(binding.collection.preload(), 1_000),
    TypeError,
    'Invalid task',
  );
  await settle();
  transport.send(
    data([change('1', 'valid'), { ...change('2', 'invalid'), value: { id: '2' } }]) +
      control('opaque:2'),
  );
  await rejected;
  await preloadRejected;
  assertEquals(binding.collection.status, 'cleaned-up');
  assertEquals(binding.collection.utils.getError()?.message, 'Invalid task');
  assertEquals(binding.collection.size, 0);
  await assertRejects(() => binding.dispose(), TypeError);
});

Deno.test('consumer collection types preserve cast-free filtered and projected live queries', async () => {
  const transport = new Transport();
  const binding = create(transport);
  const collection = binding.collection;
  if (!isCollection(collection)) throw new TypeError('Expected a TanStack collection');
  const tasks: Collection<Task, string> = collection;
  const live = createLiveQueryCollection({
    query: (q) =>
      q.from({ task: tasks })
        .where(({ task }) => eq(task.title, 'active'))
        .select(({ task }) => ({ id: task.id, title: task.title })),
    startSync: true,
    gcTime: Infinity,
  });
  try {
    await settle();
    transport.send(data([change('1', 'active'), change('2', 'inactive')]) + control('opaque:2'));
    await live.preload();
    const rows: { id: string; title: string }[] = live.toArray;
    // @ts-expect-error A projected title is a string, never an untyped number.
    const invalidTitle: number = live.toArray[0].title;
    void invalidTitle;
    assertEquals(rows.map(({ id, title }) => ({ id, title })), [{ id: '1', title: 'active' }]);
    transport.send(data([change('1', 'inactive'), change('2', 'active')]) + control('opaque:4'));
    await settle();
    assertEquals(live.toArray.map(({ id, title }) => ({ id, title })), [{
      id: '2',
      title: 'active',
    }]);
  } finally {
    await live.cleanup();
    await binding.dispose();
  }
});

Deno.test('fatal protocol failure before first control settles preload and exposes the error', async () => {
  const transport = new Transport();
  const binding = create(transport);
  const doneRejected = assertRejects(() => binding.done, TypeError);
  const preloadRejected = assertRejects(
    () => deadline(binding.collection.preload(), 1_000),
    TypeError,
  );
  await settle();
  transport.send('event: data\ndata: {}\n\nevent: control\ndata: {"streamNextOffset":"bad"}\n\n');
  await doneRejected;
  await preloadRejected;
  assertEquals(binding.collection.status, 'cleaned-up');
  assertEquals(binding.collection.utils.getError() instanceof TypeError, true);
  await assertRejects(() => binding.collection.preload(), TypeError);
  await assertRejects(() => binding.dispose(), TypeError);
});

Deno.test('cleanup forbids rebinding the cancelled single-use source', async () => {
  const transport = new Transport();
  const binding = create(transport);
  await settle();
  const collection = binding.collection;
  if (!isCollection(collection)) throw new TypeError('Expected a TanStack collection');
  const pending = assertRejects(() => binding.collection.preload(), Error);
  await binding.collection.cleanup();
  await pending;
  assertThrows(
    () => collection.startSyncImmediate(),
    Error,
    'Stream collection is closed; create a new binding',
  );
  await assertRejects(() => binding.collection.preload(), Error);
  await binding.dispose();
  assertEquals(transport.urls.length, 1);
});
Deno.test('batch-local insert update delete order and full replacement remain server-owned', async () => {
  const transport = new Transport();
  const binding = create(transport);
  try {
    await settle();
    transport.send(
      data([
        change('1', 'first'),
        change('1', 'second'),
        change('1', '', 'delete'),
        change('1', 'final'),
      ]) + control('opaque:4'),
    );
    await binding.collection.preload();
    assertEquals(binding.collection.toArray.map(({ id, title }) => ({ id, title })), [{
      id: '1',
      title: 'final',
    }]);
    const first = binding.dispose();
    assertEquals(binding.dispose(), first);
    await first;
  } finally {
    await binding.dispose();
  }
});

Deno.test('accepted stream writes stay hidden until an optimistic transaction settles', async () => {
  const transport = new Transport();
  const binding = create(transport);
  const collection = binding.collection;
  if (!isCollection(collection)) throw new TypeError('Expected a TanStack collection');
  const tasks: Collection<Task, string> = collection;
  const persistence = Promise.withResolvers<void>();
  const transaction = createTransaction({ mutationFn: () => persistence.promise });
  try {
    await settle();
    transport.send(data([change('1', 'original')]) + control('opaque:1'));
    await tasks.preload();
    transaction.mutate(() =>
      tasks.update('1', (draft) => {
        draft.title = 'optimistic';
      })
    );
    transport.send(data([change('1', 'accepted-first')]) + control('opaque:2'));
    await settle();
    transport.send(data([change('1', 'accepted-last')]) + control('opaque:3'));
    await settle();
    assertEquals(binding.snapshot().lastCommittedOffset, 'opaque:3');
    assertEquals(tasks.base.get('1')?.title, 'original');
    assertEquals(tasks.get('1')?.title, 'optimistic');
    persistence.resolve();
    await transaction.when('settled');
    assertEquals(tasks.base.get('1')?.title, 'accepted-last');
    assertEquals(tasks.get('1')?.title, 'accepted-last');
  } finally {
    persistence.resolve();
    await transaction.isPersisted.promise;
    await binding.dispose();
  }
});

Deno.test('stream live queries preserve nested source alias scope', async () => {
  const transport = new Transport();
  const binding = create(transport);
  const collection = binding.collection;
  if (!isCollection(collection)) throw new TypeError('Expected a TanStack collection');
  const tasks: Collection<Task, string> = collection;
  const nested = createLiveQueryCollection({
    query: (q) =>
      q.from({ task: tasks }).select(({ task }) => ({
        id: task.id,
        children: toArray(
          new Query().from({ task: tasks })
            .where(({ task: child }) => eq(child.id, task.id))
            .select(({ task: child }) => ({ title: child.title })),
        ),
      })),
    startSync: true,
    gcTime: Infinity,
  });
  try {
    await settle();
    transport.send(data([change('1', 'first'), change('2', 'other')]) + control('opaque:1'));
    await nested.preload();
    assertEquals(nested.toArray.find(({ id }) => id === '1')?.children, [{ title: 'first' }]);
    assertEquals(nested.toArray.find(({ id }) => id === '2')?.children, [{ title: 'other' }]);
    transport.send(data([change('1', 'updated')]) + control('opaque:2'));
    await settle();
    assertEquals(nested.toArray.find(({ id }) => id === '1')?.children, [{ title: 'updated' }]);
    assertEquals(nested.toArray.find(({ id }) => id === '2')?.children, [{ title: 'other' }]);
  } finally {
    await nested.cleanup();
    await binding.dispose();
  }
});

Deno.test('stream live queries preserve compound joins', async () => {
  const transport = new Transport();
  const binding = create(transport);
  const collection = binding.collection;
  if (!isCollection(collection)) throw new TypeError('Expected a TanStack collection');
  const tasks: Collection<Task, string> = collection;
  const joined = createLiveQueryCollection({
    query: (q) =>
      q.from({ task: tasks })
        .innerJoin({ peer: tasks }, ({ task, peer }) =>
          and(eq(task.id, peer.id), eq(task.title, peer.title)))
        .select(({ task }) => ({ id: task.id, title: task.title })),
    startSync: true,
    gcTime: Infinity,
  });
  try {
    await settle();
    transport.send(data([change('1', 'first')]) + control('opaque:1'));
    await joined.preload();
    assertEquals(joined.toArray.map(({ id, title }) => ({ id, title })), [{
      id: '1',
      title: 'first',
    }]);
    transport.send(data([change('1', 'updated')]) + control('opaque:2'));
    await settle();
    assertEquals(joined.toArray[0].title, 'updated');
  } finally {
    await joined.cleanup();
    await binding.dispose();
  }
});
