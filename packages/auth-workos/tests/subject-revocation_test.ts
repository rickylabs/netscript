import { assert, assertEquals, assertRejects } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import {
  createWorkosAuthenticator,
  createWorkosBackend,
  createWorkosRevocationStore,
  revokeWorkosSubjectPage,
  type WorkosRevocationClient,
} from '../mod.ts';
import { cutoff, issuedAt, sessionClient, sessionRequest } from './testing/revocation-fixture.ts';

Deno.test('WorkOS fence immediately refuses both subject sessions and preserves unrelated subjects without enumeration', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const revocations = createWorkosRevocationStore(kv);
  const backend = createWorkosBackend({
    workos: sessionClient(),
    cookiePassword: 'x'.repeat(32),
    revocations,
    now: () => new Date(cutoff),
  });
  const standalone = createWorkosAuthenticator({
    workos: sessionClient(),
    cookiePassword: 'x'.repeat(32),
    revocations,
  });
  for (const token of ['alice:a', 'alice:b', 'bob:c']) {
    assert((await backend.authenticate(sessionRequest(token))).ok);
  }
  assertEquals(await backend.sessions.revokeSubjectSessions({ subject: 'alice' }), {
    subject: 'alice',
    revokedAt: cutoff,
  });
  for (const token of ['alice:a', 'alice:b']) {
    assertEquals((await backend.authenticate(sessionRequest(token))).ok, false);
    assertEquals((await standalone.authenticate(sessionRequest(token))).ok, false);
    assertEquals(await backend.sessions.getSession({ token }), undefined);
  }
  assert((await backend.authenticate(sessionRequest('bob:c'))).ok);
  assertEquals((await backend.sessions.getSession({ token: 'bob:c' }))?.subject, 'bob');
  assertEquals((await revocations.nextDelivery(Date.parse(cutoff)))?.job.subject, 'alice');
  // A fresh instance over the same durable host store observes the fence.
  assertEquals(
    await createWorkosRevocationStore(kv).isRevoked('alice', 'b', issuedAt * 1000),
    true,
  );
});

Deno.test('WorkOS refresh racing global logout cannot emit a resurrected session cookie', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const revocations = createWorkosRevocationStore(kv);
  const workos = sessionClient();
  const original = workos.userManagement.loadSealedSession;
  const authenticator = createWorkosAuthenticator({
    cookiePassword: 'x'.repeat(32),
    revocations,
    refresh: 'always',
    workos: {
      userManagement: {
        loadSealedSession(options) {
          const session = original(options);
          return {
            ...session,
            async refresh() {
              await revocations.revokeSubject('alice', cutoff);
              return {
                authenticated: true,
                sessionId: 'a',
                user: { id: 'alice' },
                sealedSession: 'rotated',
              };
            },
          };
        },
      },
    },
  });
  assertEquals(await authenticator.authenticate(sessionRequest('alice:a')), {
    ok: false,
    reason: 'workos_subject_revoked',
  });
});

Deno.test('WorkOS background pages are bounded, retry partial failure, preserve new sessions and tombstone rotated tokens', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', cutoff);
  let lists = 0;
  const revoked: string[] = [];
  let fail = true;
  const workos: WorkosRevocationClient = {
    userManagement: {
      listSessions(subject, options) {
        lists++;
        assertEquals(subject, 'alice');
        assertEquals(options.limit, 2);
        const ids = options.after ? ['c', 'new'] : ['a', 'b'];
        return Promise.resolve({
          data: ids.map((id) => ({
            id,
            userId: subject,
            createdAt: id === 'new' ? '2026-10-11T12:02:00.000Z' : cutoff,
          })),
          listMetadata: { after: options.after ? null : 'b' },
        });
      },
      revokeSession({ sessionId }) {
        if (sessionId === 'b' && fail) {
          fail = false;
          throw new Error('retryable');
        }
        revoked.push(sessionId);
        return Promise.resolve();
      },
    },
  };
  const signal = new AbortController().signal;
  const first = await store.nextDelivery(Date.parse(cutoff));
  assert(first);
  await assertRejects(
    () => revokeWorkosSubjectPage(store, workos, first, signal, 2),
    Error,
    'retryable',
  );
  assertEquals((await store.nextDelivery(Date.parse(cutoff)))?.job.after, undefined);
  await revokeWorkosSubjectPage(store, workos, first, signal, 2);
  assertEquals(lists, 2);
  const second = await store.nextDelivery(Date.parse(cutoff));
  assert(second);
  assertEquals(second.job.after, 'b');
  await revokeWorkosSubjectPage(store, workos, second, signal, 2);
  assertEquals(lists, 3);
  assertEquals(revoked, ['a', 'a', 'b', 'c']);
  assertEquals(await store.nextDelivery(Date.parse(cutoff)), undefined);
  assertEquals(await store.isRevoked('alice', 'b', Date.parse(cutoff) + 1000), true);
  assertEquals(await store.isRevoked('alice', 'new', Date.parse(cutoff) + 1000), false);
  assertEquals(await store.isRevoked('alice', 'unknown', undefined), true);
  assertEquals(await store.isRevoked('bob', 'd', issuedAt * 1000), false);
});

