import { assertEquals } from '@std/assert';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import {
  AsyncContextRootCaptureError,
  createService,
  SERVICE_PIPELINE_ERROR_CODES,
  ServicePipelineConfigError,
} from '../mod.ts';
import { createScopeAuthorizer } from '../src/auth/mod.ts';
import { createMemoryRateLimitStore } from '../src/rate-limit/mod.ts';
import type {
  ActiveAsyncStoreProbe,
  AuthnSideEffects,
  AuthorizerPort,
  AuthzOptions,
  ContextFactory,
  ContractAuthorizerFactory,
  ContractAuthorizerOptions,
  ContractPolicyAuthorizerPort,
  ContractPolicyBindingOptions,
  ContractPolicyContract,
  CorsOptions,
  Database,
  FetchHandler,
  MatchAwareAuthorizerPort,
  Principal,
  ProcedureAccessPolicy,
  ProcedureAuthorizerPort,
  ProcedureAuthzRequest,
  ProcedurePolicyResolver,
  ProcedureRateLimitKeyContext,
  ServiceBuilder,
  ServiceHandlerContext,
  ServiceHandlerPlugin,
  ServiceMiddleware,
  ServicePipelineErrorCode,
  ServiceProcedureRateLimitOptions,
  ServiceRouter,
  StartedService,
  StartOptions,
} from '../mod.ts';

