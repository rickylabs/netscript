import { assertEquals } from '@std/assert';
import { buildAuthSession, buildAuthUser } from './mod.ts';

Deno.test('buildAuthUser creates overrideable users', () => {
  const user = buildAuthUser({ id: 'user_2' });

  assertEquals(user.id, 'user_2');
  assertEquals(user.emailVerified, true);
});

Deno.test('buildAuthSession creates overrideable sessions', () => {
  const session = buildAuthSession({ scopes: ['auth:read'] });

  assertEquals(session.state, 'active');
  assertEquals(session.scopes, ['auth:read']);
});
