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
