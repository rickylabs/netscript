import { assert, assertEquals, assertRejects } from '@std/assert';
import { delay } from '@std/async';
import { stub } from '@std/testing/mock';
import { QueueConfigurationError, QueueError } from '../ports/errors.ts';
import type { ListenOptions, MessageContext } from '../ports/mod.ts';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { bounded, leaseBackends, LeaseHarness, until } from './_fixtures/redis-lease-harness.ts';

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name: `${backend} Redis concurrency 1 stays serial and N admits exactly N with backpressure`,
    ignore: !url,
    async fn() {
      assert(url);
      for (const concurrency of [1, 2, 4]) {
        await using harness = new LeaseHarness(url);
        const queue = harness.queue();
        await queue.enqueueMany(Array.from({ length: concurrency + 1 }, (_, id) => id));
        const releases = Array.from(
          { length: concurrency + 1 },
          () => Promise.withResolvers<void>(),
        );
        const full = Promise.withResolvers<void>();
        const next = Promise.withResolvers<void>();
        let started = 0;
        let active = 0;
        let peak = 0;
        const run = harness.listen(queue, async (_message, context) => {
          const slot = started++;
          active++;
          peak = Math.max(peak, active);
          assertEquals(context.deliveryCount, 1);
          if (started === concurrency) full.resolve();
          if (started === concurrency + 1) next.resolve();
          await releases[slot].promise;
          active--;
        }, { concurrency });
        try {
          await bounded(full.promise, 1_500);
          assertEquals(active, concurrency);
          assertEquals((await queue.getHealth()).ready, 1, 'no preclaim beyond capacity');
          assertEquals((await queue.getHealth()).processing, concurrency);
          releases[0].resolve();
          await bounded(next.promise, 1_500);
          assertEquals(peak, concurrency);
          console.log(JSON.stringify({ backend, concurrency, peak, started }));
        } finally {
          releases.forEach((release) => release.resolve());
          await until(async () => {
            const health = await queue.getHealth();
            return health.ready === 0 && health.processing === 0;
          });
          run.controller.abort();
          await run.done;
        }
        assertEquals((await queue.getHealth()).processing, 0, 'drain includes every automatic ack');
        assertEquals((await queue.getMetrics()).staleSettlements, 0);
      }
    },
  });

  Deno.test({
    name: `${backend} Redis fast sibling dispatches while the slow handler is still running`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const slow = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const fast = Promise.withResolvers<void>();
      let slowFinished = false;
      const run = harness.listen(queue, async (message) => {
        if (message === 'slow') {
          slow.resolve();
          await release.promise;
          slowFinished = true;
        } else fast.resolve();
      }, { concurrency: 2 });
      try {
        await queue.enqueue('slow');
        await bounded(slow.promise);
        await queue.enqueue('fast');
        await bounded(fast.promise, 500);
        assertEquals(slowFinished, false);
      } finally {
        release.resolve();
        run.controller.abort();
        await run.done;
      }
      assertEquals((await queue.getHealth()).processing, 0);
    },
  });

  Deno.test({
    name: `${backend} Redis stop awaits all concurrent handlers and their fenced acknowledgements`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueueMany(['one', 'two']);
      const full = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      let entered = 0;
      let stopped = false;
      const run = harness.listen(queue, async () => {
        if (++entered === 2) full.resolve();
        await release.promise;
      }, { concurrency: 2, visibilityTimeout: 2_000 });
      try {
        await bounded(full.promise, 1_500);
        const stopping = queue.stop().then(() => stopped = true);
        await delay(50);
        assertEquals(stopped, false, 'stop must await the held handlers');
        release.resolve();
        await bounded(Promise.all([stopping, run.done]));
        assertEquals((await queue.getHealth()).processing, 0);
        assertEquals((await queue.getHealth()).reclaimed, 0);
      } finally {
        release.resolve();
      }
    },
  });

  Deno.test({
    name: `${backend} Redis delivers a final-attempt claim committed during intake abort`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueue('last-attempt');
      const leases = queue['ensureLeases']();
      const claim = leases.claim.bind(leases);
      let handled = 0;
      using _race = stub(leases, 'claim', async (signal?: AbortSignal) => {
        const committed = await claim(signal);
        if (committed) run.controller.abort();
        return committed;
      });
      const run = harness.listen(queue, (_message, context) => {
        handled++;
        assertEquals(context.deliveryCount, 1);
        return Promise.resolve();
      }, { maxDeliveries: 1 });
      await bounded(run.done);
      assertEquals(handled, 1, 'a committed claim must reach its handler after abort');
      const health = await queue.getHealth();
      assertEquals(health.processing, 0);
      assertEquals(health.deadLetterDepth, 0);
      assertEquals(health.staleSettlements, 0);
    },
  });

  Deno.test({
    name: `${backend} Redis hung concurrent handlers cannot outlive the stop drain budget`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueueMany(['one', 'two']);
      const full = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const contexts: MessageContext[] = [];
      const run = harness.listen(queue, async (_message, context) => {
        contexts.push(context);
        assertEquals(await context.extendVisibility?.(2_000), true);
        if (contexts.length === 2) full.resolve();
        await release.promise;
      }, { concurrency: 2, visibilityTimeout: 200 });
      try {
        await bounded(full.promise, 1_500);
        const start = performance.now();
        await bounded(Promise.all([queue.stop(), run.done]), 800);
        const drainMs = performance.now() - start;
        assert(drainMs >= 150, `stop returned before its drain budget: ${drainMs}`);
        assert(drainMs < 800);
        assertEquals((await queue.getHealth()).processing, 2, 'unsettled claims remain durable');
        for (const context of contexts) {
          assertEquals(await context.extendVisibility?.(), false, 'late heartbeat is refused');
          await assertRejects(() => context.ack(), DOMException, 'aborted');
        }
      } finally {
        release.resolve();
      }
    },
  });

  Deno.test({
    name: `${backend} Redis handler failure drains siblings before propagating to supervision`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueue('held');
      const held = Promise.withResolvers<void>();
      const failed = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      let ended = false;
      const run = harness.listen(queue, async (message) => {
        if (message === 'held') {
          held.resolve();
          await release.promise;
        } else {
          failed.resolve();
          throw new Error('expected handler failure');
        }
      }, { concurrency: 2 });
      void run.done.then(() => ended = true, () => ended = true);
      try {
        await bounded(held.promise);
        await queue.enqueue('failure');
        await bounded(failed.promise, 500);
        await delay(50);
        assertEquals(ended, false);
        release.resolve();
        await assertRejects(() => bounded(run.done), QueueError, 'expected handler failure');
        assertEquals((await queue.getHealth()).processing, 0);
        assertEquals((await queue.getHealth()).ready, 1, 'only the failed delivery requeues');
      } finally {
        release.resolve();
      }
    },
  });
}

