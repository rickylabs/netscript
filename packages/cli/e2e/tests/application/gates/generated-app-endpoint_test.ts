import { assertEquals, assertNotEquals, assertRejects, assertThrows } from '@std/assert';

import {
  AppEndpointPendingError,
  appUrlsFromDescribeOutput,
  generatedAppHomeUrls,
  readPinnedAppPort,
  resourceUrlsFromDescribeOutput,
} from '../../../src/application/gates/scaffold/generated-app-endpoint.ts';
import {
  diagnosticBody,
  probeAppHome,
} from '../../../src/application/gates/scaffold/probe-app-home.ts';
import { generateAppsettings } from '../../../../src/kernel/templates/aspire/generate-appsettings.ts';
import { PORT_RANGES, SCAFFOLD_APP_PORT } from '../../../../src/kernel/constants/port-ranges.ts';
import { SCAFFOLD_FILES } from '../../../../src/kernel/constants/scaffold/scaffold-files.ts';

async function projectWithAppsettings(contents: string): Promise<string> {
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(`${root}/${SCAFFOLD_FILES.APPSETTINGS}`, contents);
  return root;
}

Deno.test('readPinnedAppPort returns the port the project declares, not a default', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { dashboard: { Type: 'app', HostPort: 9137 } } } }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), 9137);
    assertEquals(await generatedAppHomeUrls(root, 'dashboard'), ['http://127.0.0.1:9137/']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

// A workspace scaffolded before the HostPort rename still spells it `Port`, and must resolve
// identically — the rename is not allowed to strand existing projects.
Deno.test('readPinnedAppPort still honours the legacy Port spelling', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { dashboard: { Type: 'app', Port: 9137 } } } }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), 9137);
    assertEquals(await generatedAppHomeUrls(root, 'dashboard'), ['http://127.0.0.1:9137/']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

// #954 regression: the probe shipped hardcoded to `PORT_RANGES.APP.start` (8000) while a
// pinning project publishes the app on `SCAFFOLD_APP_PORT` (8010). Every request was refused,
// and 60 refused connections read exactly like an app that cannot render.
Deno.test('the app home URL follows a pinned port rather than a guessed one', async () => {
  const root = await projectWithAppsettings(
    generateAppsettings({ name: 'smoke', appName: 'dashboard', appPort: SCAFFOLD_APP_PORT }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), SCAFFOLD_APP_PORT);
    assertEquals(
      await generatedAppHomeUrls(root, 'dashboard'),
      [`http://127.0.0.1:${SCAFFOLD_APP_PORT}/`],
    );
    // The offset is the whole point: probing the range start reaches nothing.
    assertNotEquals(SCAFFOLD_APP_PORT, PORT_RANGES.APP.start);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

// #952 regression, and the reason this module was reworked: the pristine scaffold pins no host
// port so `aspire start --isolated` works. The previous resolver threw
// "declares NetScript.Apps.dashboard.Port as undefined" on exactly this input — a green
// scaffold would have failed the app-home gate the moment #952 landed.
Deno.test('a pristine scaffold pins no port, and that is not an error', async () => {
  const root = await projectWithAppsettings(
    generateAppsettings({ name: 'smoke', appName: 'dashboard' }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), undefined);
    // Without a running AppHost there is nothing to ask, and the message has to say so
    // rather than blame a missing field.
    await assertRejects(
      () => generatedAppHomeUrls(root, 'dashboard'),
      Error,
      'pins no host port',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('an app absent from appsettings pins nothing', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { other: { HostPort: 8010 } } } }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), undefined);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a non-numeric pinned port is reported, never coerced', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { dashboard: { HostPort: 'eighty-ten' } } } }),
  );
  try {
    assertThrows(() => readPinnedAppPort(root, 'dashboard'), Error, 'host port as "eighty-ten"');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('readPinnedAppPort reports an unreadable appsettings rather than guessing', async () => {
  const root = await Deno.makeTempDir();
  try {
    assertThrows(() => readPinnedAppPort(root, 'dashboard'), Error, 'is unreadable');
  } finally {
    await Deno.remove(root, { recursive: true });
  }

  const broken = await projectWithAppsettings('{ not json');
  try {
    assertThrows(() => readPinnedAppPort(broken, 'dashboard'), Error, 'is not valid JSON');
  } finally {
    await Deno.remove(broken, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// The allocated-port path parses `aspire describe --format Json`, so the parse is tested
// without a running AppHost. This fixture is not invented: it is the real shape captured from
// a live NetScript AppHost (Aspire 13.4.6) — DCP-suffixed `name`, human `displayName`, a
// `dashboardUrl` deep-link, a declared `urls[]`, `relationships[]` stubs, and an `environment`
// block carrying sibling services' URLs.
// ---------------------------------------------------------------------------
const DESCRIBE_FIXTURE = JSON.stringify({
  resources: [
    {
      name: 'users-abcdwxyz',
      displayName: 'users',
      resourceType: 'Executable',
      urls: [{ name: 'http', url: 'http://localhost:34100' }],
    },
    {
      name: 'dashboard-sayhwbds',
      displayName: 'dashboard',
      resourceType: 'Executable',
      state: 'Running',
      healthStatus: 'Healthy',
      dashboardUrl: 'https://localhost:43699/?resource=dashboard-sayhwbds',
      relationships: [{ type: 'Reference', resourceName: 'users-abcdwxyz' }],
      urls: [{ name: 'http', url: 'http://localhost:34120' }],
      environment: {
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:42595',
        services__users__http__0: 'http://localhost:34100',
        VITE_USERS_URL: 'http://localhost:34100',
        PORT: '42775',
      },
    },
  ],
});

Deno.test("the app endpoint comes from the resource's declared urls[]", () => {
  assertEquals(appUrlsFromDescribeOutput(DESCRIBE_FIXTURE, 'dashboard'), [
    'http://localhost:34120',
  ]);
});

// S2 captured 13.5.3 describe JSON with `--nologo`; this independent, bannerless case is a
// redacted projection of `02-v5-aspire-describe-final.json`, selecting its `users` resource.
const ASPIRE_13_5_3_DESCRIBE_FIXTURE = JSON.stringify({
  resources: [
    {
      name: 'users-yvbcumea',
      displayName: 'users',
      resourceType: 'Executable',
      state: 'Running',
      healthStatus: 'Healthy',
      dashboardUrl: 'https://localhost:42501/?resource=users-yvbcumea',
      relationships: [{ type: 'Reference', resourceName: 'aspire-13-5-postgres-db' }],
      urls: [{ name: 'http', url: 'http://localhost:3001' }],
      environment: {
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:42043',
        OTEL_SERVICE_NAME: 'users',
        PORT: '43515',
      },
    },
  ],
});

Deno.test("13.5.3: the app endpoint comes from the captured resource's declared urls[]", () => {
  assertEquals(appUrlsFromDescribeOutput(ASPIRE_13_5_3_DESCRIBE_FIXTURE, 'users'), [
    'http://localhost:3001',
  ]);
});

// This is the sharp edge. A recursive scrape of the resource node also picks up the Aspire
// dashboard deep-link and every sibling URL in `environment`. Probing one of those would not
// just be wrong — a sibling app's page is `text/html` containing `<html` too, which is the
// entire assertion probe-app-home makes, so the gate would report a FALSE PASS.
Deno.test('resolution never returns the dashboard link or a sibling service URL', () => {
  const resolved = appUrlsFromDescribeOutput(DESCRIBE_FIXTURE, 'dashboard');
  assertEquals(resolved.some((url) => url.includes('43699')), false); // dashboard deep-link
  assertEquals(resolved.some((url) => url.includes('34100')), false); // the users service
  assertEquals(resolved.some((url) => url.includes('42595')), false); // OTLP exporter
});

// DCP suffixes the instance id; gates pass the AppHost-given name.
Deno.test('a resource resolves by displayName even though name is suffixed', () => {
  assertEquals(appUrlsFromDescribeOutput(DESCRIBE_FIXTURE, 'users'), ['http://localhost:34100']);
});

Deno.test('generic resource endpoint resolution supports plugin resources', () => {
  const describe = JSON.stringify({
    resources: [{
      name: 'workers-api-random',
      displayName: 'workers-api',
      urls: [{ name: 'http', url: 'http://localhost:35123' }],
    }],
  });
  assertEquals(resourceUrlsFromDescribeOutput(describe, 'workers-api'), [
    'http://localhost:35123',
  ]);
});

// `relationships[]` entries carry a matching `resourceName` but no endpoint. Matching one
// would return a stub and report "declared no HTTP endpoint" for a healthy app.
Deno.test('a relationship stub is never mistaken for the resource', () => {
  assertEquals(appUrlsFromDescribeOutput(DESCRIBE_FIXTURE, 'users'), ['http://localhost:34100']);
});

Deno.test('appUrlsFromDescribeOutput tolerates a banner before the JSON', () => {
  assertEquals(
    appUrlsFromDescribeOutput(`Scanning for running AppHosts...\n${DESCRIBE_FIXTURE}`, 'dashboard'),
    ['http://localhost:34120'],
  );
});

Deno.test('appUrlsFromDescribeOutput names what was missing', () => {
  assertThrows(
    () => appUrlsFromDescribeOutput(DESCRIBE_FIXTURE, 'nope'),
    Error,
    'was not present in aspire describe output',
  );

  const noEndpoint = JSON.stringify({
    resources: [{ name: 'dashboard', displayName: 'dashboard', state: 'Running' }],
  });
  assertThrows(
    () => appUrlsFromDescribeOutput(noEndpoint, 'dashboard'),
    Error,
    'still declared no HTTP endpoint',
  );
});

Deno.test('app-home probe does not retry terminal endpoint resolution failures', async () => {
  const root = await projectWithAppsettings(JSON.stringify({ NetScript: { Apps: {} } }));
  let describeCalls = 0;
  try {
    await assertRejects(
      () =>
        probeAppHome(root, 'dashboard', '/tmp/apphost.ts', {
          attempts: 3,
          retryDelayMs: 0,
          delay: () => Promise.resolve(),
          log: () => {},
          resolveLiveUrls: () => {
            describeCalls++;
            return Promise.reject(new SyntaxError('malformed aspire describe payload'));
          },
        }),
      SyntaxError,
      'malformed aspire describe payload',
    );
    assertEquals(describeCalls, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('app-home probe retries while aspire describe has not registered the endpoint', async () => {
  const root = await projectWithAppsettings(JSON.stringify({ NetScript: { Apps: {} } }));
  let describeCalls = 0;
  let fetchCalls = 0;
  try {
    await probeAppHome(root, 'dashboard', '/tmp/apphost.ts', {
      attempts: 3,
      retryDelayMs: 0,
      delay: () => Promise.resolve(),
      log: () => {},
      resolveLiveUrls: () => {
        describeCalls++;
        const output = describeCalls === 1
          ? JSON.stringify({ resources: [{ displayName: 'dashboard', urls: [] }] })
          : DESCRIBE_FIXTURE;
        const urls = appUrlsFromDescribeOutput(output, 'dashboard');
        return Promise.resolve(urls.map((url) => new URL('/', url).toString()));
      },
      fetchUrl: () => {
        fetchCalls++;
        return Promise.resolve(
          new Response('<html>ready</html>', { headers: { 'content-type': 'text/html' } }),
        );
      },
    });
    assertEquals(describeCalls, 2);
    assertEquals(fetchCalls, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('app-home probe bounds a resource endpoint that never appears', async () => {
  const root = await projectWithAppsettings(JSON.stringify({ NetScript: { Apps: {} } }));
  let describeCalls = 0;
  try {
    await assertRejects(
      () =>
        probeAppHome(root, 'dashboard', '/tmp/apphost.ts', {
          attempts: 3,
          retryDelayMs: 0,
          delay: () => Promise.resolve(),
          log: () => {},
          resolveLiveUrls: () => {
            describeCalls++;
            return Promise.reject(
              new AppEndpointPendingError(
                'resource dashboard still declared no HTTP endpoint',
              ),
            );
          },
        }),
      Error,
      'resource dashboard still declared no HTTP endpoint after 3 attempts',
    );
    assertEquals(describeCalls, 3);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('app-home diagnostics extract the Fresh overlay error and stack', () => {
  const body = `<!DOCTYPE html><html><head><title>Error</title></head><body>
    <script type="module">
      const error = {"message":"Cannot find module 'npm:@tanstack/preact-query@^5.101.0'","stack":"at fetchModule (vite.js:42)\\nat render (app.tsx:7)","frame":""}
      try { console.error(error) } catch (_) {}
    </script></body></html>`;

  assertEquals(
    diagnosticBody(body),
    "Fresh error: Cannot find module 'npm:@tanstack/preact-query@^5.101.0'\n" +
      'at fetchModule (vite.js:42)\nat render (app.tsx:7)',
  );
});

Deno.test('app-home diagnostics retain a useful bounded fallback for unknown responses', () => {
  const body = `upstream failure: ${'x'.repeat(30_000)}`;
  const diagnostic = diagnosticBody(body);
  assertEquals(diagnostic.startsWith('upstream failure:'), true);
  assertEquals(diagnostic.includes('diagnostic truncated'), true);
  assertEquals(diagnostic.length < body.length, true);
});

Deno.test('app-home exhaustion includes the app resource logs', async () => {
  const root = await projectWithAppsettings(JSON.stringify({ NetScript: { Apps: {} } }));
  try {
    await assertRejects(
      () =>
        probeAppHome(root, 'dashboard', '/tmp/apphost.ts', {
          attempts: 1,
          retryDelayMs: 0,
          log: () => {},
          resolveLiveUrls: () => Promise.resolve(['http://127.0.0.1:12345/']),
          fetchUrl: () =>
            Promise.resolve(
              new Response('broken', { status: 500, headers: { 'content-type': 'text/plain' } }),
            ),
          collectResourceLogs: (appHost, appName) =>
            Promise.resolve(`logs for ${appName} via ${appHost}: server-side stack`),
        }),
      Error,
      'Last dashboard resource logs:\nlogs for dashboard via /tmp/apphost.ts: server-side stack',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
