import type { JobMessage } from '@netscript/plugin-workers-core/runtime';
import { z } from 'zod';
import { basename, dirname, fromFileUrl, join, resolve } from '@std/path';

/** Persistent request written by the scaffold seed, independent of runtime availability. */
export const seedSampleSchema: z.ZodObject<{
  version: z.ZodLiteral<1>;
  seedId: z.ZodString;
}> = z.object({ version: z.literal(1), seedId: z.string().uuid() });

/** Existing worker boundaries used after the generated registry has been registered. */
export interface SeedSamplePorts {
  readonly readRequest: () => Promise<unknown | undefined>;
  readonly accepted: (seedId: string) => Promise<boolean>;
  readonly remember: (seedId: string) => Promise<void>;
  readonly job: (id: string) => Promise<
    | { readonly enabled: boolean; readonly topic?: string; readonly sample: boolean }
    | null
    | undefined
  >;
  readonly enqueue: (message: JobMessage) => Promise<void>;
}

const SAMPLE_JOB_ID = 'health-check';
const SEED_KEY_PREFIX = 'scaffold-seed:';

/**
 * Hand a successful seed to the registered sample job once per durable worker store.
 * Concurrent/replayed dispatch keeps the same consumer idempotency key. A failed
 * enqueue leaves the request pending; only acknowledged enqueue records acceptance.
 */
export async function dispatchSeedSample(ports: SeedSamplePorts): Promise<void> {
  const request = await ports.readRequest();
  if (request === undefined) return;
  const { seedId } = seedSampleSchema.parse(request);
  if (await ports.accepted(seedId)) return;
  const job = await ports.job(SAMPLE_JOB_ID);
  // A missing, disabled or user-replaced job is never an invitation to run other work.
  if (!job?.enabled || !job.sample) return;
  await ports.enqueue({
    jobId: SAMPLE_JOB_ID,
    topic: job.topic ?? 'default',
    triggeredBy: 'manual',
    payload: { source: 'database-seed' },
    idempotencyKey: SEED_KEY_PREFIX + seedId,
    correlationId: SEED_KEY_PREFIX + seedId,
  });
  await ports.remember(seedId);
}

/** Missing seed markers are normal for unseeded and non-database workspaces. */
export async function readSeedSampleRequest(path: URL): Promise<unknown | undefined> {
  try {
    return JSON.parse(await Deno.readTextFile(path));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

/** Watch before reading so seeding an already-running workspace cannot lose its handoff. */
export async function watchSeedSample(
  path: URL,
  ports: SeedSamplePorts,
  signal: AbortSignal,
  onReady: () => void = () => {},
  reportError: (error: unknown) => void = (error) =>
    console.error('Seed sample dispatch failed; intent remains pending.', error),
): Promise<void> {
  if (signal.aborted) return;
  const markerPath = fromFileUrl(path);
  let initial = true;
  let rearm = true;
  while (rearm && !signal.aborted) {
    rearm = false;
    await Deno.mkdir(dirname(markerPath), { recursive: true });
    const directory = await Deno.realPath(dirname(markerPath));
    const marker = join(directory, basename(markerPath));
    using watcher = Deno.watchFs(directory, { recursive: false });
    const close = () => watcher.close();
    signal.addEventListener('abort', close, { once: true });
    try {
      if (signal.aborted) return;
      if (initial) {
        await dispatchSeedSample(ports);
        initial = false;
        onReady();
      } else {
        await dispatchPublishedSeed(ports, reportError);
      }
      for await (const event of watcher) {
        if (signal.aborted) break;
        if (
          event.kind === 'remove' && event.paths.some((changed) => resolve(changed) === directory)
        ) {
          rearm = true;
          break;
        }
        // Ignore private candidates and receipts; only published intent is consumable.
        if (event.paths.some((changed) => resolve(changed) === marker)) {
          await dispatchPublishedSeed(ports, reportError);
        }
      }
    } finally {
      signal.removeEventListener('abort', close);
    }
  }
}

/** Optional sample failures preserve intent without taking down a healthy processor. */
async function dispatchPublishedSeed(
  ports: SeedSamplePorts,
  reportError: (error: unknown) => void,
): Promise<void> {
  try {
    await dispatchSeedSample(ports);
  } catch (error) {
    reportError(error);
  }
}
