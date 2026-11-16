/** Generated-project producer history must survive an Aspire-owned streams restart. @module */
import { assertEquals } from '@std/assert';
import { defineStreamSchema, DurableStreamProducer } from '@netscript/plugin-streams-core';
import { z } from 'zod';
import { resolveResourceUrlsFromAppHost } from './generated-app-endpoint.ts';
import {
  parseResourceUpdateLine,
  type ResourceUpdateSubscription,
  watchResourceUpdates,
} from './runtime/resource-state-stream.ts';
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

const MAX_READINESS_SNAPSHOT_BYTES = 65_536;
const RESOURCE_STATES = new Set([
  'NotStarted',
  'Starting',
  'Waiting',
  'Running',
  'Stopping',
  'Stopped',
  'Finished',
  'Exited',
  'FailedToStart',
  'Building',
  'Hidden',
  'Unknown',
]);
const TERMINAL_STATES = new Set(['Finished', 'Exited', 'FailedToStart']);

function healthCategory(value: unknown): 'Healthy' | 'Unhealthy' | 'Degraded' | 'Unknown' {
  return value === 'Healthy' || value === 'Unhealthy' || value === 'Degraded' ? value : 'Unknown';
}

/** Project only categorical lifecycle evidence; never retain raw resource diagnostics. */
function readinessSummary(resource: Readonly<Record<string, unknown>>) {
  const healthReports = { Healthy: 0, Unhealthy: 0, Degraded: 0, Unknown: 0 };
  if (isRecord(resource.healthReports)) {
    for (const report of Object.values(resource.healthReports)) {
      healthReports[healthCategory(isRecord(report) ? report.status : undefined)]++;
    }
  }
  return {
    state: typeof resource.state === 'string' && RESOURCE_STATES.has(resource.state)
      ? resource.state
      : 'Unknown',
    healthStatus: healthCategory(resource.healthStatus),
    ...(typeof resource.exitCode === 'number' && Number.isSafeInteger(resource.exitCode)
      ? { exitCode: resource.exitCode }
      : {}),
    healthReports,
  };
}

function observationFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.startsWith('Timed out after ')) return 'timeout';
  if (message.startsWith('Unrecognized Aspire resource update line')) return 'invalid-update';
  if (message.startsWith('Aspire resource follower for ')) return 'observer-ended';
  return 'observer-failed';
}

/** Initial readiness stays event-authoritative; one failure snapshot adds evidence only. */
export async function waitForStreamsStorageReady(
  appHost: string,
  resource: typeof STREAMS_STORAGE_RESOURCES[keyof typeof STREAMS_STORAGE_RESOURCES],
  watch: typeof watchResourceUpdates = watchResourceUpdates,
  readSnapshot: (appHost: string, resource: string) => Promise<string> = readReadinessSnapshot,
  ceilingMs = 120_000,
): Promise<void> {
  if (!Object.values(STREAMS_STORAGE_RESOURCES).includes(resource)) {
    throw new Error('Unsupported streams readiness resource');
  }
  let subscription: ResourceUpdateSubscription | undefined;
  let updates = 0;
  let last: ReturnType<typeof readinessSummary> | null = null;
  let ready = false;
  let reason = 'observer-failed';
  let observer = 'not-started';
  try {
    subscription = await watch(appHost, resource);
    await subscription.waitFor((update) => {
      updates++;
      last = readinessSummary(update.resource);
      if (TERMINAL_STATES.has(last.state)) {
        reason = 'terminal-state';
        return true;
      }
      ready = update.resource.state === 'Running' && update.resource.healthStatus === 'Healthy';
      return ready;
    }, ceilingMs);
  } catch (error) {
    reason = observationFailure(error);
  } finally {
    if (subscription) {
      try {
        await subscription.close(ready);
        observer = 'closed';
      } catch {
        observer = 'close-failed';
      }
    }
  }
  if (ready && observer === 'closed') return;
  const snapshot = ready ? null : await failureSnapshot(appHost, resource, readSnapshot);
  throw new Error(`Streams readiness failed: ${
    JSON.stringify({
      resource,
      reason: ready ? 'close-failed' : reason,
      updates,
      last,
      observer,
      snapshot,
    })
  }`);
}

async function failureSnapshot(
  appHost: string,
  resource: string,
  read: (appHost: string, resource: string) => Promise<string>,
) {
  try {
    const raw = await read(appHost, resource);
    if (new TextEncoder().encode(raw).byteLength > MAX_READINESS_SNAPSHOT_BYTES) {
      throw new Error('Readiness snapshot exceeds byte bound');
    }
    return readinessSummary(parseResourceUpdateLine(raw, resource).resource);
  } catch {
    return { outcome: 'unavailable' };
  }
}

async function readReadinessSnapshot(appHost: string, resource: string): Promise<string> {
  const child = new Deno.Command('aspire', {
    args: [
      'describe',
      resource,
      '--format',
      'Json',
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ],
    signal: AbortSignal.timeout(10_000),
    stdin: 'null',
    stdout: 'piped',
    stderr: 'null',
  }).spawn();
  const reader = child.stdout.getReader();
  const bytes = new Uint8Array(MAX_READINESS_SNAPSHOT_BYTES + 1);
  let length = 0;
  let settled = false;
  let cleanupFailed = false;
  let raw = '';
  try {
    while (length < bytes.length) {
      const next = await reader.read();
      if (next.done) break;
      const part = next.value.subarray(0, bytes.length - length);
      bytes.set(part, length);
      length += part.length;
    }
    if (length > MAX_READINESS_SNAPSHOT_BYTES) {
      throw new Error('Readiness snapshot exceeds byte bound');
    }
    const status = await child.status;
    settled = true;
    if (!status.success) throw new Error('Readiness snapshot command failed');
    raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length));
  } finally {
    if (!settled) {
      try {
        child.kill('SIGKILL');
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) cleanupFailed = true;
      }
    }
    try {
      await reader.cancel();
    } catch {
      cleanupFailed = true;
    } finally {
      reader.releaseLock();
    }
    try {
      await child.status;
    } catch {
      cleanupFailed = true;
    }
  }
  if (cleanupFailed) throw new Error('Readiness snapshot cleanup failed');
  return raw;
}

async function main(appHost: string): Promise<void> {
  const urls = new Map<string, string>();
  for (const resource of Object.values(STREAMS_STORAGE_RESOURCES)) {
    await waitForStreamsStorageReady(appHost, resource);
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
