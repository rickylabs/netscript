import { assertEquals } from '@std/assert';
import {
  buildDbCliEnv,
  findRunningAppHost,
  isNoRunningAppHostOutput,
} from './operation-runner-helpers.ts';

Deno.test('isNoRunningAppHostOutput accepts the documented line with allowed prefixes', () => {
  assertEquals(
    isNoRunningAppHostOutput('', "No AppHost is currently running for 'apphost.mts'."),
    true,
  );
  assertEquals(
    isNoRunningAppHostOutput('', "  error: No AppHost is currently running for 'apphost.mts'."),
    true,
  );
});

Deno.test('isNoRunningAppHostOutput rejects a failure that only quotes the phrase', () => {
  assertEquals(
    isNoRunningAppHostOutput(
      '',
      "Dashboard failed after reporting: No AppHost is currently running for 'apphost.mts'.",
    ),
    false,
  );
});

Deno.test('db migrate forwards artifact name and terminal identity to the generated task', () => {
  const env = buildDbCliEnv('migrate', 'postgres', 'add-profile', true);
  assertEquals(env.PRISMA_MIGRATION_NAME, 'add-profile');
  assertEquals(env.NETSCRIPT_MIGRATION_INTERACTIVE, 'true');
  assertEquals('NETSCRIPT_PRISMA_NAME' in env, false);
});

Deno.test('findRunningAppHost matches only the normalized project apphost.mts path', () => {
  const project = 'C:\\repo\\sample\\aspire\\apphost.mts';
  const json = JSON.stringify([
    { appHostPath: 'C:/repo/other/aspire/apphost.mts' },
    { appHostPath: 'c:/REPO/sample/aspire/apphost.mts' },
  ]);

  assertEquals(findRunningAppHost(json, project), true);
  assertEquals(findRunningAppHost('[]', project), false);
});
