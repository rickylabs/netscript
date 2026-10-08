import { assertEquals, assertInstanceOf, assertRejects, assertThrows } from '@std/assert';
import { ORPCError, os } from '@orpc/server';
import { createDesktopServiceClient } from '@netscript/sdk/desktop';
import type { DESKTOP_BIND_OPERATIONS } from '@netscript/sdk/desktop';
import { bindDesktopRpcWindow } from './bind-desktop-rpc-window.ts';
import { DESKTOP_RPC_BINDING_STATUSES, DESKTOP_RPC_DISABLED_REASONS } from './constants.ts';
import type { DesktopBindableWindow } from './types.ts';

const DESKTOP_RUNTIME = { BrowserWindow: class BrowserWindow {} };

class TestDesktopWindow implements DesktopBindableWindow {
  handler:
    | ((operation: unknown, payload?: unknown, epoch?: unknown) => Promise<unknown>)
    | undefined;
  bindCalls = 0;
  unbindCalls = 0;
  bindingName: string | undefined;

  bind(name: string, handler: NonNullable<TestDesktopWindow['handler']>): void {
    this.bindCalls += 1;
    this.bindingName = name;
    this.handler = handler;
  }

  unbind(name: string): void {
    assertEquals(name, this.bindingName);
    this.unbindCalls += 1;
    this.handler = undefined;
  }

  async invoke(
    operation: typeof DESKTOP_BIND_OPERATIONS[keyof typeof DESKTOP_BIND_OPERATIONS],
    payload?: string | Uint8Array,
    epoch?: unknown,
  ): Promise<unknown> {
    if (this.handler === undefined) {
      throw new Error('Desktop binding is not registered');
    }
    return await this.handler(operation, payload, epoch);
  }
}

const noopRouter = os.router({
  ping: os.handler(() => 'pong'),
});

Deno.test('close unbinds synchronously and preserves a same-name replacement', async () => {
  const window = new TestDesktopWindow();
  const options = { window, router: noopRouter, context: {}, runtime: DESKTOP_RUNTIME };
  const original = bindDesktopRpcWindow(options);
  let replacement: ReturnType<typeof bindDesktopRpcWindow> | undefined;
  try {
    const closing = original.close();
    assertEquals(window.unbindCalls, 1);
    assertEquals(window.handler, undefined);
    replacement = bindDesktopRpcWindow(options);
    const replacementHandler = window.handler;
    await closing;
    assertEquals(window.handler, replacementHandler);
    assertEquals(window.bindCalls, 2);
    const client = createDesktopServiceClient({
      contract: noopRouter,
      invoke: window.invoke.bind(window),
    });
    assertEquals(await client.ping(undefined), 'pong');
  } finally {
    await original.close();
    await replacement?.close();
  }
  assertEquals(window.unbindCalls, 2);
});

Deno.test('reentrant close shares pending asynchronous unbind completion', async () => {
  const window = new TestDesktopWindow();
  const completion = Promise.withResolvers<void>();
  const binding = bindDesktopRpcWindow({
    window,
    router: noopRouter,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });
  let reentrant: Promise<void> | undefined;
  window.unbind = () => {
    window.unbindCalls++;
    reentrant = binding.close();
    return completion.promise;
  };
  const closing = binding.close();
  assertEquals(reentrant, closing);
  assertEquals(binding.close(), closing);
  let settled = false;
  closing.then(() => settled = true);
  await Promise.resolve();
  assertEquals(settled, false);
  completion.resolve();
  await closing;
  assertEquals(settled, true);
  assertEquals(window.unbindCalls, 1);
});

Deno.test('browser and Aspire capability shapes disable Desktop RPC without binding', async () => {
  const browserWindow = new TestDesktopWindow();
  const browser = bindDesktopRpcWindow({
    window: browserWindow,
    router: noopRouter,
    context: {},
    runtime: null,
  });
  assertEquals(browser, {
    status: DESKTOP_RPC_BINDING_STATUSES.DISABLED,
    reason: DESKTOP_RPC_DISABLED_REASONS.NOT_DESKTOP,
    close: browser.close,
  });
  await browser.close();
  assertEquals(browserWindow.bindCalls, 0);

  const aspireWindow = new TestDesktopWindow();
  const aspire = bindDesktopRpcWindow({
    window: aspireWindow,
    router: noopRouter,
    context: {},
    runtime: {},
  });
  assertEquals(aspire.status, DESKTOP_RPC_BINDING_STATUSES.DISABLED);
  if (aspire.status === DESKTOP_RPC_BINDING_STATUSES.DISABLED) {
    assertEquals(aspire.reason, DESKTOP_RPC_DISABLED_REASONS.NOT_DESKTOP);
  }
  await aspire.close();
  assertEquals(aspireWindow.bindCalls, 0);
});

Deno.test('Desktop capability without a usable window returns an inert lifecycle', async () => {
  const result = bindDesktopRpcWindow({
    router: noopRouter,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });

  assertEquals(result.status, DESKTOP_RPC_BINDING_STATUSES.DISABLED);
  if (result.status === DESKTOP_RPC_BINDING_STATUSES.DISABLED) {
    assertEquals(result.reason, DESKTOP_RPC_DISABLED_REASONS.MISSING_WINDOW);
  }
  await result.close();
  await result.close();
});

Deno.test('Desktop binding rejects an empty custom binding name before registration', () => {
  const window = new TestDesktopWindow();
  assertThrows(
    () =>
      bindDesktopRpcWindow({
        window,
        router: noopRouter,
        context: {},
        runtime: DESKTOP_RUNTIME,
        bindingName: '   ',
      }),
    TypeError,
    'Desktop binding name must not be empty',
  );
  assertEquals(window.bindCalls, 0);
});

