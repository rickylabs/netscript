/** Run the fixed #2650 subscriber workload and emit raw measurements as JSON. */
import { availableParallelism } from 'node:os';
import { abortable } from 'jsr:@std/async@1/abortable';
import { delay } from 'jsr:@std/async@1/delay';
import { join } from '@std/path';
import {
  buildStreamUrl,
  createDurableStream,
  defineStreamSchema,
  deleteDurableStream,
} from '@netscript/plugin-streams-core';
import { z } from 'zod';
import { Companion, cpuTicksPerSecond, type Lifecycle, storageBytes } from './process.ts';
import { Subscriber } from './reader.ts';

const READER_COUNTS = [1, 8, 32] as const;
const LAYOUTS = ['single', 'spread', 'spread-slow'] as const;
const MAX_STREAMS = 8;
const SLOW_FRAME_MS = 250;
const PHASE_MS = 240_000;
const RUN_MS = 35 * 60_000;
const CLEANUP_MS = 10_000;
const STARTUP_MS = 30_000;
const OPEN_READER_MS = 5_000;
const DELIVERY_GRACE_MS = 10_000;
const FULL_WORKLOAD = { revisions: 60, intervalMs: 1_000 };
const SMOKE_WORKLOAD = { revisions: 8, intervalMs: 100 };
const schema = defineStreamSchema({
  revision: {
    schema: z.object({ id: z.literal('revision'), revision: z.number().int().positive() }),
    primaryKey: 'id',
    type: 'revision',
  },
});

type Layout = typeof LAYOUTS[number];
type Workload = { readonly revisions: number; readonly intervalMs: number };

function verifyIdle(counters: Lifecycle): boolean {
  return counters.openSseResponses === 0 && counters.pendingWaiters === 0;
}

