/**
 * @module templates/aspire/helpers/aspire-compat-health-checks_test
 *
 * Executes the generated compatibility helper against real local Node sockets.
 */

import { assertEquals, assertMatch } from 'jsr:@std/assert@^1';
import { afterAll, describe, it } from 'jsr:@std/testing@^1/bdd';
import { createServer, type Server, type Socket } from 'node:net';
import { fromFileUrl, resolve, toFileUrl } from 'jsr:@std/path@^1';

const compatContent = await Deno.readTextFile(
  new URL('../../../../assets/aspire/helpers/_aspire-compat.ts.template', import.meta.url),
);

await Deno.mkdir('packages/cli/.tmp', { recursive: true });
const generatedRoot = resolve(
  await Deno.makeTempDir({
    dir: 'packages/cli/.tmp',
    prefix: 'netscript-aspire-health-',
  }),
);
const helpersDir = `${generatedRoot}/.helpers`;
const modulesDir = `${generatedRoot}/.aspire/modules`;
await Deno.mkdir(helpersDir, { recursive: true });
await Deno.mkdir(modulesDir, { recursive: true });
await Deno.writeTextFile(
  `${modulesDir}/aspire.mts`,
  `export const HealthStatus = {
  Healthy: 'Healthy',
  Degraded: 'Degraded',
  Unhealthy: 'Unhealthy',
};
export type HealthCheckResult = {
  readonly status?: string;
  readonly description?: string;
  readonly data?: Readonly<Record<string, unknown>>;
};
`,
);
const compatPath = `${helpersDir}/_aspire-compat.mts`;
await Deno.writeTextFile(compatPath, compatContent);
const compatModule = await import(`${toFileUrl(compatPath).href}?test=${crypto.randomUUID()}`);

afterAll(async () => {
  await Deno.remove(generatedRoot, { recursive: true });
});

describe('generated Aspire listener readiness helpers', () => {
  it('reports a local TCP listener as Healthy', async () => {
    const server = await startServer();
    try {
      const result = await compatModule.createListenerReadinessCheck({
        kind: 'postgres',
        host: '127.0.0.1',
        port: serverPort(server),
      })();

      assertEquals(result, {
        status: 'Healthy',
        description: `postgres listener ready on 127.0.0.1:${serverPort(server)}`,
      });
    } finally {
      await closeServer(server);
    }
  });

  it('reports a closed local TCP port as Unhealthy with ECONNREFUSED', async () => {
    const server = await startServer();
    const port = serverPort(server);
    await closeServer(server);

    const result = await compatModule.createListenerReadinessCheck({
      kind: 'postgres',
      host: '127.0.0.1',
      port,
    })();

    assertEquals(result.status, 'Unhealthy');
    assertEquals(result.description, 'postgres listener unreachable: ECONNREFUSED');
    assertEquals(result.data.code, 'ECONNREFUSED');
    assertEquals(result.data.host, '127.0.0.1');
    assertEquals(result.data.port, port);
    assertMatch(String(result.data.elapsedMs), /^\d+$/);
  });

  it('bounds a black-hole TCP address at 2000 ms with ETIMEDOUT', async () => {
    const startedAt = performance.now();
    const result = await compatModule.createListenerReadinessCheck({
      kind: 'postgres',
      host: '192.0.2.1',
      port: 65_000,
    })();
    const elapsedMs = performance.now() - startedAt;

    assertEquals(result.status, 'Unhealthy');
    assertEquals(result.description, 'postgres listener unreachable: ETIMEDOUT');
    assertEquals(result.data.code, 'ETIMEDOUT');
    assertEquals(result.data.host, '192.0.2.1');
    assertEquals(result.data.port, 65_000);
    assertMatch(String(result.data.elapsedMs), /^\d+$/);
    assertEquals(elapsedMs >= 1_900 && elapsedMs < 3_500, true);
  });

  for (
    const fixture of [
      { reply: '+PONG\r\n', status: 'Healthy', code: undefined },
      { reply: '-NOAUTH Authentication required.\r\n', status: 'Degraded', code: 'NOAUTH' },
      { reply: 'garbage\r\n', status: 'Unhealthy', code: 'EPROTO' },
    ]
  ) {
    it(`maps RESP ${fixture.reply.trim()} to ${fixture.status}`, async () => {
      const server = await startServer((socket) => {
        socket.once('data', () => socket.end(fixture.reply));
      });
      const port = serverPort(server);
      try {
        const result = await compatModule.createRespPingCheck({
          host: '127.0.0.1',
          port,
        })();

        assertEquals(result.status, fixture.status);
        if (fixture.code === undefined) {
          assertEquals(result, {
            status: 'Healthy',
            description: `RESP listener ready on 127.0.0.1:${port}`,
          });
        } else {
          assertEquals(result.data.code, fixture.code);
          assertEquals(result.data.host, '127.0.0.1');
          assertEquals(result.data.port, port);
          assertMatch(String(result.data.elapsedMs), /^\d+$/);
        }
      } finally {
        await closeServer(server);
      }
    });
  }
});

async function startServer(
  connectionListener?: (socket: Socket) => void,
): Promise<Server> {
  const server = createServer(connectionListener);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

function serverPort(server: Server): number {
  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    throw new Error('test server did not expose a TCP address');
  }
  return address.port;
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

// Keep Deno's file-URL handling exercised explicitly; generated modules are loaded from disk,
// not evaluated from a source string that could bypass their relative import contract.
assertEquals(fromFileUrl(toFileUrl(compatPath)), compatPath);
