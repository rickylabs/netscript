import { agentHostFreeDenoArgs } from '../../../../../tests/support/agent-host-free-deno.ts';
import { assert, assertEquals } from '@std/assert';
import { fromFileUrl, join, toFileUrl } from '@std/path';
import type { Middleware } from 'jsr:@fresh/core@^2.3.3';
import { defineFreshApp } from '@netscript/fresh/server';
import { DenoKvAdapter } from '@netscript/kv';
import { baseContract } from '@netscript/contracts';
import { createService, type RunningService } from '@netscript/service';
import { createContractAuthorizer } from '@netscript/service/auth';
import { createAuthServiceAuthenticator } from '@netscript/plugin-auth-core/authenticator';
import type { ServiceClient } from '@netscript/sdk/client';
import { implement } from '@orpc/server';
import { z } from 'zod';
import { createAuthServiceBackendRegistry } from '../../../../../../../plugins/auth/services/src/backend-registry.ts';
import {
  AUTH_TEST_PROVIDER_USER_ID,
  AUTH_TEST_USERINFO_SUBJECT_ENV,
  syntheticProviderFetch,
} from '../../../../../../../plugins/auth/tests/testing/auth-fixtures.ts';
import { serveAuthTestService } from '../../../../../../../plugins/auth/tests/testing/auth-service-fixture.ts';
import { SCAFFOLD_APP_IMPORTS } from '../../../../../src/kernel/constants/scaffold/scaffold-app-catalog.ts';

const REPO = fromFileUrl(new URL('../../../../../../../', import.meta.url));
const contract = {
  read: baseContract.route({ method: 'GET', path: '/read' })
    .meta({ access: { authentication: 'required' } })
    .output(z.object({ subject: z.string() })),
};
type State = Record<string, never>;
interface GeneratedBff {
  browserSessionContext(request: Request): { accessToken?: string; signal: AbortSignal };
  createBrowserSessionClient(
    serviceContract: typeof contract,
    name: string,
    router: string,
  ): ServiceClient<typeof contract, { accessToken?: string; signal?: AbortSignal }>;
}
interface ServiceRequest {
  readonly path: string;
  readonly origin: string | null;
  readonly cookie: string | null;
  readonly bearer: string | null;
}
interface AppResponse {
  readonly path: string;
  readonly cookies: readonly string[];
}
export interface GeneratedBrowserFixture {
  readonly appOrigin: string;
  readonly serviceOrigin: string;
  readonly subject: string;
  readonly serviceRequests: ServiceRequest[];
  readonly appResponses: AppResponse[];
  readonly providerVisits: string[];
}

