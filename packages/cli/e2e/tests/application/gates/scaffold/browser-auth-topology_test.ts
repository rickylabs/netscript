import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { resolve, toFileUrl } from '@std/path';
import { MemoryKvAdapter } from '@netscript/kv';
import { createService } from '@netscript/service';
import { createAuthServiceAuthenticator } from '@netscript/plugin-auth-core/authenticator';
import { baseContract } from '@netscript/contracts';
import { implement } from '@orpc/server';
import { z } from 'zod';
import type { ServiceClient } from '@netscript/sdk/client';
import {
  createKvOAuthTestRegistry,
  serveAuthTestService,
} from '../../../../../../../plugins/auth/tests/testing/auth-service-fixture.ts';
import { renderTemplateAssetSync } from '../../../../../src/kernel/adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../../../src/kernel/assets/manifest.ts';

const contract = {
  read: baseContract.route({ method: 'GET', path: '/read' })
    .meta({ access: { authentication: 'required' } }).output(
      z.object({ accepted: z.boolean() }),
    ),
};
interface GeneratedBff {
  handleBrowserAuth(request: Request, action: string): Promise<Response>;
  browserSessionContext(
    request: Request,
  ): { accessToken?: string; signal: AbortSignal };
  createBrowserSessionClient(
    serviceContract: typeof contract,
    name: string,
    router: string,
  ): ServiceClient<
    typeof contract,
    { accessToken?: string; signal?: AbortSignal }
  >;
}

