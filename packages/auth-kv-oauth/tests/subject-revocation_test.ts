/**
 * Subject-scoped revocation: `revokeSubjectSessions` ends every session of one subject and no
 * other, with one subject-level write, including sessions persisted before the operation existed.
 */

import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import type { AuthnRequest } from '@netscript/service/auth';
import {
  type AuthSession,
  createKvOAuthBackend,
  createKvOAuthStore,
  defineOAuthProvider,
  type KvOAuthSessionRecord,
} from '../mod.ts';

const testKey = new ArrayBuffer(32);
new Uint8Array(testKey).fill(7);
const NAMESPACE = ['auth-kv-oauth'] as const;

/** Records every KV method call made while `counting` is on. */
function countingKv(): { kv: MemoryKvAdapter; calls: string[]; count(on: boolean): void } {
  const target = new MemoryKvAdapter();
  const calls: string[] = [];
  let counting = false;
  const kv = new Proxy(target, {
    get(object, property) {
      const value = Reflect.get(object, property, object);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        if (counting) calls.push(String(property));
        return value.apply(object, args);
      };
    },
  });
  return { kv, calls, count: (on) => (counting = on) };
}

async function createFixture() {
  const counter = countingKv();
  const store = await createKvOAuthStore({ kv: counter.kv, encryptionKey: testKey });
  const backend = await createKvOAuthBackend({
    provider: defineOAuthProvider({
      id: 'stub',
      displayName: 'Stub',
      clientId: 'client_test',
      clientSecret: 'secret_test',
      authorizationEndpoint: 'https://issuer.example.test/oauth/authorize',
      tokenEndpoint: 'https://issuer.example.test/oauth/token',
      redirectUri: 'https://app.example.test/auth/callback',
    }),
    store,
    refreshMode: 'never',
  });
  const createFor = async (subject: string): Promise<AuthSession> =>
    await backend.sessions.createSession({
      userId: subject,
      subject,
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    });
  const stateOf = async (id: string) =>
    (await backend.sessions.getSession({ sessionId: id }))?.state;
  const authenticates = async (id: string) => (await backend.authenticate(cookieRequest(id))).ok;
  return { ...counter, store, backend, createFor, stateOf, authenticates };
}

function cookieRequest(sessionId: string): AuthnRequest {
  const headers = new Headers({ cookie: `__Host-ns_session=${sessionId}` });
  return {
    method: 'POST',
    path: '/api/v1/auth/signout',
    header: (name) => headers.get(name) ?? undefined,
    headers: () => headers,
    cookie: (name) => name === '__Host-ns_session' ? sessionId : undefined,
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 2));

Deno.test('revokeSubjectSessions revokes every session of the subject and no other', async () => {
  const { backend, createFor, stateOf, authenticates } = await createFixture();
  const own = [await createFor('user-a'), await createFor('user-a'), await createFor('user-a')];
  const other = await createFor('user-b');
  const prefixed = await createFor('user-a-suffix');

  const result = await backend.sessions.revokeSubjectSessions({ subject: 'user-a' });

  assertEquals(result.subject, 'user-a');
  for (const session of own) {
    assertEquals(await stateOf(session.id), 'revoked');
    assertEquals(await authenticates(session.id), false);
  }
  for (const session of [other, prefixed]) {
    assertEquals(await stateOf(session.id), 'active');
    assertEquals(await authenticates(session.id), true);
  }
});

Deno.test('a session persisted before the upgrade is revoked by a later global logout', async () => {
  const { kv, backend, stateOf, authenticates } = await createFixture();
  // Pre-upgrade layout: the bare session record, written without any subject-level bookkeeping.
  const legacy: KvOAuthSessionRecord = {
    session: {
      id: 'sess_legacy',
      userId: 'user-a',
      providerId: 'stub',
      state: 'active',
      subject: 'user-a',
      scopes: [],
      roles: [],
      claims: {},
      issuedAt: new Date(Date.now() - 60_000).toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    },
    tokens: { keyId: 'legacy', sealed: 'legacy' },
  };
  await kv.set([...NAMESPACE, 'session', legacy.session.id], legacy);
  assertEquals(await authenticates(legacy.session.id), true);

  await backend.sessions.revokeSubjectSessions({ subject: 'user-a' });

  assertEquals(await stateOf(legacy.session.id), 'revoked');
  assertEquals(await authenticates(legacy.session.id), false);
});

Deno.test('global logout does constant work however many historical sessions the subject has', async () => {
  const { backend, createFor, stateOf, calls, count } = await createFixture();
  const sessions: AuthSession[] = [];
  for (let index = 0; index < 1_000; index += 1) sessions.push(await createFor('user-many'));
  for (const session of sessions.slice(0, 500)) await backend.sessions.revokeSession(session.id);

  count(true);
  await backend.sessions.revokeSubjectSessions({ subject: 'user-many' });
  count(false);

  // One read of the subject marker plus one compare-and-set write; no listing, no per-session I/O.
  assertEquals(calls, ['get', 'atomic']);
  for (const session of sessions) assertEquals(await stateOf(session.id), 'revoked');
});

Deno.test('a session issued after the global logout stays valid', async () => {
  const { backend, createFor, stateOf } = await createFixture();
  const before = await createFor('user-a');
  await backend.sessions.revokeSubjectSessions({ subject: 'user-a' });
  await tick();
  const after = await createFor('user-a');

  assertEquals(await stateOf(before.id), 'revoked');
  assertEquals(await stateOf(after.id), 'active');
});

Deno.test('the subject revocation instant only moves forward', async () => {
  const { store } = await createFixture();
  const later = new Date().toISOString();
  const earlier = new Date(Date.parse(later) - 60_000).toISOString();

  assertEquals(await store.revokeSubject('user-a', later), later);
  assertEquals(await store.revokeSubject('user-a', earlier), later);
  assertEquals(await store.getSubjectRevocation('user-a'), later);
  assert((await store.getSubjectRevocation('user-b')) === undefined);
});
