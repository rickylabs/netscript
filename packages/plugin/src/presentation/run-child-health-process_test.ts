import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { stub } from 'jsr:@std/testing@^1/mock';
import { runChildHealthProcess } from './run-child-health-process.ts';
import type { ChildHealthMonitor } from '../runtime/child-health-monitor.ts';

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
