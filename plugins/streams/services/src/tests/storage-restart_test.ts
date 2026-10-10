/** Process-boundary storage acceptance, reusable against a generated project. @module */
import { assert, assertEquals } from '@std/assert';
import { getAvailablePort } from '@std/net';
import { defineStreamSchema, DurableStreamProducer } from '@netscript/plugin-streams-core';
import { z } from 'zod';

const projectRoot = Deno.env.get('NETSCRIPT_STREAMS_TEST_PROJECT') ?? Deno.cwd();

async function readBoundedStderr(stream: ReadableStream<Uint8Array>): Promise<string> {
  const retained = new Uint8Array(8192);
  let size = 0;
  for await (const chunk of stream) {
    const tail = chunk.subarray(Math.max(0, chunk.length - retained.length));
    const keep = Math.min(size, retained.length - tail.length);
    retained.copyWithin(0, size - keep, size);
    retained.set(tail, keep);
    size = keep + tail.length;
  }
  return new TextDecoder().decode(retained.subarray(0, size));
}

async function spawnService(dataDir?: string) {
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
    stderr: 'piped',
  }).spawn();
  return { child, stderr: readBoundedStderr(child.stderr), base: `http://127.0.0.1:${port}` };
}

async function startService(dataDir?: string) {
  const { child, stderr, base } = await spawnService(dataDir);
  let exited = false;
  const status = child.status.then((result) => {
    exited = true;
    return result;
  });
  const stop = async () => {
    if (!exited) child.kill('SIGTERM');
    await status;
    await stderr;
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

Deno.test('storage process: missing directory exits non-zero with a storage diagnostic', async () => {
  const dir = await Deno.makeTempDir();
  const { child, stderr } = await spawnService(`${dir}/missing`);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
  }, 5000);
  try {
    const status = await child.status;
    const diagnostic = await stderr;
    assert(!timedOut, 'Missing-directory startup must exit without fixture termination.');
    assert(status.code !== 0, 'Missing-directory startup must exit non-zero.');
    assert(/STREAMS_DATA_DIR|NotFound/.test(diagnostic), diagnostic);
  } finally {
    clearTimeout(timer);
    await Deno.remove(dir, { recursive: true });
  }
});
