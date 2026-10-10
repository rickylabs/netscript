import { assert, assertEquals, assertRejects } from '@std/assert';
import { createORPCClient } from '@orpc/client';
import { os } from '@orpc/server';
import { createService } from '../../../service/mod.ts';
import { createHttpClientLink } from '../../src/client/http-client-link.ts';
import { createServiceClient } from '../../src/client/service-client.ts';
import { createServerServiceEnvKey } from '../../src/discovery/service-url.ts';
import { resolveTransportPolicy } from '../../src/internal/transport-policy.ts';
import type { ServiceUrlResolver } from '../../src/ports/service-client.ts';

const SERVICE_NAME = 'sdk-resolver';
const RPC_PATH = `/api/rpc/v1/${SERVICE_NAME}`;
const sdkConfig = new URL('../../deno.json', import.meta.url);
const childClient = new URL('./fixtures/no-deno-runtime-client.ts', import.meta.url);

interface EchoOutput {
  readonly echoed: string;
}

interface ChildResult {
  readonly denoGlobal: string;
  readonly echoed?: string;
  readonly error?: string;
  readonly resolverCalls: readonly (readonly [string, string])[];
}

function createRouter() {
  return {
    echo: os.route({ method: 'POST', path: '/echo' }).handler(
      ({ input }: { input: unknown }): EchoOutput => ({
        echoed: (input as { readonly message: string }).message,
      }),
    ),
  };
}

function clientOrigin(hostname: string, port: number): string {
  return `http://${hostname === '0.0.0.0' ? '127.0.0.1' : hostname}:${port}`;
}

async function withStubService<T>(run: (origin: string) => Promise<T>): Promise<T> {
  const running = await createService(createRouter(), { name: SERVICE_NAME })
    .withRPC({ rpcPath: RPC_PATH })
    .serve({ port: 0 });
  try {
    return await run(clientOrigin(running.addr.hostname, running.addr.port));
  } finally {
    await running.stop();
  }
}

async function withServerEnv<T>(value: string | undefined, run: () => Promise<T>): Promise<T> {
  const envKey = createServerServiceEnvKey(SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  if (value === undefined) Deno.env.delete(envKey);
  else Deno.env.set(envKey, value);
  try {
    return await run();
  } finally {
    if (previous === undefined) Deno.env.delete(envKey);
    else Deno.env.set(envKey, previous);
  }
}

async function runWithoutDeno(origin: string, mode: 'resolver' | 'default'): Promise<ChildResult> {
  const child = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--config',
      sdkConfig.pathname,
      '--allow-net',
      '--allow-read',
      childClient.pathname,
      origin,
      SERVICE_NAME,
      mode,
    ],
    env: { NO_COLOR: '1' },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(child.stdout).trim();
  if (!child.success) {
    const stderr = new TextDecoder().decode(child.stderr);
    throw new Error(`no-Deno child failed (exit ${child.code}):\n${stderr}`);
  }
  return JSON.parse(stdout.split('\n').at(-1) ?? '{}') as ChildResult;
}

Deno.test('createServiceClient resolves through resolveServiceUrl on a runtime without Deno or Vite env', async () => {
  const result = await withStubService((origin) => runWithoutDeno(origin, 'resolver'));

  assertEquals(result.denoGlobal, 'undefined');
  assertEquals(result.error, undefined);
  assertEquals(result.echoed, 'from-a-runtime-without-deno');
  assertEquals(result.resolverCalls, [[SERVICE_NAME, 'http']]);
});

Deno.test('the default discovery path still reports the missing browser key without Deno or Vite env', async () => {
  const result = await withStubService((origin) => runWithoutDeno(origin, 'default'));

  assertEquals(result.denoGlobal, 'undefined');
  assertEquals(result.echoed, undefined);
  assertEquals(
    result.error,
    `Service URL not found for "${SERVICE_NAME}" in the browser. ` +
      `Expected import.meta.env.VITE_services__sdk_resolver__http__0 or ` +
      `import.meta.env.VITE_SDK_RESOLVER_URL ` +
      `(injected by Aspire via WithConfiguredViteHttpReferences).`,
  );
});

Deno.test('resolveServiceUrl replaces discovery and keeps only the resolved origin', async () => {
  const requested: string[] = [];
  const calls: (readonly [string, string])[] = [];
  const resolveServiceUrl: ServiceUrlResolver = (serviceName, protocol) => {
    calls.push([serviceName, protocol]);
    return new URL('https://resolved.example:8443/ignored/path?q=1');
  };
  const router = createRouter();
  const link = createHttpClientLink({
    transportPolicy: resolveTransportPolicy(router),
    serviceName: SERVICE_NAME,
    rpcPath: RPC_PATH,
    protocol: 'https',
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    resolveServiceUrl,
    fetch: (request) => {
      requested.push(typeof request === 'string' ? request : (request as Request).url);
      return Promise.resolve(Response.json({ json: { echoed: 'stubbed' } }));
    },
  });
  const client: { echo: (input: { message: string }) => Promise<EchoOutput> } = createORPCClient(
    link,
  );

  await withServerEnv('http://discovery-must-not-be-read.invalid', async () => {
    const response = await client.echo({ message: 'hi' });
    assertEquals(response.echoed, 'stubbed');
  });

  assertEquals(calls, [[SERVICE_NAME, 'https']]);
  assertEquals(requested.length, 1);
  assert(
    requested[0].startsWith(`https://resolved.example:8443${RPC_PATH}/echo`),
    requested[0],
  );
});

Deno.test('a throwing resolveServiceUrl rejects the call with its own error', async () => {
  const client = createServiceClient({
    contract: createRouter(),
    serviceName: SERVICE_NAME,
    propagateTraceContext: false,
    resolveServiceUrl: (serviceName) => {
      throw new Error(`no origin configured for ${serviceName}`);
    },
  });

  await assertRejects(
    () => client.echo({ message: 'x' }),
    Error,
    `no origin configured for ${SERVICE_NAME}`,
  );
});

Deno.test('createServiceClient without resolveServiceUrl still resolves through Aspire discovery', async () => {
  await withStubService(async (origin) => {
    await withServerEnv(origin, async () => {
      const client = createServiceClient({ contract: createRouter(), serviceName: SERVICE_NAME });
      assertEquals((await client.echo({ message: 'discovered' })).echoed, 'discovered');
    });
    await withServerEnv(undefined, async () => {
      const client = createServiceClient({ contract: createRouter(), serviceName: SERVICE_NAME });
      await assertRejects(
        () => client.echo({ message: 'missing' }),
        Error,
        `Expected environment variable: ${createServerServiceEnvKey(SERVICE_NAME)}`,
      );
    });
  });
});
