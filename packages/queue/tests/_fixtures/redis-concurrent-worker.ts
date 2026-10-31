import { assert } from '@std/assert';
import { delay } from '@std/async';
import { RedisAdapter } from '../../adapters/redis.adapter.ts';
import { bounded } from './redis-lease-harness.ts';

/** Committed delivery identities reported once all child-process slots are occupied. */
export interface ConcurrentDelivery {
  messageId: string;
  deliveryCount: number;
}

/** Own a process that heartbeats three independent receipts until forcibly terminated. */
export class ConcurrentLeaseWorker implements AsyncDisposable {
  private readonly child: Deno.ChildProcess;
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  private exited = false;

  constructor(url: string, name: string, concurrency: number) {
    this.child = new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-all', '--unstable-kv', import.meta.url, name, String(concurrency)],
      env: { NETSCRIPT_LEASE_TEST_URL: url },
      stdin: 'null',
      stdout: 'piped',
      stderr: 'null',
    }).spawn();
    this.reader = this.child.stdout.getReader();
    void this.child.status.then(() => this.exited = true);
  }

  /** Wait for the whole concurrent set, not merely a single successful claim. */
  async deliveries(): Promise<ConcurrentDelivery[]> {
    return await bounded(
      (async () => {
        let output = '';
        const decoder = new TextDecoder();
        while (!output.includes('\n')) {
          const part = await this.reader.read();
          assert(!part.done, 'Concurrent consumer exited before filling its slots');
          output += decoder.decode(part.value, { stream: true });
        }
        const values: unknown = JSON.parse(output.split('\n')[0]);
        assert(Array.isArray(values));
        return values.map((value: unknown) => {
          assert(typeof value === 'object' && value !== null);
          assert('messageId' in value && typeof value.messageId === 'string');
          assert('deliveryCount' in value && typeof value.deliveryCount === 'number');
          return { messageId: value.messageId, deliveryCount: value.deliveryCount };
        });
      })(),
      2_000,
    );
  }

  /** Crash this exact owned process and join its exit before starting a replacement. */
  async [Symbol.asyncDispose](): Promise<void> {
    if (!this.exited) {
      try {
        this.child.kill('SIGKILL');
      } catch { /* Process already exited. */ }
    }
    await this.child.status;
    await this.reader.cancel();
  }
}

if (import.meta.main) {
  const [name, concurrency] = Deno.args;
  const url = Deno.env.get('NETSCRIPT_LEASE_TEST_URL');
  assert(url);
  const queue = new RedisAdapter(url, name);
  const deliveries: ConcurrentDelivery[] = [];
  await queue.listen(async (_message, context) => {
    assert(await context.extendVisibility?.(300));
    deliveries.push({ messageId: context.messageId, deliveryCount: context.deliveryCount });
    if (deliveries.length === Number(concurrency)) console.log(JSON.stringify(deliveries));
    for (;;) {
      await delay(40);
      assert(await context.extendVisibility?.(300));
    }
  }, { concurrency: Number(concurrency), visibilityTimeout: 300, recoveryGrace: 0 });
}
