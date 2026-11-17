import { assertEquals, assertObjectMatch, assertThrows } from '@std/assert';
import { AuthConfigSchema, AuthSessionPolicySchema } from './mod.ts';

Deno.test('AuthConfigSchema applies backend and session defaults', () => {
  const parsed = AuthConfigSchema.parse({});

  assertEquals(parsed.backend, 'default');
  assertEquals(parsed.session.cookieName, '__Host-netscript-auth');
  assertEquals(parsed.providers, []);
  assertEquals('rateLimit' in parsed, false);
});

Deno.test('AuthSessionPolicySchema validates cookie policy knobs', () => {
  const parsed = AuthSessionPolicySchema.parse({
    cookieName: 'ns_session',
    cookiePath: '/auth',
    secure: true,
    sameSite: 'strict',
    httpOnly: true,
    ttlSeconds: 60,
    refreshWindowSeconds: 10,
  });

  assertEquals(parsed.sameSite, 'strict');
  assertEquals(parsed.ttlSeconds, 60);
});

Deno.test('AuthConfigSchema retains native endpoint rate-limit rules', () => {
  const rateLimit = { customRules: { '/sign-in/*': { window: 60, max: 7 } } };
  assertObjectMatch(AuthConfigSchema.parse({ rateLimit }), { rateLimit });
});

for (
  const rule of [
    { window: 0, max: 1 },
    { window: 10, max: -1 },
    { window: 1.5, max: 1 },
    { window: 10, max: 1.5 },
    { window: '10', max: 1 },
    false,
  ]
) {
  Deno.test(`AuthConfigSchema rejects invalid endpoint rate rule ${JSON.stringify(rule)}`, () => {
    assertThrows(() =>
      AuthConfigSchema.parse({ rateLimit: { customRules: { '/sign-in/*': rule } } })
    );
  });
}

Deno.test('AuthConfigSchema rejects rate-limit patterns without a leading slash', () => {
  assertThrows(() =>
    AuthConfigSchema.parse({ rateLimit: { customRules: { 'sign-in/*': { window: 10, max: 1 } } } })
  );
});
