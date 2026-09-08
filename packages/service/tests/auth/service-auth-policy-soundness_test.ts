import { assertEquals } from '@std/assert';
import { createStaticCredentialAuthenticator, type ServiceAuthPolicy } from '../../src/auth/mod.ts';

const authn = { authenticator: createStaticCredentialAuthenticator({ credentials: {} }) };

Deno.test('service auth policy types reject omitted, ambiguous and malformed postures', () => {
  // @ts-expect-error A service posture cannot be omitted.
  const missing: ServiceAuthPolicy = {};
  // @ts-expect-error A public posture needs an auditable reason.
  const reasonless: ServiceAuthPolicy = { public: true };
  // @ts-expect-error A public posture cannot carry authentication.
  const ambiguous: ServiceAuthPolicy = { public: true, reason: 'test', authn };
  // @ts-expect-error Only the literal true is a public opt-out.
  const invalidMarker: ServiceAuthPolicy = { public: 'yes', reason: 'test' };
  // @ts-expect-error Native authentication requires an authenticator.
  const malformedGuard: ServiceAuthPolicy = { authn: {} };
  assertEquals([missing, reasonless, ambiguous, invalidMarker, malformedGuard].length, 5);
});
