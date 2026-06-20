import { assertEquals } from '@std/assert';
import {
  authContract,
  AuthSessionResponseSchema,
  CallbackInputSchema,
  SigninInputSchema,
} from './mod.ts';

Deno.test('authContract exposes the v1 auth procedures', () => {
  assertEquals(Object.keys(authContract), ['signin', 'callback', 'signout', 'session', 'me']);
});

Deno.test('SigninInputSchema validates provider signin input', () => {
  const parsed = SigninInputSchema.parse({
    providerId: 'workos',
    scopes: ['openid', 'profile'],
  });

  assertEquals(parsed.providerId, 'workos');
});

Deno.test('CallbackInputSchema accepts provider callback fields', () => {
  const parsed = CallbackInputSchema.parse({
    providerId: 'workos',
    code: 'code_1',
    state: 'state_1',
  });

  assertEquals(parsed.code, 'code_1');
});

Deno.test('AuthSessionResponseSchema defaults response claims', () => {
  const parsed = AuthSessionResponseSchema.parse({
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
