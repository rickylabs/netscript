import { assertEquals, assertRejects } from '@std/assert';
import {
  type DatabaseCommandResult,
  isRetryableDatabaseRestoreFailure,
  runBoundedDatabaseWalk,
} from '../../../src/application/gates/quickstart/database-walk.ts';

const PASS: DatabaseCommandResult = { code: 0, stdout: '', stderr: '', timedOut: false };

Deno.test('database walk retries only the command whose Aspire restore was canceled', async () => {
  const calls: string[][] = [];
  let generateAttempts = 0;
  await runBoundedDatabaseWalk('jsr:@netscript/cli@0.0.5-canary.10', '/project', (command) => {
    calls.push([...command]);
    if (command.includes('generate') && generateAttempts++ === 0) {
      return Promise.resolve({
        code: 6,
        stdout: '',
        stderr: 'Failed to prepare: A task was canceled.\nFailed to prepare AppHost server.',
        timedOut: false,
      });
    }
    return Promise.resolve(PASS);
  });

  assertEquals(calls.map((command) => command[command.indexOf('db') + 1]), [
    'init',
    'generate',
    'generate',
    'seed',
  ]);
});

Deno.test('database walk retries the observed Aspire start timeout after bundled restore stalls', async () => {
  let attempts = 0;
  await runBoundedDatabaseWalk('jsr:@netscript/cli@0.0.5-canary.10', '/project', () => {
    attempts += 1;
    return Promise.resolve(
      attempts === 1
        ? {
          code: 2,
          stdout: '',
          stderr: 'Timed out waiting 90s for AppHost to start.\nSee AppHost logs at /tmp/child.log',
          timedOut: false,
        }
        : PASS,
    );
  });
  assertEquals(attempts, 4);
});

Deno.test('database walk does not retry a product failure', async () => {
  let attempts = 0;
  await assertRejects(
    () =>
      runBoundedDatabaseWalk('jsr:@netscript/cli@0.0.5-canary.10', '/project', () => {
        attempts += 1;
        return Promise.resolve({
          code: 1,
          stdout: '',
          stderr: 'Prisma schema validation failed.',
          timedOut: false,
        });
      }),
    Error,
    'quickstart.database.product-failure',
  );
  assertEquals(attempts, 1);
});

Deno.test('database restore classifier requires a complete production signature', () => {
  assertEquals(isRetryableDatabaseRestoreFailure(PASS), false);
  assertEquals(
    isRetryableDatabaseRestoreFailure({
      ...PASS,
      code: 2,
      stderr: 'Timed out waiting 90s for AppHost to start.',
    }),
    false,
  );
});
