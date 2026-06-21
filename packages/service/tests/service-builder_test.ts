import { assertEquals, assertRejects } from '@std/assert';
import { createService } from '../mod.ts';

function clientOrigin(hostname: string, port: number): string {
  const host = hostname === '0.0.0.0' ? '127.0.0.1' : hostname;
  return `http://${host}:${port}`;
}

Deno.test('createService builder builds a mountable health app', async () => {
  const app = createService({}, { name: 'users', version: '1.2.3' })
    .withHealth()
    .build();

  const response = await app.request('/health');
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.status, 'healthy');
  assertEquals(body.version, '1.2.3');
});

Deno.test('custom health checks affect health status', async () => {
  const app = createService({}, { name: 'users' })
    .withHealthCheck({
      name: 'dependency',
      check: () => Promise.resolve({ healthy: false, message: 'offline' }),
    })
    .withHealth()
    .build();

  const response = await app.request('/health');
  const body = await response.json();

  assertEquals(response.status, 503);
  assertEquals(body.status, 'unhealthy');
  assertEquals(body.checks[0].name, 'dependency');
});

Deno.test('onShutdown hooks run once in LIFO order on stop', async () => {
  const calls: string[] = [];
  const running = await createService({}, { name: 'shutdown-hooks' })
    .withHealth()
    .onShutdown(() => {
      calls.push('first');
    })
    .onShutdown(() => {
      calls.push('second');
    })
    .serve({ port: 0 });

  await running.stop();
  await running.stop();

  assertEquals(calls, ['second', 'first']);
  await assertRejects(
    () => fetch(`${clientOrigin(running.addr.hostname, running.addr.port)}/health`),
    TypeError,
  );
});

Deno.test('onShutdown hook rejection is collected and stop still closes listener', async () => {
  const calls: string[] = [];
  const running = await createService({}, { name: 'shutdown-hook-failure' })
    .withHealth()
    .onShutdown(() => {
      calls.push('after');
    })
    .onShutdown(() => {
      calls.push('failure');
      throw new Error('shutdown failed');
    })
    .onShutdown(() => {
      calls.push('before');
    })
    .serve({ port: 0 });

  await running.stop();

  assertEquals(calls, ['before', 'failure', 'after']);
  await assertRejects(
    () => fetch(`${clientOrigin(running.addr.hostname, running.addr.port)}/health`),
    TypeError,
  );
});

Deno.test('onShutdown honors drain timeout without hanging stop', async () => {
  const running = await createService({}, { name: 'shutdown-hook-timeout' })
    .withHealth()
    .onShutdown(() => new Promise<void>(() => {}))
    .serve({ port: 0, drainTimeoutMs: 5 });

  await running.stop();

  await assertRejects(
    () => fetch(`${clientOrigin(running.addr.hostname, running.addr.port)}/health`),
    TypeError,
  );
});

Deno.test('onShutdown hooks run when a handled signal fires', async () => {
  const originalAdd = Deno.addSignalListener;
  const originalRemove = Deno.removeSignalListener;
  let capturedHandler: (() => void) | undefined;
  let hookCalls = 0;

  Deno.addSignalListener = ((signal, handler) => {
    if (signal === 'SIGTERM') {
      capturedHandler = handler;
    }
  }) as typeof Deno.addSignalListener;
  Deno.removeSignalListener = ((_signal, _handler) => {}) as typeof Deno.removeSignalListener;

  try {
    const running = await createService({}, { name: 'shutdown-hook-signal' })
      .withHealth()
      .onShutdown(() => {
        hookCalls += 1;
      })
      .serve({ port: 0 });

    capturedHandler?.();
    await running.stop();

    assertEquals(hookCalls, 1);
    await assertRejects(
      () => fetch(`${clientOrigin(running.addr.hostname, running.addr.port)}/health`),
      TypeError,
    );
  } finally {
    Deno.addSignalListener = originalAdd;
    Deno.removeSignalListener = originalRemove;
  }
});
