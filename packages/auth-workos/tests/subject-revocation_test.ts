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
            createdAt: id === 'new' ? '2026-10-11T12:00:01.000Z' : cutoff,
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
