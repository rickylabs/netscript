import { assertEquals, assertInstanceOf, assertStrictEquals } from 'jsr:@std/assert@1';
import { DriverAdapterError, type SqlQuery } from '@prisma/driver-adapter-utils';

import { getCapabilities, PrismaMySqlAdapter, toMysql2PoolOptions } from '../src/adapter.ts';
import type { MySqlCapabilities, PrismaMySqlOptions } from '../src/types.ts';

interface FakeExecuteResult {
  affectedRows?: number;
  lastInsertId?: number | bigint;
  rows?: unknown[];
}

type QueryImpl = (
  sql: string,
  values?: readonly unknown[],
) => Promise<Record<string, unknown>[]>;
type ExecuteImpl = (
  sql: string,
  values?: readonly unknown[],
) => Promise<FakeExecuteResult>;

class FakeQueryableClient {
  queryImpl: QueryImpl = () => Promise.resolve([]);
  executeImpl: ExecuteImpl = () => Promise.resolve({ affectedRows: 0 });

  query(
    sql: string,
    values?: readonly unknown[],
  ): Promise<Record<string, unknown>[]> {
    return this.queryImpl(sql, values);
  }

  execute(
    sql: string,
    values?: readonly unknown[],
  ): Promise<FakeExecuteResult> {
    return this.executeImpl(sql, values);
  }
}

class FakePoolClient extends FakeQueryableClient {
  connection = new FakeQueryableClient();
  closeImpl: () => Promise<void> = () => Promise.resolve();
  useConnectionImpl:
    | ((
      fn: (connection: FakeQueryableClient) => Promise<unknown>,
    ) => Promise<unknown>)
    | undefined;

  connect(): Promise<FakePoolClient> {
    return Promise.resolve(this);
  }

  async useConnection<T>(
    fn: (connection: FakeQueryableClient) => Promise<T>,
  ): Promise<T> {
    if (this.useConnectionImpl) {
      return await this.useConnectionImpl(fn) as T;
    }
    return await fn(this.connection);
  }

  close(): Promise<void> {
    return this.closeImpl();
  }
}

interface DriverErrorFields {
  errno?: number;
  code?: string;
  fatal?: boolean;
  sqlMessage?: string;
}

const CAPABILITIES: MySqlCapabilities = { supportsRelationJoins: false };
const SELECT_QUERY: SqlQuery = {
  sql: 'SELECT 1',
  args: [],
  argTypes: [],
};
const EXECUTE_QUERY: SqlQuery = {
  sql: 'INSERT INTO Example (id) VALUES (1)',
  args: [],
  argTypes: [],
};

function driverError(
  fields: DriverErrorFields = { code: 'ECONNRESET' },
): Error & DriverErrorFields {
  return Object.assign(new Error('driver failure'), fields);
}

function callbackRecorder(throws = false): {
  calls: Error[];
  options: PrismaMySqlOptions;
} {
  const calls: Error[] = [];
  return {
    calls,
    options: {
      onConnectionError(error: Error): void {
        calls.push(error);
        if (throws) {
          throw new Error('callback failure');
        }
      },
    },
  };
}

function adapter(
  client: FakePoolClient,
  options?: PrismaMySqlOptions,
): PrismaMySqlAdapter {
  return new PrismaMySqlAdapter(client, CAPABILITIES, options);
}

