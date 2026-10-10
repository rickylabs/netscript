import { assertEquals, assertFalse } from '@std/assert';
import { childHealthResponse, type ChildHealthSnapshot } from '@netscript/plugin/health';
import { WorkerListenerSupervisor } from './listener-supervisor.ts';

Deno.test('injected listener crash loop turns the child health route red and stays red on restart', async () => {
  const fourthAttempt = Promise.withResolvers<void>();
  let attempts = 0;
  const listener = new WorkerListenerSupervisor({
    name: 'injected-crash-loop',
    maxRestarts: 5,
    sleep: () => Promise.resolve(),
    run: async (signal) => {
      attempts++;
      if (attempts < 4) throw new Error('password=secret-token https://user:password@db.example');
      fourthAttempt.resolve();
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true })
      );
    },
  });
  listener.start();
  await fourthAttempt.promise;
  try {
    // Optional structural lookup keeps this assertion runnable against the baseline supervisor.
    const health =
      (listener.snapshot() as unknown as { childHealth?: ChildHealthSnapshot }).childHealth;
    assertEquals(health?.state, 'crash-looping');
    assertFalse(listener.snapshot().healthy);
    const response = childHealthResponse(new Request('http://localhost/health'), health!);
    assertEquals(response.status, 503);
    const payload = await response.text();
    assertFalse(payload.includes('secret-token'));
    assertFalse(payload.includes('password'));
    assertEquals(health?.restartCount, 3);
  } finally {
    await listener.stop();
  }
});

Deno.test('idle and cleanly stopped listener never reports healthy', async () => {
  const started = Promise.withResolvers<void>();
  const listener = new WorkerListenerSupervisor({
    name: 'clean-shutdown',
    run: async (signal) => {
      started.resolve();
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true })
      );
    },
  });
  assertFalse(listener.snapshot().healthy);
  listener.start();
  await started.promise;
  assertEquals(listener.snapshot().healthy, true);
  await listener.stop();
  assertFalse(listener.snapshot().healthy);
  assertEquals(listener.snapshot().childHealth.state, 'stopped');
});

Deno.test('listener shutdown during restart backoff drains without a detached rejection', async () => {
  const sleeping = Promise.withResolvers<void>();
  const listener = new WorkerListenerSupervisor({
    name: 'backoff-shutdown',
    run: () => Promise.reject(new Error('injected failure')),
    sleep: (_ms, signal) =>
      new Promise((_resolve, reject) => {
        sleeping.resolve();
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
          once: true,
        });
      }),
  });
  listener.start();
  await sleeping.promise;
  await listener.stop();
  assertEquals(listener.snapshot().childHealth.state, 'stopped');
  assertFalse(listener.snapshot().healthy);
});
