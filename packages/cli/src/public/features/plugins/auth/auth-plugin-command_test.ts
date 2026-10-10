import { assert, assertEquals, assertMatch, assertRejects } from '@std/assert';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import {
  createAuthServiceBackendRegistry,
  createInMemoryKvOAuthRegistry,
} from '../../../../../../../plugins/auth/services/src/backend-registry.ts';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  callback,
  session,
  signin,
  signout,
} from '../../../../../../../plugins/auth/services/src/routers/v1-handlers.ts';
import {
  generateAuthSecret,
  setAuthBackend,
  setAuthProvider,
  showAuthBackend,
} from './auth-config.ts';
import { createAuthPluginCommand } from './auth-plugin-command.ts';
import { FetchAuthSessionHttp, parseSessionProjection } from './auth-session-client.ts';
import type {
  AuthSessionClientContext,
  AuthSessionHttpPort,
  AuthSessionRequestOptions,
} from './auth-types.ts';
import { doctorPlugin } from '../doctor/doctor-plugin-use-case.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';

const HEALTHY_MODULE_PROCESS: ProcessPort = {
  exec: () =>
    Promise.resolve({
      code: 0,
      stdout: 'NETSCRIPT_PLUGIN_MANIFEST_PROBE={"status":"resolved"}\n',
      stderr: '',
    }),
};

Deno.test('auth backend set reconciles .env and show reports the active backend', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/workspace/.env', '# keep me\nPORT=9184\nNETSCRIPT_AUTH_BACKEND=workos\n');

  assertEquals(await setAuthBackend('/workspace', 'kv-oauth', fs), 'kv-oauth');
  assertEquals(await showAuthBackend('/workspace', fs), 'kv-oauth');
  assertEquals(
    await fs.readFile('/workspace/.env'),
    '# keep me\nPORT=9184\nNETSCRIPT_AUTH_BACKEND=kv-oauth\n'.replace(
      'NETSCRIPT_AUTH_BACKEND=kv-oauth',
      "NETSCRIPT_AUTH_BACKEND='kv-oauth'",
    ),
  );
});

Deno.test('auth backend show reads the service-supported appsettings seam', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/workspace/appsettings.json',
    JSON.stringify({ Auth: { Backend: 'workos' } }),
  );
  assertEquals(await showAuthBackend('/workspace', fs), 'workos');
});

Deno.test('plugin doctor reports the configured active auth backend', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.createDir('/workspace/auth');
  await setAuthBackend('/workspace', 'better-auth', fs);
  const reports = await doctorPlugin({ projectRoot: '/workspace' }, {
    fs,
    process: HEALTHY_MODULE_PROCESS,
    loadConfig: () => Promise.resolve({ plugins: ['auth'] } as never),
    loadRegisteredPlugins: () =>
      Promise.resolve({
        auth: {
          name: 'auth',
          source: {
            kind: 'local-workdir',
            configuredSpecifier: './auth/mod.ts',
            resolvedSpecifier: 'file:///workspace/auth/mod.ts',
            workdir: 'auth',
            rootDir: '/workspace/auth',
          },
          permissions: ['--allow-env'],
          cli: { doctorChecks: ['auth-backend'] },
        },
      }),
  });
  assertEquals(
    reports[0].checks.find((check) => check.id === 'auth-backend')?.message,
    'better-auth',
  );
});

