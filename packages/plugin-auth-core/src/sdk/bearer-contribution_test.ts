import { assert, assertEquals, assertFalse, assertRejects } from '@std/assert';
import { oc } from '@orpc/contract';
import { z } from 'zod';
import type { NetScriptProcedureMeta } from '@netscript/contracts';
import { createServiceClient, type SdkClientPrepareOptions } from '@netscript/sdk/client';
import { createBearerSdkClientContribution } from './bearer-contribution.ts';

interface AuthClientContext {
  readonly auth: {
    readonly getAccessToken: () => string | undefined | PromiseLike<string | undefined>;
  };
  readonly cachePartition: string;
}

type Equal<TLeft, TRight> = (<T>() => T extends TLeft ? 1 : 2) extends
  (<T>() => T extends TRight ? 1 : 2) ? true
  : false;
type Expect<T extends true> = T;

const requiredProcedure = {
  path: ['session'],
  meta: { access: { authentication: 'required' } },
} as const;

function prepareOptions(
  context: AuthClientContext,
  authentication: 'none' | 'optional' | 'required' | undefined,
  origin = new URL('https://auth.example.test'),
): SdkClientPrepareOptions<AuthClientContext> {
  return {
    context,
    procedure: {
      path: ['session'],
      meta: authentication === undefined ? {} : { access: { authentication } },
    },
    transport: {
      kind: 'http',
      origin,
      rpcPath: '/api/rpc/v1/auth',
      secure: origin.protocol === 'https:',
    },
    input: undefined,
  };
}

function createContext(
  getAccessToken: AuthClientContext['auth']['getAccessToken'],
): AuthClientContext {
  return {
    auth: { getAccessToken },
    cachePartition: 'tenant-blue',
  };
}

function createContribution(
  getResolverCallCount: { value: number },
  options: {
    readonly unmarked?: 'none' | 'optional' | 'required';
    readonly allowInsecureTransport?: boolean;
    readonly directOnly?: boolean;
  } = {},
) {
  return createBearerSdkClientContribution<AuthClientContext>({
    context: { auth: 'required', cachePartition: 'required' },
    resolveCredential: async ({ context }) => {
      getResolverCallCount.value += 1;
      return await context.auth.getAccessToken();
    },
    responseCache: options.directOnly ? { mode: 'direct-only' } : {
      mode: 'partitioned',
      partition: ({ context }) => context.cachePartition,
    },
    unmarked: options.unmarked,
    allowInsecureTransport: options.allowInsecureTransport,
  });
}

Deno.test('bearer descriptor has the fixed protocol, id, and header ownership', () => {
  const contribution = createContribution({ value: 0 });

  assertEquals(contribution.protocol, { family: 'netscript.sdk-client', major: 1 });
  assertEquals(contribution.id, '@netscript/plugin-auth:bearer');
  assertEquals(contribution.context, { auth: 'required', cachePartition: 'required' });
  assertEquals(contribution.headerKeys, ['authorization']);
});

Deno.test('bearer resolution follows explicit and unmarked authentication policy', async () => {
  const calls = { value: 0 };
  const credential = crypto.randomUUID();
  const context = createContext(() => credential);
  const contribution = createContribution(calls);

  assertEquals(await contribution.prepare(prepareOptions(context, 'none')), {});
  assertEquals(await contribution.prepare(prepareOptions(context, undefined)), {});
  assertEquals(calls.value, 0);

  const optionalMissing = createContribution(calls);
  assertEquals(
    await optionalMissing.prepare(prepareOptions(createContext(() => undefined), 'optional')),
    {},
  );

  const requiredMissing = createContribution(calls);
  await assertRejects(
    async () =>
      await requiredMissing.prepare(
        prepareOptions(createContext(() => undefined), 'required'),
      ),
    Error,
    'Required bearer credential is unavailable.',
  );

  const optionalPatch = await contribution.prepare(prepareOptions(context, 'optional'));
  const requiredPatch = await contribution.prepare(prepareOptions(context, 'required'));
  assertEquals(optionalPatch.headers?.authorization === `Bearer ${credential}`, true);
  assertEquals(requiredPatch.headers?.authorization === `Bearer ${credential}`, true);

  const requiredByDefault = createContribution(calls, { unmarked: 'required' });
  const defaultPatch = await requiredByDefault.prepare(prepareOptions(context, undefined));
  assertEquals(defaultPatch.headers?.authorization === `Bearer ${credential}`, true);
  assertEquals(calls.value, 5);
});

