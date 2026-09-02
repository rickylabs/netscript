import { assert, assertEquals, assertFalse, assertRejects } from '@std/assert';
import { onError, os } from '@orpc/server';
import { RPCHandler } from '@orpc/server/message-port';
import { createDesktopBindServerPort } from '../../src/desktop/adapters/bind-channel.ts';
import { DESKTOP_RPC_JSON_SERIALIZERS } from '../../src/desktop/adapters/orpc-serialization.ts';
import { createDesktopServiceClient } from '../../src/desktop/application/desktop-rpc-client.ts';
import { DESKTOP_BIND_OPERATIONS } from '../../src/desktop/domain/constants.ts';
import type { DesktopBindingInvoke, DesktopRpcFrame } from '../../src/desktop/domain/types.ts';

const desktopRouter = os.router({
  echo: os.handler(() => ({ echoed: 'desktop' })),
  bytes: os.handler(() => new Uint8Array([3, 1, 4, 1, 5])),
});

function observedInvoke(
  handler: DesktopBindingInvoke,
  sentFrames: DesktopRpcFrame[],
): DesktopBindingInvoke {
  return async (operation, payload) => {
    if (operation === DESKTOP_BIND_OPERATIONS.SEND && payload !== undefined) {
      sentFrames.push(payload);
    }
    return await handler(operation, payload);
  };
}

function frameText(frame: DesktopRpcFrame): string {
  return typeof frame === 'string' ? frame : new TextDecoder().decode(frame);
}

Deno.test('typed Desktop client round-trips string and Uint8Array through oRPC', async () => {
  const server = createDesktopBindServerPort();
  let serverError: unknown;
  const handler = new RPCHandler(desktopRouter, {
    customJsonSerializers: DESKTOP_RPC_JSON_SERIALIZERS,
    interceptors: [onError((error): void => {
      serverError = error;
    })],
  });
  handler.upgrade(server.port, { context: {} });
  const client = createDesktopServiceClient({
    contract: desktopRouter,
    invoke: server.handler,
  });

  try {
    const echoed = await client.echo(undefined).catch((error: unknown) => {
      if (serverError instanceof Error) {
        throw serverError;
      }
      throw error;
    });
    assertEquals(echoed, { echoed: 'desktop' });

    const bytes = new Uint8Array([3, 1, 4, 1, 5]);
    assertEquals(await client.bytes(undefined), bytes);
  } finally {
    server.close();
  }
});

Deno.test('typed Desktop client resolves POST-only policy without serializing the method', async () => {
  const server = createDesktopBindServerPort();
  const sentFrames: DesktopRpcFrame[] = [];
  const inferredMethods: string[] = [];
  const router = os.router({
    echo: os.route({ method: 'GET', path: '/echo' }).handler(
      ({ input }: { input: unknown }) => input,
    ),
  });
  const handler = new RPCHandler(router, {
    customJsonSerializers: DESKTOP_RPC_JSON_SERIALIZERS,
  });
  handler.upgrade(server.port, { context: {} });
  const client = createDesktopServiceClient({
    contract: router,
    invoke: observedInvoke(server.handler, sentFrames),
    transportPolicy: {
      method: (options) => {
        inferredMethods.push(options.inferredMethod);
        return 'POST';
      },
    },
  });

  try {
    assertEquals(await client.echo({ value: 'desktop-policy' }), {
      value: 'desktop-policy',
    });
    assertEquals(inferredMethods, ['GET']);
    assertFalse(sentFrames.some((frame) => frameText(frame).includes('POST')));
  } finally {
    server.close();
  }
});

Deno.test('invalid Desktop override result fails before any send frame', async () => {
  const server = createDesktopBindServerPort();
  const sentFrames: DesktopRpcFrame[] = [];
  const client = createDesktopServiceClient({
    contract: desktopRouter,
    invoke: observedInvoke(server.handler, sentFrames),
    transportPolicy: {
      method: () => 'HEAD' as never,
    },
  });

  try {
    const error = await assertRejects(() => client.echo(undefined));
    assert(error instanceof Error);
    assertEquals(error.name, 'TypeError');
    assertEquals(
      error.message,
      'SDK transportPolicy.method returned an invalid HTTP method: HEAD',
    );
    assertEquals(sentFrames, []);
  } finally {
    server.close();
  }
});
