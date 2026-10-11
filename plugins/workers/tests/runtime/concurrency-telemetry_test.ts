import { assertEquals, assertExists } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type {
  JobDefinition,
  JobMessage,
  TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
import type { ListenOptions, MessageContext } from '@netscript/queue';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { trace } from 'npm:@opentelemetry/api@^1.9.1';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import scaffoldMetadata from '../../scaffold.plugin.json' with { type: 'json' };
import { resolveWorkersConcurrency } from '../../src/runtime/concurrency.ts';
import { Worker } from '../../worker/worker.ts';
import type { WorkerExecutionState } from '../../worker/worker-options.ts';

Deno.test('running worker forwards metadata concurrency to queue and completed job telemetry', async () => {
  const previousTelemetry = Deno.env.get('NETSCRIPT_TELEMETRY_ENABLED');
  Deno.env.set('NETSCRIPT_TELEMETRY_ENABLED', 'true');
  trace.disable();
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  trace.setGlobalTracerProvider(provider);
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const { concurrencyEnvVar, defaultConcurrency } = scaffoldMetadata.provider;
  const concurrency = resolveWorkersConcurrency({
    readEnv: (name) => name === concurrencyEnvVar ? String(defaultConcurrency) : undefined,
    warn: (message) => {
      throw new Error(message);
    },
  });
  let listenerConcurrency: number | undefined;
  class RecordingQueue extends MemoryQueueAdapter<JobMessage> {
    override listen(
      handler: (message: JobMessage, context: MessageContext) => Promise<void>,
      options?: ListenOptions,
    ): Promise<void> {
      listenerConcurrency = options?.concurrency;
      return super.listen(handler, options);
    }
  }
  const queue = new RecordingQueue({ pollInterval: 1 });
  const taskQueue = new MemoryQueueAdapter<TaskMessage>({ pollInterval: 1 });
  const done = Promise.withResolvers<void>();
  let completed = 0;
  let execution = 0;
  const job: JobDefinition = {
    id: 'concurrency-proof',
    enabled: true,
    executionType: 'deno',
    entrypoint: import.meta.url,
    handler: () => ({ success: true }),
  };
  const executionState: WorkerExecutionState = {
    create: () => Promise.resolve({ id: `execution-${++execution}` }),
    start: (id) => Promise.resolve({ id }),
    progress: (id) => Promise.resolve({ id }),
    complete: (id, result) => {
      assertEquals(result.status, 'completed');
      if (++completed === concurrency) done.resolve();
      return Promise.resolve({ id });
    },
  };
  const worker = new Worker({
    workerId: 'metadata-concurrency',
    concurrency,
    queue,
    taskQueue,
    registry: { get: () => Promise.resolve(job) },
    executionState,
    taskRegistry: { get: () => Promise.resolve(undefined) },
    taskExecutor: { execute: () => Promise.reject(new Error('Unexpected task execution')) },
    idempotency: new KvWorkerIdempotencyStore({ kv }),
  });
  const started = worker.start();
  void started.catch(() => undefined);
  try {
    for (let index = 0; index < concurrency; index++) {
      await queue.enqueue({
        jobId: job.id,
        topic: 'jobs',
        triggeredBy: 'manual',
        idempotencyKey: `delivery-${index}`,
      });
    }
    await bounded(done.promise);
    assertEquals(listenerConcurrency, defaultConcurrency);
    // Completion storage happens inside the job span; let the dispatcher finish exporting it.
    await new Promise((resolve) => setTimeout(resolve, 20));
    await provider.forceFlush();
    const jobs = exporter.getFinishedSpans().filter((span) => span.name === 'job.execute');
    assertEquals(jobs.length, concurrency);
    for (const span of jobs) {
      assertExists(span.attributes['netscript.worker.concurrency']);
      assertEquals(span.attributes['netscript.worker.concurrency'], defaultConcurrency);
    }
    assertEquals(exporter.getFinishedSpans().some((span) => span.name === 'worker.start'), false);
  } finally {
    await worker.stop();
    await started;
    await provider.shutdown();
    trace.disable();
    if (previousTelemetry === undefined) Deno.env.delete('NETSCRIPT_TELEMETRY_ENABLED');
    else Deno.env.set('NETSCRIPT_TELEMETRY_ENABLED', previousTelemetry);
  }
});

async function bounded<T>(work: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error('Concurrency proof timed out')), 5_000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
