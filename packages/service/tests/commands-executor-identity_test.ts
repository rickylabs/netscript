import { assert, assertEquals, assertRejects, assertStrictEquals, assertThrows } from '@std/assert';
import { createMemoryCommandStore } from '../commands-testing.ts';
import {
  canonicalCommandJson,
  CommandError,
  createCommandExecutor,
  defineCommand,
} from '../commands.ts';
import {
  codec,
  command,
  envelope,
  failure,
  key,
  ports,
  tracked,
} from './_fixtures/command-executor-fixture.ts';
import type { MemoryCommandBusiness } from '../commands-testing.ts';
import type { CommandEnvelope } from '../commands.ts';

Deno.test('executor freezes detached identity and hashes exact semantic material once', async () => {
  const store = createMemoryCommandStore();
  let scopes = 0;
  let fingerprints = 0;
  let handled = 0;
  const input = { value: 'one', nested: { marker: 'frozen' } };
  const actor = { kind: 'principal', subject: 'caller', scheme: 'first' };
  // A typed envelope is detached from mutable transport data before callbacks.
  const origin: CommandEnvelope<typeof input> = {
    ...envelope,
    input,
    actor: { kind: 'principal', subject: actor.subject, scheme: actor.scheme },
  };
  const spec = defineCommand<'identity.update', typeof input, string, MemoryCommandBusiness>({
    name: 'identity.update',
    definitionVersion: 3,
    idempotency: {
      scope: (identity) => {
        scopes++;
        assert(Object.isFrozen(identity));
        assert(Object.isFrozen(identity.input.nested));
        assert(Object.isFrozen(identity.actor));
        assertStrictEquals(identity.input === input, false);
        assertThrows(
          () => Object.defineProperty(identity.input.nested, 'marker', { value: 'changed' }),
          TypeError,
        );
        input.nested.marker = 'outside';
        return 'identity';
      },
      fingerprint: (value) => {
        fingerprints++;
        assertEquals(value.nested.marker, 'frozen');
        return { value: value.value };
      },
      response: codec,
    },
    records: { audit: 'forbidden', outbox: 'forbidden' },
    handle: (ctx) => {
      handled++;
      assert(Object.isFrozen(ctx.envelope));
      assertEquals(ctx.envelope.input.nested.marker, 'frozen');
      return Promise.resolve(ctx.envelope.input.value);
    },
  });
  const execute = createCommandExecutor({ store, ...ports() });
  await execute.execute(spec, origin);
  assertEquals([scopes, fingerprints, handled], [1, 1, 1]);
  const expected = canonicalCommandJson({
    command: 'identity.update',
    definitionVersion: 3,
    scope: 'identity',
    input: { value: 'one' },
    actor: { kind: 'principal', subject: 'caller' },
    expectedVersion: null,
  });
  const digest = async (value: string): Promise<string> =>
    [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(
      (b) => b.toString(16).padStart(2, '0'),
    ).join('');
  assertEquals(store.snapshot().receipts[0].requestHash, await digest(expected));
  assertEquals(store.snapshot().receipts[0].keyHash, await digest(key));
  assert(!JSON.stringify(store.snapshot()).includes(key));
  const replay = await execute.execute(spec, {
    ...origin,
    input: { value: 'one', nested: { marker: 'frozen' } },
    actor: { kind: 'principal', subject: 'caller', scheme: 'other' },
    correlationId: 'retry',
    trace: {
      traceparent: '00-' + '1'.repeat(32) + '-' + '2'.repeat(16) + '-01',
      tracestate: 'vendor=value',
    },
  });
  assertEquals(replay.outcome, 'replayed');
  assertEquals(replay.correlationId, 'original');
  assertEquals([scopes, fingerprints, handled], [2, 2, 1]);
  await failure(
    execute.execute(spec, {
      ...origin,
      input: { value: 'one', nested: { marker: 'frozen' } },
      expectedVersion: 'next',
    }),
    'idempotency_key_reuse',
  );
});

Deno.test('executor replay checks receipt hash version completeness canonical text and codec without writes', async () => {
  const store = createMemoryCommandStore();
  let calls = 0;
  const spec = command(() => {
    calls++;
    return Promise.resolve('one');
  });
  const execute = createCommandExecutor({ store, ...ports() });
  await execute.execute(spec, envelope);
  const row = store.snapshot().receipts[0];
  assert(row.completedAt);
  const base = {
    id: row.id,
    requestHash: row.requestHash,
    commandVersion: row.commandVersion,
    correlationId: row.correlationId,
    responseJson: row.responseJson ?? '',
    completedAt: row.completedAt,
  };
  for (
    const [receipt, kind] of [
      [{ ...base, requestHash: 'a'.repeat(64) }, 'idempotency_key_reuse'],
      [{ ...base, commandVersion: 2 }, 'idempotency_key_reuse'],
      [{ ...base, completedAt: new Date(NaN) }, 'receipt_corrupt'],
      [{ ...base, id: '' }, 'receipt_corrupt'],
      [{ ...base, responseJson: ' "one"' }, 'receipt_corrupt'],
      [{ ...base, responseJson: '{}' }, 'codec_failure'],
    ]
  ) {
    assert(typeof kind === 'string');
    // Each corruption uses the original public receipt type, not an unsafe forged value.
    if (typeof receipt === 'string') throw new Error('invalid fixture tuple');
    const events: string[] = [];
    const chosen = createCommandExecutor({
      store: tracked(store, events, { decision: () => ({ kind: 'replay', receipt }) }),
      ...ports(),
    });
    try {
      await chosen.execute(spec, envelope);
      throw new Error('expected failure');
    } catch (error) {
      assert(error instanceof CommandError);
      assertEquals(error.failure.kind, kind);
    }
    assertEquals(events, ['begin', 'claim', 'rollback']);
    assertEquals(calls, 1);
  }
  store.seedReceipt({ ...row, responseJson: null, completedAt: null });
  await failure(execute.execute(spec, envelope), 'receipt_corrupt');
});

Deno.test('executor validates authentic definitions envelope capabilities isolation and limits before begin', async () => {
  const store = createMemoryCommandStore();
  const events: string[] = [];
  const execute = createCommandExecutor({ store: tracked(store, events), ...ports() });
  const spec = command();
  await assertRejects(() => execute.execute({ ...spec }, envelope), TypeError);
  await failure(
    execute.execute(spec, { ...envelope, actor: { kind: 'system', subject: '' } }),
    'invalid_envelope',
  );
  await failure(
    execute.execute(spec, { ...envelope, correlationId: '😀'.repeat(65) }),
    'invalid_envelope',
  );
  await failure(
    execute.execute(spec, { ...envelope, idempotencyKey: 'short' }),
    'invalid_envelope',
  );
  const { idempotencyKey: _, ...noKey } = envelope;
  await failure(execute.execute(spec, noKey), 'invalid_envelope');
  await failure(
    execute.execute(spec, {
      ...envelope,
      trace: { traceparent: '00-' + '0'.repeat(32) + '-' + '2'.repeat(16) + '-01' },
    }),
    'invalid_envelope',
  );
  await failure(
    execute.execute(spec, {
      ...envelope,
      trace: {
        traceparent: '00-' + '1'.repeat(32) + '-' + '2'.repeat(16) + '-01',
        tracestate: 'a=x,a=y',
      },
    }),
    'invalid_envelope',
  );
  const isolation = defineCommand<
    'isolation.update',
    { value: string },
    string,
    MemoryCommandBusiness
  >({
    name: 'isolation.update',
    definitionVersion: 1,
    isolationLevel: 'ReadCommitted',
    idempotency: { scope: () => 'isolation', fingerprint: (input) => input, response: codec },
    records: { audit: 'optional', outbox: 'optional' },
    handle: () => Promise.resolve('one'),
  });
  await failure(execute.execute(isolation, envelope), 'unsupported_capability');
  assertEquals(events, []);
  assertThrows(() => createCommandExecutor({ store, receiptClaimWaitMs: 1 }), TypeError);
  assertThrows(
    () =>
      createCommandExecutor({
        store,
        limits: { auditRecords: 65, outboxRecords: 64, recordBytes: 65536 },
      }),
    TypeError,
  );
  const caps = { ...store.capabilities };
  Object.defineProperty(caps, 'sideRecordAtomicity', { value: 'foreign' });
  assertThrows(
    () => createCommandExecutor({ store: { capabilities: caps, transaction: store.transaction } }),
    CommandError,
  );
});

Deno.test('executor accepts W3C future fields and empty tracestate members while rejecting malformed known fields', async () => {
  const prefix = '01-' + '1'.repeat(32) + '-' + '2'.repeat(16) + '-01';
  const fixtures = [
    { traceparent: prefix + '-future.field', tracestate: '' },
    { traceparent: prefix, tracestate: ' ,\t, vendor=value , , ' },
    { traceparent: prefix + '-future=opaque', tracestate: '\t ' },
  ];
  for (const trace of fixtures) {
    const store = createMemoryCommandStore();
    const chosen = createCommandExecutor({ store, ...ports() });
    assertEquals((await chosen.execute(command(), { ...envelope, trace })).outcome, 'applied');
  }
  for (
    const trace of [
      { traceparent: prefix + 'invalid-boundary' },
      { traceparent: 'ff-' + prefix.slice(3) },
      { traceparent: '00-' + prefix.slice(3) + '-future' },
      { traceparent: prefix, tracestate: 'a=x\r\n' },
      {
        traceparent: prefix,
        tracestate: Array.from({ length: 33 }, (_, i) => `k${i}=x`).join(','),
      },
    ]
  ) {
    const store = createMemoryCommandStore();
    const events: string[] = [];
    await failure(
      createCommandExecutor({ store: tracked(store, events), ...ports() }).execute(command(), {
        ...envelope,
        trace,
      }),
      'invalid_envelope',
    );
    assertEquals(events, []);
  }
});
