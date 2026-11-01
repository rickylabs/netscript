import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { Redis } from 'ioredis';
import { RedisAdapter } from '../../adapters/redis.adapter.ts';
import type { DeadLetterStorePort, ListenOptions, MessageContext } from '../../ports/mod.ts';

/** Run the same adapter regression against each configured real backend. */
export const leaseBackends: ReadonlyArray<readonly [string, string | undefined]> = [
  ['Redis', Deno.env.get('NETSCRIPT_TEST_REDIS_URL')],
  ['Garnet', Deno.env.get('NETSCRIPT_TEST_GARNET_URL')],
];

/** Poll a bounded behavioral assertion, never a fixed sleep standing in for success. */
export async function until(predicate: () => Promise<boolean>, timeout = 5_000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (!await predicate()) {
    assert(Date.now() < deadline, 'Timed out waiting for Redis lease behavior');
    await delay(20);
  }
}

/** Bound a child message or handler receipt so regressions cannot hang a test worker. */
export async function bounded<T>(promise: Promise<T>, timeout = 5_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Timed out waiting for lease test worker')),
          timeout,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** One process-isolated consumer with bounded observation and explicit owned cleanup. */
export class LeaseWorker {
  readonly child: Deno.ChildProcess;
  exited = false;
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;

  constructor(
    url: string,
    name: string,
    role: string,
    timeout: number,
    limit: number,
    grace: number,
  ) {
    this.child = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-all',
        '--unstable-kv',
        new URL('./redis-lease-worker.ts', import.meta.url).href,
        name,
        role,
        String(timeout),
        String(limit),
        String(grace),
      ],
      env: { NETSCRIPT_LEASE_TEST_URL: url },
      stdin: 'null',
      stdout: 'piped',
      stderr: 'null',
    }).spawn();
    this.reader = this.child.stdout.getReader();
    void this.child.status.then(() => this.exited = true);
  }

  async delivered(): Promise<{ deliveryCount: number; messageId: string }> {
    return await bounded((async () => {
      let text = '';
      const decoder = new TextDecoder();
      while (!text.includes('\n')) {
        const chunk = await this.reader.read();
        assert(!chunk.done, 'Consumer exited before reporting a committed claim');
        text += decoder.decode(chunk.value, { stream: true });
      }
      return JSON.parse(text.split('\n')[0]);
    })());
  }

  async kill(): Promise<void> {
    if (!this.exited) {
      try {
        this.child.kill('SIGKILL');
      } catch { /* Already exited. */ }
    }
    await this.child.status;
    await this.reader.cancel();
  }

  async finished(): Promise<void> {
    assertEquals((await bounded(this.child.status)).code, 0);
    await this.reader.cancel();
  }
}

/** Own only a random queue namespace, its adapter sockets and its child consumers. */
export class LeaseHarness implements AsyncDisposable {
  readonly name: string = `lease-${crypto.randomUUID()}`;
  readonly client: Redis;
  readonly queues: RedisAdapter[] = [];
  readonly workers: LeaseWorker[] = [];
  private readonly controllers: AbortController[] = [];
  private readonly listeners: Promise<void>[] = [];

  constructor(readonly url: string) {
    this.client = new Redis(url, { maxRetriesPerRequest: 1, enableReadyCheck: false });
  }

  queue(store?: DeadLetterStorePort): RedisAdapter {
    const queue = new RedisAdapter(this.url, this.name, undefined, store);
    this.queues.push(queue);
    return queue;
  }

  listen(
    queue: RedisAdapter,
    handler: (message: unknown, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): { done: Promise<void>; controller: AbortController } {
    const controller = new AbortController();
    const done = queue.listen(handler, { ...options, signal: controller.signal });
    void done.catch(() => {});
    this.controllers.push(controller);
    this.listeners.push(done);
    return { done, controller };
  }

  worker(role: string, timeout = 200, limit = 5, grace = 20): LeaseWorker {
    const worker = new LeaseWorker(this.url, this.name, role, timeout, limit, grace);
    this.workers.push(worker);
    return worker;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.controllers.forEach((controller) => controller.abort());
    await Promise.all(this.workers.map((worker) => worker.kill()));
    await Promise.all(this.queues.map((queue) => queue.stop()));
    await Promise.all(this.listeners.map((listener) => listener.catch(() => {})));
    const keys = await this.client.keys(`netscript:*:${this.name}*`);
    if (keys.length) await this.client.del(...keys);
    this.client.disconnect();
  }
}
