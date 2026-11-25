/** One-topic production Streams SSE fan-out regression. @module */

import { Agent, get, type IncomingMessage } from 'node:http';
import { abortable } from 'jsr:@std/async@1/abortable';
import { delay } from 'jsr:@std/async@1/delay';
import {
  buildStreamUrl,
  defineStreamSchema,
  DurableStreamProducer,
} from '@netscript/plugin-streams-core';
import {
  createStreamSseReplayStateV1,
  parseStreamSseEventV1,
  reduceStreamSseReplayStateV1,
} from '@netscript/plugin-streams-core/sse';
import { z } from 'zod';
import { startFanoutCompanion } from './fanout-companion.ts';

const READERS = 32;
const REVISIONS = 60;
const INTERVAL_MS = 1_000;
const P95_LIMIT_MS = 1_000;
const TRIAL_TIMEOUT_MS = 240_000;
const CLEANUP_TIMEOUT_MS = 10_000;
const RETENTION_MODES = ['none', 'sliding'] as const;
const SYNTHETIC_PATH = '/sse-fanout-regression';
const revisionSchema = z.object({ id: z.literal('revision'), revision: z.number() });
const schema = defineStreamSchema({
  revision: {
    type: 'revision',
    primaryKey: 'id',
    schema: revisionSchema,
  },
});

type RetentionMode = typeof RETENTION_MODES[number];
interface RegressionResult {
  result: 'PASS' | 'FAIL';
  mode: RetentionMode;
  readers: number;
  appends: number;
  commits: number;
  misses: number;
  appendRetries: number;
  readerReconnects: number;
  p95Ms: number;
  maxMs: number;
  drainMs: number;
}

async function* frames(response: IncomingMessage) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let tail = '';
  for await (const chunk of response) {
    tail += decoder.decode(chunk, { stream: true });
    const parts = tail.split(/\r?\n\r?\n/);
    tail = parts.pop()!;
    for (const part of parts) {
      if (part.length > 65_536) throw new Error('Oversized SSE frame');
      const lines = part.split(/\r?\n/);
      const eventName = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
      const data = lines.filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).replace(/^ /, '')).join('\n');
      if (eventName && data) yield { eventName, data };
    }
    if (tail.length > 65_536) throw new Error('Oversized unfinished SSE frame');
  }
}

function startReader(url: URL, signal: AbortSignal, fail: (error: unknown) => void) {
  const agent = new Agent({ keepAlive: false });
  const opening = Promise.withResolvers<void>();
  const complete = Promise.withResolvers<void>();
  const commits: number[] = [];
  let opened = false;
  const task = (async () => {
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      get(url, { agent, signal, headers: { accept: 'text/event-stream' } }, resolve)
        .once('error', reject);
    });
    try {
      if (
        response.statusCode !== 200 || response.httpVersion !== '1.1' ||
        !response.headers['content-type']?.startsWith('text/event-stream')
      ) throw new Error('Expected an HTTP/1.1 SSE connection');
      let state = createStreamSseReplayStateV1();
      for await (const frame of frames(response)) {
        const observed = performance.now();
        const parsed = parseStreamSseEventV1(frame);
        if (!parsed.ok) throw new Error(parsed.error.message);
        const previous = state;
        state = reduceStreamSseReplayStateV1(previous, parsed.frame).state;
        if (parsed.frame.event === 'data') continue;
        if (state.streamClosed) {
          if (commits.length !== REVISIONS) throw new Error('Premature terminal control');
          return;
        }
        if (!opened && parsed.frame.payload.upToDate && previous.pendingBatches.length === 0) {
          opened = true;
          opening.resolve();
        }
        if (
          previous.pendingBatches.length > 0 &&
          (!opened || previous.lastCommittedOffset === state.lastCommittedOffset)
        ) throw new Error('Data arrived before opening control or repeated the committed offset');
        for (const change of previous.pendingBatches.flat()) {
          const value = revisionSchema.safeParse(change.value);
          if (
            !value.success || change.type !== 'revision' || change.key !== 'revision' ||
            change.headers.operation !== 'upsert' || value.data.revision !== commits.length + 1 ||
            commits.length === REVISIONS
          ) throw new Error('Unexpected, missing, duplicated, or reordered revision');
          commits.push(observed);
        }
        if (commits.length === REVISIONS) complete.resolve();
      }
      if (!signal.aborted) throw new Error('SSE connection ended during the trial');
    } finally {
      response.destroy();
    }
  })().catch((error: unknown) => {
    if (!signal.aborted) fail(error);
  }).finally(() => agent.destroy());
  return { opened: opening.promise, complete: complete.promise, commits, task };
}

