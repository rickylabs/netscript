import { assertEquals, assertRejects } from '@std/assert';
import {
  disconnectServiceDatabases,
  registerServiceDatabases,
  type ServiceDatabaseResource,
} from '../src/builder/service-resources.ts';

Deno.test('database resource cleanup deduplicates aliases and repeated registration', async () => {
  const calls: string[] = [];
  const one = {
    $disconnect() {
      calls.push('one');
      return Promise.resolve();
    },
  };
  const two = {
    $disconnect() {
      calls.push('two');
      return Promise.resolve();
    },
  };
  const resources = new Set<ServiceDatabaseResource>();
  registerServiceDatabases(resources, { first: one, alias: one, second: two });
  registerServiceDatabases(resources, one);
  await disconnectServiceDatabases(resources);
  await disconnectServiceDatabases(resources);
  assertEquals(calls, ['one', 'two']);
});

Deno.test('database cleanup attempts every client after a failure and never resolves lazy accessors', async () => {
  let resolved = 0;
  let closed = 0;
  const resources = new Set<ServiceDatabaseResource>();
  registerServiceDatabases(resources, {
    getClient: () => {
      resolved++;
    },
    failed: {
      $disconnect() {
        return Promise.reject(new Error('disconnect failed'));
      },
    },
    healthy: {
      $disconnect() {
        closed++;
        return Promise.resolve();
      },
    },
  });
  await assertRejects(() => disconnectServiceDatabases(resources), AggregateError);
  assertEquals(resolved, 0);
  assertEquals(closed, 1);
});

Deno.test({
  name: 'a host disposal callback replaces automatic database disposal on a process signal',
  ignore: Deno.build.os === 'windows',
  async fn() {
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'eval',
        `
        import { createService } from '@netscript/service';
        const db = { $disconnect: async () => { console.log('DATABASE_DISCONNECTED'); } };
        await createService({}, { name: 'host-disposal' }).withDatabase(db).serve({
          port: 0,
          disposeDatabaseOnSignal: false,
          onCleanup: [() => db.$disconnect()],
        });
        setTimeout(() => Deno.kill(Deno.pid, 'SIGTERM'), 0);
        await new Promise(() => {});
      `,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
    assertEquals(
      new TextDecoder().decode(result.stdout).split('DATABASE_DISCONNECTED').length - 1,
      1,
    );
  },
});