function percentiles(values: readonly number[]): { p50: number; p95: number; max: number } {
  const sorted = values.toSorted((a, b) => a - b);
  return {
    p50: sorted[Math.ceil(sorted.length * 0.50) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    max: sorted[sorted.length - 1],
  };
}

async function runPhase(
  companion: Companion,
  baseUrl: string,
  dataDir: string,
  runSignal: AbortSignal,
  layout: Layout,
  readerCount: number,
  workload: Workload,
  clockTicks: number,
) {
  const failure = new AbortController();
  const stopReaders = new AbortController();
  const signal = AbortSignal.any([runSignal, failure.signal, AbortSignal.timeout(PHASE_MS)]);
  const readerSignal = AbortSignal.any([signal, stopReaders.signal]);
  const streamCount = layout === 'single' ? 1 : Math.min(MAX_STREAMS, readerCount);
  const revisions = Array.from({ length: workload.revisions }, (_, index) => index + 1);
  const streams = [];
  const readers: Subscriber[] = [];
  const phaseStarted = performance.now();

  try {
    for (let index = 0; index < streamCount; index++) {
      const path = `/capacity-${index + 1}`;
      streams.push({
        path,
        expected: revisions.filter((revision) => (revision - 1) % streamCount === index),
        producer: createDurableStream({ streamPath: path, schema, producerId: 'capacity', signal }),
      });
    }
    await abortable(
      Promise.all(streams.map(({ producer }) => producer.waitUntilReady({ signal }))),
      signal,
    );
    console.error('Streams ready');
    for (let index = 0; index < readerCount; index++) {
      const stream = streams[index % streamCount];
      const reader = new Subscriber({
        url: buildStreamUrl(stream.path, baseUrl),
        expected: stream.expected,
        delayMs: layout === 'spread-slow' && index === 0 ? SLOW_FRAME_MS : 0,
        signal: readerSignal,
        fail: (error) => failure.abort(error),
      });
      readers.push(reader);
      await abortable(reader.opened, AbortSignal.any([signal, AbortSignal.timeout(OPEN_READER_MS)]))
        .catch((error) => {
          throw new Error(`Reader ${index + 1} did not open`, { cause: error });
        });
    }
    console.error('Readers ready');
    const opened = await companion.snapshot(signal);
    if (opened.openSseResponses !== readerCount || opened.pendingWaiters !== readerCount) {
      throw new Error('Expected one upstream response and waiter per opened reader');
    }
    const storageBeforeBytes = await storageBytes(dataDir);
    const samples = [await companion.sample()];
    const start = performance.now();
    const appendTimes: number[] = [];
    const receipts: Promise<{ acknowledgedAtMs: number; attempts: number }>[] = [];
    for (const revision of revisions) {
      // Keep the offered rate independent of write acknowledgements and reader processing.
      await delay(Math.max(0, start + revision * workload.intervalMs - performance.now()), {
        signal,
      });
      const { producer } = streams[(revision - 1) % streamCount];
      appendTimes.push(performance.now());
      const receipt = producer.upsert('revision', { id: 'revision', revision });
      receipts.push(receipt.completion.then((outcome) => {
        if (outcome.status !== 'delivered') {
          const error = new Error(`Append ${revision} ended with ${outcome.status}`);
          failure.abort(error);
          return { acknowledgedAtMs: Number.NaN, attempts: 0 };
        }
        return { acknowledgedAtMs: performance.now(), attempts: outcome.attempts };
      }));
      samples.push(await companion.sample());
    }
    const acknowledgements = await abortable(Promise.all(receipts), signal);
    signal.throwIfAborted();

    const expectedDeliveries = readers.reduce(
      (total, { delivery }) => total + delivery.expected.length,
      0,
    );
    const committed = () =>
      readers.reduce((total, { delivery }) => total + delivery.commits.size, 0);
    // Give the final append time to reach all readers after the one-minute write window.
    const deliveryDeadline = performance.now() + DELIVERY_GRACE_MS;
    while (committed() < expectedDeliveries && performance.now() < deliveryDeadline) {
      await delay(20, { signal });
    }
    const deliveryGaps = expectedDeliveries - committed();
    const duplicates = readers.reduce((total, { delivery }) => total + delivery.duplicates, 0);
    const outOfOrder = readers.reduce((total, { delivery }) => total + delivery.outOfOrder, 0);
    const appends = revisions.map((revision, index) => {
      const appendedAt = appendTimes[index];
      const readerCommits = readers.flatMap(({ delivery }, readerIndex) => {
        if (!delivery.expected.includes(revision)) return [];
        const commit = delivery.commits.get(revision);
        return [{
          reader: readerIndex + 1,
          latencyMs: commit === undefined ? null : commit - appendedAt,
        }];
      });
      return {
        revision,
        scheduledMs: revision * workload.intervalMs,
        appendMs: appendedAt - start,
        acknowledgedMs: acknowledgements[index].acknowledgedAtMs - start,
        writeAttempts: acknowledgements[index].attempts,
        readerCommits,
      };
    });
    const lastReaderMs = appends.flatMap(({ readerCommits }) => {
      const times = readerCommits.map(({ latencyMs }) => latencyMs);
      return times.every((time) => time !== null) ? [Math.max(...times)] : [];
    });
    samples.push(await companion.sample());
    const storageAfterBytes = await storageBytes(dataDir);

    console.error('Writes and delivery captured');
    stopReaders.abort();
    await abortable(Promise.all(readers.map(({ done }) => done)), signal);
    // Close each durable stream to wake any upstream waits left by disconnected HTTP clients.
    await abortable(Promise.all(streams.map(({ producer }) => producer.close())), signal);
    console.error('Readers and streams closed');
    let closed = await companion.snapshot(signal);
    while (!verifyIdle(closed)) {
      await delay(20, { signal });
      closed = await companion.snapshot(signal);
    }
    console.error('Upstream idle');
    for (const { path } of streams) {
      if (!(await deleteDurableStream(path, { signal }))) {
        throw new Error('Synthetic stream not deleted');
      }
    }
    const first = samples[0];
    const last = samples.at(-1)!;
    return {
      layout,
      elapsedMs: performance.now() - phaseStarted,
      readerCount,
      streamCount,
      expectedDeliveries,
      committedDeliveries: expectedDeliveries - deliveryGaps,
      deliveryGaps,
      duplicates,
      outOfOrder,
      reconnects: readers.reduce((total, reader) => total + reader.reconnects, 0),
      readerReconnects: readers.map((reader) => reader.reconnects),
      httpVersions: [...new Set(readers.flatMap((reader) => [...reader.httpVersions]))],
      appendToLastReaderMs: lastReaderMs.length ? percentiles(lastReaderMs) : null,
      completeLatencySamples: lastReaderMs.length,
      appends,
      resources: {
        rssPeakBytes: Math.max(...samples.map(({ rssBytes }) => rssBytes)),
        averageCpuPercent: 100 * ((last.cpuTicks - first.cpuTicks) / clockTicks) /
          ((last.atMs - first.atMs) / 1000),
        openFdPeak: Math.max(...samples.map(({ openFileDescriptors }) => openFileDescriptors)),
        storageBeforeBytes,
        storageAfterBytes,
        samples: samples.map((sample) => ({ ...sample, atMs: sample.atMs - first.atMs })),
      },
      lifecycle: { opened, closed, joinedClients: readers.length, deletedStreams: streams.length },
    };
  } finally {
    stopReaders.abort();
    failure.abort();
    await abortable(
      Promise.all([
        ...readers.map(({ done }) => done),
        ...streams.map(({ producer }) => producer.stop()),
      ]),
      AbortSignal.timeout(CLEANUP_MS),
    );
  }
}

async function main(interrupt: AbortSignal): Promise<number> {
  if (Deno.build.os !== 'linux') throw new Error('This benchmark requires Linux procfs');
  const smoke = Deno.args[0] === '--smoke';
  if (Deno.args.length !== Number(smoke)) throw new Error('Expected no arguments or --smoke');
  const signal = AbortSignal.any([interrupt, AbortSignal.timeout(RUN_MS)]);
  const clockTicks = await cpuTicksPerSecond(signal);
  const workspace = await Deno.makeTempDir({ prefix: 'streams-capacity-' });
  const dataDir = join(workspace, 'data');
  const workload = smoke ? SMOKE_WORKLOAD : FULL_WORKLOAD;
  const phases: Awaited<ReturnType<typeof runPhase>>[] = [];
  let companion: Companion | undefined;
  let stopped: Lifecycle | undefined;
  let directoryRemoved = false;

  try {
    await Deno.mkdir(dataDir);
    companion = new Companion(dataDir);
    const port = await companion.ready(AbortSignal.any([signal, AbortSignal.timeout(STARTUP_MS)]));
    const baseUrl = `http://127.0.0.1:${port}`;
    Deno.env.set('DURABLE_STREAMS_URL', baseUrl);
    Deno.env.delete('DURABLE_STREAMS_SECRET');
    Deno.env.delete('STREAMS_SECRET');
    const layouts = smoke ? ['single', 'spread-slow'] as const : LAYOUTS;
    const counts = smoke ? [32] as const : READER_COUNTS;
    for (const layout of layouts) {
      for (const count of counts) {
        console.error(`Starting ${layout} with ${count} readers`);
        const phase = await runPhase(
          companion,
          baseUrl,
          dataDir,
          signal,
          layout,
          count,
          workload,
          clockTicks,
        );
        phases.push(phase);
        console.error(`Finished ${layout} with ${count} readers`);
      }
    }
  } finally {
    try {
      stopped = await companion?.stop();
    } finally {
      await Deno.remove(workspace, { recursive: true });
      directoryRemoved = await Deno.stat(workspace).then(() => false, (error: unknown) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
        return true;
      });
    }
  }

  const completedTrials =
    phases.filter((phase) =>
      phase.deliveryGaps === 0 && phase.duplicates === 0 && phase.outOfOrder === 0
    ).length;
  const clean = stopped !== undefined && verifyIdle(stopped) && directoryRemoved;
  console.log(JSON.stringify(
    {
      runtime: {
        deno: Deno.version.deno,
        os: Deno.build.os,
        arch: Deno.build.arch,
        availableLogicalCpus: availableParallelism(),
        memoryBytes: Deno.systemMemoryInfo().total,
      },
      storage: 'file-backed LMDB and segments in an isolated temporary directory',
      transport: { protocol: 'HTTP', framing: 'SSE', network: 'loopback', tls: false },
      workload: {
        ...workload,
        mode: smoke ? 'smoke' : 'full',
        slowFrameDelayMs: SLOW_FRAME_MS,
        phaseTimeoutMs: PHASE_MS,
        globalTimeoutMs: RUN_MS,
        startupTimeoutMs: STARTUP_MS,
        readerOpenTimeoutMs: OPEN_READER_MS,
        deliveryGraceMs: DELIVERY_GRACE_MS,
      },
      companionCpuTicksPerSecond: clockTicks,
      completedTrials,
      phases,
      cleanup: { stopped, cleanChildExit: stopped !== undefined, directoryRemoved },
    },
    null,
    2,
  ));
  return clean && completedTrials === phases.length ? 0 : 1;
}

if (import.meta.main) {
  const interrupt = new AbortController();
  const abort = () => interrupt.abort(new Error('Benchmark interrupted'));
  Deno.addSignalListener('SIGINT', abort);
  Deno.addSignalListener('SIGTERM', abort);
  try {
    Deno.exitCode = await main(interrupt.signal);
  } finally {
    Deno.removeSignalListener('SIGINT', abort);
    Deno.removeSignalListener('SIGTERM', abort);
  }
  // Finish the standalone command after the readers, child, and temporary storage are settled.
  Deno.exit(Deno.exitCode);
}
