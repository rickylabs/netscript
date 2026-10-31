import { assertEquals, assertRejects } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { KvSagaStore } from '@netscript/plugin-sagas-core/stores';
import {
  createProjectingSagaStore,
  KvSagaInstanceProjection,
  parseSagaInstanceReadModel,
} from '../../src/runtime/saga-instance-projection.ts';
import {
  RECEIPT_INSTANCE,
  RECEIPT_SAGA_ID,
  receiptSaga,
  runProjectedReceiptFlow,
} from './fixtures/projected-receipt-flow.ts';

Deno.test('issue 2390: native KV refuses atomic worker-command sagas before writes', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = new KvSagaStore({ kv });
  const runtime = createSagaRuntime({
    native: { store: createProjectingSagaStore(store, new KvSagaInstanceProjection(kv, () => 7)) },
  });
  try {
    await assertRejects(
      () => runtime.register([receiptSaga(true)]),
      TypeError,
      'lacks atomic transition/outbox and replay capability',
    );
    assertEquals(await store.load(RECEIPT_INSTANCE), undefined);
    const rows = [];
    for await (const entry of kv.list({ prefix: ['sagas'] })) rows.push(entry);
    assertEquals(rows, []);
  } finally {
    await runtime.stop();
    await kv.close();
  }
});

Deno.test('issue 2390: persisted KV receipt projection survives producer and processor restarts (no atomic worker outbox)', async () => {
  const directory = await Deno.makeTempDir();
  const kv = new DenoKvAdapter(await Deno.openKv(directory + '/saga.db'));
  try {
    await runProjectedReceiptFlow({
      openStore: async () =>
        new KvSagaStore({ kv: new DenoKvAdapter(await Deno.openKv(directory + '/saga.db')) }),
      readCanonical: () => new KvSagaStore({ kv }).load(RECEIPT_INSTANCE),
      projection: new KvSagaInstanceProjection(kv, () => 7),
      serviceContext: {
        sagaStore: new KvSagaStore({ kv }),
        db: {
          sagaInstance: {
            findFirst: () => Promise.reject(new Error('KV must use canonical lookup')),
            findMany: () => Promise.resolve([]),
            count: () => Promise.resolve(0),
          },
          sagaExecutionHistory: {
            findMany: () => Promise.resolve([]),
            count: () => Promise.resolve(0),
          },
        },
      },
      readProjection: async () => {
        const entry = await kv.get(['saga_instances', RECEIPT_SAGA_ID, RECEIPT_INSTANCE]);
        return entry ? parseSagaInstanceReadModel(entry.value) : undefined;
      },
      assertCommands: (expected) => {
        assertEquals(expected, 0);
        return Promise.resolve();
      },
    });
    assertEquals((await new KvSagaStore({ kv }).transitions(RECEIPT_INSTANCE)).length, 2);
  } finally {
    await kv.close();
    await Deno.remove(directory, { recursive: true });
  }
});
