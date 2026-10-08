import type { CommandStorePort } from '@netscript/database/commands';
import { assert, assertEquals, assertStrictEquals, assertThrows } from '@std/assert';
import { CommandStoreError } from '@netscript/database/commands';
import { createMemoryCommandStore } from '../commands-testing.ts';
import { CommandError, createCommandExecutor, defineCommand } from '../commands.ts';
import {
  codec,
  command,
  envelope,
  failure,
  intents,
  key,
  ports,
  tracked,
} from './_fixtures/command-executor-fixture.ts';
import type { MemoryCommandBusiness } from '../commands-testing.ts';
import type {
  CommandCodec,
  CommandTelemetryPort,
  CommandTelemetryResult,
  CommandTelemetryStart,
} from '../commands.ts';

Deno.test('executor commits ordered bound rows and shares the receipt execution identity', async () => {
  const store = createMemoryCommandStore();
  const events: string[] = [];
  const hold = store.holdBeforeCommit();
  const execute = createCommandExecutor({ store: tracked(store, events), ...ports() });
  const operation = execute.execute(
    command((ctx) => {
      ctx.tx.set('value', 'one');
      intents(ctx);
      return Promise.resolve('one');
    }),
    envelope,
  );
  await hold.reached;
  assertEquals(events, ['begin', 'claim', 'audit', 'outbox', 'complete']);
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
  hold.release();
  const result = await operation;
  assertEquals(result, {
    value: 'one',
    outcome: 'applied',
    idempotency: 'claimed',
    correlationId: 'original',
  });
  const snapshot = store.snapshot();
  assertEquals(snapshot.business, { value: 'one' });
  assertEquals(snapshot.audit[0].executionId, snapshot.receipts[0].id);
  assertEquals(snapshot.outbox[0].executionId, snapshot.receipts[0].id);
  assertEquals(snapshot.outbox[0].dedupeKey, snapshot.outbox[0].id);
  assertEquals(snapshot.receipts[0].responseJson, '"one"');
  assertEquals(events.at(-1), 'commit');
});

Deno.test('executor terminal busy performs no later query and surfaces only after rollback', async () => {
  const store = createMemoryCommandStore();
  const hold = store.holdBeforeCommit();
  let calls = 0;
  const spec = command((ctx) => {
    calls++;
    ctx.tx.set('value', 'one');
    return Promise.resolve('one');
  });
  const leader = createCommandExecutor({ store, ...ports() }).execute(spec, envelope);
  await hold.reached;
  const events: string[] = [];
  let callbackError: unknown;
  const follower = createCommandExecutor({
    store: tracked(store, events, {
      callbackRejected: (error) => {
        callbackError = error;
      },
    }),
    ...ports(),
  });
  const error = await failure(follower.execute(spec, envelope), 'in_progress');
  assertEquals(events, ['begin', 'claim', 'rollback']);
  assertEquals(error.failure, { kind: 'in_progress', retryable: true, retryAfterMs: 0 });
  assert(!(callbackError instanceof CommandError));
  assertEquals(calls, 1);
  hold.release();
  await leader;
  assertEquals((await follower.execute(spec, envelope)).outcome, 'replayed');
  assertEquals(calls, 1);
});

Deno.test('executor preserves arbitrary business errors and rolls back conflicts without retry', async () => {
  for (
    const original of [
      new Error('application failure'),
      { domain: 'fixture' },
      'business',
      null,
      undefined,
    ]
  ) {
    const store = createMemoryCommandStore();
    let calls = 0;
    const execute = createCommandExecutor({ store, ...ports() });
    try {
      await execute.execute(
        command((ctx) => {
          calls++;
          ctx.tx.set('value', 'one');
          intents(ctx);
          throw original;
        }),
        envelope,
      );
      throw new Error('expected application error');
    } catch (error) {
      assertStrictEquals(error, original);
    }
    assertEquals(calls, 1);
    assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
  }
  const store = createMemoryCommandStore();
  const execute = createCommandExecutor({ store, ...ports() });
  await failure(
    execute.execute(
      command((ctx) => {
        intents(ctx);
        if (!ctx.tx.compareAndSet('version', 'missing', 'next')) ctx.conflict();
        return Promise.resolve('one');
      }),
      envelope,
    ),
    'optimistic_conflict',
  );
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
});

