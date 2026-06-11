import { assert, assertEquals, assertRejects } from '@std/assert';
import { createService } from '../mod.ts';

Deno.test('serve starts on an ephemeral port and stops cleanly', async () => {
  const running = await createService({}, { name: 'runtime' })
    .withHealth()
    .serve({ port: 0 });

  try {
    const response = await fetch(`http://${running.addr.hostname}:${running.addr.port}/health`);
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.status, 'healthy');
  } finally {
    await running.stop();
  }
});

Deno.test('serve stops when external signal aborts', async () => {
  const controller = new AbortController();
  const running = await createService({}, { name: 'runtime-signal' })
    .withHealth()
    .serve({ port: 0, signal: controller.signal });

  controller.abort();
  await running.stop();

  await assertRejects(
    () => fetch(`http://${running.addr.hostname}:${running.addr.port}/health`),
    TypeError,
  );
});

Deno.test('serve rejects invalid port configuration', async () => {
  await assertRejects(
    () => createService({}, { name: 'runtime-invalid' }).serve({ port: -1 }),
    Error,
  );
});

Deno.test('serve rejects startup hook failure before listening', async () => {
  await assertRejects(
    () =>
      createService({}, { name: 'runtime-startup-failure' })
        .onStartup(() => Promise.reject(new Error('startup failed')))
        .serve({ port: 0 }),
    Error,
    'startup failed',
  );
});

Deno.test('service stops cleanly after handler error response', async () => {
  const running = await createService({}, { name: 'runtime-error' })
    .route('get', '/boom', () => {
      throw new Error('boom');
    })
    .serve({ port: 0 });

  try {
    const response = await fetch(`http://${running.addr.hostname}:${running.addr.port}/boom`);
    const body = await response.json();

    assertEquals(response.status, 500);
    assertEquals(body.error, 'INTERNAL_ERROR');
  } finally {
    await running.stop();
  }

  await assertRejects(
    () => fetch(`http://${running.addr.hostname}:${running.addr.port}/boom`),
    TypeError,
  );
});

Deno.test('running service exposes assigned listener address', async () => {
  const running = await createService({}, { name: 'runtime-address' }).serve({ port: 0 });

  try {
    assert(running.addr.port > 0);
    assertEquals(running.addr.transport, 'tcp');
  } finally {
    await running.stop();
  }
});
