import { assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import type { MessageContext, MessageQueue } from '../ports/mod.ts';
import { bounded } from './_fixtures/redis-lease-harness.ts';

for (
  const [kind, url] of [
    ['KV polling', undefined],
    ['Redis', Deno.env.get('NETSCRIPT_TEST_REDIS_URL')],
    ['Garnet', Deno.env.get('NETSCRIPT_TEST_GARNET_URL')],
  ] as const
) {
  for (const owner of [false, true]) {
    Deno.test({
      name: `${kind} ${
        owner ? 'lets the worker own admitted work' : 'keeps its default bounded drain'
      } after intake cancellation`,
      ignore: kind !== 'KV polling' && !url,
      async fn() {
        await using kv = new MemoryKvAdapter();
        const queue: MessageQueue = kind === 'KV polling'
          ? new KvPollingAdapter({
            kv,
            queueName: crypto.randomUUID(),
            visibilityTimeout: 50,
            pollInterval: 1,
          })
          : new RedisAdapter(url!, `drain-owner-${crypto.randomUUID()}`);
        await queue.enqueue('active');
        const entered = Promise.withResolvers<MessageContext>();
        const release = Promise.withResolvers<void>();
        const callbackFinished = Promise.withResolvers<void>();
        const intake = new AbortController();
        let listenerFinished = false;
        // Executable on the previous contract: unknown fields go through a variable.
        const options = {
          signal: intake.signal,
          visibilityTimeout: 50,
          ...(owner ? { drainTimeoutMs: Infinity } : {}),
        };
        const done = queue.listen(async (_message, context) => {
          entered.resolve(context);
          try {
            await release.promise;
            await context.ack();
          } finally {
            callbackFinished.resolve();
          }
        }, options).finally(() => listenerFinished = true);
        void done.catch(() => {});
        try {
          const context = await bounded(entered.promise);
          if (context.extendVisibility) assertEquals(await context.extendVisibility(2_000), true);
          intake.abort();
          await delay(500);
          assertEquals(
            listenerFinished,
            !owner,
            'The backend ended the pause barrier before the handler finished.',
          );
          if (owner && context.extendVisibility) {
            assertEquals(await context.extendVisibility(2_000), true);
          }
        } finally {
          intake.abort();
          release.resolve();
          await bounded(callbackFinished.promise);
          try {
            await bounded(done);
          } finally {
            await queue.stop();
          }
        }
      },
    });
  }
}
