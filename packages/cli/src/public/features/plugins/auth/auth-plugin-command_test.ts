import { assertEquals, assertMatch, assertRejects } from '@std/assert';

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
import type { AuthSessionHttpPort } from './auth-types.ts';
import { doctorPlugin } from '../doctor/doctor-plugin-use-case.ts';

Deno.test('auth backend set reconciles .env and show reports the active backend', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/workspace/.env', '# keep me\nPORT=8094\nNETSCRIPT_AUTH_BACKEND=workos\n');

  assertEquals(await setAuthBackend('/workspace', 'kv-oauth', fs), 'kv-oauth');
  assertEquals(await showAuthBackend('/workspace', fs), 'kv-oauth');
  assertEquals(
    await fs.readFile('/workspace/.env'),
    '# keep me\nPORT=8094\nNETSCRIPT_AUTH_BACKEND=kv-oauth\n',
  );
});

Deno.test('auth backend show reads the service-supported appsettings seam', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/workspace/appsettings.json', JSON.stringify({ Auth: { Backend: 'workos' } }));
  assertEquals(await showAuthBackend('/workspace', fs), 'workos');
});

Deno.test('plugin doctor reports the configured active auth backend', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.createDir('/workspace/auth');
  await setAuthBackend('/workspace', 'better-auth', fs);
  const reports = await doctorPlugin({ projectRoot: '/workspace' }, {
    fs,
    loadConfig: () => Promise.resolve({ plugins: ['auth'] } as never),
    loadRegisteredPlugins: () => Promise.resolve({
      auth: {
        name: 'auth',
        workdir: 'auth',
        rootDir: '/workspace/auth',
        permissions: ['--allow-env'],
        cli: { doctorChecks: ['auth-backend'] },
      },
    }),
  });
  assertEquals(reports[0].checks.find((check) => check.id === 'auth-backend')?.message, 'better-auth');
});

Deno.test('github provider preset writes boot-ready OAuth environment', async () => {
  const fs = new MemoryFileSystemAdapter();
  const kvOAuthKey = generateAuthSecret('kv-oauth-key');
  await setAuthProvider({
    projectRoot: '/workspace',
    preset: 'github',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'http://localhost:8094/api/v1/auth/callback',
    kvOAuthKey,
  }, fs);

  const env = await fs.readFile('/workspace/.env');
  assertMatch(env, /NETSCRIPT_AUTH_BACKEND=kv-oauth/);
  assertMatch(env, /NETSCRIPT_AUTH_PROVIDER_ID=github/);
  assertMatch(env, /NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT=https:\/\/github.com\/login\/oauth\/authorize/);
  assertMatch(env, /NETSCRIPT_AUTH_CLIENT_SECRET=client-secret/);
  assertMatch(env, new RegExp(`NETSCRIPT_AUTH_KV_OAUTH_KEY=${kvOAuthKey}`));
  const appsettings = JSON.parse(await fs.readFile('/workspace/appsettings.json'));
  assertEquals(appsettings.Auth.Environment.NETSCRIPT_AUTH_PROVIDER_ID, 'github');
  assertEquals(
    appsettings.NetScript.Plugins.auth.Environment.NETSCRIPT_AUTH_KV_OAUTH_KEY,
    kvOAuthKey,
  );
  const registry = await createAuthServiceBackendRegistry({
    env: {},
    appsettings,
    kv: new MemoryKvAdapter(),
  });
  assertEquals(registry.defaultName, 'kv-oauth');
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
  assertMatch(await fs.readFile('/workspace/.env'), /WORKOS_COOKIE_PASSWORD=cookie-secret/);

  await setAuthProvider({ projectRoot: '/workspace', preset: 'better-auth', secret: 'better-secret' }, fs);
  assertMatch(await fs.readFile('/workspace/.env'), /BETTER_AUTH_SECRET=better-secret/);
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
  const client = new FetchAuthSessionHttp(async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    if (request.method === 'POST') {
      return Response.json({ signedOut: true, sessionId: 'session-1' });
    }
    return Response.json([{ id: 'session-1', state: 'active', userId: 'user-1' }]);
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
  const sessions: AuthSessionHttpPort = {
    list: () => Promise.resolve([
      { id: 'active-1', state: 'active', userId: 'user-1' },
      { id: 'old-1', state: 'revoked', userId: 'user-1' },
    ]),
    revoke: (_url, id) => Promise.resolve(id),
  };
  const command = createAuthPluginCommand({
    fs,
    sessions,
    resolveProjectRoot: (value) => Promise.resolve(value ?? '/workspace'),
    print: (line) => output.push(line),
    regenerateAspire: (projectRoot) => {
      regenerated.push(projectRoot);
      return Promise.resolve();
    },
  });

  await command.parse(['backend', 'set', 'kv-oauth', '--project-root', '/workspace']);
  await command.parse(['session', 'list']);
  await command.parse(['session', 'revoke', 'active-1']);
  assertEquals(output, [
    'kv-oauth',
    'Session\tUser\tProvider\tState\tExpires',
    'active-1\tuser-1\t-\tactive\t-',
    'Revoked active-1.',
  ]);
  assertEquals(regenerated, ['/workspace']);
});

Deno.test('session CLI lists a signed-in backend session and revoke invalidates it', async () => {
  const registry = await createInMemoryKvOAuthRegistry({
    fetch: () => Promise.resolve(Response.json({ access_token: 'access', token_type: 'Bearer' })),
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
  await command.parse(['session', 'list']);
  await command.parse(['session', 'revoke', id]);

  assertMatch(output[1], new RegExp(id));
  assertEquals((await session({ sessionId: id }, { registry })).authenticated, false);
});