Deno.test('generated BFF cookie flow forwards a bearer to a guarded service and refuses direct cookie CORS', async () => {
  await using kv = new MemoryKvAdapter();
  const registry = await createKvOAuthTestRegistry(kv);
  await using auth = await serveAuthTestService(registry);
  await Deno.mkdir('.llm/tmp', { recursive: true });
  const root = await Deno.makeTempDir({
    dir: '.llm/tmp',
    prefix: 'bff-conformance-',
  });
  const appOrigin = 'https://app.example.test';
  const guardedName = `guarded-${crypto.randomUUID()}`;
  const envKey = `services__${guardedName}__http__0`;
  const router = implement(contract);
  let downstreamCookie: string | undefined;
  const service = await createService({
    v1: { private: { read: router.read.handler(() => ({ accepted: true })) } },
  }, { name: guardedName })
    .withCors({ origin: [appOrigin] })
    .use(async (ctx, next) => {
      downstreamCookie = ctx.req.header('cookie');
      await next();
    })
    .withAuthn({
      authenticator: createAuthServiceAuthenticator({
        serviceName: auth.serviceName,
        timeoutMs: 2000,
      }),
    })
    .withRPC({ traceContext: false })
    .withOpenAPI({ title: 'BFF conformance' })
    .serve({ port: 0 });
  Deno.env.set(envKey, `http://127.0.0.1:${service.addr.port}`);
  try {
    const path = `${root}/bff.ts`;
    await Deno.writeTextFile(
      path,
      renderTemplateAssetSync(TEMPLATE_KEYS.authBff, {
        authServiceName: JSON.stringify(auth.serviceName),
      }),
    );
    const bff: GeneratedBff = await import(toFileUrl(resolve(path)).href);
    const request = (path: string, init?: RequestInit) => new Request(`${appOrigin}${path}`, init);
    const signin = await bff.handleBrowserAuth(
      request('/auth/signin', {
        method: 'POST',
        headers: { origin: appOrigin },
      }),
      'signin',
    );
    assertEquals(signin.status, 303);
    const transaction = signin.headers.getSetCookie()[0];
    assertStringIncludes(transaction, 'Secure');
    assertStringIncludes(transaction, 'HttpOnly');
    const provider = new URL(signin.headers.get('location')!);
    const callback = await bff.handleBrowserAuth(
      request(
        `/auth/callback?code=c&state=${provider.searchParams.get('state')}`,
        { headers: { cookie: transaction.split(';')[0] } },
      ),
      'callback',
    );
    assertEquals(callback.status, 303);
    const cookie = callback.headers.getSetCookie()[0];
    assertStringIncludes(cookie, '__Host-ns_session=');
    assertStringIncludes(cookie, 'Secure');
    const browserRequest = request('/auth/session', {
      headers: { cookie: cookie.split(';')[0] },
    });
    const session = await bff.handleBrowserAuth(browserRequest, 'session');
    const body = await session.json();
    assertEquals(body.authenticated, true);
    assertEquals(body.session, undefined);
    assertEquals(body.sessionId, undefined);
    const client = bff.createBrowserSessionClient(
      contract,
      guardedName,
      'private',
    );
    assertEquals(
      await client.read(undefined, {
        context: bff.browserSessionContext(browserRequest),
      }),
      { accepted: true },
    );
    assertEquals(downstreamCookie, undefined);
    for (const origin of [appOrigin, 'https://foreign.example']) {
      const direct = await fetch(`http://127.0.0.1:${service.addr.port}/api/v1/private/read`, {
        headers: { cookie: cookie.split(';')[0], origin },
      });
      assertEquals(direct.status, 401);
      assertEquals(
        direct.headers.get('access-control-allow-origin'),
        origin === appOrigin ? appOrigin : null,
      );
      assertEquals(direct.headers.get('access-control-allow-credentials'), null);
      await direct.body?.cancel();
    }
    const missingTxn = await bff.handleBrowserAuth(
      request('/auth/callback?code=c&state=bad'),
      'callback',
    );
    assertEquals(missingTxn.status, 502);
    const csrf = await bff.handleBrowserAuth(
      request('/auth/signout', {
        method: 'POST',
        headers: {
          origin: 'https://foreign.example',
          cookie: cookie.split(';')[0],
        },
      }),
      'signout',
    );
    assertEquals(csrf.status, 403);
    const signout = await bff.handleBrowserAuth(
      request('/auth/signout', {
        method: 'POST',
        headers: { origin: appOrigin, cookie: cookie.split(';')[0] },
      }),
      'signout',
    );
    assertEquals(signout.status, 303);
    assert(
      signout.headers.getSetCookie().some((value) => value.includes('Max-Age=0')),
    );
    assertEquals(
      (await (await bff.handleBrowserAuth(browserRequest, 'session')).json())
        .authenticated,
      false,
    );
  } finally {
    await service.stop();
    Deno.env.delete(envKey);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generated BFF session distinguishes rejected credentials from an auth service outage', async () => {
  await Deno.mkdir('.llm/tmp', { recursive: true });
  const root = await Deno.makeTempDir({ dir: '.llm/tmp', prefix: 'bff-outage-' });
  let status = 401;
  const server = Deno.serve(
    { port: 0, onListen: () => {} },
    () =>
      Response.json({
        code: status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR',
        message: 'Auth fixture error',
      }, { status }),
  );
  const name = `outage-${crypto.randomUUID()}`;
  const envKey = `services__${name}__http__0`;
  Deno.env.set(envKey, `http://127.0.0.1:${server.addr.port}`);
  try {
    const path = `${root}/bff.ts`;
    await Deno.writeTextFile(
      path,
      renderTemplateAssetSync(TEMPLATE_KEYS.authBff, {
        authServiceName: JSON.stringify(name),
      }),
    );
    const bff: GeneratedBff = await import(toFileUrl(resolve(path)).href);
    const request = () =>
      new Request('https://app.example.test/auth/session', {
        headers: { cookie: '__Host-ns_session=rejected' },
      });
    assertEquals((await bff.handleBrowserAuth(request(), 'session')).status, 401);
    status = 500;
    const outage = await bff.handleBrowserAuth(request(), 'session');
    assertEquals(outage.status, 503);
    assertEquals(await outage.json(), { error: 'Authentication service unavailable' });
    await server.shutdown();
    assertEquals((await bff.handleBrowserAuth(request(), 'session')).status, 503);
  } finally {
    await server.shutdown();
    Deno.env.delete(envKey);
    await Deno.remove(root, { recursive: true });
  }
});
