import { assert, assertEquals, assertRejects, assertStrictEquals, assertThrows } from '@std/assert';
import { createCommandStoreCapabilities } from '@netscript/database/commands';
import type {
  CommandReceiptRow,
  CommandTransaction,
  ReceiptClaim,
  StoredCommandAudit,
  StoredCommandOutbox,
} from '@netscript/database/commands';
import { createMemoryCommandStore } from '../commands-testing.ts';
import type { MemoryCommandBusiness, MemoryCommandStore } from '../commands-testing.ts';
import { CommandError } from '../commands.ts';

const request = { receiptClaimWaitMs: 0 };
const date = new Date('2026-01-01T00:00:00Z');
const claim: ReceiptClaim = {
  id: 'receipt',
  scope: 'namespace',
  commandName: 'counter.update',
  commandVersion: 1,
  keyHash: 'a'.repeat(64),
  requestHash: 'b'.repeat(64),
  actorKind: 'system',
  actorSubject: 'fixture',
  correlationId: 'correlation',
  createdAt: date,
};
const audit: StoredCommandAudit = {
  id: 'audit',
  executionId: claim.id,
  commandName: claim.commandName,
  commandVersion: 1,
  action: 'updated',
  subjectType: 'counter',
  subjectId: 'counter',
  actorKind: 'system',
  actorSubject: 'fixture',
  correlationId: claim.correlationId,
  occurredAt: date,
};
const outbox: StoredCommandOutbox = {
  id: 'outbox',
  executionId: claim.id,
  commandName: claim.commandName,
  commandVersion: 1,
  destination: 'events',
  topic: 'counter.updated',
  payloadJson: '{}',
  dedupeKey: 'outbox',
  correlationId: claim.correlationId,
  availableAt: date,
};
async function writeAll(transaction: CommandTransaction<MemoryCommandBusiness>): Promise<void> {
  assertEquals(await transaction.claimReceipt(claim), { kind: 'execute', receiptId: claim.id });
  transaction.business.set('counter', '1');
  await transaction.appendAudit([audit]);
  await transaction.appendOutbox([outbox]);
  await transaction.completeReceipt({
    receiptId: claim.id,
    responseJson: '{"updated":true}',
    completedAt: date,
  });
}

type RootMethods = '$connect' | '$disconnect' | '$transaction' | 'transaction' | 'snapshot';
type AssertFalse<T extends false> = T;
/** Compile-time port conformance: no root operation in the concrete business handle. */
export type BoundBusinessOnly = AssertFalse<
  Extract<keyof MemoryCommandBusiness, RootMethods> extends never ? false : true
>;
/** Compile-time raw port conformance: no testing control in a bound transaction. */
export type BoundTransactionOnly = AssertFalse<
  Extract<keyof CommandTransaction<MemoryCommandBusiness>, RootMethods> extends never ? false : true
>;

Deno.test('memory capabilities validate construction and immutable declarations', () => {
  const store = createMemoryCommandStore();
  const levels: 'Serializable'[] = ['Serializable'];
  const input = {
    ...store.capabilities,
    selectableIsolationLevels: levels,
    receiptClaimWait: { minimumMs: 0, maximumMs: 1000, granularityMs: 10 },
  };
  const capabilities = createCommandStoreCapabilities(input);
  levels.length = 0;
  input.receiptClaimWait.maximumMs = 2000;
  assertEquals(capabilities.selectableIsolationLevels, ['Serializable']);
  assertEquals(capabilities.receiptClaimWait.maximumMs, 1000);
  assert(Object.isFrozen(capabilities));
  assert(Object.isFrozen(capabilities.receiptClaimWait));
  assertThrows(
    () =>
      createCommandStoreCapabilities({
        ...store.capabilities,
        receiptClaimWait: { minimumMs: 0, maximumMs: 5, granularityMs: 2 },
      }),
    TypeError,
  );
  assertThrows(
    () =>
      createCommandStoreCapabilities({
        ...store.capabilities,
        selectableIsolationLevels: [],
        defaultIsolation: 'Serializable',
      }),
    TypeError,
  );
});