Deno.test('executor optional no-key attempts create side identities without claim or completion', async () => {
  const store = createMemoryCommandStore();
  const events: string[] = [];
  const execute = createCommandExecutor({ store: tracked(store, events), ...ports() });
  const spec = command((ctx) => {
    ctx.tx.set('value', 'one');
    intents(ctx);
    return Promise.resolve('one');
  }, 'optional');
  const { idempotencyKey: _, ...noKey } = envelope;
  const result = await execute.execute(spec, noKey);
  assertEquals(result.idempotency, 'not_requested');
  assertEquals(events, ['begin', 'audit', 'outbox', 'commit']);
  const snapshot = store.snapshot();
  assertEquals(snapshot.receipts.length, 0);
  assertEquals(snapshot.audit[0].executionId, snapshot.outbox[0].executionId);
  assert(snapshot.audit[0].executionId.length > 0);
});

Deno.test('executor enforces required forbidden count and aggregate byte policies before flushing', async () => {
  const scenarios = [
    { audit: 'required', outbox: 'optional', auditRecords: 64, recordBytes: 65536, produce: false },
    { audit: 'forbidden', outbox: 'optional', auditRecords: 64, recordBytes: 65536, produce: true },
    { audit: 'optional', outbox: 'optional', auditRecords: 0, recordBytes: 65536, produce: true },
    { audit: 'optional', outbox: 'optional', auditRecords: 64, recordBytes: 400, produce: true },
  ];
  for (const scenario of scenarios) {
    const store = createMemoryCommandStore();
    const events: string[] = [];
    if (
      scenario.audit !== 'required' && scenario.audit !== 'forbidden' &&
      scenario.audit !== 'optional'
    ) throw new Error('fixture');
    const spec = defineCommand<'policy.update', { value: string }, string, MemoryCommandBusiness>({
      name: 'policy.update',
      definitionVersion: 1,
      idempotency: { scope: () => 'policy', fingerprint: (input) => input, response: codec },
      records: { audit: scenario.audit, outbox: 'optional' },
      handle: (ctx) => {
        ctx.tx.set('value', 'one');
        if (scenario.produce) intents(ctx);
        return Promise.resolve('one');
      },
    });
    const execute = createCommandExecutor({
      store: tracked(store, events),
      ...ports(),
      limits: {
        auditRecords: scenario.auditRecords,
        outboxRecords: 64,
        recordBytes: scenario.recordBytes,
      },
    });
    await failure(execute.execute(spec, envelope), 'codec_failure');
    assertEquals(events, ['begin', 'claim', 'rollback']);
    assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
  }
});

Deno.test('executor cancellation checkpoints rollback before typed results and prevent later flush', async () => {
  const early = new AbortController();
  early.abort('fixture');
  const store = createMemoryCommandStore();
  const events: string[] = [];
  const execute = createCommandExecutor({ store: tracked(store, events), ...ports() });
  await failure(execute.execute(command(), envelope, { signal: early.signal }), 'aborted');
  assertEquals(events, []);
  const during = new AbortController();
  await failure(
    execute.execute(
      command((ctx) => {
        ctx.tx.set('value', 'one');
        intents(ctx);
        during.abort('fixture');
        return Promise.resolve('one');
      }),
      envelope,
      { signal: during.signal },
    ),
    'aborted',
  );
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
  const flush = new AbortController();
  const flushing: string[] = [];
  const selected = createCommandExecutor({
    store: tracked(store, flushing, { afterAudit: () => flush.abort('fixture') }),
    ...ports(),
  });
  await failure(
    selected.execute(
      command((ctx) => {
        ctx.tx.set('value', 'one');
        intents(ctx);
        return Promise.resolve('one');
      }),
      envelope,
      { signal: flush.signal },
    ),
    'aborted',
  );
  assertEquals(flushing, ['begin', 'claim', 'audit', 'rollback']);
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
});

