import { assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvMessageQueue } from '@fedify/denokv';
import { createQueue } from '../factory/create-queue.ts';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import { KvDeadLetterStore } from '../adapters/kv-dead-letter-store.ts';
import { createKvQueueConnection, KvQueueDispatcher } from '../adapters/_kv-queue-dispatcher.ts';
import { createEnvelope, type MessageEnvelope } from '../adapters/_envelope.ts';
import { type MessageQueue, QueueProvider } from '../ports/mod.ts';

interface Addressed {
  readonly queue: string;
  readonly seq: number;
}

const KV_PATH_ENV = 'DENO_KV_URL';

/** Point environment discovery at a fresh local database, as a DB-less background runtime does. */
async function withLocalKv(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'queue-named-kv-' });
  const previous = Deno.env.get(KV_PATH_ENV);
  Deno.env.set(KV_PATH_ENV, `${dir}/kv.sqlite`);
  try {
    await run(`${dir}/kv.sqlite`);
  } finally {
    if (previous === undefined) Deno.env.delete(KV_PATH_ENV);
    else Deno.env.set(KV_PATH_ENV, previous);
    await Deno.remove(dir, { recursive: true });
  }
}

function localQueue<T>(name: string): MessageQueue<T> {
  return createQueue<T>(name, {
    provider: QueueProvider.DenoKv,
    autoDiscover: false,
    disableAutoTracing: true,
  });
}

async function until(condition: () => boolean | Promise<boolean>, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (!(await condition())) {
    if (Date.now() > deadline) throw new Error('Condition did not hold before the deadline.');
    await delay(10);
  }
}

Deno.test('createQueue instances with N names on one local Deno KV database each receive only their own messages', async () => {
  await withLocalKv(async () => {
    const names = ['jobs', 'tasks', 'trigger:orders', 'trigger:files'];
    const perName = 5;
    const received = new Map<string, Addressed[]>(names.map((name) => [name, []]));
    const consumers = names.map((name) => localQueue<Addressed>(name));
    const producers = names.map((name) => localQueue<Addressed>(name));
    const controller = new AbortController();
    const listening = consumers.map((queue, index) =>
      queue.listen((message) => {
        received.get(names[index])!.push(message);
        return Promise.resolve();
      }, { signal: controller.signal })
    );
    try {
      for (let seq = 0; seq < perName; seq++) {
        for (const [index, name] of names.entries()) {
          await producers[index].enqueue({ queue: name, seq });
        }
      }
      await until(() =>
        [...received.values()].reduce((sum, list) => sum + list.length, 0) >= names.length * perName
      );
      await delay(100);
    } finally {
      controller.abort();
      await Promise.all(listening);
      await Promise.all([...consumers, ...producers].map((queue) => queue.stop()));
    }

    for (const name of names) {
      const messages = received.get(name)!;
      assertEquals(messages.every((message) => message.queue === name), true, name);
      assertEquals(messages.map((message) => message.seq).sort(), [0, 1, 2, 3, 4], name);
    }
  });
});

Deno.test('a legacy envelope without a queue name routes to the default queue only', async () => {
  await withLocalKv(async (path) => {
    const defaults: unknown[] = [];
    const jobs: unknown[] = [];
    const defaultQueue = new DenoKvAdapter<unknown>({ path, queueName: 'default' });
    const jobsQueue = new DenoKvAdapter<unknown>({ path, queueName: 'jobs' });
    const controller = new AbortController();
    const listening = [
      defaultQueue.listen((message) => {
        defaults.push(message);
        return Promise.resolve();
      }, { signal: controller.signal }),
      jobsQueue.listen((message) => {
        jobs.push(message);
        return Promise.resolve();
      }, { signal: controller.signal }),
    ];
    try {
      const legacy: MessageEnvelope<unknown> = createEnvelope({ legacy: 1 });
      assertEquals('queueName' in legacy, false);
      await new DenoKvMessageQueue(await jobsQueue.getKv()).enqueue(legacy);
      await until(() => defaults.length === 1);
      await delay(100);
    } finally {
      controller.abort();
      await Promise.all(listening);
      await Promise.all([defaultQueue.stop(), jobsQueue.stop()]);
    }
    assertEquals(defaults, [{ legacy: 1 }]);
    assertEquals(jobs, []);
  });
});

