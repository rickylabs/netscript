/**
 * Subject-wide revocation over a real better-auth instance: `revokeSubjectSessions` wraps
 * better-auth's own `api.revokeSessions`, scoped to the subject that owns the request credential.
 */

import { assertEquals, assertRejects } from '@std/assert';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import type { AuthnRequest } from '@netscript/service/auth';
import { AuthBackendOperationUnsupportedError, createBetterAuthBackend } from '../mod.ts';

async function createFixture() {
  const db = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({
    secret: crypto.randomUUID().repeat(2),
    baseURL: 'http://localhost:3000',
    database: memoryAdapter(db),
    emailAndPassword: { enabled: true },
    logger: { disabled: true },
  });
  const backend = createBetterAuthBackend({ auth, sessionTokenSecret: crypto.randomUUID() });
  const signUp = async (email: string) => {
    const result = await auth.api.signUpEmail({
      body: { email, password: 'password-1234', name: email },
      returnHeaders: true,
    });
    return { userId: result.response.user.id, cookie: sessionCookie(result.headers) };
  };
  const signIn = async (email: string) =>
    sessionCookie(
      (await auth.api.signInEmail({
        body: { email, password: 'password-1234' },
        returnHeaders: true,
      })).headers,
    );
  const isActive = async (cookie: string) =>
    (await backend.sessions.getSession({ request: cookieRequest(cookie) }))?.state === 'active';
  return { backend, signUp, signIn, isActive };
}

function sessionCookie(headers: Headers): string {
  return (headers.get('set-cookie') ?? '').split(';')[0];
}

function cookieRequest(cookie: string): AuthnRequest {
  const headers = new Headers({ cookie });
  return {
    method: 'POST',
    path: '/api/v1/auth/signout',
    header: (name) => headers.get(name) ?? undefined,
    headers: () => new Headers(headers),
    cookie: () => undefined,
  };
}

Deno.test('better-auth revokeSubjectSessions ends every session of the subject and no other', async () => {
  const { backend, signUp, signIn, isActive } = await createFixture();
  const alice = await signUp('alice@example.test');
  const aliceElsewhere = await signIn('alice@example.test');
  const bob = await signUp('bob@example.test');

  const result = await backend.sessions.revokeSubjectSessions({
    subject: alice.userId,
    request: cookieRequest(alice.cookie),
  });

  assertEquals(result.subject, alice.userId);
  assertEquals(await isActive(alice.cookie), false);
  assertEquals(await isActive(aliceElsewhere), false);
  assertEquals(await isActive(bob.cookie), true);
});

Deno.test('better-auth revokeSubjectSessions refuses a credential of another subject', async () => {
  const { backend, signUp, isActive } = await createFixture();
  const alice = await signUp('alice@example.test');
  const bob = await signUp('bob@example.test');

  await assertRejects(
    () =>
      Promise.resolve(backend.sessions.revokeSubjectSessions({
        subject: alice.userId,
        request: cookieRequest(bob.cookie),
      })),
    Error,
    'the credential is not the subject',
  );
  assertEquals(await isActive(alice.cookie), true);
  assertEquals(await isActive(bob.cookie), true);
});

Deno.test('better-auth revokeSubjectSessions needs the caller request', async () => {
  const { backend, signUp, isActive } = await createFixture();
  const alice = await signUp('alice@example.test');

  await assertRejects(
    () => Promise.resolve(backend.sessions.revokeSubjectSessions({ subject: alice.userId })),
    AuthBackendOperationUnsupportedError,
  );
  assertEquals(await isActive(alice.cookie), true);
});