Deno.test('bearer transport policy permits HTTPS and loopback but guards cleartext', async () => {
  const credential = crypto.randomUUID();
  const context = createContext(() => credential);
  const allowedOrigins = [
    'https://service.example.test',
    'http://localhost:8080',
    'http://api.localhost:8080',
    'http://127.0.0.1:8080',
    'http://127.255.1.2:8080',
    'http://[::1]:8080',
  ];

  for (const value of allowedOrigins) {
    const contribution = createContribution({ value: 0 });
    const patch = await contribution.prepare(
      prepareOptions(context, 'required', new URL(value)),
    );
    assertEquals(patch.headers?.authorization === `Bearer ${credential}`, true);
  }

  const guarded = createContribution({ value: 0 });
  await assertRejects(
    async () =>
      await guarded.prepare(
        prepareOptions(context, 'required', new URL('http://service.example.test')),
      ),
    Error,
    'Bearer credentials require secure transport',
  );

  const optedIn = createContribution({ value: 0 }, { allowInsecureTransport: true });
  const patch = await optedIn.prepare(
    prepareOptions(context, 'required', new URL('http://service.example.test')),
  );
  assertEquals(patch.headers?.authorization === `Bearer ${credential}`, true);
});

Deno.test('bearer cache policy remains caller-selected and non-secret', () => {
  const credential = crypto.randomUUID();
  const partitioned = createContribution({ value: 0 });
  const directOnly = createContribution({ value: 0 }, { directOnly: true });
  assertEquals(partitioned.responseCache.mode, 'partitioned');
  assertEquals(directOnly.responseCache, { mode: 'direct-only' });

  if (partitioned.responseCache.mode === 'partitioned') {
    const partition = partitioned.responseCache.partition({
      context: createContext(() => credential),
      procedure: requiredProcedure,
    });
    assertEquals(partition, 'tenant-blue');
    assertFalse(partition.includes(credential));
  }
});

Deno.test('bearer contribution makes its declared client context required', () => {
  const contract = {
    session: oc.$meta<NetScriptProcedureMeta>({})
      .route({ method: 'GET', path: '/session' })
      .meta({ access: { authentication: 'required' } })
      .input(z.undefined())
      .output(z.object({ authenticated: z.boolean() })),
  };
  const contribution = createContribution({ value: 0 });
  const authenticated = createServiceClient({
    contract,
    serviceName: 'auth-context-type',
    contributions: [contribution] as const,
  });
  const omitted = createServiceClient({ contract, serviceName: 'auth-context-type' });

  type AuthenticatedArgs = Parameters<typeof authenticated.session>;
  type OmittedArgs = Parameters<typeof omitted.session>;
  type _AuthenticatedOptionsRequired = Expect<
    AuthenticatedArgs extends [unknown, { readonly context: infer TContext }]
      ? TContext extends { readonly auth: infer TAuth } ? Equal<TAuth, AuthClientContext['auth']>
      : false
      : false
  >;
  type _OmittedOptionsRemainOptional = Expect<
    OmittedArgs extends [unknown, (infer _TOptions)?] ? true : false
  >;
  assert(authenticated);
  assert(omitted);
});

