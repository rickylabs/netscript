/** Owns the production companion process used by the SSE fan-out regression. @module */

import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { abortable } from 'jsr:@std/async@1/abortable';
import { TextLineStream } from 'jsr:@std/streams@1/text-line-stream';
import { DurableStreamTestServer, FileBackedStreamStore } from '@durable-streams/server';
import { startStreamsService } from '../../service.ts';

const READY = 'STREAMS_FANOUT_PORT=';
const STOP_TIMEOUT_MS = 15_000;

function loopbackAddress(): string {
  const address = Object.values(networkInterfaces()).flat()
    .find((entry) => entry?.internal && entry.family === 'IPv4')?.address;
  if (!address) throw new Error('An internal IPv4 interface is required');
  return address;
}

/** Run the public Streams factory with an isolated storage directory and ephemeral listener. */
export async function startFanoutCompanion(
  dataDir: string,
): Promise<{ base: string; stop(): Promise<void> }> {
  const hostname = loopbackAddress();
  const env = { ...Deno.env.toObject(), STREAMS_DATA_DIR: dataDir };
  Reflect.deleteProperty(env, 'STREAMS_INTERNAL_PORT');
  const child = new Deno.Command(Deno.execPath(), {
    args: ['run', '--frozen', '-A', fileURLToPath(import.meta.url), hostname],
    env,
    clearEnv: true,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'inherit',
  }).spawn();
  const ready = Promise.withResolvers<number>();
  const output = (async () => {
    const lines = child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
      new TextLineStream(),
    );
    for await (const line of lines) {
      if (line.startsWith(READY)) ready.resolve(Number(line.slice(READY.length)));
    }
  })();
  // Keep consuming stdout until the child has stopped. Reject readiness if it exits first.
  output.then(
    () => ready.reject(new Error('File-backed companion exited before readiness')),
    ready.reject,
  );
  const status = child.status;
  try {
    const port = await abortable(ready.promise, AbortSignal.timeout(15_000));
    return { base: `http://${hostname}:${port}`, stop };
  } catch (error) {
    await stop().catch(() => undefined);
    throw error;
  }

  async function stop(): Promise<void> {
    await child.stdin.close();
    const exit = await abortable(status, AbortSignal.timeout(STOP_TIMEOUT_MS)).catch(async () => {
      child.kill('SIGKILL');
      return await abortable(status, AbortSignal.timeout(STOP_TIMEOUT_MS));
    });
    await output;
    if (!exit.success) throw new Error(`File-backed companion exit ${exit.code}`);
  }
}

async function runCompanion(hostname: string): Promise<void> {
  // Keep a reference for teardown. Restore the startup method before accepting any workload.
  let store: FileBackedStreamStore | undefined;
  const start = DurableStreamTestServer.prototype.start;
  DurableStreamTestServer.prototype.start = function () {
    if (this.store instanceof FileBackedStreamStore) store = this.store;
    return start.call(this);
  };
  const service = await startStreamsService({
    auth: { public: true, reason: 'Isolated synthetic Streams fan-out regression' },
    serve: { hostname, port: 0, handleSignals: false },
  }).finally(() => {
    DurableStreamTestServer.prototype.start = start;
  });
  try {
    const base = `http://${hostname}:${service.addr.port}`;
    const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5_000) });
    const health = await response.json();
    const storage = health.checks?.find((check: { name: string }) =>
      check.name === 'streams-storage'
    )?.storage;
    if (!store || !response.ok || storage?.mode !== 'file' || storage?.probe !== 'passed') {
      throw new Error('Expected healthy file-backed Streams storage');
    }
    console.log(READY + service.addr.port);
    for await (const _ of Deno.stdin.readable) {
      throw new Error('Expected the benchmark driver to close stdin');
    }
  } finally {
    try {
      // Wake outstanding upstream SSE waiters, then drain the real service.
      for (const path of store?.list() ?? []) store?.closeStream(path);
    } finally {
      await service.stop();
    }
  }
}

if (import.meta.main) await runCompanion(Deno.args[0]);
