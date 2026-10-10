/** Process-boundary storage acceptance, reusable against a generated project. @module */
import { assertEquals, assertRejects } from '@std/assert';
import { getAvailablePort } from '@std/net';
import { defineStreamSchema, DurableStreamProducer } from '@netscript/plugin-streams-core';
import { z } from 'zod';

const projectRoot = Deno.env.get('NETSCRIPT_STREAMS_TEST_PROJECT') ?? Deno.cwd();

async function startService(dataDir?: string) {
  const port = await getAvailablePort();
  const env: Record<string, string> = { ...Deno.env.toObject(), PORT: String(port) };
  delete env.STREAMS_DATA_DIR;
  delete env.STREAMS_INTERNAL_PORT;
  if (dataDir !== undefined) env.STREAMS_DATA_DIR = dataDir;
  const child = new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-all', '--unstable-kv', 'plugins/streams/services/src/main.ts'],
    cwd: projectRoot,
    env,
    clearEnv: true,
    stdout: 'null',
    stderr: 'null',
  }).spawn();
  const base = `http://127.0.0.1:${port}`;
  let exited = false;
  const status = child.status.then((result) => {
    exited = true;
    return result;
  });
  const stop = async () => {
    if (!exited) child.kill('SIGTERM');
    await status;
  };
  try {
    for (let attempt = 0; attempt < 100 && !exited; attempt++) {
      try {
        const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) });
        const health = await response.json();
        if (response.ok) return { base, health, stop };
      } catch { /* The process has not bound its front listener yet. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Streams process did not become healthy.');
  } catch (error) {
    await stop();
    throw error;
  }
}

for (const mode of ['memory', 'file'] as const) {
  Deno.test(`storage process: ${mode} health and producer write -> stop -> restart -> read`, async () => {
    const dir = await Deno.makeTempDir();
    const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
    let running: Awaited<ReturnType<typeof startService>> | undefined;
    let producer: DurableStreamProducer<ReturnType<typeof definition>> | undefined;
    const definition = () => ({
      event: {
        schema: z.object({ id: z.string(), value: z.string() }),
        type: 'event',
        primaryKey: 'id',
      },
    });
    try {
      running = await startService(mode === 'file' ? dir : undefined);
      const storage = running.health.checks.find((check: { name: string }) =>
        check.name === 'streams-storage'
      )?.storage;
      assertEquals(storage?.mode, mode);
      assertEquals(storage?.durable, mode === 'file');
      assertEquals(storage?.probe, mode === 'file' ? 'passed' : 'not-applicable');
      assertEquals(storage?.dataDir, undefined);
      Deno.env.set('DURABLE_STREAMS_URL', running.base);
      producer = new DurableStreamProducer({
        streamPath: '/storage-restart',
        schema: defineStreamSchema(definition()),
        producerId: 'storage-acceptance',
      });
      await producer.waitUntilReady({ signal: AbortSignal.timeout(5000) });
      producer.upsert('event', { id: 'before-restart', value: 'persisted-by-real-producer' });
      producer.upsert('event', { id: 'deleted', value: 'gone' });
      producer.delete('event', 'deleted');
      await producer.flush();
      const endpoint = '/v1/stream/netscript/storage-restart?offset=-1';
      const before = await fetch(`${running.base}${endpoint}`);
      assertEquals(before.status, 200);
      const events = await before.json();
      assertEquals(events.length, 3);
      assertEquals(events[0].value.value, 'persisted-by-real-producer');
      await producer.stop();
      producer = undefined;
      await running.stop();
      running = undefined;
      running = await startService(mode === 'file' ? dir : undefined);
      const after = await fetch(`${running.base}${endpoint}`);
      if (mode === 'file') {
        assertEquals(after.status, 200);
        assertEquals(await after.json(), events);
      } else {
        assertEquals(after.status, 404);
        await after.body?.cancel();
      }
    } finally {
      await producer?.stop();
      await running?.stop();
      if (previousUrl === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
      else Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
      await Deno.remove(dir, { recursive: true });
    }
  });
}

Deno.test('storage process: missing directory fails startup and cannot serve a false file claim', async () => {
  const dir = await Deno.makeTempDir();
  try {
    await assertRejects(() => startService(`${dir}/missing`));
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
