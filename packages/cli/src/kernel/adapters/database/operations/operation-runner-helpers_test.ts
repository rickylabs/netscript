import { assertEquals, assertRejects } from '@std/assert';
import type { AspireCommandExecutor } from './aspire-command-executor.ts';
import {
  buildDbCliEnv,
  findRunningAppHost,
  isNoRunningAppHostOutput,
  resolveDbCliTimeoutSeconds,
  watchExecutableCompletion,
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

function update(state: string | null, exitCode?: number, displayName = 'postgres-cli'): string {
  return JSON.stringify({ displayName, resourceType: 'Executable', state, exitCode });
}

async function watchLines(lines: readonly string[], start: () => Promise<void> = async () => {}) {
  let closed = false;
  const executor: AspireCommandExecutor = {
    output: () => {
      throw new Error('Snapshot polling is forbidden');
    },
    spawn: () => {
      throw new Error('Unexpected spawn');
    },
    async *stream() {
      try {
        yield* lines;
      } finally {
        closed = true;
      }
    },
  };
  try {
    return await watchExecutableCompletion(executor, {
      resourceName: 'postgres-cli',
      apphostPath: 'project/aspire/apphost.mts',
      cwd: '.',
      timeoutMs: 1_000,
      signal: new AbortController().signal,
      start,
    });
  } finally {
    assertEquals(closed, true);
  }
}

Deno.test('watch ignores old terminal and stale terminal replay before a fresh lifecycle', async () => {
  assertEquals(
    await watchLines([
      update('Finished', 0),
      update('Finished', 0),
      update('Running'),
      update('Finished', 9),
    ]),
    9,
  );
});

Deno.test('watch buffers a fast new run immediately after the initial snapshot', async () => {
  let started = false;
  assertEquals(
    await watchLines([
      update('Stopped', 77),
      update('Starting'),
      update('Finished', 0),
    ], () => {
      started = true;
      return Promise.resolve();
    }),
    0,
  );
  assertEquals(started, true);
});

Deno.test('watch requires initial identity and ignores sibling resources and non-executables', async () => {
  let started = false;
  const initial = update('Stopped', 99);
  assertEquals(
    await watchLines([
      update('Running', undefined, 'postgres-cli-sibling'),
      initial,
      update(null),
      update('Running'),
      update('Finished', 44, 'postgres-cli-sibling'),
      JSON.stringify({
        displayName: 'postgres-cli',
        resourceType: 'Container',
        state: 'Finished',
        exitCode: 88,
      }),
      update('Finished', 5),
    ], () => {
      started = true;
      return Promise.resolve();
    }),
    5,
  );
  assertEquals(started, true);
});

for (
  const [label, lines, message] of [
    ['malformed', ['not JSON'], 'Unexpected token'],
    ['premature EOF', [], 'initial snapshot'],
    [
      'no new run',
      [update('Finished', 0), update('Finished', 0)],
      'ended before postgres-cli completed',
    ],
    [
      'no terminal',
      [update('Stopped', 0), update('Running')],
      'ended before postgres-cli completed',
    ],
    [
      'no exit code',
      [update('Stopped', 0), update('Running'), update('Finished')],
      'without an exit code',
    ],
  ] as const
) {
  Deno.test(`watch fails closed for ${label} and closes the stream`, async () => {
    await assertRejects(() => watchLines(lines), Error, message);
  });
}