Deno.test('an envelope for a name with no local listener is re-enqueued until that listener registers', async () => {
  await withLocalKv(async (path) => {
    const dispatcher = new KvQueueDispatcher(createKvQueueConnection({ path }), {
      maxHops: 20,
      baseDelayMs: 20,
      maxDelayMs: 20,
    });
    const jobs: MessageEnvelope<unknown>[] = [];
    const tasks: MessageEnvelope<unknown>[] = [];
    const controller = new AbortController();
    const listening = [
      dispatcher.listen('jobs', (envelope) => {
        jobs.push(envelope);
        return Promise.resolve();
      }, controller.signal),
    ];
    try {
      await dispatcher.enqueue(createEnvelope({ task: 1 }, undefined, 'tasks'));
      await delay(100);
      assertEquals(tasks.length, 0);
      listening.push(dispatcher.listen('tasks', (envelope) => {
        tasks.push(envelope);
        return Promise.resolve();
      }, controller.signal));
      await until(() => tasks.length === 1);
    } finally {
      controller.abort();
      await Promise.all(listening);
      await dispatcher.close();
    }
    assertEquals(jobs, []);
    assertEquals(tasks[0].payload, { task: 1 });
    assertEquals((tasks[0].routingHops ?? 0) > 0, true);
  });
});

Deno.test('an envelope whose listener never appears is dead-lettered as unroutable, never acked silently', async () => {
  await withLocalKv(async (path) => {
    const dispatcher = new KvQueueDispatcher(createKvQueueConnection({ path }), {
      maxHops: 3,
      baseDelayMs: 10,
      maxDelayMs: 40,
    });
    const jobs: MessageEnvelope<unknown>[] = [];
    const controller = new AbortController();
    const listening = dispatcher.listen('jobs', (envelope) => {
      jobs.push(envelope);
      return Promise.resolve();
    }, controller.signal);
    const kv = await dispatcher.kv();
    const tasksDlq = new KvDeadLetterStore<unknown>({ queueName: 'tasks', denoKv: kv });
    const defaultDlq = new KvDeadLetterStore<unknown>({ queueName: 'default', denoKv: kv });
    try {
      const addressed = createEnvelope({ task: 'elsewhere' }, undefined, 'tasks');
      await dispatcher.enqueue(addressed);
      await dispatcher.enqueue(createEnvelope({ legacy: 'no-name' }));
      await until(async () => await tasksDlq.depth() === 1 && await defaultDlq.depth() === 1);

      const [record] = await tasksDlq.list();
      assertEquals(record.reason, 'unroutable');
      assertEquals(record.queueName, 'tasks');
      assertEquals(record.messageId, addressed.messageId);
      assertEquals(record.payload, { task: 'elsewhere' });
      const [legacy] = await defaultDlq.list();
      assertEquals(legacy.reason, 'unroutable');
      assertEquals(legacy.payload, { legacy: 'no-name' });
    } finally {
      controller.abort();
      await listening;
      await dispatcher.close();
    }
    assertEquals(jobs, []);
  });
});

Deno.test('stopping one named listener leaves the other names on the database listening', async () => {
  await withLocalKv(async () => {
    const jobs = localQueue<string>('jobs');
    const tasks = localQueue<string>('tasks');
    const producer = localQueue<string>('tasks');
    const received: string[] = [];
    const jobsListening = jobs.listen(() => Promise.resolve());
    const tasksListening = tasks.listen((message) => {
      received.push(message);
      return Promise.resolve();
    });
    try {
      await delay(50);
      await jobs.stop();
      await jobsListening;
      await producer.enqueue('after-jobs-stopped');
      await until(() => received.length === 1);
    } finally {
      await tasks.stop();
      await tasksListening;
      await producer.stop();
    }
    assertEquals(received, ['after-jobs-stopped']);
  });
});