Deno.test('Fresh binding round-trips typed strings and Uint8Array then closes once', async () => {
  const window = new TestDesktopWindow();
  const router = os.router({
    echo: os.handler(({ input }) => ({ value: String(input) })),
    bytes: os.handler(() => new Uint8Array([8, 4, 2, 1])),
  });
  const binding = bindDesktopRpcWindow({
    window,
    router,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });
  const client = createDesktopServiceClient({
    contract: router,
    invoke: window.invoke.bind(window),
  });

  assertEquals(binding.status, DESKTOP_RPC_BINDING_STATUSES.BOUND);
  assertEquals(await client.echo('fresh'), { value: 'fresh' });
  assertEquals(await client.bytes(undefined), new Uint8Array([8, 4, 2, 1]));

  await Promise.all([binding.close(), binding.close()]);
  assertEquals(window.bindCalls, 1);
  assertEquals(window.unbindCalls, 1);
});

Deno.test('two Fresh Desktop windows keep same-named RPC bindings isolated', async () => {
  const windowA = new TestDesktopWindow();
  const windowB = new TestDesktopWindow();
  const routerA = os.router({ identify: os.handler(() => 'window-a') });
  const routerB = os.router({ identify: os.handler(() => 'window-b') });
  const bindingA = bindDesktopRpcWindow({
    window: windowA,
    router: routerA,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });
  const bindingB = bindDesktopRpcWindow({
    window: windowB,
    router: routerB,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });
  const clientA = createDesktopServiceClient({
    contract: routerA,
    invoke: windowA.invoke.bind(windowA),
  });
  const clientB = createDesktopServiceClient({
    contract: routerB,
    invoke: windowB.invoke.bind(windowB),
  });

  assertEquals(await Promise.all([clientA.identify(undefined), clientB.identify(undefined)]), [
    'window-a',
    'window-b',
  ]);
  await Promise.all([bindingA.close(), bindingB.close()]);
  assertEquals(windowA.unbindCalls, 1);
  assertEquals(windowB.unbindCalls, 1);
});

Deno.test('procedure failures cross the Fresh binding as typed oRPC errors', async () => {
  const window = new TestDesktopWindow();
  const router = os.router({
    fail: os.handler(() => {
      throw new ORPCError('BAD_REQUEST', { message: 'desktop procedure failed' });
    }),
  });
  const binding = bindDesktopRpcWindow({
    window,
    router,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });
  const client = createDesktopServiceClient({
    contract: router,
    invoke: window.invoke.bind(window),
  });

  const error = await assertRejects(() => client.fail(undefined));
  assertInstanceOf(error, Error);
  assertInstanceOf(error, ORPCError);
  assertEquals(error.message, 'desktop procedure failed');
  assertEquals(error.name, 'Error');
  assertEquals(typeof error.stack, 'string');
  await binding.close();
});

Deno.test('new document closes pending receive and rebinds typed RPC without admitting stale calls', async () => {
  const window = new TestDesktopWindow();
  const otherWindow = new TestDesktopWindow();
  const binding = bindDesktopRpcWindow({
    window,
    router: noopRouter,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });
  const other = bindDesktopRpcWindow({
    window: otherWindow,
    router: noopRouter,
    context: {},
    runtime: DESKTOP_RUNTIME,
  });
  const pending = Promise.withResolvers<void>();
  const retired = Promise.withResolvers<unknown>();
  let receives = 0;
  const old = createDesktopServiceClient({
    contract: noopRouter,
    invoke: async (op, payload) => {
      const result = window.invoke(op, payload, 100);
      if (op === 'receive' && ++receives === 2) {
        pending.resolve();
        result.then(retired.resolve, retired.reject);
      }
      return await result;
    },
  });
  const isolated = createDesktopServiceClient({
    contract: noopRouter,
    invoke: (op, payload) => otherWindow.invoke(op, payload, 100),
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Document reconnect timed out')), 2000);
  });
  const retainedHandler = window.handler;
  try {
    await Promise.race([
      (async () => {
        assertEquals(await old.ping(undefined), 'pong');
        await pending.promise;
        const current = createDesktopServiceClient({
          contract: noopRouter,
          invoke: (op, payload) => window.invoke(op, payload, 200),
        });

        assertEquals(await current.ping(undefined), 'pong');
        assertEquals(await retired.promise, { status: 'closed' });
        for (const op of ['send', 'receive', 'close']) {
          assertEquals(await retainedHandler?.(op, 'stale', 100), { status: 'closed' });
        }
        for (const epoch of [-1, 0, NaN, Infinity, 'epoch', null]) {
          await assertRejects(() => window.invoke('close', undefined, epoch), TypeError);
        }
        assertEquals(await current.ping(undefined), 'pong');
        assertEquals(await isolated.ping(undefined), 'pong');
        await Promise.all([binding.close(), binding.close()]);
        assertEquals(await retainedHandler?.('receive', undefined, 300), { status: 'closed' });
        assertEquals(window.bindCalls, 1);
        assertEquals(window.unbindCalls, 1);
        // The same shared cleanup promise includes synchronous unbind failures.
        otherWindow.unbind = () => {
          otherWindow.unbindCalls++;
          throw new Error('unbind failed');
        };
        const firstClose = other.close();
        assertEquals(other.close(), firstClose);
        await assertRejects(() => firstClose, Error, 'unbind failed');
        await assertRejects(() => other.close(), Error, 'unbind failed');
        assertEquals(otherWindow.unbindCalls, 1);
      })(),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
    await binding.close();
    await other.close().catch(() => undefined);
  }
});
