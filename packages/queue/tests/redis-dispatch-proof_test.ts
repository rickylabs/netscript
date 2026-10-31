import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { stub } from '@std/testing/mock';
import { getSpanId } from '@netscript/telemetry/context';
import { TracedQueue, type TracedQueueMessageContext } from '@netscript/telemetry/instrumentation';
import { recording } from '../../telemetry/tests/commands/native-fixture.ts';
import { parseLease } from '../adapters/_redis-lease-state.ts';
import { createQueue, QueueProvider } from '../mod.ts';
import { bounded, leaseBackends, LeaseHarness, until } from './_fixtures/redis-lease-harness.ts';
import { ConcurrentLeaseWorker } from './_fixtures/redis-concurrent-worker.ts';

const MEASUREMENTS_ENV = 'NETSCRIPT_QUEUE_MEASUREMENTS_PATH';
const POLL_ENV = 'NETSCRIPT_REDIS_QUEUE_POLL_INTERVAL_MS';
const DELAYED_ENV = 'NETSCRIPT_REDIS_DELAYED_POLL_INTERVAL_MS';
const SAMPLE_COUNT = 20;
const COMMAND_AND_SCHEDULING_ALLOWANCE_MS = 100;

async function record(result: Readonly<Record<string, unknown>>): Promise<void> {
  const path = Deno.env.get(MEASUREMENTS_ENV);
  if (path) await Deno.writeTextFile(path, JSON.stringify(result) + '\n', { append: true });
}