async function captureRejection(operation: () => Promise<unknown>): Promise<unknown> {
  try {
    await operation();
  } catch (error) {
    return error;
  }
  throw new Error('Expected operation to reject');
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function assertSingleCall(calls: Error[], error: Error): void {
  assertEquals(calls.length, 1);
  assertStrictEquals(calls[0], error);
}

Deno.test('capability probe notifies once and preserves fallback for connection errors', async () => {
  const error = driverError({ fatal: true, errno: 1045 });
  const client = new FakePoolClient();
  client.queryImpl = () => Promise.reject(error);
  const recorder = callbackRecorder(true);

  const capabilities = await getCapabilities(client, recorder.options);
  const connected = new PrismaMySqlAdapter(client, capabilities, recorder.options);

  assertEquals(capabilities, { supportsRelationJoins: false });
  assertEquals(connected.getConnectionInfo().supportsRelationJoins, false);
  assertSingleCall(recorder.calls, error);
});

Deno.test('capability probe preserves fallback without notifying for mapped query errors', async () => {
  const error = driverError({ errno: 1146 });
  const client = new FakePoolClient();
  client.queryImpl = () => Promise.reject(error);
  const recorder = callbackRecorder();

  const capabilities = await getCapabilities(client, recorder.options);

  assertEquals(capabilities, { supportsRelationJoins: false });
  assertEquals(recorder.calls.length, 0);
});

for (const operation of ['queryRaw', 'executeRaw'] as const) {
  Deno.test(`pooled ${operation} notifies once and preserves mapped rejection`, async () => {
    const error = driverError();
    const client = new FakePoolClient();
    if (operation === 'queryRaw') {
      client.queryImpl = () => Promise.reject(error);
    } else {
      client.executeImpl = () => Promise.reject(error);
    }
    const recorder = callbackRecorder(true);
    const connected = adapter(client, recorder.options);

    const rejection = await captureRejection(() =>
      connected[operation](
        operation === 'queryRaw' ? SELECT_QUERY : EXECUTE_QUERY,
      )
    );

    assertInstanceOf(rejection, DriverAdapterError);
    assertSingleCall(recorder.calls, error);
  });

  Deno.test(`pooled ${operation} excludes classifier-false errors`, async () => {
    const error = driverError({ errno: 1146 });
    const client = new FakePoolClient();
    if (operation === 'queryRaw') {
      client.queryImpl = () => Promise.reject(error);
    } else {
      client.executeImpl = () => Promise.reject(error);
    }
    const recorder = callbackRecorder();
    const connected = adapter(client, recorder.options);

    const rejection = await captureRejection(() =>
      connected[operation](
        operation === 'queryRaw' ? SELECT_QUERY : EXECUTE_QUERY,
      )
    );

    assertInstanceOf(rejection, DriverAdapterError);
    assertEquals(recorder.calls.length, 0);
  });
}

Deno.test('executeScript contains callback failure and preserves raw rejection identity', async () => {
  const error = driverError();
  const client = new FakePoolClient();
  client.queryImpl = () => Promise.reject(error);
  const recorder = callbackRecorder(true);

  const withoutCallback = await captureRejection(() => adapter(client).executeScript('SELECT 1'));
  const withThrowingCallback = await captureRejection(() =>
    adapter(client, recorder.options).executeScript('SELECT 1')
  );

  assertStrictEquals(withoutCallback, error);
  assertStrictEquals(withThrowingCallback, withoutCallback);
  assertSingleCall(recorder.calls, error);
});

Deno.test('executeScript excludes classifier-false errors', async () => {
  const error = driverError({ errno: 1146 });
  const client = new FakePoolClient();
  client.queryImpl = () => Promise.reject(error);
  const recorder = callbackRecorder();

  const rejection = await captureRejection(() =>
    adapter(client, recorder.options).executeScript('SELECT 1')
  );

  assertStrictEquals(rejection, error);
  assertEquals(recorder.calls.length, 0);
});

for (const errno of [1045, 1044, 1049]) {
  for (const fatal of [true, false]) {
    Deno.test(`pooled auth-family errno ${errno} ${fatal ? 'notifies when fatal' : 'does not notify mid-session'}`, async () => {
      const error = driverError({ errno, fatal, sqlMessage: 'MySQL access failure' });
      const client = new FakePoolClient();
      client.queryImpl = () => Promise.reject(error);
      const recorder = callbackRecorder();

      const rejection = await captureRejection(() =>
        adapter(client, recorder.options).queryRaw(SELECT_QUERY)
      );

      assertInstanceOf(rejection, DriverAdapterError);
      if (fatal) {
        assertSingleCall(recorder.calls, error);
      } else {
        assertEquals(recorder.calls.length, 0);
      }
    });
  }
}

for (const stage of ['acquisition', 'isolation', 'begin'] as const) {
  for (const classified of [true, false]) {
    Deno.test(`transaction ${stage} ${classified ? 'notifies once' : 'excludes classifier-false errors'}`, async () => {
      const error = classified ? driverError() : driverError({ errno: 1146 });
      const client = new FakePoolClient();
      if (stage === 'acquisition') {
        client.useConnectionImpl = () => Promise.reject(error);
      } else {
        client.connection.executeImpl = (sql) => {
          const fails = stage === 'isolation' ? sql.startsWith('SET TRANSACTION') : sql === 'BEGIN';
          return fails ? Promise.reject(error) : Promise.resolve({ affectedRows: 0 });
        };
      }
      const recorder = callbackRecorder();
      const connected = adapter(client, recorder.options);

      const rejection = await captureRejection(() =>
        connected.startTransaction(stage === 'isolation' ? 'SERIALIZABLE' : undefined)
      );
      await flushMicrotasks();

      assertStrictEquals(rejection, error);
      if (classified) {
        assertSingleCall(recorder.calls, error);
      } else {
        assertEquals(recorder.calls.length, 0);
      }
    });
  }
}

for (const operation of ['queryRaw', 'executeRaw'] as const) {
  for (const classified of [true, false]) {
    Deno.test(`transaction ${operation} ${classified ? 'notifies once' : 'excludes classifier-false errors'}`, async () => {
      const error = classified ? driverError() : driverError({ errno: 1146 });
      const client = new FakePoolClient();
      if (operation === 'queryRaw') {
        client.connection.queryImpl = () => Promise.reject(error);
      } else {
        client.connection.executeImpl = (sql) =>
          sql === 'BEGIN' || sql === 'COMMIT'
            ? Promise.resolve({ affectedRows: 0 })
            : Promise.reject(error);
      }
      const recorder = callbackRecorder();
      const transaction = await adapter(client, recorder.options).startTransaction();

      const rejection = await captureRejection(() =>
        transaction[operation](
          operation === 'queryRaw' ? SELECT_QUERY : EXECUTE_QUERY,
        )
      );
      await transaction.commit();

      assertInstanceOf(rejection, DriverAdapterError);
      if (classified) {
        assertSingleCall(recorder.calls, error);
      } else {
        assertEquals(recorder.calls.length, 0);
      }
    });
  }
}

for (const operation of ['commit', 'rollback'] as const) {
  for (const classified of [true, false]) {
    Deno.test(`${operation} ${classified ? 'notifies once' : 'excludes classifier-false errors'} and preserves raw rejection`, async () => {
      const error = classified ? driverError() : driverError({ errno: 1146 });
      const client = new FakePoolClient();
      client.connection.executeImpl = (sql) =>
        sql === operation.toUpperCase()
          ? Promise.reject(error)
          : Promise.resolve({ affectedRows: 0 });
      const recorder = callbackRecorder(true);
      const transaction = await adapter(client, recorder.options).startTransaction();

      const rejection = await captureRejection(() => transaction[operation]());

      assertStrictEquals(rejection, error);
      if (classified) {
        assertSingleCall(recorder.calls, error);
      } else {
        assertEquals(recorder.calls.length, 0);
      }
    });
  }
}

for (const classified of [true, false]) {
  Deno.test(`post-ready lifecycle failure ${classified ? 'notifies once' : 'excludes classifier-false errors'}`, async () => {
    const error = classified ? driverError() : driverError({ errno: 1146 });
    const client = new FakePoolClient();
    client.useConnectionImpl = async (fn) => {
      await fn(client.connection);
      throw error;
    };
    const recorder = callbackRecorder();
    const transaction = await adapter(client, recorder.options).startTransaction();

    await transaction.commit();
    await flushMicrotasks();

    if (classified) {
      assertSingleCall(recorder.calls, error);
    } else {
      assertEquals(recorder.calls.length, 0);
    }
  });
}

for (const classified of [true, false]) {
  Deno.test(`dispose ${classified ? 'notifies once' : 'excludes classifier-false errors'} and preserves raw rejection`, async () => {
    const error = classified ? driverError() : driverError({ errno: 1146 });
    const client = new FakePoolClient();
    client.closeImpl = () => Promise.reject(error);
    const recorder = callbackRecorder(true);

    const rejection = await captureRejection(() => adapter(client, recorder.options).dispose());

    assertStrictEquals(rejection, error);
    if (classified) {
      assertSingleCall(recorder.calls, error);
    } else {
      assertEquals(recorder.calls.length, 0);
    }
  });
}

Deno.test('successful disposal never notifies', async () => {
  const client = new FakePoolClient();
  const recorder = callbackRecorder();
  let closeCalls = 0;
  client.closeImpl = () => {
    closeCalls += 1;
    return Promise.resolve();
  };

  await adapter(client, recorder.options).dispose();

  assertEquals(recorder.calls.length, 0);
  assertEquals(closeCalls, 1);
});

Deno.test('structured connection config maps exactly to mysql2 pool options', () => {
  assertEquals(
    toMysql2PoolOptions({
      hostname: 'db.internal',
      port: 3307,
      username: 'app',
      password: 'secret',
      db: 'example',
      poolSize: 4,
      timeout: 12_345,
    }),
    {
      host: 'db.internal',
      port: 3307,
      user: 'app',
      password: 'secret',
      database: 'example',
      waitForConnections: true,
      connectionLimit: 4,
      multipleStatements: true,
      connectTimeout: 12_345,
    },
  );
});

Deno.test('structured connection config defaults pool size to one', () => {
  assertEquals(toMysql2PoolOptions({}).connectionLimit, 1);
});

Deno.test('legacy verify_identity without CA certificates leaves TLS unset', () => {
  const options = toMysql2PoolOptions({
    tls: { mode: 'verify_identity' },
  });

  assertEquals(options.ssl, undefined);
});

Deno.test('legacy verify_identity forwards only joined CA certificates', () => {
  const options = toMysql2PoolOptions({
    tls: {
      mode: 'verify_identity',
      caCerts: ['first certificate', 'second certificate'],
    },
  });

  assertEquals(options.ssl, {
    ca: 'first certificate\nsecond certificate',
  });
});

Deno.test('disabled TLS ignores CA certificates and leaves TLS unset', () => {
  const options = toMysql2PoolOptions({
    tls: { mode: 'disabled', caCerts: ['ignored certificate'] },
  });

  assertEquals(options.ssl, undefined);
});
