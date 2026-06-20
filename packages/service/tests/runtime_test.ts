import { assert, assertEquals, assertRejects } from '@std/assert';
import { createService } from '../mod.ts';

function clientOrigin(hostname: string, port: number): string {
  const host = hostname === '0.0.0.0' ? '127.0.0.1' : hostname;
  return `http://${host}:${port}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deferred<T = void>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

Deno.test('serve starts on an ephemeral port and stops cleanly', async () => {
  const running = await createService({}, { name: 'runtime' })
    .withHealth()
    .serve({ port: 0 });

  try {
    const response = await fetch(
      `${clientOrigin(running.addr.hostname, running.addr.port)}/health`,
    );
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
    () => fetch(`${clientOrigin(running.addr.hostname, running.addr.port)}/health`),
    TypeError,
  );
});

Deno.test('stop drains an in-flight request before closing the listener', async () => {
  const requestStarted = deferred<void>();
  const running = await createService({}, { name: 'runtime-drain' })
    .route('get', '/slow', async () => {
      requestStarted.resolve();
      await delay(25);
      return new Response('done', { status: 200 });
    })
    .serve({ port: 0 });

  const origin = clientOrigin(running.addr.hostname, running.addr.port);
  const responsePromise = fetch(`${origin}/slow`);
  await requestStarted.promise;

  await running.stop();
  const response = await responsePromise;

  assertEquals(response.status, 200);
  assertEquals(await response.text(), 'done');
  await assertRejects(() => fetch(`${origin}/slow`), TypeError);
});

Deno.test('serve installs and removes platform signal listeners by default', async () => {
  const originalAdd = Deno.addSignalListener;
  const originalRemove = Deno.removeSignalListener;
  const added: Deno.Signal[] = [];
  const removed: Deno.Signal[] = [];

  Deno.addSignalListener = ((signal, _handler) => {
    added.push(signal);
  }) as typeof Deno.addSignalListener;
  Deno.removeSignalListener = ((signal, _handler) => {
    removed.push(signal);
  }) as typeof Deno.removeSignalListener;

  try {
    const running = await createService({}, { name: 'runtime-signal-registration' })
      .serve({ port: 0 });
    await running.stop();

    assert(added.length > 0);
    assertEquals(removed, added);
  } finally {
    Deno.addSignalListener = originalAdd;
    Deno.removeSignalListener = originalRemove;
  }
});

Deno.test('serve skips signal listeners when handleSignals is false', async () => {
  const originalAdd = Deno.addSignalListener;
  const originalRemove = Deno.removeSignalListener;
  let addCalls = 0;
  let removeCalls = 0;

  Deno.addSignalListener = ((_signal, _handler) => {
    addCalls += 1;
  }) as typeof Deno.addSignalListener;
  Deno.removeSignalListener = ((_signal, _handler) => {
    removeCalls += 1;
  }) as typeof Deno.removeSignalListener;

  try {
    const running = await createService({}, { name: 'runtime-signal-disabled' })
      .serve({ port: 0, handleSignals: false });
    await running.stop();

    assertEquals(addCalls, 0);
    assertEquals(removeCalls, 0);
  } finally {
    Deno.addSignalListener = originalAdd;
    Deno.removeSignalListener = originalRemove;
  }
});

Deno.test('serve can start and stop twice without leaking signal handlers', async () => {
  const first = await createService({}, { name: 'runtime-repeat-1' }).serve({ port: 0 });
  await first.stop();

  const second = await createService({}, { name: 'runtime-repeat-2' }).serve({ port: 0 });
  await second.stop();
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
    const response = await fetch(`${clientOrigin(running.addr.hostname, running.addr.port)}/boom`);
    const body = await response.json();

    assertEquals(response.status, 500);
    assertEquals(body.error, 'INTERNAL_ERROR');
  } finally {
    await running.stop();
  }

  await assertRejects(
    () => fetch(`${clientOrigin(running.addr.hostname, running.addr.port)}/boom`),
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
