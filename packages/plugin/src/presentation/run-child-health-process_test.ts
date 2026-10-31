import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { stub } from 'jsr:@std/testing@^1/mock';
import { runChildHealthProcess } from './run-child-health-process.ts';
import type { ChildHealthMonitor } from '../runtime/child-health-monitor.ts';
import type { ChildHealthSnapshot } from '../domain/child-health.ts';

Deno.test('child health HTTP transport awaits asynchronous durable snapshot readers', async () => {
  const previousPort = Deno.env.get('PORT');
  Deno.env.set('PORT', '0');
  const nativeServe = Deno.serve;
  const listening = Promise.withResolvers<Deno.Addr>();
  const started = Promise.withResolvers<void>();
  let monitor: ChildHealthMonitor | undefined;
  let stop: (() => void) | undefined;
  using _serve = stub(Deno, 'serve', (...args) => {
    const server = nativeServe(...args);
    listening.resolve(server.addr);
    return server;
  });
  using _signals = stub(Deno, 'addSignalListener', (_signal, callback) => {
    stop = callback;
  });
  using _removeSignals = stub(Deno, 'removeSignalListener', () => undefined);
  const running = runChildHealthProcess(async (health, signal) => {
    monitor = health;
    health.registryLoaded();
    health.dependenciesReady();
    health.running();
    started.resolve();
    await new Promise<void>((resolve) =>
      signal.addEventListener('abort', () => resolve(), { once: true })
    );
  }, async () => {
    await Promise.resolve();
    assert(monitor);
    return { ...monitor.snapshot(), deadLetters: { available: true, depth: 7 } };
  });
  void running.catch(() => undefined);
  try {
    const addr = await listening.promise;
    assert('port' in addr);
    await started.promise;
    const response = await fetch(`http://127.0.0.1:${addr.port}/health`);
    assertEquals(response.status, 200);
    assertEquals((await response.json()).deadLetters, { available: true, depth: 7 });
  } finally {
    stop?.();
    await running;
    if (previousPort === undefined) Deno.env.delete('PORT');
    else Deno.env.set('PORT', previousPort);
  }
});

Deno.test('fatal child failure drains even when a health snapshot never settles', async () => {
  const previousPort = Deno.env.get('PORT');
  const previousExit = Deno.exitCode;
  Deno.env.set('PORT', '0');
  const nativeServe = Deno.serve;
  const listening = Promise.withResolvers<Deno.Addr>();
  const reading = Promise.withResolvers<void>();
  const blockedSnapshot = Promise.withResolvers<ChildHealthSnapshot | undefined>();
  const fail = Promise.withResolvers<void>();
  let stop: (() => void) | undefined;
  using _serve = stub(Deno, 'serve', (...args) => {
    const server = nativeServe(...args);
    listening.resolve(server.addr);
    return server;
  });
  using _signals = stub(Deno, 'addSignalListener', (_signal, callback) => {
    stop = callback;
  });
  using _removeSignals = stub(Deno, 'removeSignalListener', () => undefined);
  const running = runChildHealthProcess(async (health) => {
    health.registryLoaded();
    health.dependenciesReady();
    health.running();
    await fail.promise;
    throw new Error('fatal child');
  }, () => {
    reading.resolve();
    return blockedSnapshot.promise;
  });
  void running.catch(() => undefined);
  let request: Promise<Response> | undefined;
  try {
    const addr = await listening.promise;
    assert('port' in addr);
    request = fetch(`http://127.0.0.1:${addr.port}/health`);
    void request.catch(() => undefined);
    await bounded(reading.promise);
    fail.resolve();
    const response = await bounded(request);
    assertEquals(response.status, 503);
    assertEquals((await response.json()).state, 'failed');
    await assertRejects(() => bounded(running), Error, 'Background child failed');
    assertEquals(Deno.exitCode, 1);
  } finally {
    fail.resolve();
    blockedSnapshot.resolve(undefined);
    stop?.();
    await running.catch(() => undefined);
    await request?.then((response) => response.body?.cancel()).catch(() => undefined);
    Deno.exitCode = previousExit;
    if (previousPort === undefined) Deno.env.delete('PORT');
    else Deno.env.set('PORT', previousPort);
  }
});

async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Health drain deadline elapsed')), 2500);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