/** Generate actual CLI auth output and mount the emitted route in the Fresh runtime. */
export async function withGeneratedBrowserFixture(
  probe: (fixture: GeneratedBrowserFixture) => Promise<void>,
  transformBff: (source: string) => string = (source) => source,
): Promise<void> {
  await Deno.mkdir(join(REPO, '.llm/tmp'), { recursive: true });
  const scratch = await Deno.makeTempDir({ dir: join(REPO, '.llm/tmp'), prefix: 'browser-auth-' });
  const root = join(scratch, 'browser-app');
  const serviceRequests: ServiceRequest[] = [];
  const appResponses: AppResponse[] = [];
  const providerVisits: string[] = [];
  const servers: Deno.HttpServer[] = [];
  let service: RunningService | undefined;
  const previousAuthUrl = Deno.env.get('services__auth__http__0');
  const serviceName = `browser-guarded-${crypto.randomUUID()}`;
  const serviceKey = `services__${serviceName}__http__0`;
  try {
    await runCli([
      'init',
      'browser-app',
      '--path',
      scratch,
      '--db',
      'none',
      '--app-name',
      'web',
      '--ci',
      '--yes',
      '--no-git',
      '--force',
      '--editor',
      'none',
    ]);
    await runCli([
      'plugin',
      'install',
      'auth',
      '--name',
      'auth',
      '--project-root',
      root,
      '--force',
    ]);
    // Dynamic imports inherit this test's import map. Preserve emitted route/BFF behavior;
    // resolve only the bare Fresh import using the generator's own dependency catalog.
    const utils = join(root, 'apps/web/utils.ts');
    await Deno.writeTextFile(
      utils,
      (await Deno.readTextFile(utils)).replace(
        "'fresh'",
        JSON.stringify(SCAFFOLD_APP_IMPORTS.fresh),
      ),
    );
    const bffPath = join(root, 'auth/bff.ts');
    await Deno.writeTextFile(bffPath, transformBff(await Deno.readTextFile(bffPath)));
    const bff: GeneratedBff = await import(toFileUrl(bffPath).href);
    const route: { handler: { GET: Middleware<State>; POST: Middleware<State> } } = await import(
      toFileUrl(join(root, 'apps/web/routes/auth/[action].ts')).href
    );
    const client = bff.createBrowserSessionClient(contract, serviceName, 'private');
    const app = defineFreshApp<State>({
      name: 'browser-conformance',
      staticFiles: false,
      fsRoutes: false,
      telemetry: false,
      queryCacheInvalidation: false,
    })
      .get('/auth/:action', route.handler.GET)
      .post('/auth/:action', route.handler.POST)
      .get('/private', async (ctx) => {
        const context = bff.browserSessionContext(ctx.req);
        if (!context.accessToken) {
          return Response.json({ error: 'Sign in required' }, { status: 401 });
        }
        try {
          return Response.json(
            await client.read(undefined, {
              context: bff.browserSessionContext(ctx.req),
            }),
          );
        } catch (error) {
          const status = error instanceof Error && 'status' in error ? Number(error.status) : 500;
          return Response.json({ error: 'Guarded read refused' }, { status });
        }
      })
      .get('/', () =>
        new Response(
          '<!doctype html><form method="post" action="/auth/signin"><button>Sign in</button></form>',
          { headers: { 'content-type': 'text/html' } },
        ));
    const appHandler = app.handler();
    const appServer = Deno.serve({ port: 0, onListen: () => {} }, async (request, info) => {
      const response = await appHandler(request, info);
      if (appResponses.length < 40) {
        appResponses.push({
          path: new URL(request.url).pathname,
          cookies: response.headers.getSetCookie(),
        });
      }
      return response;
    });
    servers.push(appServer);
    const appOrigin = `http://localhost:${appServer.addr.port}`;
    const provider = Deno.serve({ port: 0, onListen: () => {} }, (request) => {
      const url = new URL(request.url);
      assertEquals(url.pathname, '/authorize');
      assertEquals(url.searchParams.get('redirect_uri'), `${appOrigin}/auth/callback`);
      assert(url.searchParams.get('code_challenge'), 'PKCE must reach the provider');
      const state = url.searchParams.get('state');
      assert(state, 'OAuth state must reach the provider');
      if (providerVisits.length < 10) providerVisits.push(state);
      const callback = new URL('/auth/callback', appOrigin);
      callback.searchParams.set('state', state);
      callback.searchParams.set('code', 'c');
      return Response.redirect(callback, 303);
    });
    servers.push(provider);
    await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
    const registry = await createAuthServiceBackendRegistry({
      kv,
      env: {
        NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
        NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
        NETSCRIPT_AUTH_CLIENT_SECRET: 'secret_test',
        NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: `http://localhost:${provider.addr.port}/authorize`,
        NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://issuer.example.test/oauth/token',
        NETSCRIPT_AUTH_REDIRECT_URI: `${appOrigin}/auth/callback`,
        NETSCRIPT_AUTH_KV_OAUTH_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
        NETSCRIPT_AUTH_ALLOW_INSECURE_HTTP_REQUESTS: 'true',
        NETSCRIPT_AUTH_TRUST_PROXY_HEADERS: 'true',
        ...AUTH_TEST_USERINFO_SUBJECT_ENV,
      },
      fetch: syntheticProviderFetch(),
    });
    await using auth = await serveAuthTestService(registry);
    Deno.env.set('services__auth__http__0', auth.baseUrl);
    const implemented = implement(contract).$context<{ principal?: { subject: string } }>();
    const router = {
      v1: {
        private: {
          read: implemented.read.handler(({ context }) => ({
            subject: context.principal!.subject,
          })),
        },
      },
    };
    service = await createService(router, { name: serviceName })
      .withCors({ origin: [appOrigin] })
      .use(async (ctx, next) => {
        if (serviceRequests.length < 40) {
          serviceRequests.push({
            path: new URL(ctx.req.url).pathname,
            origin: ctx.req.header('origin') ?? null,
            cookie: ctx.req.header('cookie') ?? null,
            bearer: ctx.req.header('authorization') ?? null,
          });
        }
        await next();
      })
      .withAuthn({
        authenticator: createAuthServiceAuthenticator({
          serviceName: auth.serviceName,
          timeoutMs: 2000,
        }),
      })
      .withAuthz({ authorizer: createContractAuthorizer(router) })
      .withRPC({ traceContext: false }).withOpenAPI({ title: 'Browser conformance' })
      .serve({ port: 0 });
    const serviceOrigin = `http://localhost:${service.addr.port}`;
    Deno.env.set(serviceKey, serviceOrigin);
    await probe({
      appOrigin,
      serviceOrigin,
      subject: `default:${AUTH_TEST_PROVIDER_USER_ID}`,
      serviceRequests,
      appResponses,
      providerVisits,
    });
  } finally {
    await service?.stop();
    await Promise.all(servers.map((server) => server.shutdown()));
    Deno.env.delete(serviceKey);
    if (previousAuthUrl === undefined) Deno.env.delete('services__auth__http__0');
    else Deno.env.set('services__auth__http__0', previousAuthUrl);
    await Deno.remove(scratch, { recursive: true });
  }
}

async function runCli(args: string[]): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: agentHostFreeDenoArgs([
      'run',
      '--no-lock',
      '-A',
      join(REPO, 'packages/cli/bin/netscript-dev.ts'),
      ...args,
    ]),
    cwd: REPO,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
}
