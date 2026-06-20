import { assertEquals } from '@std/assert';
import {
  AUTH_STREAM_EVENT_TYPES,
  AuthStreamEventSchema,
  authStreamSchema,
  AuthStreamSessionSchema,
} from './mod.ts';

Deno.test('AuthStreamEventSchema validates known auth event names', () => {
  const parsed = AuthStreamEventSchema.parse({
    type: 'auth.session.revoked',
    timestamp: '2026-01-01T00:00:00.000Z',
    sessionId: 'sess_1',
  });

  assertEquals(parsed.type, 'auth.session.revoked');
  assertEquals(AUTH_STREAM_EVENT_TYPES.includes(parsed.type), true);
});

Deno.test('AuthStreamSessionSchema validates stream session entities', () => {
  const parsed = AuthStreamSessionSchema.parse({
    id: 'sess_1',
    userId: 'user_1',
    state: 'active',
    subject: 'user:user_1',
    scopes: [],
    roles: [],
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
  });

  assertEquals(parsed.claims, {});
});

Deno.test('authStreamSchema exposes the authSession collection', () => {
  assertEquals(authStreamSchema.authSession.type, 'auth-session');
  assertEquals(authStreamSchema.authSession.primaryKey, 'id');
});