Deno.test('public SDK retry and server authentication keep credentials undisclosed', async () => {
  const bearerModule = new URL('./bearer-contribution.ts', import.meta.url);
  const sdkModule = new URL('../../../sdk/src/client/mod.ts', import.meta.url);
  const serviceAuthModule = new URL(
    '../../../service/src/auth/static-credential-authenticator.ts',
    import.meta.url,
  );
  const authConfig = new URL('../../deno.json', import.meta.url);
  const otelApiSpecifier = ['npm:', '@opentelemetry/api@^1.9.1'].join('');
  const otelContextSpecifier = [
    'npm:',
    '@opentelemetry/context-async-hooks@^2.9.0',
  ].join('');
  const otelTraceSpecifier = [
    'npm:',
    '@opentelemetry/sdk-trace-base@^2.5.0',
  ].join('');
  const source = `
    import { context, trace } from ${JSON.stringify(otelApiSpecifier)};
    import { AsyncLocalStorageContextManager } from ${JSON.stringify(otelContextSpecifier)};
    import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from ${
    JSON.stringify(otelTraceSpecifier)
  };
    import { oc } from '@orpc/contract';
    import { z } from 'zod';
    import { createBearerSdkClientContribution } from ${JSON.stringify(bearerModule.href)};
    import { createServiceClient } from ${JSON.stringify(sdkModule.href)};
    import { createStaticCredentialAuthenticator } from ${JSON.stringify(serviceAuthModule.href)};

    context.disable();
    trace.disable();
    const contextManager = new AsyncLocalStorageContextManager().enable();
    context.setGlobalContextManager(contextManager);
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
    trace.setGlobalTracerProvider(provider);

    const credential = Deno.env.get('S5_TEST_CREDENTIAL');
    if (credential === undefined) throw new Error('test credential was not supplied');
    const serviceName = 'auth-bearer-fake-fetch';
    const envKey = 'services__' + serviceName + '__http__0';
    Deno.env.set(envKey, 'http://127.0.0.1:9');
    const authenticator = createStaticCredentialAuthenticator({
      credentials: { [credential]: { subject: 'service:test' } },
    });
    const contract = {
      session: oc.$meta({}).route({ method: 'GET', path: '/session' })
        .meta({ access: { authentication: 'required' } })
        .input(z.undefined()).output(z.object({ authenticated: z.boolean() })),
    };
    let resolverCalls = 0;
    let attempts = 0;
    const headerMatches = [];
    const serverMatches = [];
    const requestUrls = [];
    const capturedLogs = [];
    const originalFetch = globalThis.fetch;
    const originalConsole = { log: console.log, warn: console.warn, error: console.error };
    console.log = (...args) => capturedLogs.push(args);
    console.warn = (...args) => capturedLogs.push(args);
    console.error = (...args) => capturedLogs.push(args);
    globalThis.fetch = async (request, init) => {
      attempts += 1;
      const headers = new Headers(init?.headers);
      const authorization = headers.get('authorization');
      headerMatches.push(authorization === 'Bearer ' + credential);
      const result = await authenticator.authenticate({
        header: (name) => headers.get(name) ?? undefined,
        headers: () => headers,
        cookie: () => undefined,
        method: init?.method ?? 'GET',
        path: '/api/rpc/v1/auth/session',
      });
      serverMatches.push(result.ok && result.principal.scheme === 'bearer');
      requestUrls.push(typeof request === 'string' ? request : request.url);
      throw new Error('expected transport stop');
    };

    const contribution = createBearerSdkClientContribution({
      context: { auth: 'required', cachePartition: 'required' },
      resolveCredential: ({ context }) => {
        resolverCalls += 1;
        return context.auth.getAccessToken();
      },
      responseCache: { mode: 'partitioned', partition: ({ context }) => context.cachePartition },
    });
    const client = createServiceClient({
      contract,
      serviceName,
      propagateTraceContext: false,
      contributions: [contribution],
    });
    let errorSnapshot = '';
    try {
      await client.session(undefined, {
        context: {
          auth: { getAccessToken: () => credential },
          cachePartition: 'tenant-safe',
          retry: 1,
          retryDelay: 0,
        },
      });
    } catch (error) {
      errorSnapshot = JSON.stringify({
        name: error?.name,
        message: error?.message,
        cause: error?.cause instanceof Error
          ? { name: error.cause.name, message: error.cause.message }
          : error?.cause,
        diagnostic: typeof error?.toJSON === 'function' ? error.toJSON() : undefined,
      });
    }

    const rejecting = createBearerSdkClientContribution({
      context: {},
      resolveCredential: () => { throw new Error(credential); },
      responseCache: { mode: 'direct-only' },
    });
    const rejectingClient = createServiceClient({
      contract,
      serviceName,
      contributions: [rejecting],
    });
    let preparationSnapshot = '';
    let preparationCode = '';
    try {
      await rejectingClient.session(undefined, { context: {} });
    } catch (error) {
      preparationCode = error?.code ?? '';
      preparationSnapshot = JSON.stringify({
        name: error?.name,
        message: error?.message,
        cause: error?.cause instanceof Error
          ? { name: error.cause.name, message: error.cause.message }
          : error?.cause,
        diagnostic: typeof error?.toJSON === 'function' ? error.toJSON() : undefined,
      });
    }

    await provider.forceFlush();
    const spanSnapshot = JSON.stringify(exporter.getFinishedSpans().map((span) => ({
      name: span.name,
      attributes: span.attributes,
      events: span.events,
      status: span.status,
    })));
    const logSnapshot = JSON.stringify(capturedLogs);
    await provider.shutdown();
    context.disable();
    contextManager.disable();
    trace.disable();
    globalThis.fetch = originalFetch;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    Deno.env.delete(envKey);
    originalConsole.log(JSON.stringify({
      resolverCalls,
      attempts,
      headersAccepted: headerMatches.length === 2 && headerMatches.every(Boolean),
      serverAccepted: serverMatches.length === 2 && serverMatches.every(Boolean),
      urlsSafe: requestUrls.every((value) => !value.includes(credential)),
      errorsSafe: !errorSnapshot.includes(credential) && !preparationSnapshot.includes(credential),
      preparationCode,
      logsSafe: !logSnapshot.includes(credential),
      spansSafe: !spanSnapshot.includes(credential),
    }));
  `;

  const credential = crypto.randomUUID();
  const child = await new Deno.Command(Deno.execPath(), {
    args: ['eval', '--config', authConfig.pathname, source],
    cwd: new URL('../..', import.meta.url).pathname,
    env: { S5_TEST_CREDENTIAL: credential },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(child.stdout).trim();
  const stderr = new TextDecoder().decode(child.stderr);
  const safeStderr = stderr.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '[redacted-runtime-value]',
  );
  assert(
    child.success,
    `non-disclosure child failed with exit ${child.code}:\n${safeStderr}`,
  );
  const result: {
    readonly resolverCalls: number;
    readonly attempts: number;
    readonly headersAccepted: boolean;
    readonly serverAccepted: boolean;
    readonly urlsSafe: boolean;
    readonly errorsSafe: boolean;
    readonly preparationCode: string;
    readonly logsSafe: boolean;
    readonly spansSafe: boolean;
  } = JSON.parse(stdout);

  assertEquals(result, {
    resolverCalls: 1,
    attempts: 2,
    headersAccepted: true,
    serverAccepted: true,
    urlsSafe: true,
    errorsSafe: true,
    preparationCode: 'SDK_PREPARATION_FAILED',
    logsSafe: true,
    spansSafe: true,
  });
  assertFalse(stderr.includes(credential));
});

Deno.test('bearer contribution module is universal and has no ambient credential reader', async () => {
  const source = await Deno.readTextFile(new URL('./bearer-contribution.ts', import.meta.url));
  const forbidden = [
    'Deno.',
    'process.',
    'import.meta.env',
    'window.',
    'document.',
    'localStorage',
    'sessionStorage',
    'cookie',
  ];
  for (const token of forbidden) assertFalse(source.includes(token));
});

Deno.test('packed auth core exposes the SDK bearer factory to an npm consumer', async () => {
  const packageRoot = new URL('../..', import.meta.url).pathname;
  const temporaryRoot = await Deno.makeTempDir({ prefix: 'netscript-auth-core-packed-' });
  const tarball = `${temporaryRoot}/plugin-auth-core.tgz`;
  const consumer = `${temporaryRoot}/consumer`;
  await Deno.mkdir(consumer);

  try {
    const packed = await new Deno.Command(Deno.execPath(), {
      args: ['pack', '--allow-dirty', '--output', tarball],
      cwd: packageRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assert(packed.success, `auth-core pack failed with exit ${packed.code}`);
    await Deno.writeTextFile(
      `${consumer}/package.json`,
      JSON.stringify({
        private: true,
        type: 'module',
        dependencies: { '@netscript/plugin-auth-core': 'file:../plugin-auth-core.tgz' },
      }),
    );
    await Deno.writeTextFile(
      `${consumer}/deno.json`,
      JSON.stringify({ nodeModulesDir: 'manual' }),
    );
    const installed = await new Deno.Command('npm', {
      args: ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
      cwd: consumer,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assert(installed.success, `auth-core consumer install failed with exit ${installed.code}`);
    await Deno.writeTextFile(
      `${consumer}/probe.ts`,
      "import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';\nvoid createBearerSdkClientContribution;\n",
    );
    const checked = await new Deno.Command(Deno.execPath(), {
      args: ['check', 'probe.ts'],
      cwd: consumer,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assert(checked.success, `auth-core consumer check failed with exit ${checked.code}`);
  } finally {
    await Deno.remove(temporaryRoot, { recursive: true });
  }
});
