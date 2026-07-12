import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { os } from '@orpc/server';
import { createService } from '../../../service/mod.ts';
import { createServiceClient } from '../../src/client/service-client.ts';
import { createHttpClientLink } from '../../src/client/http-client-link.ts';
import { createServerServiceEnvKey } from '../../src/discovery/service-url.ts';

const SERVICE_NAME = 'sdk-live';
const BAD_SERVICE_NAME = 'sdk-missing';
const RPC_PATH = `/api/rpc/v1/${SERVICE_NAME}`;

interface EchoInput {
  readonly message: string;
}

interface EchoOutput {
  readonly echoed: string;
}

function clientOrigin(hostname: string, port: number): string {
  const host = hostname === '0.0.0.0' ? '127.0.0.1' : hostname;
  return `http://${host}:${port}`;
}

function createRuntimeRouter() {
  return {
    echo: os.route({ method: 'POST', path: '/echo' }).handler(({ input }: { input: unknown }) => {
      const payload = input as EchoInput;
      return { echoed: payload.message } satisfies EchoOutput;
    }),
    slow: os.route({ method: 'POST', path: '/slow' }).handler(
      async ({ input }: { input: unknown }) => {
        const payload = input as EchoInput;
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { echoed: payload.message } satisfies EchoOutput;
      },
    ),
  };
}

function createLink(contract: Parameters<typeof createHttpClientLink>[0]['contract']) {
  return createHttpClientLink({
    apiPath: '/api/rpc',
    apiVersion: 'v1',
    contract,
    getTraceHeaders: () => ({}),
    pathSegment: SERVICE_NAME,
    propagateTraceContext: false,
    protocol: 'http',
    serviceName: SERVICE_NAME,
  });
}

Deno.test('createHttpClientLink accepts real oRPC routers and rejects structural impostors', () => {
  assert(createLink(createRuntimeRouter()));

  assertThrows(
    () => createLink({ '~orpc': {} }),
    TypeError,
    'Service client contracts must contain oRPC contract procedures',
  );
});

Deno.test('createServiceClient round-trips through live service discovery', async () => {
  const router = createRuntimeRouter();
  const running = await createService(router, { name: SERVICE_NAME })
    .withRPC({ rpcPath: RPC_PATH })
    .serve({ port: 0 });
  const envKey = createServerServiceEnvKey(SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  Deno.env.set(envKey, clientOrigin(running.addr.hostname, running.addr.port));

  try {
    const client = createServiceClient({
      contract: router,
      serviceName: SERVICE_NAME,
    });

    const response = await client.echo({ message: 'hello' });
    assertEquals(response.echoed, 'hello');
  } finally {
    if (previous === undefined) {
      Deno.env.delete(envKey);
    } else {
      Deno.env.set(envKey, previous);
    }
    await running.stop();
  }
});

Deno.test('createServiceClient rejects connection failures for bad service URLs', async () => {
  const envKey = createServerServiceEnvKey(BAD_SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  Deno.env.set(envKey, 'http://127.0.0.1:9');

  try {
    const client = createServiceClient({
      contract: createRuntimeRouter(),
      serviceName: BAD_SERVICE_NAME,
    });

    await assertRejects(
      () => client.echo({ message: 'missing' }, { context: { signal: AbortSignal.timeout(250) } }),
      Error,
    );
  } finally {
    if (previous === undefined) {
      Deno.env.delete(envKey);
    } else {
      Deno.env.set(envKey, previous);
    }
  }
});

Deno.test('createServiceClient reports retry exhaustion callbacks', async () => {
  const envKey = createServerServiceEnvKey(BAD_SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  Deno.env.set(envKey, 'http://127.0.0.1:9');
  let retryAttempts = 0;

  try {
    const client = createServiceClient({
      contract: createRuntimeRouter(),
      serviceName: BAD_SERVICE_NAME,
    });

    await assertRejects(
      () =>
        client.echo(
          { message: 'retry' },
          {
            context: {
              retry: 2,
              retryDelay: 0,
              signal: AbortSignal.timeout(750),
              onRetry: () => {
                retryAttempts += 1;
              },
            },
          },
        ),
      Error,
    );

    assertEquals(retryAttempts, 2);
  } finally {
    if (previous === undefined) {
      Deno.env.delete(envKey);
    } else {
      Deno.env.set(envKey, previous);
    }
  }
});

Deno.test('createServiceClient propagates cancellation to fetch', async () => {
  const router = createRuntimeRouter();
  const running = await createService(router, { name: SERVICE_NAME })
    .withRPC({ rpcPath: RPC_PATH })
    .serve({ port: 0 });
  const envKey = createServerServiceEnvKey(SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  const controller = new AbortController();
  Deno.env.set(envKey, clientOrigin(running.addr.hostname, running.addr.port));

  try {
    const client = createServiceClient({
      contract: router,
      serviceName: SERVICE_NAME,
    });
    const pending = client.slow({ message: 'cancel' }, { context: { signal: controller.signal } });

    controller.abort();

    await assertRejects(() => pending, Error);
    assert(controller.signal.aborted);
  } finally {
    if (previous === undefined) {
      Deno.env.delete(envKey);
    } else {
      Deno.env.set(envKey, previous);
    }
    await running.stop();
  }
});