async function recordLatency(
  backend: string,
  kind: string,
  samples: number[],
  policy: Readonly<Record<string, number>>,
): Promise<void> {
  const sorted = samples.toSorted((a, b) => a - b);
  await record({
    backend,
    kind,
    ...policy,
    sampleCount: samples.length,
    samplesMs: samples.map((value) => Math.round(value * 1_000) / 1_000),
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    maxMs: sorted.at(-1),
    commandAndSchedulingAllowanceMs: COMMAND_AND_SCHEDULING_ALLOWANCE_MS,
  });
}

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name:
      `${backend} three live heartbeats exclude duplicates and a crash reclaims all fenced leases`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const producer = harness.queue();
      await producer.enqueueMany(['one', 'two', 'three']);
      const child = new ConcurrentLeaseWorker(url, harness.name, 3);
      const release = Promise.withResolvers<void>();
      try {
        const initial = await child.deliveries();
        assertEquals(initial.length, 3);
        assertEquals(new Set(initial.map((item) => item.messageId)).size, 3);
        assert(initial.every((item) => item.deliveryCount === 1));
        const receipts = await harness.client.zrange(`netscript:leases:${harness.name}`, 0, -1);
        const old = await Promise.all(receipts.map(async (key) => {
          const encoded = await harness.client.get(key);
          assert(encoded);
          return parseLease(key, encoded);
        }));
        const replacements: string[] = [];
        const full = Promise.withResolvers<void>();
        const competing = harness.queue();
        const run = harness.listen(competing, async (_message, context) => {
          replacements.push(context.messageId);
          assertEquals(context.deliveryCount, 2);
          assertEquals(await context.extendVisibility?.(2_000), true);
          if (replacements.length === 3) full.resolve();
          await release.promise;
        }, { concurrency: 3, visibilityTimeout: 500, recoveryGrace: 0, pollIntervalMs: 10 });
        // Exercise repeated real recovery beyond twice the child's original visibility window.
        const deadline = performance.now() + 700;
        while (performance.now() < deadline) {
          await producer.reclaimExpired();
          assertEquals((await producer.getHealth()).processing, 3);
          assertEquals(replacements.length, 0, 'no competing delivery while any receipt is live');
          await delay(30);
        }
        await child[Symbol.asyncDispose]();
        await bounded(full.promise, 3_000);
        assertEquals(replacements.toSorted(), initial.map((item) => item.messageId).toSorted());
        const leases = producer['ensureLeases']();
        for (const receipt of old) {
          await leases.settle(receipt);
          assertEquals(await leases.extend(receipt), false);
        }
        assertEquals(
          (await producer.getHealth()).processing,
          3,
          'old fences cannot settle replacements',
        );
        release.resolve();
        await until(async () => (await producer.getHealth()).processing === 0);
        run.controller.abort();
        await run.done;
        const metrics = await producer.getMetrics();
        assertEquals(metrics.reclaimed, 3);
        assertEquals(metrics.staleSettlements, 6);
        await record({ backend, kind: 'concurrent-crash', peak: 3, recovered: 3, ...metrics });
      } finally {
        release.resolve();
        await child[Symbol.asyncDispose]();
      }
    },
  });

  Deno.test({
    name: `${backend} configured idle pickup follows its bounded poll interval`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const leases = queue['ensureLeases']();
      const claim = leases.claim.bind(leases);
      let empty = Promise.withResolvers<void>();
      using _empty = stub(leases, 'claim', async (signal?: AbortSignal) => {
        const result = await claim(signal);
        if (!result) empty.resolve();
        return result;
      });
      const received = new Map<number, ReturnType<typeof Promise.withResolvers<number>>>();
      const pollIntervalMs = 200;
      const samples: number[] = [];
      const run = harness.listen(queue, (message) => {
        assert(typeof message === 'number');
        received.get(message)?.resolve(performance.now());
        return Promise.resolve();
      }, { pollIntervalMs });
      try {
        for (let sample = 0; sample < SAMPLE_COUNT; sample++) {
          await bounded(empty.promise);
          empty = Promise.withResolvers<void>();
          const delivery = Promise.withResolvers<number>();
          received.set(sample, delivery);
          const start = performance.now();
          await queue.enqueue(sample);
          const elapsed = await bounded(delivery.promise) - start;
          samples.push(elapsed);
          assert(elapsed <= pollIntervalMs + COMMAND_AND_SCHEDULING_ALLOWANCE_MS);
        }
        const sorted = samples.toSorted((a, b) => a - b);
        assert(
          sorted[18] >= pollIntervalMs * 0.75,
          'the configured interval must replace the fixed 50 ms poll',
        );
        await recordLatency(backend, 'idle', samples, { pollIntervalMs });
      } finally {
        run.controller.abort();
        await run.done;
      }
    },
  });

  for (const environment of [false, true]) {
    Deno.test({
      name: `${backend} delayed pickup stays within configured polling plus measured overhead (${
        environment ? 'environment' : 'options'
      })`,
      ignore: !url,
      async fn() {
        assert(url);
        await using harness = new LeaseHarness(url);
        const queue = environment
          ? createQueue(harness.name, {
            provider: QueueProvider.Redis,
            connection: { redis: { url } },
            disableAutoTracing: true,
          })
          : harness.queue();
        const previous = [Deno.env.get(POLL_ENV), Deno.env.get(DELAYED_ENV)];
        const pollIntervalMs = environment ? 15 : 10;
        const delayedPollIntervalMs = environment ? 35 : 25;
        const pollingBoundMs = pollIntervalMs + delayedPollIntervalMs;
        const received = new Map<number, ReturnType<typeof Promise.withResolvers<number>>>();
        if (environment) {
          Deno.env.set(POLL_ENV, String(pollIntervalMs));
          Deno.env.set(DELAYED_ENV, String(delayedPollIntervalMs));
        }
        const controller = new AbortController();
        const done = queue.listen((message) => {
          assert(typeof message === 'number');
          received.get(message)?.resolve(Date.now());
          return Promise.resolve();
        }, {
          ...(environment ? {} : { pollIntervalMs, delayedPollIntervalMs }),
          signal: controller.signal,
        });
        void done.catch(() => {});
        const samples: number[] = [];
        try {
          for (let sample = 0; sample < SAMPLE_COUNT; sample++) {
            const delivery = Promise.withResolvers<number>();
            received.set(sample, delivery);
            await queue.enqueue(sample, { delay: 100 });
            const entries = await harness.client.zrange(
              `netscript:delayed:${harness.name}`,
              0,
              -1,
              'WITHSCORES',
            );
            assertEquals(entries.length, 2, 'measure the actual persisted eligibility score');
            const elapsed = await bounded(delivery.promise) - Number(entries[1]);
            samples.push(elapsed);
            assert(elapsed >= 0, 'a delayed message cannot be delivered before eligibility');
            assert(
              elapsed <= pollingBoundMs + COMMAND_AND_SCHEDULING_ALLOWANCE_MS,
              `pickup ${elapsed}ms exceeds ${pollingBoundMs}ms polling plus overhead`,
            );
          }
          await recordLatency(
            backend,
            environment ? 'delayed-environment' : 'delayed-options',
            samples,
            {
              pollIntervalMs,
              delayedPollIntervalMs,
              pollingBoundMs,
            },
          );
        } finally {
          controller.abort();
          await done;
          await queue.stop();
          [POLL_ENV, DELAYED_ENV].forEach((name, index) => {
            if (previous[index] === undefined) Deno.env.delete(name);
            else Deno.env.set(name, previous[index]!);
          });
        }
      },
    });
  }
}

