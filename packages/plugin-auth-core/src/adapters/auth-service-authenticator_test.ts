import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import type { AuthnRequest } from '@netscript/service/auth';
import {
  createAuthServiceAuthenticator,
  REMOTE_SESSION_REJECTIONS,
  RemoteSessionVerificationError,
} from './auth-service-authenticator.ts';

function request(authorization?: string): AuthnRequest {
  const headers = new Headers(authorization ? { authorization } : {});
  return {
    header: (name) => headers.get(name) ?? undefined,
    headers: () => headers,
    cookie: () => undefined,
    method: 'GET',
    path: '/private',
  };
}

Deno.test('remote verifier requires explicit bounded discovery and timeout policy', () => {
  for (const serviceName of ['', '  ']) {
    assertThrows(() => createAuthServiceAuthenticator({ serviceName, timeoutMs: 1000 }), TypeError);
  }
  for (const timeoutMs of [0, -1, 1.5, NaN, Infinity, 2_147_483_648]) {
    assertThrows(
      () => createAuthServiceAuthenticator({ serviceName: 'auth', timeoutMs }),
      TypeError,
    );
  }
});

Deno.test('missing and malformed bearer never require discovery or network permissions', {
  permissions: { env: false, net: false },
}, async () => {
  const verifier = createAuthServiceAuthenticator({
    serviceName: 'not-configured',
    timeoutMs: 100,
  });
  for (const header of [undefined, 'Bearer', 'Basic credential', 'Bearer a b', 'Bearer a,b']) {
    assertEquals(await verifier.authenticate(request(header)), {
      ok: false,
      reason: REMOTE_SESSION_REJECTIONS.bearerMissing,
    });
  }
});

Deno.test('unavailable discovery throws a redacted failure rather than credential denial', async () => {
  const verifier = createAuthServiceAuthenticator({
    serviceName: `absent-auth-${crypto.randomUUID()}`,
    timeoutMs: 1000,
  });
  const error = await assertRejects(
    async () => await verifier.authenticate(request('Bearer synthetic-private-credential')),
    RemoteSessionVerificationError,
  );
  assertEquals(error.code, 'transport');
  assertEquals(error.cause, undefined);
  assertEquals(JSON.stringify(error), '{"code":"transport","procedurePath":"session"}');
  assertEquals(error.message, 'Remote session verification unavailable');
});
