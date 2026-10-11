import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { createService } from '@netscript/service';
import type { CdpClient } from '../../../../src/application/gates/scaffold/service-client-browser-probe.ts';
import { browserValue, navigate, withBrowser } from './browser-session.ts';
import {
  type GeneratedBrowserFixture,
  withGeneratedBrowserFixture,
} from './generated-browser-fixture.ts';

interface CookieEvidence {
  readonly name: string;
  readonly value: string;
  readonly domain: string;
  readonly path: string;
  readonly secure: boolean;
  readonly httpOnly: boolean;
  readonly sameSite: string;
}
interface FetchEvidence {
  readonly status: number;
  readonly body: Record<string, unknown>;
}

async function pageFetch(client: CdpClient, url: string): Promise<FetchEvidence> {
  return await browserValue(
    client,
    `fetch(${JSON.stringify(url)}).then(async r => ({
    status: r.status, body: await r.json()
  }))`,
  );
}

async function signIn(client: CdpClient, fixture: GeneratedBrowserFixture): Promise<void> {
  await navigate(client, fixture.appOrigin);
  assertEquals((await pageFetch(client, '/auth/session')).body, { authenticated: false });
  assertEquals((await pageFetch(client, '/private')).status, 401);
  await browserValue(client, 'document.querySelector("button").click(); true');
  await client.waitFor('Page.loadEventFired');
  assertEquals(await browserValue(client, 'location.origin'), fixture.appOrigin);
  const session = await pageFetch(client, '/auth/session');
  assertEquals(session.status, 200);
  assertEquals(
    session.body.authenticated,
    true,
    'browser must accept the app-origin session cookie',
  );
  assertEquals(await browserValue(client, 'location.pathname'), '/');
  assertEquals(session.body.subject, fixture.subject);
  assertEquals(session.body.session, undefined);
  assertEquals(session.body.sessionId, undefined);
  const read = await pageFetch(client, '/private');
  assertEquals(read.status, 200, 'generated app must forward a valid bearer on its next read');
  assertEquals(read.body, { subject: fixture.subject });
}

Deno.test('real generated browser: signin/provider/callback and the next guarded app read', async () => {
  await withGeneratedBrowserFixture(async (fixture) => {
    await withBrowser(async (browser) => {
      await signIn(browser, fixture);
      assertEquals(fixture.providerVisits.length, 1);
      const cookies = await browser.send('Network.getCookies', { urls: [fixture.appOrigin] }) as {
        cookies: CookieEvidence[];
      };
      const session = cookies.cookies.find((cookie) => cookie.name === '__Host-ns_session');
      assert(session, 'Browser must retain the real callback session cookie');
      assertEquals({
        domain: session.domain,
        path: session.path,
        secure: session.secure,
        httpOnly: session.httpOnly,
        sameSite: session.sameSite,
      }, { domain: 'localhost', path: '/', secure: true, httpOnly: true, sameSite: 'Lax' });
      assertEquals(await browserValue(browser, 'document.cookie'), '');
      for (const path of ['/auth/signin', '/auth/callback']) {
        const response = fixture.appResponses.find((response) => response.path === path);
        assert(response, `Generated ${path} must execute`);
        const cookie = response.cookies.find((value) => value.startsWith('__Host-ns_session='));
        assert(cookie);
        for (const attribute of ['Secure', 'HttpOnly', 'Path=/', 'SameSite=Lax']) {
          assertStringIncludes(cookie, attribute);
        }
        assertEquals(/(?:^|;)\s*Domain=/i.test(cookie), false);
      }
      const bearerCall = fixture.serviceRequests.find((request) => request.bearer);
      assert(bearerCall);
      assertEquals(bearerCall.bearer, `Bearer ${session.value}`);
      assertEquals(bearerCall.cookie, null, 'The BFF must forward only the bearer');
      assertEquals(bearerCall.origin, null, 'The SDK read runs on the app server');
      const browserCalls: string[] = [];
      browser.observe(({ method, params }) => {
        if (method === 'Network.requestWillBeSent' && browserCalls.length < 40) {
          const request = params.request as { url: string };
          browserCalls.push(request.url);
        }
      });
      await pageFetch(browser, '/private');
      assertEquals(browserCalls.some((url) => url.startsWith(fixture.serviceOrigin)), false);
      await assertCorsNegatives(browser, fixture, session.value);
    });
  });
});

