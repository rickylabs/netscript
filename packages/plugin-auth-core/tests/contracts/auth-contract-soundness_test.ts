import { assert, assertEquals } from '@std/assert';
import type {
  AuthSessionResponse,
  SessionResponse,
  SigninInput,
  SigninResponse,
} from '../../src/contracts/v1/mod.ts';
import { authContractV1 } from '../../src/contracts/v1/mod.ts';
import { AUTH_SESSION_STATES } from '../../src/domain/mod.ts';
import type { AuthSessionState } from '../../src/domain/mod.ts';

// ============================================================================
// Type-level soundness assertions for the precise auth contract.
//
// These compile-time checks lock in the 172a-2-SOUND invariant: the auth
// contract carries PRECISE input/output types, not loosened
// `any`/`string`/`Record<string, unknown>` stand-ins. Each `@ts-expect-error`
// below MUST stay an error — deleting one (i.e. re-loosening the type) breaks
// the build, which is exactly the regression guard we want. This mirrors
// `plugin-sagas-core/tests/contracts/sagas-contract-soundness_test.ts`.
// ============================================================================

// --- signin input is precisely typed -----------------------------------------

// Positive: a well-formed signin input conforms.
const _validSignin = {
  providerId: 'github',
  redirectTo: '/dashboard',
} satisfies SigninInput;

// Negative: `providerId` is a string, not a number. Re-loosening to `any` would
// silence this and remove the @ts-expect-error error.
const _badSigninInput: SigninInput = {
  // @ts-expect-error - `providerId` must be a string
  providerId: 123,
};

// --- signin output keeps `started: boolean` ----------------------------------

// Negative: `started` is a boolean; a string must not satisfy the output.
const _badSigninOut: SigninResponse = {
  // @ts-expect-error - `started` must be a boolean
  started: 'yes',
};

// --- AuthSessionResponse always carries the required `subject` ----------------

// Negative: omitting the required `subject` must fail.
// @ts-expect-error - `subject` is required on AuthSessionResponse
const _badSession: AuthSessionResponse = {
  id: 's-1',
  userId: 'u-1',
  state: 'active',
  scopes: [],
  roles: [],
  claims: {},
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-02T00:00:00.000Z',
};

// --- session `state` is the enum, not a bare `string` -------------------------

// Positive: a canonical enum value conforms.
const _validState: AuthSessionState = 'active';

// Negative: an arbitrary string is not a valid session `state` enum member.
// @ts-expect-error - 'pending' is not an AuthSessionState
const _badState: AuthSessionResponse['state'] = 'pending';

// --- session response `authenticated` flag is required ------------------------

// Negative: a non-boolean `authenticated` must fail.
const _badSessionResponse: SessionResponse = {
  // @ts-expect-error - `authenticated` must be a boolean
  authenticated: 'maybe',
};

Deno.test('auth contract exposes a precise, non-loosened type surface', () => {
  // Reference the type-level bindings at runtime so they are not unused, and
  // confirm the implementer value (precise oRPC contract) is present.
  assertEquals(typeof authContractV1.signin, 'object');
  assertEquals(typeof authContractV1.describe, 'object');
  assertEquals(_validSignin.providerId, 'github');
  assertEquals(_badSigninInput.providerId as unknown, 123);
  assertEquals(_badSigninOut.started as unknown, 'yes');
  assertEquals(_badSession.id, 's-1');
  assertEquals(_validState, AUTH_SESSION_STATES.active);
  assertEquals(_badState as unknown, 'pending');
  assertEquals(_badSessionResponse.authenticated as unknown, 'maybe');
});

Deno.test('auth contract carries validated Standard Schema base error data', () => {
  const errorMap = authContractV1.signin['~orpc'].errorMap;

  for (const code of ['NOT_FOUND', 'VALIDATION_ERROR', 'INTERNAL'] as const) {
    const definition = errorMap[code];
    assert(definition?.data, `${code} must carry a data schema`);
    assertEquals(definition.data['~standard'].version, 1);
    assertEquals(typeof definition.data['~standard'].validate, 'function');
  }
});