Deno.test('github provider preset writes boot-ready OAuth environment', async () => {
  const fs = new MemoryFileSystemAdapter();
  const kvOAuthKey = generateAuthSecret('kv-oauth-key');
  await setAuthProvider({
    projectRoot: '/workspace',
    preset: 'github',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'http://localhost:9184/api/v1/auth/callback',
    kvOAuthKey,
  }, fs);

  const env = (await fs.readFile('/workspace/.env')).replaceAll("'", '');
  assertMatch(env, /NETSCRIPT_AUTH_BACKEND=kv-oauth/);
  assertMatch(env, /NETSCRIPT_AUTH_PROVIDER_ID=github/);
  assertMatch(
    env,
    /NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT=https:\/\/github.com\/login\/oauth\/authorize/,
  );
  assertMatch(env, /NETSCRIPT_AUTH_CLIENT_SECRET=client-secret/);
  assertMatch(env, new RegExp(`NETSCRIPT_AUTH_KV_OAUTH_KEY=${kvOAuthKey}`));
  const appsettings = JSON.parse(await fs.readFile('/workspace/appsettings.json'));
  assertEquals(appsettings.Auth, undefined);
  assertEquals(
    appsettings.NetScript.Plugins.auth.Environment,
    { NETSCRIPT_AUTH_BACKEND: 'kv-oauth' },
  );
  const registry = await createAuthServiceBackendRegistry({
    env: Object.fromEntries(
      env.trim().split('\n').map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
    ),
    appsettings,
    kv: new MemoryKvAdapter(),
  });
  assertEquals(registry.defaultName, 'kv-oauth');
});

for (const issuer of [undefined, 'https://github.com']) {
  Deno.test(`GitHub CLI preset skips discovery and resolves userinfo subject (issuer=${issuer})`, async () => {
    const fs = new MemoryFileSystemAdapter();
    // Reconfiguring a project must remove its old issuer too.
    await fs.writeFile('/workspace/.env', "NETSCRIPT_AUTH_ISSUER='https://github.com'\n");
    await setAuthProvider({
      projectRoot: '/workspace',
      preset: 'github',
      clientId: 'client_test',
      clientSecret: 'secret_test',
      redirectUri: 'https://app.test/v1/auth/callback',
      kvOAuthKey: generateAuthSecret('kv-oauth-key'),
      issuer,
    }, fs);
    const env = Object.fromEntries(
      (await fs.readFile('/workspace/.env')).trim().split('\n').map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1).replaceAll("'", '')];
      }),
    );
    const requests: Request[] = [];
    const registry = await createAuthServiceBackendRegistry({
      env,
      kv: new MemoryKvAdapter(),
      fetch: (input, init) => {
        const request = new Request(input, init);
        requests.push(request);
        if (request.url === 'https://api.github.com/user') {
          return Promise.resolve(Response.json({ id: 583231, login: 'octocat' }));
        }
        if (request.url === 'https://github.com/login/oauth/access_token') {
          return Promise.resolve(Response.json({ access_token: 'access', token_type: 'Bearer' }));
        }
        throw new Error(`Unexpected provider request: ${request.url}`);
      },
    });
    const started = await signin({}, {
      registry,
      request: { url: 'https://app.test/v1/auth/signin' },
    });
    const redirect = new URL(started.redirectUrl ?? '');
    assertEquals(redirect.origin + redirect.pathname, 'https://github.com/login/oauth/authorize');
    const completed = await callback({
      code: 'code',
      state: redirect.searchParams.get('state') ?? undefined,
    }, {
      registry,
      request: { url: `https://app.test/v1/auth/callback?txn=${redirect.searchParams.get('txn')}` },
    });
    assertEquals(completed.subject, 'github:583231');
    assertEquals(env.NETSCRIPT_AUTH_ISSUER, undefined);
    assertEquals(requests.map((request) => request.url), [
      'https://github.com/login/oauth/access_token',
      'https://api.github.com/user',
    ]);
    assert(!requests.some((request) => request.url.includes('/.well-known/')));
    assertEquals(requests[1].headers.get('authorization'), 'Bearer access');
    assertEquals(requests[1].headers.get('user-agent'), 'netscript-auth-kv-oauth');
  });
}

Deno.test('GitHub preset docs describe explicit OAuth endpoints without an issuer', async () => {
  const docs = await Deno.readTextFile('docs/site/identity-access/how-to/add-authentication.md');
  assert(docs.includes('GitHub is OAuth 2.0, so the preset emits no `NETSCRIPT_AUTH_ISSUER`'));
  const fs = new MemoryFileSystemAdapter();
  await setAuthProvider({
    projectRoot: '/workspace',
    preset: 'github',
    clientId: 'client_test',
    clientSecret: 'secret_test',
    redirectUri: 'https://app.test/v1/auth/callback',
  }, fs);
  const assignments = (await fs.readFile('/workspace/.env')).replaceAll("'", '').split('\n');
  for (
    const key of [
      'NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT',
      'NETSCRIPT_AUTH_TOKEN_ENDPOINT',
      'NETSCRIPT_AUTH_USERINFO_ENDPOINT',
      'NETSCRIPT_AUTH_SCOPES',
    ]
  ) {
    const assignment = assignments.find((line) => line.startsWith(`${key}=`));
    assert(assignment && docs.includes(assignment), `GitHub docs must match ${key}`);
  }
});