Deno.test('WorkOS stale delivery cannot clear a newer fence; cutoffs are monotonic and commit atomically with jobs', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', cutoff);
  const old = await store.nextDelivery(Date.parse(cutoff));
  assert(old);
  const newJob = await store.revokeSubject('alice', '2026-10-11T11:59:59.000Z');
  assertEquals(newJob.revokedAt, cutoff);
  assertEquals(await store.checkpoint(old), true);
  assertEquals(await store.isRevoked('alice', 'new', Date.parse(cutoff) + 1000), true);
  assertEquals(await store.checkpoint(old), false);
  assert(await store.nextDelivery(Date.parse(cutoff)));
  const broken = createWorkosRevocationStore({
    get: kv.get.bind(kv),
    list: kv.list.bind(kv),
    has: kv.has.bind(kv),
    set: kv.set.bind(kv),
    delete: kv.delete.bind(kv),
    close: kv.close.bind(kv),
    [Symbol.asyncDispose]: kv[Symbol.asyncDispose].bind(kv),
    atomic: () => Promise.reject(new Error('storage unavailable')),
  });
  await assertRejects(() => broken.revokeSubject('bob', cutoff), Error, 'storage unavailable');
  assertEquals(await store.isRevoked('bob', 'd', issuedAt * 1000), false);
});

Deno.test('WorkOS background rejects foreign data, oversized pages, stuck cursors and cancellation', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', cutoff);
  const delivery = await store.nextDelivery(Date.parse(cutoff));
  assert(delivery);
  let revokes = 0;
  const client = (
    ids: string[],
    userId = 'alice',
    after: string | null = null,
  ): WorkosRevocationClient => ({
    userManagement: {
      listSessions: () =>
        Promise.resolve({
          data: ids.map((id) => ({ id, userId, createdAt: cutoff })),
          listMetadata: { after },
        }),
      revokeSession: () => {
        revokes++;
        return Promise.resolve();
      },
    },
  });
  const signal = new AbortController().signal;
  await assertRejects(
    () => revokeWorkosSubjectPage(store, client(['a'], 'bob'), delivery, signal, 1),
    Error,
    'foreign',
  );
  await assertRejects(
    () => revokeWorkosSubjectPage(store, client(['a', 'b']), delivery, signal, 1),
    Error,
    'bounded',
  );
  await assertRejects(
    () =>
      revokeWorkosSubjectPage(
        store,
        client([], 'alice', 'a'),
        { ...delivery, job: { ...delivery.job, after: 'a' } },
        signal,
        1,
      ),
    Error,
    'advance',
  );
  await assertRejects(() =>
    revokeWorkosSubjectPage(store, client(['a']), delivery, AbortSignal.abort(), 1)
  );
  assertEquals(revokes, 0);
  assertEquals(await store.isRevoked('alice', 'a', issuedAt * 1000), true);
});

Deno.test('WorkOS tombstones survive upstream outages and expire after the maximum token lifetime plus skew', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  let clock = Date.parse(cutoff);
  const ttls: Array<number | undefined> = [];
  const store = createWorkosRevocationStore({
    get: kv.get.bind(kv),
    has: kv.has.bind(kv),
    list: kv.list.bind(kv),
    delete: kv.delete.bind(kv),
    close: kv.close.bind(kv),
    atomic: async (checks, mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'set' && mutation.key.includes('session')) {
          ttls.push(mutation.expireIn);
        }
      }
      return await kv.atomic(checks, mutations);
    },
    [Symbol.asyncDispose]: kv[Symbol.asyncDispose].bind(kv),
    set: kv.set.bind(kv),
  }, { now: () => clock, maxAccessTokenLifetimeMs: 3600_000, clockSkewMs: 60_000 });
  await store.revokeSubject('alice', cutoff);
  const delivery = await store.nextDelivery(clock);
  assert(delivery);
  let unavailable = true;
  const client: WorkosRevocationClient = {
    userManagement: {
      listSessions: () =>
        Promise.resolve({
          data: [{ id: 'a', userId: 'alice', createdAt: cutoff }],
          listMetadata: {},
        }),
      revokeSession() {
        if (unavailable) return Promise.reject(new Error('outage'));
        return Promise.resolve();
      },
    },
  };
  await assertRejects(() =>
    revokeWorkosSubjectPage(store, client, delivery, new AbortController().signal)
  );
  assertEquals(ttls, [undefined]);
  clock += 7 * 86_400_000;
  assertEquals(await store.isRevoked('alice', 'a', clock), true);
  unavailable = false;
  await revokeWorkosSubjectPage(store, client, delivery, new AbortController().signal);
  assertEquals(ttls, [undefined, undefined, 3660_000]);
  const tombstone = await kv.get<{ expiresAt: number }>([
    'auth-workos',
    'revocation',
    'session',
    'alice',
    'a',
  ]);
  assertEquals(tombstone?.value.expiresAt, clock + 3660_000);
  clock += 3660_000 - 1;
  assertEquals(await store.isRevoked('alice', 'a', Date.parse(cutoff) + 1), true);
  clock++;
  assertEquals(await store.isRevoked('alice', 'a', Date.parse(cutoff) + 1), false);
  assertEquals(await store.isRevoked('alice', 'a', Date.parse(cutoff)), true);
  assertEquals(await store.isRevoked('bob', 'a', Date.parse(cutoff)), false);
});

