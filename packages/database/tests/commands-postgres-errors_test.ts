import { assertEquals, assertInstanceOf, assertRejects, assertStrictEquals } from '@std/assert';
import { CommandStoreError } from '../commands.ts';
import {
  createPostgresCommandStore,
  type PostgresCommandClient,
  type ReceiptClaim,
} from '../commands-postgres.ts';

// Structurally identical to the Prisma 7 classes, but loaded from a second module instance:
// a consumer's generated client can resolve its own `@prisma/client` copy, so these never
// satisfy `instanceof` against the package's import.
class DriverAdapterError extends Error {
  override name = 'DriverAdapterError';
  override cause: { kind: string; originalCode?: string };
  constructor(payload: { kind: string; originalCode?: string }) {
    super(payload.kind);
    this.cause = payload;
  }
}

class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;
  clientVersion = '7.10.0';
  constructor(code: string, meta?: Record<string, unknown>) {
    super('known request error');
    this.name = 'PrismaClientKnownRequestError';
    this.code = code;
    this.meta = meta;
  }
}

const postgresError = (originalCode: string) =>
  new DriverAdapterError({ kind: 'postgres', originalCode });

const claim: ReceiptClaim = {
  id: 'r1',
  scope: 's',
  commandName: 'c',
  commandVersion: 1,
  keyHash: 'k',
  requestHash: 'h',
  actorKind: 'system',
  actorSubject: 'worker',
  correlationId: 'corr',
  createdAt: new Date(0),
};

/** Root whose claim INSERT fails with `insertError`, or whose commit fails with `commitError`. */
function root(failure: { insertError?: unknown; commitError?: unknown }) {
  let queries = 0;
  const business: PostgresCommandClient = {
    $queryRawUnsafe<T>(): Promise<T> {
      queries++;
      if (queries === 1) return Promise.resolve([{ value: '0' }] as T);
      if (queries === 3 && 'insertError' in failure) return Promise.reject(failure.insertError);
      return Promise.resolve([{ id: 'r1' }] as T);
    },
    $executeRawUnsafe: () => Promise.resolve(1),
  };
  return {
    async $transaction<R>(work: (tx: PostgresCommandClient) => Promise<R>): Promise<R> {
      const value = await work(business);
      if ('commitError' in failure) throw failure.commitError;
      return value;
    },
  };
}

const store = (failure: { insertError?: unknown; commitError?: unknown }) =>
  createPostgresCommandStore(root(failure), { transactionTimeoutMs: 1000 });

for (
  const [label, error] of [
    ['driver adapter error', postgresError('55P03')],
    [
      'known request error wrapping a driver adapter error',
      new PrismaClientKnownRequestError('P2010', { driverAdapterError: postgresError('55P03') }),
    ],
    [
      'known request error carrying meta.code',
      new PrismaClientKnownRequestError('P2010', { code: '55P03' }),
    ],
  ] as const
) {
  Deno.test(`foreign-instance 55P03 ${label} is a busy claim`, async () => {
    const result = await store({ insertError: error }).transaction(
      { receiptClaimWaitMs: 25 },
      async (tx) => await tx.claimReceipt(claim),
    );
    assertEquals(result, { kind: 'busy', retryAfterMs: 25 });
  });
}

for (
  const [label, error] of [
    ['driver adapter 40001', postgresError('40001')],
    ['driver adapter 40P01', postgresError('40P01')],
    ['known request error P2034', new PrismaClientKnownRequestError('P2034')],
    [
      'known request error wrapping 40001',
      new PrismaClientKnownRequestError('P2010', { driverAdapterError: postgresError('40001') }),
    ],
  ] as const
) {
  Deno.test(`foreign-instance ${label} at commit is a retryable store failure`, async () => {
    const failure = await assertRejects(
      () =>
        store({ commitError: error }).transaction(
          { receiptClaimWaitMs: 25 },
          () => Promise.resolve(1),
        ),
      CommandStoreError,
    );
    assertEquals(failure.failure, { kind: 'store_failure', retryable: true, phase: 'commit' });
    assertStrictEquals(failure.cause, error);
  });
}

for (
  const [label, error] of [
    ['an unrelated SQLSTATE', postgresError('23505')],
    ['an unnamed error carrying a SQLSTATE code', Object.assign(new Error('x'), { code: '40001' })],
    [
      'a lookalike name without a cause object',
      Object.assign(new Error('x'), { name: 'DriverAdapterError' }),
    ],
    ['a thrown primitive', 'boom'],
    ['a thrown null', null],
  ] as const
) {
  Deno.test(`${label} at commit is a non-retryable store failure`, async () => {
    const failure = await assertRejects(
      () =>
        store({ commitError: error }).transaction(
          { receiptClaimWaitMs: 25 },
          () => Promise.resolve(1),
        ),
      CommandStoreError,
    );
    assertEquals(failure.failure, { kind: 'store_failure', retryable: false, phase: 'commit' });
  });
}

for (
  const [label, error] of [
    ['a SQLSTATE code', Object.assign(new Error('domain'), { code: '40001' })],
    // The native conformance fixture's business error: Prisma's name, but no Prisma request code.
    [
      "Prisma's name with a SQLSTATE code",
      Object.assign(new Error('business'), {
        code: '40001',
        name: 'PrismaClientKnownRequestError',
        meta: { code: '40001' },
      }),
    ],
    [
      "Prisma's name and code without a client version",
      Object.assign(new Error('business'), {
        code: 'P2034',
        name: 'PrismaClientKnownRequestError',
      }),
    ],
  ] as const
) {
  Deno.test(`business errors with ${label} pass through unclassified`, async () => {
    const thrown = await assertRejects(() =>
      store({}).transaction({ receiptClaimWaitMs: 25 }, () => Promise.reject(error))
    );
    assertStrictEquals(thrown, error);
  });
}

Deno.test('foreign-instance business-phase serialization failure is retryable', async () => {
  const error = postgresError('40001');
  const thrown = await assertRejects(() =>
    store({}).transaction({ receiptClaimWaitMs: 25 }, () => Promise.reject(error))
  );
  assertInstanceOf(thrown, CommandStoreError);
  assertEquals(thrown.failure, { kind: 'store_failure', retryable: true, phase: 'business' });
});
