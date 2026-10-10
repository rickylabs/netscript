import { assertEquals } from '@std/assert';
import {
  buildDbCliEnv,
  findRunningAppHost,
  isNoRunningAppHostOutput,
  resolveDbCliTimeoutSeconds,
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

Deno.test('resolveDbCliTimeoutSeconds accepts a bounded test override', () => {
  const name = 'ASPIRE_CLI_START_TIMEOUT';
  const previous = Deno.env.get(name);
  try {
    Deno.env.set(name, '10');
    assertEquals(resolveDbCliTimeoutSeconds(), 10);
    assertEquals(buildDbCliEnv('init', 'postgres').ASPIRE_CLI_START_TIMEOUT, '10');
  } finally {
    if (previous === undefined) Deno.env.delete(name);
    else Deno.env.set(name, previous);
  }
});

Deno.test('resolveDbCliTimeoutSeconds rejects invalid override values', () => {
  const name = 'ASPIRE_CLI_START_TIMEOUT';
  const previous = Deno.env.get(name);
  try {
    for (const value of ['0', '-1', '1.5', 'later']) {
      Deno.env.set(name, value);
      let message = '';
      try {
        resolveDbCliTimeoutSeconds();
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      assertEquals(message, `${name} must be a positive whole number.`);
    }
  } finally {
    if (previous === undefined) Deno.env.delete(name);
    else Deno.env.set(name, previous);
  }
});