Deno.test('WorkOS provider clock ahead of logout is covered by the skew margin and unrelated sessions survive', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', cutoff);
  const delivery = await store.nextDelivery(Date.parse(cutoff));
  assert(delivery);
  const revoked: string[] = [];
  await revokeWorkosSubjectPage(
    store,
    {
      userManagement: {
        listSessions: () =>
          Promise.resolve({
            data: [
              { id: 'skewed', userId: 'alice', createdAt: '2026-10-11T12:00:30.000Z' },
              { id: 'boundary', userId: 'alice', createdAt: '2026-10-11T12:01:00.000Z' },
              { id: 'new', userId: 'alice', createdAt: '2026-10-11T12:01:00.001Z' },
            ],
            listMetadata: {},
          }),
        revokeSession: ({ sessionId }) => {
          revoked.push(sessionId);
          return Promise.resolve();
        },
      },
    },
    delivery,
    new AbortController().signal,
  );
  assertEquals(revoked, ['skewed', 'boundary']);
  assertEquals(await store.isRevoked('alice', 'skewed', Date.parse(cutoff) + 30_000), true);
  assertEquals(await store.isRevoked('alice', 'boundary', Date.parse(cutoff) + 60_000), true);
  assertEquals(await store.isRevoked('alice', 'new', Date.parse(cutoff) + 60_001), false);
  assertEquals(await store.isRevoked('bob', 'skewed', Date.parse(cutoff)), false);
});

Deno.test('WorkOS refresh identity changes have a distinct reason without emitting a cookie', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const revocations = createWorkosRevocationStore(kv);
  for (const [subject, sessionId] of [['alice', 'different-id'], ['bob', 'a']]) {
    const client = sessionClient();
    const authenticator = createWorkosAuthenticator({
      revocations,
      cookiePassword: 'x'.repeat(32),
      refresh: 'always',
      workos: {
        userManagement: {
          loadSealedSession(options) {
            return {
              ...client.userManagement.loadSealedSession(options),
              refresh: () =>
                Promise.resolve({
                  authenticated: true,
                  user: { id: subject },
                  sessionId,
                  sealedSession: 'must-not-leak',
                }),
            };
          },
        },
      },
    });
    assertEquals(await authenticator.authenticate(sessionRequest('alice:a')), {
      ok: false,
      reason: 'workos_session_identity_changed',
    });
  }
});

Deno.test('WorkOS tokens exceeding retention or missing expiry cannot bypass an expired tombstone', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  let clock = Date.parse(cutoff);
  const store = createWorkosRevocationStore(kv, {
    now: () => clock,
    maxAccessTokenLifetimeMs: 3600_000,
  });
  const job = await store.revokeSubject('alice', cutoff);
  await store.revokeSession('alice', 'a', job.id);
  await store.confirmSessionRevoked('alice', 'a', job.id);
  const delivery = await store.nextDelivery(clock);
  assert(delivery);
  await store.checkpoint(delivery);
  clock += 4_000_000;
  for (const [duration, allowed] of [[3600, true], [7200, false], [undefined, false]] as const) {
    const iat = clock / 1000;
    const token = `header.${
      btoa(JSON.stringify({ iat, ...(duration ? { exp: iat + duration } : {}) }))
    }.signature`;
    const result = {
      authenticated: true as const,
      user: { id: 'alice' },
      sessionId: 'a',
      accessToken: token,
    };
    const authenticator = createWorkosAuthenticator({
      revocations: store,
      cookiePassword: 'x'.repeat(32),
      workos: {
        userManagement: {
          loadSealedSession: () => ({
            authenticate: () => Promise.resolve(result),
            refresh: () => Promise.resolve(result),
          }),
        },
      },
    });
    assertEquals((await authenticator.authenticate(sessionRequest('alice:a'))).ok, allowed);
  }
});

