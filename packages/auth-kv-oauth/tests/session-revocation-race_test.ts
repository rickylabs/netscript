/**
 * Deterministic native-store coverage for `revokeSession` compare-and-set races.
 *
 * Every case runs the real backend over a disposable Deno KV database file. The barrier adapter
 * delays an atomic commit; separate store gates delay calls before CAS. Two bounded-conflict tests
 * stub rotateSession to return false. The encryption key is generated in memory, injected fetches
 * never contact the network, and the database is closed and removed in `finally`.
 */

import { assertEquals, assertRejects } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import {
  type AtomicCheck,
  type AtomicMutation,
  type AtomicResult,
  type AuthnRequest,
  type AuthSession,
  createKvOAuthBackend,
  createKvOAuthStore,
  defineOAuthProvider,
  type KvOAuthBackend,
  KvOAuthError,
  type KvOAuthStore,
} from '../mod.ts';

const SESSION_COOKIE = '__Host-ns_session';

/** Deno KV adapter that holds the first atomic commit until it is released. */
class BarrierKvAdapter extends DenoKvAdapter {
  #armed = false;
  readonly #entered = Promise.withResolvers<void>();
  readonly #released = Promise.withResolvers<void>();

  /** Resolves once the held atomic commit has reached the barrier. */
  get entered(): Promise<void> {
    return this.#entered.promise;
  }

  /** Arms the barrier for the next atomic commit. */
  arm(): void {
    this.#armed = true;
  }

  /** Releases a held atomic commit; safe to call when nothing is held. */
  release(): void {
    this.#released.resolve();
  }