Deno.test('memory commits business receipt audit and outbox at one boundary', async () => {
  const store = createMemoryCommandStore();
  const barrier = store.holdBeforeCommit();
  let calls = 0;
  const operation = store.transaction(request, async (transaction) => {
    calls++;
    await writeAll(transaction);
    return 'result';
  });
  await barrier.reached;
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
  barrier.release();
  assertEquals(await operation, 'result');
  const snapshot = store.snapshot();
  assertEquals(snapshot.business, { counter: '1' });
  assertEquals(snapshot.receipts.length, 1);
  assertEquals(snapshot.receipts[0].responseJson, '{"updated":true}');
  assertEquals(snapshot.audit, [audit]);
  assertEquals(snapshot.outbox, [outbox]);
  assertEquals(calls, 1);
});

Deno.test('memory rollback preserves error identity and never retries work', async () => {
  const store = createMemoryCommandStore();
  const failure = new Error('business failure');
  let calls = 0;
  const rejected = await assertRejects(() =>
    store.transaction(request, async (transaction) => {
      calls++;
      await writeAll(transaction);
      throw failure;
    })
  );
  assertStrictEquals(rejected, failure);
  assertEquals(calls, 1);
  assertEquals(store.snapshot(), { business: {}, receipts: [], audit: [], outbox: [] });
  await store.transaction(request, writeAll);
  assertEquals(store.snapshot().receipts.length, 1);
  const negative = createMemoryCommandStore();
  await assertRejects(() =>
    negative.transaction(request, () => {
      negative.writeBusinessOutsideTransaction('counter', 'leaked');
      return Promise.reject(failure);
    })
  );
  assertEquals(negative.snapshot().business.counter, 'leaked');
});

Deno.test('memory CAS zero match and concurrent stale drafts cannot commit or retry', async () => {
  const store = createMemoryCommandStore();
  await store.transaction(request, ({ business }) => {
    assertEquals(business.compareAndSet('counter', 'wrong', 'bad'), false);
    assertEquals(business.compareAndSet('counter', undefined, '0'), true);
    return Promise.resolve();
  });
  const barrier = store.holdBeforeCommit();
  let firstCalls = 0;
  const stale = store.transaction(request, ({ business }) => {
    firstCalls++;
    assert(business.compareAndSet('counter', '0', '1'));
    return Promise.resolve();
  });
  await barrier.reached;
  await store.transaction(request, ({ business }) => {
    assert(business.compareAndSet('counter', '0', '2'));
    return Promise.resolve();
  });
  barrier.release();
  const error = await assertRejects(() => stale, CommandError);
  assert(error instanceof CommandError);
  assertEquals(error.failure, { kind: 'store_failure', retryable: true, phase: 'commit' });
  assertEquals(store.snapshot().business.counter, '2');
  assertEquals(firstCalls, 1);
});

Deno.test('memory busy is terminal for every delegate and rolls back before surfacing', async () => {
  const store = createMemoryCommandStore();
  const barrier = store.holdBeforeCommit();
  const leader = store.transaction(request, writeAll);
  await barrier.reached;
  const failure = new Error('busy sentinel');
  let calls = 0;
  const follower = await assertRejects(() =>
    store.transaction(request, async (transaction) => {
      calls++;
      transaction.business.set('follower', 'uncommitted');
      assertEquals((await transaction.claimReceipt(claim)).kind, 'busy');
      assertThrows(() => transaction.business.get('counter'), TypeError);
      assertThrows(() => transaction.business.set('counter', 'bad'), TypeError);
      await assertRejects(() => transaction.appendAudit([audit]), TypeError);
      await assertRejects(() => transaction.appendOutbox([outbox]), TypeError);
      await assertRejects(
        () =>
          transaction.completeReceipt({
            receiptId: claim.id,
            responseJson: '{}',
            completedAt: date,
          }),
        TypeError,
      );
      await assertRejects(() => transaction.claimReceipt(claim), TypeError);
      throw failure;
    })
  );
  assertStrictEquals(follower, failure);
  assertEquals(calls, 1);
  assertEquals(store.snapshot().business, {});
  await assertRejects(() =>
    store.transaction(request, async (transaction) => {
      await transaction.claimReceipt(claim);
      return 'swallowed busy';
    }), TypeError);
  barrier.release();
  await leader;
  assertEquals(store.snapshot().business, { counter: '1' });
});

