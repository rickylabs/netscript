import { assertEquals } from '@std/assert';
import { createDbOperationCommand } from './db-operation-command.ts';

Deno.test('DB operation command no longer requires a transient AppHost workspace mutator', () => {
  const command = createDbOperationCommand('seed', 'Seed database', {
    cwd: () => '/workspace',
  });

  assertEquals(command.getName(), 'seed');
});
