import { assertEquals } from '@std/assert';
import { buildDbCliEnv } from './operation-runner-helpers.ts';

Deno.test('db migrate forwards artifact name and terminal identity to the generated task', () => {
  const env = buildDbCliEnv('migrate', 'postgres', 'add-profile', true);
  assertEquals(env.PRISMA_MIGRATION_NAME, 'add-profile');
  assertEquals(env.NETSCRIPT_MIGRATION_INTERACTIVE, 'true');
  assertEquals('NETSCRIPT_PRISMA_NAME' in env, false);
});