Deno.test('executor translates typed provider failures without guessing driver-looking business values', async () => {
  const store = createMemoryCommandStore();
  const provider = new CommandStoreError({
    kind: 'store_failure',
    retryable: true,
    phase: 'commit',
  }, { cause: new Error('trusted driver') });
  assert(Object.isFrozen(provider));
  assert(Object.isFrozen(provider.failure));
  assertEquals(
    JSON.stringify(provider),
    '{"kind":"store_failure","retryable":true,"phase":"commit"}',
  );
  const invalid = new CommandStoreError({ kind: 'aborted', retryable: true });
  assertEquals(invalid.failure.kind, 'aborted');
  const foreign = { ...provider.failure };
  Object.defineProperty(foreign, 'retryable', { value: 'unsafe' });
  assertThrows(() => new CommandStoreError(foreign), TypeError);
  const adapter: CommandStorePort<MemoryCommandBusiness> = {
    capabilities: store.capabilities,
    transaction: () => Promise.reject(provider),
  };
  const error = await failure(
    createCommandExecutor({ store: adapter, ...ports() }).execute(command(), envelope),
    'store_failure',
  );
  assertEquals(error.failure, provider.failure);
  assertStrictEquals(error.cause, provider);
  const operationEvents: string[] = [];
  let attempts = 0;
  const operationFailure = new CommandStoreError({
    kind: 'store_failure',
    retryable: true,
    phase: 'flush',
  });
  const operationExecutor = createCommandExecutor({
    store: tracked(store, operationEvents, {
      afterAudit: () => {
        throw operationFailure;
      },
    }),
    ...ports(),
  });
  const operationError = await failure(
    operationExecutor.execute(
      command((ctx) => {
        attempts++;
        ctx.tx.set('value', 'one');
        intents(ctx);
        return Promise.resolve('one');
      }),
      envelope,
    ),
    'store_failure',
  );
  assertEquals(operationError.failure, operationFailure.failure);
  assertStrictEquals(operationError.cause, operationFailure);
  assertEquals(attempts, 1);
  assertEquals(operationEvents, ['begin', 'claim', 'audit', 'rollback']);
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
  const business = { code: '40001', retryable: true, phase: 'commit' };
  try {
    await createCommandExecutor({ store, ...ports() }).execute(
      command(() => {
        throw business;
      }),
      envelope,
    );
    throw new Error('expected business error');
  } catch (error) {
    assertStrictEquals(error, business);
  }
});

Deno.test('executor codec failures rollback response and side intent without partial writes', async () => {
  for (const side of [false, true]) {
    const store = createMemoryCommandStore();
    const events: string[] = [];
    const invalid: CommandCodec<string> = { encode: () => NaN, decode: codec.decode };
    const spec = defineCommand<'codec.update', { value: string }, string, MemoryCommandBusiness>({
      name: 'codec.update',
      definitionVersion: 1,
      idempotency: {
        scope: () => 'codec',
        fingerprint: (input) => input,
        response: side ? codec : invalid,
      },
      records: { audit: 'optional', outbox: 'optional' },
      handle: (ctx) => {
        ctx.tx.set('value', 'one');
        if (side) {
          ctx.publish({ destination: 'events', topic: 'updated', payload: 'one', codec: invalid });
        }
        return Promise.resolve('one');
      },
    });
    const error = await failure(
      createCommandExecutor({ store: tracked(store, events), ...ports() }).execute(spec, envelope),
      'codec_failure',
    );
    assertEquals(error.failure, {
      kind: 'codec_failure',
      retryable: false,
      phase: side ? 'side_record' : 'response_encode',
    });
    assertEquals(events, ['begin', 'claim', 'rollback']);
    assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
  }
});

Deno.test('executor refuses a second provider callback without a second handler attempt', async () => {
  const store = createMemoryCommandStore();
  const events: string[] = [];
  let calls = 0;
  const execute = createCommandExecutor({
    store: tracked(store, events, { twice: true }),
    ...ports(),
  });
  await failure(
    execute.execute(
      command((ctx) => {
        calls++;
        ctx.tx.set('value', 'one');
        return Promise.resolve('one');
      }),
      envelope,
    ),
    'store_failure',
  );
  assertEquals(calls, 1);
  assertEquals(events, ['begin', 'claim', 'audit', 'outbox', 'complete', 'rollback']);
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
});

Deno.test('executor emits finite telemetry only after commit with default isolation and replay counts', async () => {
  const store = createMemoryCommandStore();
  const hold = store.holdBeforeCommit();
  const starts: CommandTelemetryStart[] = [];
  const results: CommandTelemetryResult[] = [];
  const telemetry: CommandTelemetryPort = {
    async trace(start, operation) {
      starts.push(start);
      return await operation({
        finish: (result) => {
          results.push(result);
          assertEquals(store.snapshot().business, { value: 'one' });
        },
      });
    },
  };
  const execute = createCommandExecutor({ store, ...ports(), telemetry });
  const spec = command((ctx) => {
    ctx.tx.set('value', 'one');
    intents(ctx);
    return Promise.resolve('one');
  });
  const pending = execute.execute(spec, envelope);
  await hold.reached;
  assertEquals(results, []);
  hold.release();
  await pending;
  await execute.execute(spec, envelope);
  assertEquals(starts[0], {
    name: 'values.update',
    definitionVersion: 1,
    isolation: 'default',
    provider: 'sqlite',
    idempotency: 'claimed',
  });
  assertEquals(results, [{
    outcome: 'applied',
    idempotency: 'claimed',
    auditCount: 1,
    outboxCount: 1,
  }, { outcome: 'replayed', idempotency: 'replayed', auditCount: 0, outboxCount: 0 }]);
  assert(!JSON.stringify({ starts, results }).includes('caller'));
  assert(!JSON.stringify({ starts, results }).includes(key));
});
