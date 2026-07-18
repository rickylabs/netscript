import { assertEquals } from '@std/assert';
import { onError, os } from '@orpc/server';
import { RPCHandler } from '@orpc/server/message-port';
import { createDesktopBindServerPort } from '../../src/desktop/adapters/bind-channel.ts';
import { DESKTOP_RPC_JSON_SERIALIZERS } from '../../src/desktop/adapters/orpc-serialization.ts';
import { createDesktopServiceClient } from '../../src/desktop/application/desktop-rpc-client.ts';

const desktopRouter = os.router({
  echo: os.handler(() => ({ echoed: 'desktop' })),
  bytes: os.handler(() => new Uint8Array([3, 1, 4, 1, 5])),
});

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
