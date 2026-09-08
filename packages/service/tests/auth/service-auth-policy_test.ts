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
  { name: 'authz undefined', value: { authn, authz: undefined } },
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
