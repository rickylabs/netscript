/**
 * Subject-wide revocation over a real better-auth instance: `revokeSubjectSessions` wraps
 * better-auth's own `api.revokeSessions`, scoped to the subject that owns the request credential.
 */

import { assert, assertEquals, assertRejects } from '@std/assert';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import type { AuthnRequest } from '@netscript/service/auth';
import { AuthBackendOperationUnsupportedError, createBetterAuthBackend } from '../mod.ts';

function createFixture(options: { readonly cookieCache?: boolean } = {}) {
  const db = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({
    secret: crypto.randomUUID().repeat(2),
    baseURL: 'http://localhost:3000',
    database: memoryAdapter(db),
    emailAndPassword: { enabled: true },
    logger: { disabled: true },
    session: { cookieCache: { enabled: options.cookieCache ?? false, maxAge: 300 } },
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
  const authenticates = async (cookie: string) =>
    (await backend.authenticate(cookieRequest(cookie))).ok;
  /** better-auth's own read, which honors the signed cookie cache. */
  const upstreamCachedRead = async (cookie: string) =>
    await auth.api.getSession({ headers: new Headers({ cookie }) });
  return { db, backend, signUp, signIn, isActive, authenticates, upstreamCachedRead };
}

/** The complete cookie jar a browser would keep: the session token and, when enabled, the cache. */
function sessionCookie(headers: Headers): string {
  return headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ');
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
  const { backend, signUp, signIn, isActive } = createFixture();
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
  const { backend, signUp, isActive } = createFixture();
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
  const { backend, signUp, isActive } = createFixture();
  const alice = await signUp('alice@example.test');

  await assertRejects(
    () => Promise.resolve(backend.sessions.revokeSubjectSessions({ subject: alice.userId })),
    AuthBackendOperationUnsupportedError,
  );
  assertEquals(await isActive(alice.cookie), true);
});

Deno.test('better-auth global logout also ends sessions held only in the cookie cache', async () => {
  const { db, backend, signUp, signIn, authenticates, isActive, upstreamCachedRead } =
    createFixture({ cookieCache: true });
  const alice = await signUp('alice@example.test');
  const sibling = await signIn('alice@example.test');
  assert(sibling.includes('session_data='), 'the sibling jar carries a signed cache cookie');
  assertEquals(await authenticates(sibling), true);

  await backend.sessions.revokeSubjectSessions({
    subject: alice.userId,
    request: cookieRequest(alice.cookie),
  });

  assertEquals(db.session.length, 0);
  for (const jar of [alice.cookie, sibling]) {
    assertEquals(await authenticates(jar), false);
    assertEquals(await isActive(jar), false);
  }
  // Residual window, outside NetScript: better-auth's own cached read still trusts the signed
  // cache cookie until its maxAge (300 s here, better-auth's default).
  assert(await upstreamCachedRead(sibling));
});