async function assertCorsNegatives(
  browser: CdpClient,
  fixture: GeneratedBrowserFixture,
  session: string,
): Promise<void> {
  const path = '/api/v1/private/read';
  const directUrl = fixture.serviceOrigin + path;
  const rejected = await browserValue(
    browser,
    `fetch(${JSON.stringify(directUrl)}, {
    credentials: 'include'
  }).then(() => false, error => error instanceof TypeError)`,
  );
  assertEquals(rejected, true, 'Allowlisted origins still have no credentialed browser access');
  const direct = fixture.serviceRequests.find((request) => request.origin === fixture.appOrigin);
  assert(direct);
  assertStringIncludes(direct.cookie ?? '', `__Host-ns_session=${session}`);
  assertEquals(direct.bearer, null);
  // Cookies cross same-host ports. Rejection is the bearer/CORS contract, never a port boundary.
  const raw = await fetch(directUrl, {
    headers: { origin: fixture.appOrigin, cookie: `__Host-ns_session=${session}` },
  });
  assertEquals(raw.status, 401);
  assertEquals(raw.headers.get('access-control-allow-origin'), fixture.appOrigin);
  assertEquals(raw.headers.get('access-control-allow-credentials'), null);
  await raw.body?.cancel();
  const foreignOrigin = fixture.appOrigin.replace('localhost', '127.0.0.1');
  await navigate(browser, foreignOrigin);
  assertEquals(
    await browserValue(
      browser,
      `fetch(${JSON.stringify(directUrl)}).then(
    () => false, error => error instanceof TypeError
  )`,
    ),
    true,
  );
  const foreign = await fetch(directUrl, { headers: { origin: foreignOrigin } });
  assertEquals(foreign.headers.get('access-control-allow-origin'), null);
  await foreign.body?.cancel();
  await navigate(browser, fixture.appOrigin);
  const oldRequests: Array<{ cookie: string | null }> = [];
  const old = await createService({}, { name: 'legacy-wildcard-control' })
    .withCors({ origin: '*' })
    .use(async (ctx, next) => {
      if (oldRequests.length < 10) oldRequests.push({ cookie: ctx.req.header('cookie') ?? null });
      await next();
    }).withHealth().serve({ port: 0 });
  try {
    const oldUrl = `http://localhost:${old.addr.port}/health`;
    assertEquals(
      await browserValue(
        browser,
        `fetch(${JSON.stringify(oldUrl)}, {
      credentials: 'omit'
    }).then(r => r.status)`,
      ),
      200,
      'The wildcard endpoint is reachable without credentials',
    );
    assertEquals(
      await browserValue(
        browser,
        `fetch(${JSON.stringify(oldUrl)}, {
      credentials: 'include'
    }).then(() => false, error => error instanceof TypeError)`,
      ),
      true,
    );
    assert(oldRequests.some((request) => request.cookie?.includes(`__Host-ns_session=${session}`)));
    const response = await fetch(oldUrl, { headers: { origin: fixture.appOrigin } });
    assertEquals(response.headers.get('access-control-allow-origin'), '*');
    assertEquals(response.headers.get('access-control-allow-credentials'), null);
    await response.body?.cancel();
  } finally {
    await old.stop();
  }
  // Recreate the former insecure __Host issuance independently of the valid BFF session.
  const insecure = Deno.serve({ port: 0, onListen: () => {} }, () =>
    new Response('legacy', {
      headers: { 'set-cookie': '__Host-legacy_session=old; Path=/; HttpOnly; SameSite=Lax' },
    }));
  try {
    const origin = `http://localhost:${insecure.addr.port}`;
    await navigate(browser, origin);
    const jar = await browser.send('Network.getCookies', { urls: [origin] }) as {
      cookies: CookieEvidence[];
    };
    assertEquals(jar.cookies.some((cookie) => cookie.name === '__Host-legacy_session'), false);
    assertEquals(jar.cookies.some((cookie) => cookie.name === '__Host-ns_session'), true);
  } finally {
    await insecure.shutdown();
  }
}

Deno.test('browser conformance detects a generated BFF regression that strips Secure', async () => {
  await assertRejects(
    () =>
      withGeneratedBrowserFixture(
        (fixture) => withBrowser((browser) => signIn(browser, fixture)),
        (source) => {
          const forwarding = "headers.append('set-cookie', cookie);";
          assertStringIncludes(source, forwarding);
          return source.replace(
            forwarding,
            "headers.append('set-cookie', cookie.replace(/; Secure/ig, ''));",
          );
        },
      ),
    Error,
    'browser must accept the app-origin session cookie',
  );
});

Deno.test('browser conformance detects a generated SDK call that omits bearer forwarding', async () => {
  await assertRejects(
    () =>
      withGeneratedBrowserFixture(
        (fixture) => withBrowser((browser) => signIn(browser, fixture)),
        (source) => {
          const contribution = 'contributions: [bearer] as const,';
          assertStringIncludes(source, contribution);
          // Keep the auth session read intact; remove only the guarded client's contribution.
          return source.replace(
            contribution,
            'contributions: name === serviceName ? [bearer] as const : [],',
          );
        },
      ),
    Error,
    'generated app must forward a valid bearer on its next read',
  );
});
