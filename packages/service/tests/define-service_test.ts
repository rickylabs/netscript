import { assertEquals } from '@std/assert';
import { defineService } from '../mod.ts';

async function withReachableDatabaseEndpoint(
  run: () => Promise<void>,
): Promise<void> {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const previousHost = Deno.env.get('MYSQLDB_HOST');
  const previousPort = Deno.env.get('MYSQLDB_PORT');
  let accepting = true;
  const acceptLoop = (async () => {
    while (accepting) {
      try {
        const conn = await listener.accept();
        conn.close();
      } catch {
        if (accepting) throw new Error('database endpoint accept failed');
      }
    }
  })();

  Deno.env.set('MYSQLDB_HOST', '127.0.0.1');
  Deno.env.set('MYSQLDB_PORT', String(listener.addr.port));

  try {
    await run();
  } finally {
    accepting = false;
    listener.close();
    await acceptLoop.catch(() => {});
    restoreEnv('MYSQLDB_HOST', previousHost);
    restoreEnv('MYSQLDB_PORT', previousPort);
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    Deno.env.delete(name);
    return;
  }
  Deno.env.set(name, value);
}

Deno.test('defineService disconnects a capable database client on stop', async () => {
  await withReachableDatabaseEndpoint(async () => {
    let queryCount = 0;
    let disconnectCount = 0;
    const db = {
      $queryRaw(_query: TemplateStringsArray): Promise<unknown> {
        queryCount += 1;
        return Promise.resolve(1);
      },
      $disconnect(): Promise<void> {
        disconnectCount += 1;
        return Promise.resolve();
      },
    };

    const running = await defineService({}, {
      name: 'define-service-disconnect',
      port: 0,
      db,
    });
    await running.stop();
    await running.stop();

    assertEquals(queryCount, 1);
    assertEquals(disconnectCount, 1);
  });
});

Deno.test('defineService exposes a friendly service landing response', async () => {
  const running = await defineService({}, {
    name: 'define-service-landing',
    port: 0,
  });

  try {
    const response = await running.app.request('/');
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.service, 'define-service-landing');
    assertEquals(
      body.message,
      'NetScript service is running. Open /api/docs for the oRPC playground.',
    );
    assertEquals(body.endpoints.playground, '/api/docs');
  } finally {
    await running.stop();
  }
});

Deno.test('defineService aggregate health selects sqlite and excludes unused mysql', async () => {
  const previousProvider = Deno.env.get('DB_PROVIDER');
  Deno.env.set('DB_PROVIDER', 'sqlite');
  let mysqlQueries = 0;
  let sqliteQueries = 0;

  const running = await defineService({}, {
    name: 'define-service-provider-health',
    port: 0,
    db: {
      mysql: {
        $queryRaw(): Promise<unknown> {
          mysqlQueries += 1;
          return Promise.reject(new Error('unused mysql queried'));
        },
      },
      sqlite: {
        $queryRaw(): Promise<unknown> {
          sqliteQueries += 1;
          return Promise.resolve(1);
        },
      },
    },
  });

  try {
    const response = await running.app.request('/health');
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.status, 'healthy');
    assertEquals(body.checks.map((check: { name: string }) => check.name), ['database:sqlite']);
    assertEquals(mysqlQueries, 0);
    assertEquals(sqliteQueries, 1);
  } finally {
    await running.stop();
    restoreEnv('DB_PROVIDER', previousProvider);
  }
});

Deno.test('defineService preserves readiness for the configured database', async () => {
  const previousProvider = Deno.env.get('DB_PROVIDER');
  Deno.env.set('DB_PROVIDER', 'sqlite');
  let rejectQuery = false;

  const running = await defineService({}, {
    name: 'define-service-provider-readiness',
    port: 0,
    db: {
      mysql: {
        $queryRaw(): Promise<unknown> {
          return Promise.reject(new Error('unused mysql queried'));
        },
      },
      sqlite: {
        $queryRaw(): Promise<unknown> {
          return rejectQuery
            ? Promise.reject(new Error('configured sqlite unavailable'))
            : Promise.resolve(1);
        },
      },
    },
  });

  try {
    const readyResponse = await running.app.request('/health/ready');
    assertEquals(readyResponse.status, 200);
    assertEquals(await readyResponse.json(), { ready: true });

    rejectQuery = true;
    const notReadyResponse = await running.app.request('/health/ready');
    assertEquals(notReadyResponse.status, 503);
    assertEquals(await notReadyResponse.json(), { ready: false });
  } finally {
    await running.stop();
    restoreEnv('DB_PROVIDER', previousProvider);
  }
});

Deno.test('defineService skips disconnect hook for non-capable database client', async () => {
  await withReachableDatabaseEndpoint(async () => {
    let queryCount = 0;
    const db = {
      $queryRaw(_query: TemplateStringsArray): Promise<unknown> {
        queryCount += 1;
        return Promise.resolve(1);
      },
    };

    const running = await defineService({}, {
      name: 'define-service-no-disconnect',
      port: 0,
      db,
    });
    await running.stop();

    assertEquals(queryCount, 1);
  });
});
