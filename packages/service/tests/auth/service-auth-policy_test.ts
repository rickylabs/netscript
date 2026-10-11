import { assertEquals, assertStrictEquals, assertThrows } from '@std/assert';
import {
  assertServiceAuthPolicy,
  createScopeAuthorizer,
  createStaticCredentialAuthenticator,
  type ServiceAuthPolicy,
} from '../../src/auth/mod.ts';

const authn = {
  authenticator: createStaticCredentialAuthenticator({ credentials: {} }),
  protect: ['/private'],
  allowAnonymous: ['/public'],
};
const authz = { authorizer: createScopeAuthorizer({ rules: [] }), denyByDefault: true };

Deno.test('service auth policy accepts authz undefined as absent', () => {
  const guarded: ServiceAuthPolicy = { authn, authz: undefined };
  assertServiceAuthPolicy(guarded);
  assertStrictEquals(guarded.authn, authn);
  assertEquals(guarded.authz, undefined);
});

Deno.test('service auth policy preserves native option identity and explicit public reason', () => {
  const guarded: ServiceAuthPolicy = { authn, authz };
  assertServiceAuthPolicy(guarded);
  assertStrictEquals(guarded.authn, authn);
  assertStrictEquals(guarded.authz, authz);
  assertEquals(authn.allowAnonymous, ['/public']);
  assertServiceAuthPolicy({ authn });
  const publicPolicy = { public: true, reason: '  Public status endpoint  ' };
  assertServiceAuthPolicy(publicPolicy);
  assertEquals(publicPolicy.reason, '  Public status endpoint  ');
});

const invalidPolicies: readonly { name: string; value: unknown }[] = [
  { name: 'missing', value: undefined },
  { name: 'null', value: null },
  { name: 'string', value: 'public' },
  { name: 'number', value: 1 },
  { name: 'array', value: [] },
  { name: 'empty', value: {} },
  { name: 'reason missing', value: { public: true } },
  { name: 'reason nonstring', value: { public: true, reason: 1 } },
  { name: 'reason empty', value: { public: true, reason: '' } },
  { name: 'reason whitespace', value: { public: true, reason: ' \t\n' } },
  { name: 'public string', value: { public: 'yes', reason: 'test' } },
  { name: 'public number', value: { public: 1, reason: 'test' } },
  { name: 'public false', value: { public: false, authn } },
  { name: 'both postures', value: { public: true, reason: 'test', authn } },
  { name: 'public authn undefined', value: { public: true, reason: 'test', authn: undefined } },
  { name: 'public authz', value: { public: true, reason: 'test', authz } },
  { name: 'public authz undefined', value: { public: true, reason: 'test', authz: undefined } },
  { name: 'guarded public undefined', value: { authn, public: undefined } },
  { name: 'guarded reason', value: { authn, reason: 'test' } },
  { name: 'guarded reason undefined', value: { authn, reason: undefined } },
  { name: 'authn missing', value: { authz } },
  { name: 'authn null', value: { authn: null } },
  { name: 'authn array', value: { authn: [] } },
  { name: 'authn primitive', value: { authn: true } },
  { name: 'authenticator missing', value: { authn: {} } },
  { name: 'authenticator null', value: { authn: { authenticator: null } } },
  { name: 'authenticate missing', value: { authn: { authenticator: {} } } },
  { name: 'authenticate noncallable', value: { authn: { authenticator: { authenticate: 1 } } } },
  { name: 'authz null', value: { authn, authz: null } },
  { name: 'authz array', value: { authn, authz: [] } },
  { name: 'authz primitive', value: { authn, authz: false } },
  { name: 'authorizer missing', value: { authn, authz: {} } },
  { name: 'authorizer null', value: { authn, authz: { authorizer: null } } },
  { name: 'authorize missing', value: { authn, authz: { authorizer: {} } } },
  { name: 'authorize noncallable', value: { authn, authz: { authorizer: { authorize: 1 } } } },
];

for (const { name, value } of invalidPolicies) {
  Deno.test(`service auth policy rejects ${name}`, () => {
    assertThrows(() => assertServiceAuthPolicy(value), TypeError, 'Service auth requires');
  });
}

Deno.test('service auth policy diagnostics never serialize caller data', () => {
  const error = assertThrows(
    () => assertServiceAuthPolicy({ public: 'private-sensitive-value', reason: 'secret-reason' }),
    TypeError,
  );
  assertEquals(error.message.includes('private-sensitive-value'), false);
  assertEquals(error.message.includes('secret-reason'), false);
});

Deno.test('guarded policy composes contract access across REST and RPC without exposing protected handlers', async () => {
  const { baseContract } = await import('@netscript/contracts');
  const { implement } = await import('@orpc/server');
  const { z } = await import('zod');
  const { defineService } = await import('../../mod.ts');
  const { createContractAuthorizer } = await import('../../src/auth/mod.ts');
  const contract = {
    public: baseContract.route({ method: 'POST', path: '/public' })
      .meta({ access: { authentication: 'none' } }).output(z.boolean()),
    protected: baseContract.route({ method: 'POST', path: '/protected' })
      .meta({ access: { authentication: 'required' } }).output(z.boolean()),
    denied: baseContract.route({ method: 'POST', path: '/denied' })
      .meta({ access: { authentication: 'required', authorization: { scopes: ['admin'] } } })
      .output(z.boolean()),
  };
  let protectedCalls = 0;
  let deniedCalls = 0;
  const binding = implement(contract);
  const router = {
    v1: {
      proof: {
        public: binding.public.handler(() => true),
        protected: binding.protected.handler(() => {
          protectedCalls++;
          return true;
        }),
        denied: binding.denied.handler(() => {
          deniedCalls++;
          return true;
        }),
      },
    },
  };
  const policy: ServiceAuthPolicy = {
    authn: {
      authenticator: createStaticCredentialAuthenticator({
        credentials: { reader: { subject: 'reader', scopes: [] } },
      }),
      allowAnonymous: ['/health', '/api/docs', '/api/openapi.json'],
    },
    authz: { authorizer: createContractAuthorizer(router) },
  };
  assertServiceAuthPolicy(policy);
  const service = await defineService(router, { name: 'policy-proof', port: 0, auth: policy });
  try {
    for (const path of ['/health', '/api/docs', '/api/openapi.json']) {
      const response = await service.app.request(path);
      assertEquals(response.status, 200, path);
      await response.body?.cancel();
    }
    for (const prefix of ['/api/', '/api/rpc/v1/proof/']) {
      for (
        const [procedure, credential, expected] of [
          ['public', undefined, 200],
          ['protected', undefined, 401],
          ['protected', 'reader', 200],
          ['denied', undefined, 401],
          ['denied', 'reader', 403],
        ] as const
      ) {
        const response = await service.app.request(`${prefix}${procedure}`, {
          method: 'POST',
          headers: credential ? { authorization: `Bearer ${credential}` } : {},
        });
        assertEquals(response.status, expected, `${prefix}${procedure}`);
        await response.body?.cancel();
      }
    }
    assertEquals(protectedCalls, 2);
    assertEquals(deniedCalls, 0);
  } finally {
    await service.stop();
  }
});