Deno.test('workos and better-auth variants enforce their boot credential contracts', async () => {
  const fs = new MemoryFileSystemAdapter();
  await setAuthProvider({
    projectRoot: '/workspace',
    preset: 'workos',
    apiKey: 'sk_test',
    clientId: 'client_test',
    cookiePassword: 'cookie-secret',
  }, fs);
  assertMatch(
    (await fs.readFile('/workspace/.env')).replaceAll("'", ''),
    /WORKOS_COOKIE_PASSWORD=cookie-secret/,
  );

  await setAuthProvider({
    projectRoot: '/workspace',
    preset: 'better-auth',
    secret: 'better-secret',
  }, fs);
  assertMatch(
    (await fs.readFile('/workspace/.env')).replaceAll("'", ''),
    /BETTER_AUTH_SECRET=better-secret/,
  );
  await assertRejects(
    () => setAuthProvider({ projectRoot: '/workspace', preset: 'workos' }, fs),
    Error,
    '--api-key',
  );
});

Deno.test('generated kv-oauth key is accepted by the real backend registry', async () => {
  const key = generateAuthSecret('kv-oauth-key');
  assertMatch(key, /^[A-Za-z0-9_-]{43}$/);
  const registry = await createInMemoryKvOAuthRegistry({
    env: { NETSCRIPT_AUTH_KV_OAUTH_KEY: key },
  });
  assertEquals(registry.defaultName, 'kv-oauth');
});

Deno.test('session projection parser exposes active sessions', () => {
  const sessions = parseSessionProjection({
    collections: {
      authSession: [
        { id: 'session-active', userId: 'user-1', state: 'active' },
        { id: 'session-revoked', userId: 'user-1', state: 'revoked' },
      ],
    },
  });
  assertEquals(sessions.map((session) => session.id), ['session-active', 'session-revoked']);
});

Deno.test('fetch session adapter lists projections and revokes through signout', async () => {
  const requests: Request[] = [];
  const client = new FetchAuthSessionHttp((input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    if (request.method === 'POST') {
      return Promise.resolve(Response.json({ signedOut: true, sessionId: 'session-1' }));
    }
    return Promise.resolve(
      Response.json([{ id: 'session-1', state: 'active', userId: 'user-1' }]),
    );
  });
  assertEquals((await client.list('http://streams/auth/sessions'))[0].id, 'session-1');
  assertEquals(await client.revoke('http://auth/api/v1/auth', 'session-1'), 'session-1');
  assertEquals(requests[1].url, 'http://auth/api/v1/auth/signout');
  assertEquals(await requests[1].json(), { sessionId: 'session-1' });
});

