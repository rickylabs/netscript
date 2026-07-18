import { assertEquals, assertInstanceOf, assertRejects, assertThrows } from '@std/assert';
import { ORPCError, os } from '@orpc/server';
import { createDesktopServiceClient } from '@netscript/sdk/desktop';
import type { DESKTOP_BIND_OPERATIONS, DesktopBindingHandler } from '@netscript/sdk/desktop';
import { bindDesktopRpcWindow } from './bind-desktop-rpc-window.ts';
import { DESKTOP_RPC_BINDING_STATUSES, DESKTOP_RPC_DISABLED_REASONS } from './constants.ts';
import type { DesktopBindableWindow } from './types.ts';

const DESKTOP_RUNTIME = { BrowserWindow: class BrowserWindow {} };

class TestDesktopWindow implements DesktopBindableWindow {
  handler: DesktopBindingHandler | undefined;
  bindCalls = 0;
  unbindCalls = 0;
  bindingName: string | undefined;

  bind(name: string, handler: DesktopBindingHandler): void {
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
  ): Promise<unknown> {
    if (this.handler === undefined) {
      throw new Error('Desktop binding is not registered');
    }
    return await this.handler(operation, payload);
  }
}

const noopRouter = os.router({
  ping: os.handler(() => 'pong'),
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
