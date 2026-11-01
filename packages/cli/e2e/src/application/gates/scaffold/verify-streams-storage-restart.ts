/** Generated-project producer history must survive an Aspire-owned streams restart. @module */
import { assertEquals } from '@std/assert';
import { defineStreamSchema, DurableStreamProducer } from '@netscript/plugin-streams-core';
import { z } from 'zod';
import { resolveResourceUrlsFromAppHost } from './generated-app-endpoint.ts';
import { watchResourceUpdates } from './runtime/resource-state-stream.ts';
import { STREAMS_STORAGE_RESOURCES } from './prepare-streams-storage-fixture.ts';

/** External effects exercised by the generated-project restart gate. */
export interface StreamsStorageRestartEffects {
  /** Read HTTP JSON from the exact logical resource. */
  read(resource: string, path: string): Promise<unknown>;
  /** Append and flush a nonempty document history using the public producer. */
  produce(): Promise<readonly unknown[]>;
  /** Restart the exact streams resource and wait for its new healthy process. */
  restart(): Promise<void>;
}

const STORAGE_PATH = '/health';
const HistorySchema = z.array(z.object({
  type: z.string(),
  key: z.string(),
  value: z.unknown().optional(),
  headers: z.object({ operation: z.enum(['upsert', 'delete']) }),
}));

/** Assert both storage modes, actual pre-restart writes and exact replay after restart. */
export async function verifyStreamsStorageRestart(
  effects: StreamsStorageRestartEffects,
  streamPath = '/storage-aspire-restart',
): Promise<void> {
  const historyPath = `/v1/stream/netscript${streamPath}?offset=-1`;
  assertStorage(await effects.read(STREAMS_STORAGE_RESOURCES.MEMORY, STORAGE_PATH), 'memory');
  assertStorage(await effects.read(STREAMS_STORAGE_RESOURCES.FILE, STORAGE_PATH), 'file');
  const expected = await effects.produce();
  if (expected.length === 0) throw new Error('Restart proof requires nonempty producer history.');
  const before = await effects.read(STREAMS_STORAGE_RESOURCES.FILE, historyPath);
  assertEquals(
    HistorySchema.parse(before),
    expected,
    'File storage must not silently swallow producer writes.',
  );
  await effects.restart();
  assertStorage(await effects.read(STREAMS_STORAGE_RESOURCES.FILE, STORAGE_PATH), 'file');
  const after = await effects.read(STREAMS_STORAGE_RESOURCES.FILE, historyPath);
  assertEquals(
    after,
    before,
    'Generated streams must replay identical history after Aspire restart.',
  );
}

function assertStorage(health: unknown, mode: 'memory' | 'file'): void {
  if (!isRecord(health) || !Array.isArray(health.checks)) {
    throw new Error('Missing storage health checks');
  }
  const check: unknown = health.checks.find((value: unknown) =>
    isRecord(value) && value.name === 'streams-storage'
  );
  if (!isRecord(check) || !isRecord(check.storage)) {
    throw new Error('Missing streams storage health');
  }
  assertEquals(check.storage.mode, mode);
  assertEquals(check.storage.durable, mode === 'file');
  assertEquals(check.storage.probe, mode === 'file' ? 'passed' : 'not-applicable');
  assertEquals(check.storage.dataDir, undefined, 'Health must not expose local storage paths.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function restartStreams(appHost: string): Promise<void> {
  // Subscribe before inducing. Ignore the initial healthy snapshot until a non-running
  // transition, then require the new healthy process; stale buffered health cannot pass.
  let departed = false;
  const updates = await watchResourceUpdates(appHost, STREAMS_STORAGE_RESOURCES.FILE);
  try {
    await updates.waitFor((update) => update.resource.state === 'Running', 120_000);
    const result = await new Deno.Command('aspire', {
      args: [
        'resource',
        STREAMS_STORAGE_RESOURCES.FILE,
        'restart',
        '--apphost',
        appHost,
        '--non-interactive',
        '--nologo',
      ],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (!result.success) throw new Error(`Aspire streams restart failed (${result.code})`);
    await updates.waitFor((update) => {
      if (update.resource.state !== 'Running') departed = true;
      return departed && update.resource.state === 'Running' &&
        update.resource.healthStatus === 'Healthy';
    }, 120_000);
  } finally {
    await updates.close();
  }
}

async function main(appHost: string): Promise<void> {
  const urls = new Map<string, string>();
  for (const resource of Object.values(STREAMS_STORAGE_RESOURCES)) {
    const readiness = await watchResourceUpdates(appHost, resource);
    try {
      await readiness.waitFor(
        (update) =>
          update.resource.state === 'Running' && update.resource.healthStatus === 'Healthy',
        120_000,
      );
    } finally {
      await readiness.close();
    }
    const [url] = await resolveResourceUrlsFromAppHost(appHost, resource);
    if (!url) throw new Error(`No allocated endpoint for ${resource}`);
    urls.set(resource, url);
  }
  const originalUrl = Deno.env.get('DURABLE_STREAMS_URL');
  const streamPath = `/storage-aspire-restart-${crypto.randomUUID()}`;
  const schema = defineStreamSchema({
    document: {
      schema: z.object({ id: z.string(), value: z.string() }),
      type: 'document',
      primaryKey: 'id',
    },
  });
  Deno.env.set('DURABLE_STREAMS_URL', urls.get(STREAMS_STORAGE_RESOURCES.FILE)!);
  try {
    await verifyStreamsStorageRestart({
      read: async (resource, path) => {
        const response = await fetch(`${urls.get(resource)}${path}`, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error(`Streams ${resource} ${path} returned HTTP ${response.status}`);
        }
        return await response.json();
      },
      produce: async () => {
        const producer = new DurableStreamProducer({
          streamPath,
          schema,
          producerId: `restart-proof-${crypto.randomUUID()}`,
        });
        try {
          await producer.waitUntilReady({ signal: AbortSignal.timeout(10_000) });
          producer.upsert('document', { id: 'retained', value: 'before-Aspire-restart' });
          producer.upsert('document', { id: 'removed', value: 'tombstone-follows' });
          producer.delete('document', 'removed');
          await producer.flush();
          return [
            {
              type: 'document',
              key: 'retained',
              value: { id: 'retained', value: 'before-Aspire-restart' },
              headers: { operation: 'upsert' },
            },
            {
              type: 'document',
              key: 'removed',
              value: { id: 'removed', value: 'tombstone-follows' },
              headers: { operation: 'upsert' },
            },
            { type: 'document', key: 'removed', headers: { operation: 'delete' } },
          ];
        } finally {
          await producer.stop();
        }
      },
      restart: () => restartStreams(appHost),
    }, streamPath);
    console.info(
      'Streams generated-project restart: ephemeral control truthful; file producer writes and tombstone replayed after Aspire restart.',
    );
  } finally {
    if (originalUrl === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', originalUrl);
  }
}

if (import.meta.main) {
  if (!Deno.args[0]) throw new Error('AppHost path required');
  await main(Deno.args[0]);
}