Deno.test('plugin auth parser drives backend and session verbs', async () => {
  const fs = new MemoryFileSystemAdapter();
  const output: string[] = [];
  const regenerated: string[] = [];
  const listedUrls: string[] = [];
  const requestOptions: Array<AuthSessionRequestOptions | undefined> = [];
  const context: AuthSessionClientContext = {
    auth: { getAccessToken: () => 'application-owned-token' },
  };
  let contextCalls = 0;
  const sessions: AuthSessionHttpPort = {
    list: (url, options) => {
      listedUrls.push(url);
      requestOptions.push(options);
      return Promise.resolve([
        { id: 'active-1', state: 'active', userId: 'user-1' },
        { id: 'old-1', state: 'revoked', userId: 'user-1' },
      ]);
    },
    revoke: (_url, id, options) => {
      requestOptions.push(options);
      return Promise.resolve(id);
    },
  };
  const command = createAuthPluginCommand({
    fs,
    sessions,
    resolveSessionContext: () => {
      contextCalls++;
      return context;
    },
    resolveProjectRoot: (value) => Promise.resolve(value ?? '/workspace'),
    print: (line) => output.push(line),
    regenerateAspire: (projectRoot) => {
      regenerated.push(projectRoot);
      return Promise.resolve();
    },
  });

  await command.parse(['backend', 'set', 'kv-oauth', '--project-root', '/workspace']);
  await command.parse([
    'session',
    'list',
    '--stream-url',
    'http://streams.test/auth/sessions',
  ]);
  await command.parse([
    'session',
    'revoke',
    'active-1',
    '--auth-url',
    'http://auth.test/api/v1/auth',
  ]);
  assertEquals(output, [
    'kv-oauth',
    'Session\tUser\tProvider\tState\tExpires',
    'active-1\tuser-1\t-\tactive\t-',
    'Revoked active-1.',
  ]);
  assertEquals(regenerated, ['/workspace']);
  assertEquals(listedUrls, ['http://streams.test/auth/sessions']);
  assertEquals(requestOptions, [{ context }, { context }]);
  assertEquals(contextCalls, 2);
});

Deno.test('session list fails loudly when the stream URL is omitted', async () => {
  let listCalls = 0;
  const command = createAuthPluginCommand({
    fs: new MemoryFileSystemAdapter(),
    sessions: {
      list: () => {
        listCalls++;
        return Promise.resolve([]);
      },
      revoke: (_url, id) => Promise.resolve(id),
    },
    resolveProjectRoot: () => Promise.resolve('/workspace'),
  });

  await assertRejects(
    () => command.parse(['session', 'list']),
    Error,
    'Run `aspire describe streams --format Json`, append `/auth/sessions` to the streams ' +
      'HTTP endpoint, and pass it with `--stream-url`.',
  );
  assertEquals(listCalls, 0);
});

Deno.test('session CLI lists a signed-in backend session and revoke invalidates it', async () => {
  const userInfoEndpoint = 'https://issuer.example.test/oauth/userinfo';
  const registry = await createInMemoryKvOAuthRegistry({
    env: {
      NETSCRIPT_AUTH_USERINFO_ENDPOINT: userInfoEndpoint,
      NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
      NETSCRIPT_AUTH_SUBJECT_CLAIM: 'id',
    },
    fetch: (input) =>
      Promise.resolve(
        String(input) === userInfoEndpoint
          ? Response.json({ id: 'user-1' })
          : Response.json({ access_token: 'access', token_type: 'Bearer' }),
      ),
  });
  const started = await signin({}, {
    registry,
    request: { url: 'https://app.test/v1/auth/signin' },
  });
  const redirect = new URL(started.redirectUrl ?? '');
  const completed = await callback({
    code: 'code',
    state: redirect.searchParams.get('state') ?? undefined,
  }, {
    registry,
    request: { url: `https://app.test/v1/auth/callback?txn=${redirect.searchParams.get('txn')}` },
  });
  const id = completed.sessionId ?? '';
  const sessions: AuthSessionHttpPort = {
    async list() {
      const current = await session({ sessionId: id }, { registry });
      return current.authenticated && current.session
        ? [{ ...current.session, userId: current.session.subject }]
        : [];
    },
    async revoke(_url, sessionId) {
      const result = await signout({ sessionId }, {
        registry,
        request: { url: 'https://app.test/v1/auth/signout' },
      });
      return result.sessionId ?? sessionId;
    },
  };
  const output: string[] = [];
  const command = createAuthPluginCommand({
    fs: new MemoryFileSystemAdapter(),
    sessions,
    resolveProjectRoot: () => Promise.resolve('/workspace'),
    print: (line) => output.push(line),
  });
  await command.parse([
    'session',
    'list',
    '--stream-url',
    'http://streams.test/auth/sessions',
  ]);
  await command.parse([
    'session',
    'revoke',
    id,
    '--auth-url',
    'http://auth.test/api/v1/auth',
  ]);

  assertMatch(output[1], new RegExp(id));
  assertEquals((await session({ sessionId: id }, { registry })).authenticated, false);
});