  override async atomic(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult> {
    if (this.#armed) {
      this.#armed = false;
      this.#entered.resolve();
      await this.#released.promise;
    }
    return await super.atomic(checks, mutations);
  }
}

type RevocationHarness = Readonly<{
  backend: KvOAuthBackend;
  store: KvOAuthStore;
  kv: BarrierKvAdapter;
}>;

function fixtureProvider(): ReturnType<typeof defineOAuthProvider> {
  return defineOAuthProvider({
    id: 'fixture',
    displayName: 'Fixture',
    kind: 'oauth',
    clientId: 'client_fixture',
    redirectUri: 'https://app.example.test/auth/callback',
    authorizationEndpoint: 'https://issuer.example.test/oauth/authorize',
    tokenEndpoint: 'https://issuer.example.test/oauth/token',
  });
}

function forbiddenFetch(): never {
  throw new Error('Network access is forbidden in the session revocation tests.');
}

function sessionRequest(sessionId: string): AuthnRequest {
  const headers = new Headers({
    cookie: `${SESSION_COOKIE}=${sessionId}`,
    'x-forwarded-proto': 'https',
  });
  return {
    method: 'GET',
    path: '/rpc',
    header: (name) => headers.get(name) ?? undefined,
    headers: () => headers,
    cookie: (name) =>
      name === SESSION_COOKIE
        ? headers.get('cookie')?.slice(`${SESSION_COOKIE}=`.length)
        : undefined,
  };
}

async function createFixtureSession(backend: KvOAuthBackend): Promise<AuthSession> {
  return await backend.sessions.createSession({
    userId: 'user_fixture',
    subject: 'subject_fixture',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
}

async function withRevocationHarness(
  run: (harness: RevocationHarness) => Promise<void>,
  wrapStore: (store: KvOAuthStore) => KvOAuthStore = (store) => store,
): Promise<void> {
  const directory = await Deno.makeTempDir({ prefix: 'netscript-auth-kv-oauth-revoke-' });
  const kv = new BarrierKvAdapter(await Deno.openKv(`${directory}/sessions.db`));
  try {
    const store = wrapStore(
      await createKvOAuthStore({
        kv,
        namespace: ['auth-kv-oauth-revocation-test'],
        encryptionKey: await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
          'encrypt',
          'decrypt',
        ]),
      }),
    );
    const backend = await createKvOAuthBackend({
      trustProxyHeaders: true,
      provider: fixtureProvider(),
      store,
      refreshMode: 'never',
      fetch: forbiddenFetch,
    });
    await run({ backend, store, kv });
  } finally {
    kv.release();
    await kv.close();
    await Deno.remove(directory, { recursive: true });
  }
}

Deno.test('uncontended revokeSession persists the revoked session', async () => {
  await withRevocationHarness(async ({ backend, store }) => {
    const session = await createFixtureSession(backend);

    const returned = await backend.sessions.revokeSession(session.id);

    assertEquals(returned.state, 'revoked');
    assertEquals(
      (await store.getSession(session.id))?.session.state,
      'revoked',
      'an uncontended revoke must persist the revoked state',
    );
    assertEquals(
      (await backend.authenticate(sessionRequest(session.id))).ok,
      false,
      'a persisted revocation must end the session authority',
    );
  });
});

Deno.test('revokeSession never acknowledges a revocation the store did not keep', async () => {
  await withRevocationHarness(async ({ backend, store, kv }) => {
    const session = await createFixtureSession(backend);

    kv.arm();
    const revoke = Promise.resolve(backend.sessions.revokeSession(session.id));
    await kv.entered;
    const refreshed = await backend.sessions.refreshSession(session.id);
    kv.release();
    const returned = await revoke;

    const persisted = (await store.getSession(session.id))?.session;
    assertEquals(
      persisted?.state,
      'revoked',
      'the store must hold a revoked session once revokeSession resolves successfully',
    );
    assertEquals(
      returned.state,
      persisted?.state,
      'the returned session state must agree with the stored session state',
    );
    assertEquals(
      persisted?.refreshedAt,
      refreshed.refreshedAt,
      'the retry must revoke the record the concurrent refresh committed, preserving its fields',
    );
    assertEquals(
      (await backend.authenticate(sessionRequest(session.id))).ok,
      false,
      'no active authority may survive an acknowledged revocation',
    );
  });
});

Deno.test('revokeSession reports the stored revocation when a concurrent revoke wins', async () => {
  await withRevocationHarness(async ({ backend, store, kv }) => {
    const session = await createFixtureSession(backend);

    kv.arm();
    const blocked = Promise.resolve(backend.sessions.revokeSession(session.id));
    await kv.entered;
    const winner = await backend.sessions.revokeSession(session.id);
    kv.release();
    const returned = await blocked;

    const persisted = (await store.getSession(session.id))?.session;
    assertEquals(persisted?.state, 'revoked');
    assertEquals(
      persisted?.revokedAt,
      winner.revokedAt,
      'the winning revocation must stay persisted',
    );
    assertEquals(
      returned.revokedAt,
      winner.revokedAt,
      'the losing revoke must report the persisted revocation instead of a second one',
    );
  });
});

Deno.test('revokeSession raises a structured conflict when the bounded retry is exhausted', async () => {
  await withRevocationHarness(
    async ({ backend, store }) => {
      const session = await createFixtureSession(backend);

      const error = await assertRejects(
        () => Promise.resolve(backend.sessions.revokeSession(session.id)),
        KvOAuthError,
        'could not be revoked',
      );

      assertEquals(error.code, 'revoke_conflict');
      assertEquals(
        (await store.getSession(session.id))?.session.state,
        'active',
        'an unpersisted revocation must leave the stored session untouched',
      );
    },
    (store) => ({ ...store, rotateSession: () => Promise.resolve(false) }),
  );
});

Deno.test('refreshSession raises a structured conflict when its compare-and-set fails', async () => {
  await withRevocationHarness(
    async ({ backend }) => {
      const session = await createFixtureSession(backend);

      const error = await assertRejects(
        () => Promise.resolve(backend.sessions.refreshSession(session.id)),
        KvOAuthError,
        'could not be refreshed',
      );

      assertEquals(error.code, 'refresh_failed');
    },
    (store) => ({ ...store, rotateSession: () => Promise.resolve(false) }),
  );
});

Deno.test('a refresh begun before revocation cannot reactivate the stored session', async () => {
  const entered = Promise.withResolvers<void>();
  const released = Promise.withResolvers<void>();
  let hold = true;
  try {
    await withRevocationHarness(async ({ backend, store }) => {
      const session = await createFixtureSession(backend);
      const refresh = backend.sessions.refreshSession(session.id);
      await entered.promise;
      const revoked = await backend.sessions.revokeSession(session.id);
      assertEquals(revoked.state, 'revoked');
      released.resolve();
      const error = await assertRejects(() => Promise.resolve(refresh), KvOAuthError);
      assertEquals(error.code, 'refresh_failed');
      assertEquals((await store.getSession(session.id))?.session.state, 'revoked');
      assertEquals((await backend.authenticate(sessionRequest(session.id))).ok, false);
    }, (store) => ({
      ...store,
      async rotateSession(...args: Parameters<KvOAuthStore['rotateSession']>) {
        if (hold) {
          hold = false;
          entered.resolve();
          await released.promise;
        }
        return await store.rotateSession(...args);
      },
    }));
  } finally {
    released.resolve();
  }
});

Deno.test('deleting a session during revocation cannot resurrect it', async () => {
  const entered = Promise.withResolvers<void>();
  const released = Promise.withResolvers<void>();
  let hold = true;
  try {
    await withRevocationHarness(async ({ backend, store }) => {
      const session = await createFixtureSession(backend);
      const revoke = backend.sessions.revokeSession(session.id);
      await entered.promise;
      await store.deleteSession(session.id);
      released.resolve();
      assertEquals((await revoke).state, 'revoked');
      assertEquals(await store.getSession(session.id), null);
      assertEquals((await backend.authenticate(sessionRequest(session.id))).ok, false);
    }, (store) => ({
      ...store,
      async rotateSession(...args: Parameters<KvOAuthStore['rotateSession']>) {
        if (hold) {
          hold = false;
          entered.resolve();
          await released.promise;
        }
        return await store.rotateSession(...args);
      },
    }));
  } finally {
    released.resolve();
  }
});

Deno.test('authenticate refresh cannot restore authority after revocation', async () => {
  await withRevocationHarness(async ({ backend, store }) => {
    const session = await createFixtureSession(backend);
    await store.putSession({
      session,
      tokens: { accessToken: 'access', refreshToken: 'refresh', expiresAt: session.expiresAt },
    });
    const entered = Promise.withResolvers<void>();
    const released = Promise.withResolvers<void>();
    try {
      const refreshing = await createKvOAuthBackend({
        trustProxyHeaders: true,
        provider: fixtureProvider(),
        store,
        refreshMode: 'always',
        fetch: async () => {
          entered.resolve();
          await released.promise;
          return new Response(
            JSON.stringify({ access_token: 'new-access', token_type: 'Bearer', expires_in: 3600 }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        },
      });
      const authenticate = refreshing.authenticate(sessionRequest(session.id));
      await entered.promise;
      assertEquals((await backend.sessions.revokeSession(session.id)).state, 'revoked');
      released.resolve();
      assertEquals((await authenticate).ok, false);
      assertEquals((await store.getSession(session.id))?.session.state, 'revoked');
    } finally {
      released.resolve();
    }
  });
});

Deno.test('parallel authenticate refreshes keep a valid session available', async () => {
  await withRevocationHarness(async ({ backend, store }) => {
    const session = await createFixtureSession(backend);
    await store.putSession({
      session,
      tokens: { accessToken: 'access', refreshToken: 'refresh', expiresAt: session.expiresAt },
    });
    let successfulWrites = 0;
    const countedStore: KvOAuthStore = {
      ...store,
      async rotateSession(...args: Parameters<KvOAuthStore['rotateSession']>) {
        const ok = await store.rotateSession(...args);
        if (ok) successfulWrites += 1;
        return ok;
      },
    };
    const bothEntered = Promise.withResolvers<void>();
    const released = Promise.withResolvers<void>();
    let calls = 0;
    try {
      const refreshing = await createKvOAuthBackend({
        trustProxyHeaders: true,
        provider: fixtureProvider(),
        store: countedStore,
        refreshMode: 'always',
        fetch: async () => {
          calls += 1;
          if (calls === 2) bothEntered.resolve();
          await released.promise;
          return new Response(
            JSON.stringify({ access_token: 'new-access', token_type: 'Bearer', expires_in: 3600 }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        },
      });
      const first = refreshing.authenticate(sessionRequest(session.id));
      const second = refreshing.authenticate(sessionRequest(session.id));
      await bothEntered.promise;
      released.resolve();
      const [a, b] = await Promise.all([first, second]);
      assertEquals(a.ok, true);
      assertEquals(b.ok, true);
      assertEquals(successfulWrites, 1, 'only one refresh CAS may commit');
      assertEquals((await store.getSession(session.id))?.session.state, 'active');
    } finally {
      released.resolve();
    }
  });
});

Deno.test('rotating a deleted session without an observed version does not recreate it', async () => {
  await withRevocationHarness(async ({ backend, store }) => {
    const session = await createFixtureSession(backend);
    const record = await store.getSession(session.id);
    if (!record) throw new Error('Fixture session was not stored');
    await store.deleteSession(session.id);
    assertEquals(await store.rotateSession(session.id, record), false);
    assertEquals(await store.getSession(session.id), null);
  });
});
