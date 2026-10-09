import { assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';

async function withTempDir(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'queue-kv-lifecycle-' });
  try {
    await run(`${dir}/kv.sqlite`);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function until(condition: () => boolean, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('Condition did not hold before the deadline.');
    await delay(10);
  }
}

/** A handler that records when it starts and finishes a short asynchronous unit of work. */
function slowHandler(workMs = 150) {
  const state = { started: 0, completed: 0 };
  const handler = async () => {
    state.started += 1;
    await delay(workMs);
    state.completed += 1;
  };
  return { state, handler };
}

Deno.test('stop() on the last listener of a database waits for its in-flight handler', async () => {
  await withTempDir(async (path) => {
    const queue = new DenoKvAdapter<string>({ path, queueName: 'jobs' });
    const { state, handler } = slowHandler();
    let completedWhenListenReturned = -1;
    const listening = queue.listen(handler).then(() => {
      completedWhenListenReturned = state.completed;
    });
    await queue.enqueue('work');
    await until(() => state.started === 1);

    await queue.stop();
    const completedWhenStopReturned = state.completed;
    await listening;

    assertEquals(completedWhenStopReturned, 1);
    assertEquals(completedWhenListenReturned, 1);
  });
});

Deno.test('stop() on one of several named listeners waits for its handler and leaves the others listening', async () => {
  await withTempDir(async (path) => {
    const tasks = new DenoKvAdapter<string>({ path, queueName: 'tasks' });
    const jobs = new DenoKvAdapter<string>({ path, queueName: 'jobs' });
    const { state, handler } = slowHandler();
    const jobsReceived: string[] = [];
    const tasksListening = tasks.listen(handler);
    const jobsListening = jobs.listen((message) => {
      jobsReceived.push(message);
      return Promise.resolve();
    });
    try {
      await tasks.enqueue('task');
      await until(() => state.started === 1);

      await tasks.stop();
      assertEquals(state.completed, 1);
      await tasksListening;

      await jobs.enqueue('job-after-tasks-stopped');
      await until(() => jobsReceived.length === 1);
    } finally {
      await jobs.stop();
      await jobsListening;
    }
    assertEquals(jobsReceived, ['job-after-tasks-stopped']);
  });
});

for (const database of ['file', 'memory'] as const) {
  Deno.test(`a pending message survives a listener abort and restart while a producer holds the ${database} database`, async () => {
    await withTempDir(async (filePath) => {
      const path = database === 'memory' ? ':memory:' : filePath;
      const producer = new DenoKvAdapter<string>({ path, queueName: 'jobs' });
      const consumer = new DenoKvAdapter<string>({ path, queueName: 'jobs' });
      const received: string[] = [];
      const handler = (message: string) => {
        received.push(message);
        return Promise.resolve();
      };
      try {
        const first = new AbortController();
        const firstListening = consumer.listen(handler, { signal: first.signal });
        await delay(20);
        await producer.enqueue('pending', { delay: 300 });
        first.abort();
        await firstListening;

        const second = new AbortController();
        const secondListening = consumer.listen(handler, { signal: second.signal });
        await until(() => received.length === 1);
        second.abort();
        await secondListening;
      } finally {
        await consumer.stop();
        await producer.stop();
      }
      assertEquals(received, ['pending']);
    });
  });
}

Deno.test('a caller-owned KV handle stays open across listener shutdown and after every adapter stops', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const consumer = DenoKvAdapter.withKv<string>(kv, 'jobs');
    const producer = DenoKvAdapter.withKv<string>(kv, 'jobs');
    const received: string[] = [];
    const listening = consumer.listen((message) => {
      received.push(message);
      return Promise.resolve();
    });
    await producer.enqueue('before-stop');
    await until(() => received.length === 1);

    await consumer.stop();
    await listening;
    await producer.enqueue('after-listener-stopped');
    await producer.stop();

    await kv.set(['still', 'open'], true);
    assertEquals((await kv.get(['still', 'open'])).value, true);
    assertEquals(received, ['before-stop']);
  } finally {
    kv.close();
    await delay(20);
  }
});

Deno.test('round-robin is per queue name under interleaved traffic', async () => {
  await withTempDir(async (path) => {
    const counts = { a1: 0, a2: 0, b1: 0, b2: 0 };
    const consumers = (['a1', 'a2', 'b1', 'b2'] as const).map((id) => ({
      id,
      queue: new DenoKvAdapter<string>({ path, queueName: id[0] }),
    }));
    const producers = {
      a: new DenoKvAdapter<string>({ path, queueName: 'a' }),
      b: new DenoKvAdapter<string>({ path, queueName: 'b' }),
    };
    const listening = consumers.map(({ id, queue }) =>
      queue.listen(() => {
        counts[id] += 1;
        return Promise.resolve();
      })
    );
    try {
      await delay(20);
      // Strictly alternate names, one delivery at a time, so dispatch order is deterministic.
      const total = () => counts.a1 + counts.a2 + counts.b1 + counts.b2;
      for (let index = 0; index < 4; index++) {
        for (const name of ['a', 'b'] as const) {
          const before = total();
          await producers[name].enqueue(`${name}-${index}`);
          await until(() => total() === before + 1);
        }
      }
      await until(() => counts.a1 + counts.a2 + counts.b1 + counts.b2 === 8);
    } finally {
      await Promise.all(consumers.map(({ queue }) => queue.stop()));
      await Promise.all(listening);
      await Promise.all([producers.a.stop(), producers.b.stop()]);
    }
    assertEquals(counts, { a1: 2, a2: 2, b1: 2, b2: 2 });
  });
});