Deno.test('public structural types are assignable through builder APIs', () => {
  const router: ServiceRouter = {};
  const corsOptions: CorsOptions = { origin: '*' };
  const database: Database = {
    $queryRaw: () => Promise.resolve(1),
  };
  const contextFactory: ContextFactory<{ readonly tenant: 'alpha' }> = () => ({ tenant: 'alpha' });
  const middleware: ServiceMiddleware = async (_ctx, next) => {
    await next();
  };

  const procedureRateLimitOptions: ServiceProcedureRateLimitOptions = {
    limit: 60,
    windowMs: 60_000,
    store: createMemoryRateLimitStore(),
    key: (ctx: ProcedureRateLimitKeyContext) =>
      `${ctx.principal?.subject ?? ctx.clientAddress ?? 'anon'}:${ctx.procedurePath.join('.')}`,
  };
  const pipelineErrorCode: ServicePipelineErrorCode =
    SERVICE_PIPELINE_ERROR_CODES.CROSS_SERVICE_MOUNT;
  const pipelineError = new ServicePipelineConfigError(pipelineErrorCode, 'duplicate mount');

  const builder: ServiceBuilder<ServiceRouter, { readonly tenant: 'alpha' }> = createService(
    router,
    { name: 'types' },
  )
    .withCors(corsOptions)
    .withDatabase({ primary: database }, database)
    .withProcedureRateLimit(procedureRateLimitOptions)
    .withContext(contextFactory)
    .use(middleware)
    .route('get', '/ping', () => new Response('pong'));

  const app = builder.build();

  const handlerContext: ServiceHandlerContext<{ readonly tenant: 'alpha' }> = {
    tenant: 'alpha',
    requestId: 'req-1',
    principal: undefined,
  };
  const numericRequestIdContext: ServiceHandlerContext<{ readonly requestId: number }> = {
    requestId: 42,
  };
  const preservedNumericId: number = numericRequestIdContext.requestId;
  assertEquals(preservedNumericId, 42);
  assertEquals(pipelineError.code, 'ROUTER_CLIENT_CROSS_SERVICE_MOUNT');
  const principal: Principal | undefined = handlerContext.principal;

  const policy: ProcedureAccessPolicy = {
    authentication: 'required',
    requiredScopes: ['items:read'],
    requiredRoles: ['operator'],
  };
  const policyContract = {
    readItem: baseContract
      .route({ method: 'GET', path: '/items/{id}' })
      .output(SuccessSchema)
      .meta({
        access: {
          authentication: 'required',
          authorization: { scopes: policy.requiredScopes, roles: policy.requiredRoles },
        },
      }),
  } satisfies ContractPolicyContract;

  const standaloneAuthorizer: AuthorizerPort = createScopeAuthorizer({ rules: [] });
  const matchAwareFallback: MatchAwareAuthorizerPort = {
    authorize: () => ({ allow: false, reason: 'authz.no-matching-rule' }),
    authorizeMatch: () => ({ matched: false }),
  };
  const contractAuthorizerOptions: ContractAuthorizerOptions = {
    fallback: matchAwareFallback,
  };
  const procedureFallback: ProcedureAuthorizerPort = {
    authorizeProcedure: (_req: ProcedureAuthzRequest) => ({
      matched: true,
      decision: { allow: true },
    }),
  };
  const procedureContractAuthorizerOptions: ContractAuthorizerOptions = {
    fallback: procedureFallback,
  };
  const authnSideEffects: AuthnSideEffects = {
    onResponseHeaders: () => {},
    onSetCookies: () => {},
  };
  const startOptions: StartOptions = { drainTimeoutMs: 5_000, disposeDatabases: true };
  const probe: ActiveAsyncStoreProbe = { name: 'test-probe', isActive: () => false };
  const captureErr = new AsyncContextRootCaptureError([probe.name]);
  const startFn: (opts?: StartOptions) => Promise<StartedService> = builder.start.bind(builder);
  assertEquals(captureErr.code, 'ASYNC_CONTEXT_ROOT_CAPTURE_FAILED');
  assertEquals(typeof startFn, 'function');
  assertEquals(typeof procedureContractAuthorizerOptions.fallback, 'object');
  assertEquals(typeof authnSideEffects.onSetCookies, 'function');
  assertEquals(startOptions.drainTimeoutMs, 5_000);
  const _invalidContractAuthorizerOptions: ContractAuthorizerOptions = {
    // @ts-expect-error Contract fallbacks must distinguish no match from an explicit deny.
    fallback: standaloneAuthorizer,
  };

  const policyResolver: ProcedurePolicyResolver = {
    resolve: () => ({ matched: true, policy }),
  };
  const binding: ContractPolicyBindingOptions = {
    apiPath: '/api',
    rpcPath: '/api/rpc',
    rpcAliases: ['/rpc'],
    deprecatedRpcRoutes: [{ pathPrefix: '/v0/items', replacementPrefix: '/items' }],
  };
  const contractAuthorizer: ContractPolicyAuthorizerPort = {
    bind: () => policyResolver,
    authorize: () => ({ allow: true }),
  };
  const createContractAuthorizer: ContractAuthorizerFactory = () => contractAuthorizer;
  const createdContractAuthorizer = createContractAuthorizer(
    policyContract,
    contractAuthorizerOptions,
  );
  const authzOptions: AuthzOptions = { authorizer: contractAuthorizer };

  assertEquals(typeof app.fetch, 'function');
  assertEquals(handlerContext.tenant, 'alpha');
  assertEquals(principal, undefined);
  assertEquals(policyContract.readItem['~orpc'].meta.access?.authentication, 'required');
  assertEquals(
    policyContract.readItem['~orpc'].meta.access?.authorization?.scopes,
    policy.requiredScopes,
  );
  assertEquals(
    policyContract.readItem['~orpc'].meta.access?.authorization?.roles,
    policy.requiredRoles,
  );
  assertEquals(policy.authentication, 'required');
  assertEquals(typeof standaloneAuthorizer.authorize, 'function');
  assertEquals(contractAuthorizerOptions.fallback, matchAwareFallback);
  assertEquals(contractAuthorizer.bind(binding), policyResolver);
  assertEquals(createdContractAuthorizer, contractAuthorizer);
  assertEquals(authzOptions.authorizer, contractAuthorizer);
});

Deno.test('FetchHandler mirror accepts oRPC-style handler result', async () => {
  const handler: FetchHandler = {
    handle: () =>
      Promise.resolve({
        matched: true,
        response: new Response('ok'),
      }),
  };

  const result = await handler.handle(new Request('http://localhost/api'), {
    prefix: '/api',
    context: { tenant: 'alpha' } satisfies ServiceHandlerContext<{ readonly tenant: 'alpha' }>,
  });

  assertEquals(result.matched, true);
  if (result.matched) {
    assertEquals(await result.response.text(), 'ok');
  }
});

Deno.test('ServiceHandlerPlugin accepts named return-based and void v1 plugins', () => {
  const v2ReadyPlugin: ServiceHandlerPlugin = {
    name: 'custom-v2-ready',
    order: 100,
    init: (options) => options,
    initRuntimeAdapter: (options) => options,
  };
  const v1VoidPlugin: ServiceHandlerPlugin = {
    order: 200,
    init: () => {},
  };

  assertEquals(v2ReadyPlugin.name, 'custom-v2-ready');
  assertEquals(v2ReadyPlugin.init?.({ ok: true }, {}), { ok: true });
  assertEquals(v1VoidPlugin.init?.({}, {}), undefined);
});
