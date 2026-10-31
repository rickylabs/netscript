import { assert, assertEquals } from '@std/assert';
import {
  createDatabaseConnectivityStartupHook,
  resolveProbeEngine,
} from '../src/diagnostics/database-connectivity.ts';
import type { Database } from '../src/types.ts';

// Regression coverage for #175: a service scaffolded with
// PrimaryDatabase=sqlite must NOT run (and thus must not log a spurious ERR
// for) the MySQL connectivity probe. sqlite is file-based and has no TCP
// endpoint, so the probe resolves to 'skip'.
Deno.test('resolveProbeEngine skips probe for sqlite (no spurious MySQL probe) (#175)', () => {
  assertEquals(resolveProbeEngine('sqlite'), 'skip');
  assertEquals(resolveProbeEngine('SQLite'), 'skip');
});

Deno.test('resolveProbeEngine targets the configured TCP engine', () => {
  assertEquals(resolveProbeEngine('mysql'), 'mysql');
  assertEquals(resolveProbeEngine('postgres'), 'postgres');
  assertEquals(resolveProbeEngine('postgresql'), 'postgres');
  assertEquals(resolveProbeEngine('mssql'), 'mssql');
  assertEquals(resolveProbeEngine('sqlserver'), 'mssql');
});

Deno.test('resolveProbeEngine is case-insensitive for TCP engines', () => {
  assertEquals(resolveProbeEngine('MySQL'), 'mysql');
  assertEquals(resolveProbeEngine('POSTGRES'), 'postgres');
  assertEquals(resolveProbeEngine('SqlServer'), 'mssql');
});

Deno.test('resolveProbeEngine falls back to mysql only when provider is unset', () => {
  // Preserves the legacy default for existing MySQL deployments that do not
  // export DB_PROVIDER / DATABASE_PROVIDER.
  assertEquals(resolveProbeEngine(undefined), 'mysql');
  assertEquals(resolveProbeEngine(null), 'mysql');
  assertEquals(resolveProbeEngine(''), 'mysql');
});

Deno.test('resolveProbeEngine skips unrecognized providers instead of probing mysql', () => {
  // An unknown engine must not silently fall back to a MySQL probe.
  assertEquals(resolveProbeEngine('duckdb'), 'skip');
  assertEquals(resolveProbeEngine('mongodb'), 'skip');
});

Deno.test('resolveProbeEngine reads DB_PROVIDER from the environment', () => {
  const prevDbProvider = Deno.env.get('DB_PROVIDER');
  const prevDatabaseProvider = Deno.env.get('DATABASE_PROVIDER');
  try {
    Deno.env.set('DB_PROVIDER', 'sqlite');
    Deno.env.delete('DATABASE_PROVIDER');
    assertEquals(resolveProbeEngine(), 'skip');

    Deno.env.set('DB_PROVIDER', 'mysql');
    assertEquals(resolveProbeEngine(), 'mysql');
  } finally {
    restoreEnv('DB_PROVIDER', prevDbProvider);
    restoreEnv('DATABASE_PROVIDER', prevDatabaseProvider);
  }
});

Deno.test('resolveProbeEngine falls back to DATABASE_PROVIDER when DB_PROVIDER is unset', () => {
  const prevDbProvider = Deno.env.get('DB_PROVIDER');
  const prevDatabaseProvider = Deno.env.get('DATABASE_PROVIDER');
  try {
    Deno.env.delete('DB_PROVIDER');
    Deno.env.set('DATABASE_PROVIDER', 'sqlite');
    assertEquals(resolveProbeEngine(), 'skip');
  } finally {
    restoreEnv('DB_PROVIDER', prevDbProvider);
    restoreEnv('DATABASE_PROVIDER', prevDatabaseProvider);
  }
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    Deno.env.delete(name);
  } else {
    Deno.env.set(name, value);
  }
}

async function runProbe(port: number, database: Database): Promise<void> {
  const environment = {
    DB_PROVIDER: 'mysql',
    MYSQLDB_HOST: 'localhost',
    MYSQLDB_PORT: String(port),
    MYSQLDB_URI: undefined,
    ConnectionStrings__mysqldb: undefined,
  };
  const previous = Object.keys(environment).map((key) => [key, Deno.env.get(key)] as const);
  try {
    for (const [key, value] of Object.entries(environment)) restoreEnv(key, value);
    await createDatabaseConnectivityStartupHook({ serviceName: 'probe-fixture', database })();
  } finally {
    for (const [key, value] of previous) restoreEnv(key, value);
  }
}

Deno.test({
  name: 'database TCP probe closes its native loopback connection before querying',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  async fn() {
    const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    let peer: Deno.TcpConn | undefined;
    const deadline = setTimeout(() => {
      listener.close();
      peer?.close();
    }, 10_000);
    let queries = 0;
    const observation = (async () => {
      peer = await listener.accept();
      assertEquals(await peer.read(new Uint8Array(1)), null, 'probe must send EOF');
    })();
    try {
      await runProbe(listener.addr.port, {
        $queryRaw(query) {
          assertEquals([...query], ['SELECT 1']);
          queries += 1;
          return Promise.resolve(1);
        },
      });
      await observation;
      assertEquals(queries, 1);
    } finally {
      clearTimeout(deadline);
      listener.close();
      peer?.close();
      await observation.catch(() => undefined);
    }
  },
});

