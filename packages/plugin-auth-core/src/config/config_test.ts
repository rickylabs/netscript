import { assertEquals } from '@std/assert';
import { AuthConfigSchema, AuthSessionPolicySchema } from './mod.ts';

Deno.test('AuthConfigSchema applies backend and session defaults', () => {
  const parsed = AuthConfigSchema.parse({});

  assertEquals(parsed.backend, 'default');
  assertEquals(parsed.session.cookieName, '__Host-netscript-auth');
  assertEquals(parsed.providers, []);
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
