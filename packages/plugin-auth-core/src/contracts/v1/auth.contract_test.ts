import { assertEquals } from '@std/assert';
import {
  authContract,
  authContractV1,
  AuthSessionResponseSchema,
  type CallbackInput,
  CallbackInputSchema,
  type CallbackResponse,
  type SigninInput,
  SigninInputSchema,
  type SigninResponse,
} from './mod.ts';

type Equal<TLeft, TRight> = (<T>() => T extends TLeft ? 1 : 2) extends
  (<T>() => T extends TRight ? 1 : 2) ? true
  : false;
type Expect<T extends true> = T;
type HasKey<TValue, TKey extends PropertyKey> = TKey extends keyof TValue ? true : false;

type AuthTestContext = Record<PropertyKey, unknown> & Readonly<{ requestId: string }>;

Deno.test('authContract exposes the v1 auth procedures', () => {
  assertEquals(Object.keys(authContract), ['signin', 'callback', 'signout', 'session', 'me']);
});

Deno.test('authContractV1 exposes typed context-bound procedures and errors', () => {
  const router = authContractV1.$context<AuthTestContext>();

  router.signin.handler(({ input, context, errors }) => {
    type _SigninInput = Expect<Equal<typeof input, SigninInput>>;
    type _Context = Expect<typeof context extends AuthTestContext ? true : false>;
    type _UnauthorizedError = Expect<HasKey<typeof errors, 'UNAUTHORIZED'>>;
    assertEquals('UNAUTHORIZED' in errors, true);

    return {
      started: true,
      providerId: input.providerId,
      state: input.state,
    } satisfies SigninResponse;
  });

  router.callback.handler(({ input, errors }) => {
    type _CallbackInput = Expect<Equal<typeof input, CallbackInput>>;
    type _ProviderError = Expect<HasKey<typeof errors, 'AUTH_PROVIDER_ERROR'>>;
    assertEquals('AUTH_PROVIDER_ERROR' in errors, true);

    return {
      completed: true,
      redirectTo: input.redirectTo,
    } satisfies CallbackResponse;
  });
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