Deno.test({
  name: 'database TCP probe retries a native refused endpoint and returns without querying',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  async fn() {
    const reservation = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const port = reservation.addr.port;
    reservation.close();
    let queries = 0;
    const started = performance.now();
    await runProbe(port, {
      $queryRaw() {
        queries += 1;
        return Promise.resolve(1);
      },
    });
    assertEquals(queries, 0);
    assert(performance.now() - started >= 4000, 'retain both 2000 ms retry delays');
    assert(performance.now() - started < 15_000, 'refused endpoint must remain bounded');
  },
});

// Supplemental unit scheduling evidence; native success/refusal controls above stay live.
for (const mode of ['reject', 'throw', 'abort', 'late'] as const) {
  Deno.test({
    name: `database TCP probe unit ${mode}: owns abort, settlement and timeout cleanup`,
    sanitizeOps: true,
    sanitizeResources: true,
    sanitizeExit: true,
    async fn() {
      const originalConnect = Deno.connect;
      const originalTimeout = globalThis.setTimeout;
      const originalClear = globalThis.clearTimeout;
      const descriptors = [
        Object.getOwnPropertyDescriptor(Deno, 'connect')!,
        Object.getOwnPropertyDescriptor(globalThis, 'setTimeout')!,
        Object.getOwnPropertyDescriptor(globalThis, 'clearTimeout')!,
      ];
      const timers = new Map<ReturnType<typeof setTimeout>, number>();
      const cleared = new Set<ReturnType<typeof setTimeout>>();
      const active = new Set<ReturnType<typeof setTimeout>>();
      const signals: Array<AbortSignal | undefined> = [];
      const events: string[] = [];
      const connections: Deno.TcpConn[] = [];
      const peers: Deno.TcpConn[] = [];
      const pending: Array<() => void> = [];
      let queries = 0;
      let timedOut = false;
      const close = (connection: Deno.TcpConn) => {
        try {
          connection.close();
        } catch (error) {
          if (!(error instanceof Deno.errors.BadResource)) throw error;
        }
      };
      const deadline = originalTimeout(() => {
        timedOut = true;
        for (const connection of [...connections, ...peers]) close(connection);
      }, 10_000);
      const listener = mode === 'late'
        ? Deno.listen({ hostname: '127.0.0.1', port: 0 })
        : undefined;
      try {
        if (listener) {
          for (let i = 0; i < 3; i++) {
            const accepted = listener.accept();
            connections.push(
              await originalConnect({ hostname: '127.0.0.1', port: listener.addr.port }),
            );
            peers.push(await accepted);
          }
        }
        Object.defineProperty(globalThis, 'setTimeout', {
          configurable: true,
          writable: true,
          value(callback: () => void, ms: number) {
            const timer = originalTimeout(() => {
              active.delete(timer);
              callback();
            }, 0);
            timers.set(timer, ms);
            active.add(timer);
            return timer;
          },
        });
        Object.defineProperty(globalThis, 'clearTimeout', {
          configurable: true,
          writable: true,
          value(timer: ReturnType<typeof setTimeout>) {
            cleared.add(timer);
            active.delete(timer);
            originalClear(timer);
          },
        });
        Object.defineProperty(Deno, 'connect', {
          configurable: true,
          writable: true,
          value(options: Deno.ConnectOptions): Promise<Deno.TcpConn> {
            const attempt = signals.length;
            signals.push(options.signal);
            if (mode === 'throw') throw new Error('unit synchronous connection error');
            if (mode === 'reject') return Promise.reject(new Error('unit connection refusal'));
            return new Promise((resolve, reject) => {
              pending.push(() => reject(new Error('unit cleanup')));
              options.signal?.addEventListener('abort', () => {
                events.push(`abort:${attempt}`);
                queueMicrotask(() => {
                  events.push(`settled:${attempt}`);
                  if (mode === 'late') resolve(connections[attempt]);
                  else reject(options.signal?.reason);
                });
              }, { once: true });
            });
          },
        });
        await runProbe(3306, {
          $queryRaw() {
            queries += 1;
            return Promise.resolve(1);
          },
        });
        assertEquals(signals.length, 3, 'retain three TCP attempts');
        assert(
          signals.every((signal) => signal instanceof AbortSignal),
          'each connect gets a signal',
        );
        assertEquals([...timers.values()], [3000, 2000, 3000, 2000, 3000]);
        for (const [timer, ms] of timers) {
          if (ms === 3000) assert(cleared.has(timer), 'clear every probe deadline in finally');
        }
        assertEquals(active.size, 0);
        assertEquals(queries, 0, 'failed or timed-out connections never run SELECT 1');
        if (mode === 'abort' || mode === 'late') {
          assert(signals.every((signal) => signal?.aborted), 'timeout aborts every connect');
          assertEquals(events, [
            'abort:0',
            'settled:0',
            'abort:1',
            'settled:1',
            'abort:2',
            'settled:2',
          ], 'connect settlement precedes hook completion');
          for (const peer of peers) assertEquals(await peer.read(new Uint8Array(1)), null);
          assert(!timedOut, 'late connections must close before the unit deadline');
        }
      } finally {
        Object.defineProperty(Deno, 'connect', descriptors[0]);
        Object.defineProperty(globalThis, 'setTimeout', descriptors[1]);
        Object.defineProperty(globalThis, 'clearTimeout', descriptors[2]);
        for (const timer of timers.keys()) originalClear(timer);
        originalClear(deadline);
        for (const reject of pending) reject();
        for (const connection of [...connections, ...peers]) close(connection);
        listener?.close();
      }
    },
  });
}
