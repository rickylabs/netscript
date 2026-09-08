import { assertEquals } from '@std/assert';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { implement, os } from '@orpc/server';
import {
  type AuthenticatorPort,
  createContractAuthorizer,
  createScopeAuthorizer,
  createStaticCredentialAuthenticator,
} from '@netscript/service/auth';
import {
  assemblePluginContractRouter,
  createPluginService,
  type PluginServiceConfig,
} from '../../src/service/mod.ts';
import { mountPluginContract } from '../../src/contract-base/mod.ts';

Deno.test('mounted contract authorizes assembled REST, RPC and compatibility RPC from procedure scopes', async () => {
  const definition = {
    list: baseContract.route({ method: 'GET', path: '/items' }).output(SuccessSchema)
      .meta({ access: { authentication: 'required', authorization: { scopes: ['sample:read'] } } }),
  };
  const mount = { version: 'v1', namespace: 'sample' };
  const implementation = implement(definition);
  const handlers = { list: implementation.list.handler(() => ({ success: true })) };
  const router = assemblePluginContractRouter(implementation, { ...mount, handlers });
  const app = createPluginService(router, {
    name: 'sample',
    auth: {
      authn: { authenticator },
      authz: { authorizer: createContractAuthorizer(mountPluginContract(definition, mount)) },
    },
  }).build();
  for (
    const [path, method] of [
      ['/api/v1/sample/items', 'GET'],
      ['/api/rpc/v1/sample/list', 'POST'],
      ['/api/rpc/v1/list', 'POST'],
    ]
  ) {
    for (const [token, status] of [['read', 200], ['write', 403]] as const) {
      const response = await app.request(path, {
        method,
        headers: { authorization: `Bearer ${token}` },
      });
      assertEquals(response.status, status, `${method} ${path} ${token}`);
      await response.arrayBuffer();
    }
  }
});

const contract = {
  list: baseContract.route({ method: 'GET', path: '/items' }).output(SuccessSchema),
};
const events: string[] = [];
const implemented = implement(contract);
const handlers = os.router({
  list: implemented.list.handler(() => {
    events.push('handler');
    return { success: true };
  }),
});
const router = assemblePluginContractRouter(
  { router: () => handlers },
  { version: 'v1', namespace: 'sample', handlers },
);
const authenticator = createStaticCredentialAuthenticator({
  credentials: {
    read: { subject: 'reader', scopes: ['sample:read'] },
    write: { subject: 'writer', scopes: ['sample:write'] },
  },
});
const authorizer = createScopeAuthorizer({
  rules: [{ match: () => true, requireScopes: ['sample:read'] }],
});
const auth = { authn: { authenticator }, authz: { authorizer } };
const paths = [
  { path: '/api/v1/sample/items', method: 'GET' },
  { path: '/api/rpc/v1/sample/list', method: 'POST' },
  { path: '/api/raw', method: 'GET' },
];

function config(): PluginServiceConfig {
  return {
    name: 'sample',
    auth,
    openApi: { title: 'Guarded fixture' },
    rawRoutes: [{ method: 'get', path: '/api/raw', handler: (c) => c.json({ success: true }) }],
  };
}

Deno.test('plugin factory guards REST, RPC and raw routes independently of configuration key order', async () => {
  const original = config();
  const reordered: PluginServiceConfig = {
    rawRoutes: original.rawRoutes,
    openApi: original.openApi,
    auth: original.auth,
    name: original.name,
    serveRpc: true,
  };
  for (const options of [original, reordered]) {
    const app = createPluginService(router, options).build();
    for (const { path, method } of paths) {
      for (const [token, status] of [['', 401], ['write', 403], ['read', 200]] as const) {
        const response = await app.request(path, {
          method,
          headers: token ? { authorization: `Bearer ${token}` } : {},
        });
        assertEquals(response.status, status, `${method} ${path} with ${token || 'no credential'}`);
        await response.arrayBuffer();
      }
    }
    for (const path of ['/health', '/health/live', '/health/ready', '/']) {
      const response = await app.request(path);
      assertEquals(response.status, 200, path);
      await response.arrayBuffer();
    }
    const spec = await app.request('/api/openapi.json');
    assertEquals(spec.status, 401);
    await spec.arrayBuffer();
  }
});

Deno.test('plugin factory preserves native health routes and anonymous-prefix replacement', async () => {
  const app = createPluginService(router, {
    ...config(),
    auth: { authn: { authenticator, protect: ['/'], allowAnonymous: ['/api/openapi.json'] } },
    rawRoutes: [{ method: 'get', path: '/health/private', handler: (c) => c.text('guarded') }],
  }).build();
  const spec = await app.request('/api/openapi.json');
  assertEquals(spec.status, 200);
  await spec.arrayBuffer();
  const health = await app.request('/health');
  assertEquals(health.status, 200);
  await health.arrayBuffer();
  const privateHealth = await app.request('/health/private');
  assertEquals(privateHealth.status, 401);
  await privateHealth.arrayBuffer();
});

Deno.test('plugin factory rejects RPC before entering its handler', async () => {
  events.length = 0;
  const recording: AuthenticatorPort = {
    authenticate(request) {
      events.push('authenticate');
      return authenticator.authenticate(request);
    },
  };
  const app = createPluginService(router, {
    ...config(),
    auth: { authn: { authenticator: recording } },
  }).build();
  const response = await app.request('/api/rpc/v1/sample/list', { method: 'POST' });
  assertEquals(response.status, 401);
  await response.arrayBuffer();
  assertEquals(events, ['authenticate']);
});

Deno.test('plugin factory reports verifier failure as redacted unavailable', async () => {
  const app = createPluginService(router, {
    ...config(),
    auth: {
      authn: {
        authenticator: {
          authenticate() {
            throw new Error('sensitive-verifier-detail');
          },
        },
      },
    },
  }).build();
  const response = await app.request('/api/rpc/v1/sample/list', { method: 'POST' });
  assertEquals(response.status, 503);
  assertEquals((await response.text()).includes('sensitive-verifier-detail'), false);
});

Deno.test('plugin factory rejects missing or ambiguous policy at a JavaScript caller boundary', async () => {
  const moduleUrl = new URL('../../src/service/mod.ts', import.meta.url).href;
  const configPath = new URL('../../../../deno.json', import.meta.url).pathname;
  const source = `
    import { createPluginService } from ${JSON.stringify(moduleUrl)};
    for (const auth of [undefined, {}, { public: true }, { public: true, reason: 'test', authn: undefined }]) {
      try { createPluginService({}, { name: 'invalid', auth }); }
      catch (error) {
        if (error instanceof TypeError && error.message.includes('Service auth requires')) continue;
        throw error;
      }
      throw new Error('Malformed policy was accepted');
    }
  `;
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['eval', '--config', configPath, source],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
});