Deno.test('memory snapshots detach dates and revoke bound handles after completion', async () => {
  const store = createMemoryCommandStore();
  let retained: CommandTransaction<MemoryCommandBusiness> | undefined;
  await store.transaction(request, async (transaction) => {
    retained = transaction;
    await writeAll(transaction);
  });
  assert(retained);
  const bound = retained;
  assertThrows(() => bound.business.set('counter', 'bad'), TypeError);
  await assertRejects(() => bound.appendAudit([audit]), TypeError);
  const snapshot = store.snapshot();
  assert(Object.isFrozen(snapshot));
  assert(Object.isFrozen(snapshot.business));
  assert(Object.isFrozen(snapshot.receipts));
  assert(Object.isFrozen(snapshot.receipts[0]));
  assertEquals(Reflect.set(snapshot.business, 'counter', 'bad'), false);
  snapshot.receipts[0].createdAt.setUTCFullYear(2000);
  snapshot.audit[0].occurredAt.setUTCFullYear(2000);
  snapshot.outbox[0].availableAt.setUTCFullYear(2000);
  assertEquals(store.snapshot().receipts[0].createdAt, date);
  assertEquals(store.snapshot().audit[0].occurredAt, date);
  assertEquals(store.snapshot().outbox[0].availableAt, date);
  assertEquals(createMemoryCommandStore().snapshot().receipts, []);
});

Deno.test('memory cancellation timeout and unsupported requests rollback before settlement', async () => {
  const store = createMemoryCommandStore();
  const abort = new AbortController();
  const reason = new Error('cancel');
  const barrier = store.holdBeforeCommit();
  let retained: CommandTransaction<MemoryCommandBusiness> | undefined;
  const operation = store.transaction(request, async (transaction) => {
    retained = transaction;
    await writeAll(transaction);
  }, abort.signal);
  await barrier.reached;
  abort.abort(reason);
  assertStrictEquals(await assertRejects(() => operation), reason);
  barrier.release();
  assertEquals(store.snapshot().receipts, []);
  assert(retained);
  const bound = retained;
  assertThrows(() => bound.business.get('counter'), TypeError);
  const timed = createMemoryCommandStore({ transactionTimeoutMs: 10 });
  await assertRejects(() =>
    timed.transaction(request, async (transaction) => {
      transaction.business.set('counter', '1');
      await new Promise(() => {});
    }), CommandError);
  assertEquals(timed.snapshot().business, {});
  let calls = 0;
  const never = () => {
    calls++;
    return Promise.resolve();
  };
  await assertRejects(() => store.transaction({ receiptClaimWaitMs: 1 }, never), TypeError);
  await assertRejects(
    () => store.transaction({ ...request, options: { isolationLevel: 'ReadCommitted' } }, never),
    TypeError,
  );
  await assertRejects(
    () => store.transaction({ ...request, options: { timeout: 0 } }, never),
    TypeError,
  );
  await assertRejects(() => store.transaction(request, never, abort.signal));
  assertEquals(calls, 0);
});

Deno.test('memory receipt constraints replay mismatch corruption and duplicate side rows', async () => {
  const store: MemoryCommandStore = createMemoryCommandStore();
  await store.transaction(request, writeAll);
  await store.transaction(request, async (transaction) => {
    const replay = await transaction.claimReceipt({ ...claim, id: 'new', correlationId: 'new' });
    assertEquals(replay.kind, 'replay');
    if (replay.kind === 'replay') {
      assertEquals(replay.receipt.id, claim.id);
      assertEquals(replay.receipt.correlationId, claim.correlationId);
    }
    assertEquals(
      (await transaction.claimReceipt({ ...claim, requestHash: 'different' })).kind,
      'mismatch',
    );
    assertEquals(
      (await transaction.claimReceipt({ ...claim, commandVersion: 2 })).kind,
      'mismatch',
    );
    await assertRejects(() => transaction.appendAudit([audit]), TypeError);
    await assertRejects(() => transaction.appendOutbox([outbox]), TypeError);
    await assertRejects(
      () =>
        transaction.completeReceipt({ receiptId: claim.id, responseJson: '{}', completedAt: date }),
      TypeError,
    );
  });
  const corrupt: CommandReceiptRow = { ...claim, responseJson: null, completedAt: null };
  const other = createMemoryCommandStore();
  other.seedReceipt(corrupt);
  await assertRejects(() =>
    other.transaction(request, async (transaction) => {
      await transaction.claimReceipt(claim);
    }), CommandError);
  const incomplete = createMemoryCommandStore();
  await assertRejects(() =>
    incomplete.transaction(request, async (transaction) => {
      await transaction.claimReceipt(claim);
    }), CommandError);
  assertEquals(incomplete.snapshot().receipts, []);
});
