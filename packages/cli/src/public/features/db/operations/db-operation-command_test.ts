import { assertEquals, assertRejects } from '@std/assert';

import { executeWithDbOperationAppHost } from './db-operation-command.ts';

Deno.test('one-shot DB operation removes its AppHost files after success', async () => {
  const events: string[] = [];
  const code = await executeWithDbOperationAppHost(
    'status',
    '/project',
    {
      materializeDbOperationAppHost: () => {
        events.push('materialize');
        return Promise.resolve([]);
      },
      removeDbOperationAppHost: () => {
        events.push('remove');
        return Promise.resolve();
      },
    },
    () => {
      events.push('execute');
      return Promise.resolve(0);
    },
  );

  assertEquals(code, 0);
  assertEquals(events, ['materialize', 'execute', 'remove']);
});

Deno.test('one-shot DB operation removes its AppHost files after failure', async () => {
  const events: string[] = [];
  await assertRejects(
    () =>
      executeWithDbOperationAppHost(
        'status',
        '/project',
        {
          materializeDbOperationAppHost: () => Promise.resolve([]),
          removeDbOperationAppHost: () => {
            events.push('remove');
            return Promise.resolve();
          },
        },
        () => Promise.reject(new Error('operation failed')),
      ),
    Error,
    'operation failed',
  );
  assertEquals(events, ['remove']);
});

Deno.test('studio keeps using the named resident AppHost path', async () => {
  const events: string[] = [];
  const code = await executeWithDbOperationAppHost(
    'studio',
    '/project',
    {
      materializeDbOperationAppHost: () => {
        events.push('materialize');
        return Promise.resolve([]);
      },
      removeDbOperationAppHost: () => {
        events.push('remove');
        return Promise.resolve();
      },
    },
    () => {
      events.push('execute');
      return Promise.resolve(0);
    },
  );
  assertEquals(code, 0);
  assertEquals(events, ['execute']);
});
