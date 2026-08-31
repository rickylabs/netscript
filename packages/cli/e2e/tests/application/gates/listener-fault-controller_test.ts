import { assertEquals, assertRejects } from '@std/assert';

import {
  GARNET_TEST_LISTENER_PORT,
  ListenerFaultController,
  type ListenerFaultState,
  POSTGRES_TEST_LISTENER_PORT,
} from '../../../src/application/gates/scaffold/runtime/listener-fault-controller.ts';

Deno.test('listener fault controller closes and reopens real loopback TCP and RESP listeners', async () => {
  const controller = new ListenerFaultController({
    hostname: 'localhost',
    postgresPort: 0,
    garnetPort: 0,
  });
  try {
    await controller.applyState(state(1, true, true));
    await assertTcpConnects(controller.postgresAddress().port);
    assertEquals(await respPing(controller.garnetAddress().port), '+PONG\r\n');

    await controller.applyState(state(2, false, false));
    await assertConnectRefused(controller.postgresAddress().port);
    await assertConnectRefused(controller.garnetAddress().port);

    await controller.applyState(state(3, true, true));
    await assertTcpConnects(controller.postgresAddress().port);
    assertEquals(await respPing(controller.garnetAddress().port), '+PONG\r\n');
  } finally {
    await controller.close();
  }
});

Deno.test('listener fault controller state application is revision-idempotent', async () => {
  const controller = new ListenerFaultController({
    hostname: 'localhost',
    postgresPort: 0,
    garnetPort: 0,
  });
  try {
    assertEquals(await controller.applyState(state(4, true, false)), state(4, true, false));
    assertEquals(await controller.applyState(state(4, false, true)), state(4, true, false));
    assertEquals(await controller.applyState(state(3, false, true)), state(4, true, false));
  } finally {
    await controller.close();
  }
});

Deno.test('listener fault controller reaps disconnected bare-TCP health clients', async () => {
  const controller = new ListenerFaultController({
    hostname: 'localhost',
    postgresPort: 0,
    garnetPort: 0,
  });
  const clients: Deno.TcpConn[] = [];
  try {
    await controller.applyState(state(1, true, false));
    for (let index = 0; index < 8; index += 1) {
      clients.push(
        await Deno.connect({
          hostname: 'localhost',
          port: controller.postgresAddress().port,
        }),
      );
    }
    await pollUntil(() => controller.postgresConnectionCount() === clients.length);
    for (const client of clients.splice(0)) client.close();
    await pollUntil(() => controller.postgresConnectionCount() === 0);
  } finally {
    for (const client of clients) client.close();
    await controller.close();
  }
});

Deno.test('listener fault controller keeps the ratified E2E reserved ports', () => {
  assertEquals(POSTGRES_TEST_LISTENER_PORT, 18_998);
  assertEquals(GARNET_TEST_LISTENER_PORT, 18_999);
});

function state(
  revision: number,
  postgresOpen: boolean,
  garnetOpen: boolean,
): ListenerFaultState {
  return { revision, postgresOpen, garnetOpen };
}

async function assertTcpConnects(port: number): Promise<void> {
  const connection = await Deno.connect({
    hostname: 'localhost',
    port,
  });
  connection.close();
}

async function respPing(port: number): Promise<string> {
  const connection = await Deno.connect({
    hostname: 'localhost',
    port,
  });
  try {
    await connection.write(new TextEncoder().encode('PING\r\n'));
    const buffer = new Uint8Array(64);
    const read = await connection.read(buffer);
    return new TextDecoder().decode(buffer.subarray(0, read ?? 0));
  } finally {
    connection.close();
  }
}

async function assertConnectRefused(port: number): Promise<void> {
  await assertRejects(() => Deno.connect({ hostname: 'localhost', port }));
}

async function pollUntil(accepts: () => boolean): Promise<void> {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    if (accepts()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('controller connection state missed its 2s test deadline');
}
