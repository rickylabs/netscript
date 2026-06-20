import { assertEquals } from '@std/assert';
import { AUTH_SESSION_STATES, AuthSessionSchema } from './mod.ts';

Deno.test('AuthSessionSchema validates normalized sessions', () => {
  const parsed = AuthSessionSchema.parse({
    id: 'sess_1',
    userId: 'user_1',
    state: AUTH_SESSION_STATES.active,
    subject: 'user:user_1',
    scopes: ['profile:read'],
    roles: ['user'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
  });

  assertEquals(parsed.claims, {});
  assertEquals(parsed.state, 'active');
});