function startProducer(base: string, mode: RetentionMode) {
  const keys = ['DURABLE_STREAMS_URL', 'DURABLE_STREAMS_SECRET', 'STREAMS_SECRET'];
  const previous = keys.map((key) => Deno.env.get(key));
  try {
    Deno.env.set(keys[0], base);
    Deno.env.delete(keys[1]);
    Deno.env.delete(keys[2]);
    return new DurableStreamProducer({
      streamPath: SYNTHETIC_PATH,
      producerId: 'fanout-regression',
      schema,
      retention: mode === 'sliding' ? { kind: 'ttl', ttlSeconds: 60 } : undefined,
    });
  } finally {
    for (const [index, key] of keys.entries()) {
      const value = previous[index];
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
}

/** Exercise one retention mode and return its strict latency and delivery verdict. */
export async function runFanoutRegression(mode: RetentionMode): Promise<RegressionResult> {
  const dataDir = await Deno.makeTempDir({ prefix: 'streams-fanout-' });
  const stop = new AbortController();
  const signal = AbortSignal.any([stop.signal, AbortSignal.timeout(TRIAL_TIMEOUT_MS)]);
  let companion: Awaited<ReturnType<typeof startFanoutCompanion>> | undefined;
  let producer: ReturnType<typeof startProducer> | undefined;
  const readers: ReturnType<typeof startReader>[] = [];
  try {
    companion = await startFanoutCompanion(dataDir);
    producer = startProducer(companion.base, mode);
    await producer.waitUntilReady({ signal });
    const sseUrl = new URL(buildStreamUrl(SYNTHETIC_PATH, companion.base));
    sseUrl.search = '?offset=-1&live=sse';
    for (let i = 0; i < READERS; i++) {
      const reader = startReader(sseUrl, signal, (error) => stop.abort(error));
      readers.push(reader);
      await abortable(reader.opened, signal);
    }

    const started = performance.now();
    const offered: number[] = [];
    const receipts = [];
    for (let revision = 1; revision <= REVISIONS; revision++) {
      await delay(Math.max(0, started + revision * INTERVAL_MS - performance.now()), { signal });
      offered.push(performance.now());
      receipts.push(producer.upsert('revision', { id: 'revision', revision }).completion);
    }
    const acknowledgements = await abortable(Promise.all(receipts), signal);
    const delivered = acknowledgements.filter((receipt) => receipt.status === 'delivered');
    if (delivered.length !== REVISIONS) throw new Error('A producer append failed');
    await abortable(Promise.all(readers.map((reader) => reader.complete)), signal);
    const latencies = offered.map((enqueued, i) =>
      Math.max(...readers.map((reader) => reader.commits[i])) - enqueued
    ).sort((a, b) => a - b);
    const p95Ms = latencies[Math.ceil(latencies.length * 0.95) - 1];
    const commits = readers.reduce((sum, reader) => sum + reader.commits.length, 0);
    const misses = READERS * REVISIONS - commits;
    const drainMs = performance.now() - offered.at(-1)!;
    signal.throwIfAborted();
    return {
      result: Number.isFinite(p95Ms) && p95Ms < P95_LIMIT_MS && misses === 0 ? 'PASS' : 'FAIL',
      mode,
      readers: READERS,
      appends: delivered.length,
      commits,
      misses,
      appendRetries: delivered.reduce((sum, receipt) => sum + receipt.attempts - 1, 0),
      readerReconnects: 0,
      p95Ms,
      maxMs: latencies.at(-1)!,
      drainMs,
    };
  } finally {
    stop.abort();
    try {
      await abortable(
        Promise.all(readers.map((reader) => reader.task)),
        AbortSignal.timeout(
          CLEANUP_TIMEOUT_MS,
        ),
      );
    } finally {
      try {
        if (producer) await abortable(producer.stop(), AbortSignal.timeout(CLEANUP_TIMEOUT_MS));
      } finally {
        try {
          await companion?.stop();
        } finally {
          // The only topic belongs to this companion. Removing its closed store
          // discards both the topic metadata and segment files.
          await Deno.remove(dataDir, { recursive: true });
        }
      }
    }
  }
}

if (import.meta.main) {
  let passed = true;
  for (const mode of RETENTION_MODES) {
    try {
      const result = await runFanoutRegression(mode);
      console.log(JSON.stringify(result));
      passed &&= result.result === 'PASS';
    } catch (error) {
      passed = false;
      console.error(`FAIL ${mode}`, error);
    }
  }
  Deno.exit(passed ? 0 : 1);
}