Deno.test('Redis validates concurrency and interval bounds before allocating sockets', async () => {
  const invalid: Array<readonly [keyof ListenOptions, number]> = [
    ...[0, -1, 1.5, NaN, Infinity, 2_147_483_648].map((value) => ['concurrency', value] as const),
    ...[0, 9, -1, 10.5, NaN, Infinity, 60_001].flatMap((value) =>
      [['pollIntervalMs', value], ['delayedPollIntervalMs', value]] as const
    ),
  ];
  const queue = new RedisAdapter('redis://unused');
  for (const [key, value] of invalid) {
    await assertRejects(
      () => queue.listen(() => Promise.resolve(), { [key]: value, signal: AbortSignal.abort() }),
      QueueConfigurationError,
      key,
    );
    assertEquals(queue['clients'], null);
  }
  for (const value of [10, 60_000]) {
    await queue.listen(() => Promise.resolve(), {
      pollIntervalMs: value,
      delayedPollIntervalMs: value,
      signal: AbortSignal.abort(),
    });
  }
});

Deno.test('Redis rejects malformed environment tuning and explicit options take precedence', async () => {
  const variables = [
    'NETSCRIPT_REDIS_QUEUE_POLL_INTERVAL_MS',
    'NETSCRIPT_REDIS_DELAYED_POLL_INTERVAL_MS',
  ];
  const previous = variables.map((name) => Deno.env.get(name));
  const queue = new RedisAdapter('redis://unused');
  try {
    for (const variable of variables) {
      for (const value of ['', 'NaN', 'Infinity', '9', '60001', '10.5']) {
        Deno.env.set(variable, value);
        await assertRejects(
          () => queue.listen(() => Promise.resolve(), { signal: AbortSignal.abort() }),
          QueueConfigurationError,
          variable,
        );
      }
      Deno.env.delete(variable);
    }
    variables.forEach((name) => Deno.env.set(name, 'malformed'));
    await queue.listen(() => Promise.resolve(), {
      pollIntervalMs: 10,
      delayedPollIntervalMs: 60_000,
      signal: AbortSignal.abort(),
    });
    assertEquals(queue['clients'], null);
  } finally {
    variables.forEach((name, index) => {
      if (previous[index] === undefined) Deno.env.delete(name);
      else Deno.env.set(name, previous[index]!);
    });
  }
});