Deno.test('WorkOS recovers retention after upstream success and KV failure even when the provider omits revoked sessions', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  let failConfirmation = true;
  const store = createWorkosRevocationStore({
    get: kv.get.bind(kv),
    has: kv.has.bind(kv),
    list: kv.list.bind(kv),
    set: kv.set.bind(kv),
    delete: kv.delete.bind(kv),
    close: kv.close.bind(kv),
    [Symbol.asyncDispose]: kv[Symbol.asyncDispose].bind(kv),
    async atomic(checks, mutations) {
      if (
        failConfirmation &&
        mutations.some((m) =>
          m.type === 'set' && m.key.includes('session') && m.expireIn !== undefined
        )
      ) {
        failConfirmation = false;
        throw new Error('KV transient failure after upstream success');
      }
      return await kv.atomic(checks, mutations);
    },
  });
  await store.revokeSubject('alice', cutoff);
  const delivery = await store.nextDelivery(Date.parse(cutoff));
  assert(delivery);
  let upstreamRevoked = false;
  const workos: WorkosRevocationClient = {
    userManagement: {
      listSessions: () =>
        Promise.resolve({
          data: upstreamRevoked ? [] : [{ id: 'a', userId: 'alice', createdAt: cutoff }],
          listMetadata: {},
        }),
      revokeSession() {
        upstreamRevoked = true;
        return Promise.resolve();
      },
    },
  };
  await assertRejects(() =>
    revokeWorkosSubjectPage(store, workos, delivery, new AbortController().signal)
  );
  assertEquals(await store.isRevoked('alice', 'new', Date.parse(cutoff) + 1), true);
  await revokeWorkosSubjectPage(store, workos, delivery, new AbortController().signal);
  const tombstone = await kv.get<{ expiresAt?: number }>([
    'auth-workos',
    'revocation',
    'session',
    'alice',
    'a',
  ]);
  assert(tombstone?.value.expiresAt);
  assertEquals(await store.nextDelivery(Date.parse(cutoff)), undefined);
  assertEquals(await store.isRevoked('alice', 'new', Date.parse(cutoff) + 1), false);
  assertEquals(await store.isRevoked('alice', 'a', Date.parse(cutoff) + 1), true);
});

Deno.test('WorkOS retention repair is bounded, durable across restart, and excludes newer jobs', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv, { now: () => Date.parse(cutoff) });
  const job = await store.revokeSubject('alice', cutoff);
  for (let i = 0; i < 51; i++) {
    await store.revokeSession('alice', `s${String(i).padStart(2, '0')}`, job.id);
  }
  const newer = await store.revokeSubject('alice', cutoff);
  await store.revokeSession('alice', 'z-newer', newer.id);
  const delivery = await store.nextDelivery(Date.parse(cutoff));
  assert(delivery);
  // Isolate the original delivery; random job ids do not define request order.
  const entry = await kv.get<typeof job>([
    'auth-workos',
    'revocation',
    'pending',
    new Date(job.dueAt).toISOString().replaceAll(':', ''),
    job.id,
  ]);
  assert(entry);
  await store.checkpoint({ job, versionstamp: entry.versionstamp });
  let repaired = 0;
  for await (
    const entry of kv.list<{ expiresAt?: number }>({
      prefix: ['auth-workos', 'revocation', 'session', 'alice'],
    })
  ) {
    if (entry.value.expiresAt !== undefined) repaired++;
  }
  assertEquals(repaired, 50);
  const pending = await kv.get<typeof job>([
    'auth-workos',
    'revocation',
    'pending',
    new Date(job.dueAt).toISOString().replaceAll(':', ''),
    job.id,
  ]);
  assert(pending?.value.tombstoneAfter);
  const restarted = createWorkosRevocationStore(kv, { now: () => Date.parse(cutoff) });
  await revokeWorkosSubjectPage(
    restarted,
    {
      userManagement: {
        listSessions() {
          throw new Error('retention repair must not enumerate WorkOS again');
        },
        revokeSession() {
          throw new Error('retention repair must not revoke another session');
        },
      },
    },
    { job: pending.value, versionstamp: pending.versionstamp },
    new AbortController().signal,
  );
  assertEquals(
    (await kv.get<{ expiresAt?: number }>(['auth-workos', 'revocation', 'session', 'alice', 's50']))
      ?.value.expiresAt,
    Date.parse(cutoff) + 86460_000,
  );
  assertEquals(
    (await kv.get<{ expiresAt?: number }>([
      'auth-workos',
      'revocation',
      'session',
      'alice',
      'z-newer',
    ]))?.value.expiresAt,
    undefined,
  );
  assertEquals(await store.isRevoked('alice', 'new', Date.parse(cutoff) + 1), true);
});
