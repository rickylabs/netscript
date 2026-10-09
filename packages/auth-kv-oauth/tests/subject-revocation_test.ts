/**
 * Subject-scoped revocation: `revokeSubjectSessions` ends every session of one subject and no other.
 */

import { assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  type AuthSession,
  createKvOAuthBackend,
  createKvOAuthStore,
  defineOAuthProvider,
} from '../mod.ts';

const testKey = new ArrayBuffer(32);
new Uint8Array(testKey).fill(7);

async function createFixture() {
  const store = await createKvOAuthStore({ kv: new MemoryKvAdapter(), encryptionKey: testKey });
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
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
  const stateOf = async (id: string) => (await store.getSession(id))?.session.state;
  return { store, backend, createFor, stateOf };
}

Deno.test('revokeSubjectSessions revokes every session of the subject and no other', async () => {
  const { backend, createFor, stateOf } = await createFixture();
  const own = [await createFor('user-a'), await createFor('user-a'), await createFor('user-a')];
  const other = await createFor('user-b');

  const revoked = await backend.sessions.revokeSubjectSessions('user-a');

  assertEquals(
    revoked.map((session) => session.id).sort(),
    own.map((session) => session.id).sort(),
  );
  for (const session of revoked) assertEquals(session.state, 'revoked');
  for (const session of own) assertEquals(await stateOf(session.id), 'revoked');
  assertEquals(await stateOf(other.id), 'active');
  // A repeated global logout has nothing left to revoke.
  assertEquals(await backend.sessions.revokeSubjectSessions('user-a'), []);
});

Deno.test('subject index follows rotation and deletion', async () => {
  const { store, backend, createFor, stateOf } = await createFixture();
  const rotated = await createFor('user-a');
  const deleted = await createFor('user-a');
  await backend.sessions.refreshSession(rotated.id);
  await store.deleteSession(deleted.id);

  const listed: string[] = [];
  for await (const id of store.listSubjectSessionIds('user-a')) listed.push(id);
  assertEquals(listed, [rotated.id]);

  const revoked = await backend.sessions.revokeSubjectSessions('user-a');
  assertEquals(revoked.map((session) => session.id), [rotated.id]);
  assertEquals(await stateOf(rotated.id), 'revoked');
});