Deno.test({
  name: 'Redis and Garnet concurrent queue consumers preserve their exact producer span parents',
  ignore: !leaseBackends.some(([, url]) => url),
  async fn() {
    // One provider lifetime: queue-domain tracers are cached by the existing telemetry runtime.
    await recording(async (_tracer, exporter) => {
      for (const [backend, url] of leaseBackends) {
        if (!url) continue;
        const firstSpan = exporter.getFinishedSpans().length;
        await using harness = new LeaseHarness(url);
        const queue = new TracedQueue(harness.queue(), {
          queueName: harness.name,
          system: 'redis',
        });
        const controller = new AbortController();
        const slow = Promise.withResolvers<void>();
        const fast = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        const contexts: TracedQueueMessageContext[] = [];
        const done = queue.listen(async (message, context) => {
          contexts.push(context);
          assertEquals(getSpanId(), context.span.spanContext().spanId);
          if (message === 'slow') {
            slow.resolve();
            await release.promise;
          } else fast.resolve();
          assertEquals(
            getSpanId(),
            context.span.spanContext().spanId,
            'async overlap preserves active context',
          );
        }, { concurrency: 2, signal: controller.signal });
        void done.catch(() => {});
        try {
          await queue.enqueue('slow');
          await bounded(slow.promise);
          await queue.enqueue('fast');
          await bounded(fast.promise, 500);
          release.resolve();
          controller.abort();
          await done;
          const spans = exporter.getFinishedSpans().slice(firstSpan);
          const producers = spans.filter((span) => span.name === 'queue.enqueue');
          const consumers = spans.filter((span) => span.name === 'queue.dequeue');
          assertEquals(producers.length, 2);
          assertEquals(consumers.length, 2);
          assertEquals(new Set(producers.map((span) => span.spanContext().spanId)).size, 2);
          contexts.forEach((context, index) => {
            const consumer = consumers.find((span) =>
              span.spanContext().spanId === context.span.spanContext().spanId
            );
            assert(consumer);
            assertEquals(consumer.parentSpanContext?.spanId, producers[index].spanContext().spanId);
            assertEquals(consumer.spanContext().traceId, producers[index].spanContext().traceId);
          });
          await record({
            backend,
            kind: 'trace-parentage',
            producers: 2,
            consumers: 2,
            concurrent: 2,
          });
        } finally {
          release.resolve();
          controller.abort();
          await done;
        }
      }
    });
  },
});

Deno.test('Redis direct consumers retain defaults when optional tuning env access is denied', async () => {
  const child = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--no-prompt',
      '--allow-env',
      `--deny-env=${POLL_ENV},${DELAYED_ENV}`,
      new URL('./_fixtures/redis-scoped-env.ts', import.meta.url).href,
    ],
    env: { [POLL_ENV]: 'malformed', [DELAYED_ENV]: 'malformed' },
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(child.code, 0, new TextDecoder().decode(child.stderr));
  assert(new TextDecoder().decode(child.stdout).includes('defaults remain compatible'));
});
