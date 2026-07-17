import { assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import type { SupportedMessagePort } from '@orpc/client/message-port';
import {
  createDesktopBindClientPort,
  createDesktopBindServerPort,
  DesktopBindingProtocolError,
} from '../../src/desktop/adapters/bind-channel.ts';
import {
  DESKTOP_BIND_OPERATIONS,
  DESKTOP_PORT_CLOSE_REASONS,
} from '../../src/desktop/domain/constants.ts';
import type { DesktopBindingInvoke, DesktopRpcFrame } from '../../src/desktop/domain/types.ts';

function nextMessage(port: MessagePort): Promise<unknown> {
  const message = Promise.withResolvers<unknown>();
  port.addEventListener('message', (event): void => {
    message.resolve(event.data);
  }, { once: true });
  return message.promise;
}

function echoFrames(port: MessagePort, prefix = ''): void {
  port.addEventListener('message', (event): void => {
    if (event.data instanceof Uint8Array) {
      port.postMessage(event.data);
      return;
    }
    port.postMessage(`${prefix}${String(event.data)}`);
  });
}

Deno.test('bind ports are real MessagePorts accepted structurally by oRPC without casts', async () => {
  const server = createDesktopBindServerPort();
  const client = createDesktopBindClientPort({ invoke: server.handler });
  const supported: SupportedMessagePort = client.port;
  echoFrames(server.port);

  try {
    const response = nextMessage(client.port);
    client.port.postMessage('hello');
    assertEquals(await response, 'hello');
    assertInstanceOf(supported, MessagePort);
  } finally {
    server.close();
    await client.closed;
  }
});

Deno.test('bind channel carries Uint8Array as a top-level native payload', async () => {
  const server = createDesktopBindServerPort();
  let observedPayload: unknown;
  const invoke: DesktopBindingInvoke = async (operation, payload): Promise<unknown> => {
    if (operation === DESKTOP_BIND_OPERATIONS.SEND) {
      observedPayload = payload;
    }
    return await server.handler(operation, payload);
  };
  const client = createDesktopBindClientPort({ invoke });
  echoFrames(server.port);

  try {
    const bytes = new Uint8Array([0, 1, 2, 127, 255]);
    const response = nextMessage(client.port);
    client.port.postMessage(bytes);
    assertEquals(await response, bytes);
    assertInstanceOf(observedPayload, Uint8Array);
    assertEquals(observedPayload, bytes);
  } finally {
    server.close();
    await client.closed;
  }
});

Deno.test('two windows using the same protocol remain isolated', async () => {
  const serverA = createDesktopBindServerPort();
  const serverB = createDesktopBindServerPort();
  const clientA = createDesktopBindClientPort({ invoke: serverA.handler });
  const clientB = createDesktopBindClientPort({ invoke: serverB.handler });
  echoFrames(serverA.port, 'window-a:');
  echoFrames(serverB.port, 'window-b:');

  try {
    const responseA = nextMessage(clientA.port);
    const responseB = nextMessage(clientB.port);
    clientA.port.postMessage('one');
    clientB.port.postMessage('two');
    assertEquals(await Promise.all([responseA, responseB]), [
      'window-a:one',
      'window-b:two',
    ]);
  } finally {
    serverA.close();
    serverB.close();
    await Promise.all([clientA.closed, clientB.closed]);
  }
});

Deno.test('server permits only one pending receive and closes it exactly once', async () => {
  const server = createDesktopBindServerPort();
  const client = createDesktopBindClientPort({ invoke: server.handler });
  let closeEvents = 0;
  client.port.addEventListener('close', (): void => {
    closeEvents += 1;
  });

  await assertRejects(
    () => server.handler(DESKTOP_BIND_OPERATIONS.RECEIVE),
    DesktopBindingProtocolError,
    'already pending',
  );
  server.close();
  server.close();
  assertEquals(await client.closed, { reason: DESKTOP_PORT_CLOSE_REASONS.CLOSED });
  await client.close();
  assertEquals(closeEvents, 1);
});

Deno.test('client rehydrates native binding errors with name message and stack', async () => {
  const nativeError = {
    name: 'NotFound',
    message: 'desktop resource is missing',
    stack: 'NotFound: desktop resource is missing\n    at native-binding',
  };
  const invoke: DesktopBindingInvoke = async (): Promise<unknown> => {
    return await Promise.reject(nativeError);
  };
  const client = createDesktopBindClientPort({ invoke });
  const closed = await client.closed;

  assertEquals(closed.reason, DESKTOP_PORT_CLOSE_REASONS.TRANSPORT_ERROR);
  if (closed.reason === DESKTOP_PORT_CLOSE_REASONS.TRANSPORT_ERROR) {
    assertInstanceOf(closed.error, Error);
    assertEquals(closed.error.name, nativeError.name);
    assertEquals(closed.error.message, nativeError.message);
    assertEquals(closed.error.stack, nativeError.stack);
  }
});

Deno.test('server rejects invalid operations and non-binary frames', async () => {
  const server = createDesktopBindServerPort();
  try {
    await assertRejects(
      () => server.handler('unknown'),
      DesktopBindingProtocolError,
      'Unknown Desktop bind operation',
    );
    await assertRejects(
      () => server.handler(DESKTOP_BIND_OPERATIONS.SEND, { invalid: true }),
      DesktopBindingProtocolError,
      'string or Uint8Array',
    );
  } finally {
    server.close();
  }
});

Deno.test('queued runtime frames preserve FIFO order', async () => {
  const server = createDesktopBindServerPort();
  try {
    server.port.postMessage('first' satisfies DesktopRpcFrame);
    server.port.postMessage('second' satisfies DesktopRpcFrame);
    assertEquals(await server.handler(DESKTOP_BIND_OPERATIONS.RECEIVE), 'first');
    assertEquals(await server.handler(DESKTOP_BIND_OPERATIONS.RECEIVE), 'second');
  } finally {
    server.close();
  }
});
