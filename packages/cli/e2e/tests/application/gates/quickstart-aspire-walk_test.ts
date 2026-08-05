import { assertEquals, assertRejects } from '@std/assert';
import {
  ASPIRE_RESTORE_MAX_ATTEMPTS,
  ASPIRE_TIMEOUT_CLASSIFICATION,
  type AspireCommandResult,
  isRetryableAspireRestoreCancellation,
  runBoundedAspireWalk,
} from '../../../src/application/gates/quickstart/aspire-walk.ts';

const PASS: AspireCommandResult = { code: 0, stdout: '', stderr: '', timedOut: false };

Deno.test('bounded Aspire walk runs restore, start, then waits for postgres', async () => {
  const commands: readonly string[][] = [];
  const mutable = commands as string[][];
  await runBoundedAspireWalk('/project/aspire/apphost.mts', '/project', 42_000, (command) => {
    mutable.push([...command]);
    return Promise.resolve(PASS);
  });

  assertEquals(commands.map((command) => command.slice(0, 2)), [
    ['aspire', 'restore'],
    ['aspire', 'start'],
    ['aspire', 'wait'],
  ]);
  assertEquals(commands[2].includes('42'), true);
});

Deno.test('bounded Aspire walk classifies restore timeout with #1227 and stops', async () => {
  let calls = 0;
  const error = await assertRejects(
    () =>
      runBoundedAspireWalk('/project/aspire/apphost.mts', '/project', 1, () => {
        calls++;
        return Promise.resolve({ ...PASS, code: 124, timedOut: true });
      }),
    Error,
    ASPIRE_TIMEOUT_CLASSIFICATION.RESTORE,
  );
  assertEquals(error.message, ASPIRE_TIMEOUT_CLASSIFICATION.RESTORE);
  assertEquals(calls, 1);
});

Deno.test('bounded Aspire walk classifies start timeout independently', async () => {
  let calls = 0;
  await assertRejects(
    () =>
      runBoundedAspireWalk('/project/aspire/apphost.mts', '/project', 1, () => {
        calls++;
        return Promise.resolve(calls === 2 ? { ...PASS, code: 124, timedOut: true } : PASS);
      }),
    Error,
    ASPIRE_TIMEOUT_CLASSIFICATION.START,
  );
  assertEquals(calls, 2);
});

Deno.test('bounded Aspire walk retries only the observed exit-6 restore cancellation', async () => {
  let calls = 0;
  await runBoundedAspireWalk('/project/aspire/apphost.mts', '/project', 42_000, (command) => {
    calls++;
    if (command[1] === 'restore' && calls === 1) {
      return Promise.resolve({
        ...PASS,
        code: 6,
        stderr: 'Failed to prepare: A task was canceled.\nFailed to prepare AppHost server.',
      });
    }
    return Promise.resolve(PASS);
  });
  assertEquals(ASPIRE_RESTORE_MAX_ATTEMPTS, 2);
  assertEquals(calls, 4);
});

Deno.test('Aspire restore retry predicate rejects product and partial failures', () => {
  assertEquals(
    isRetryableAspireRestoreCancellation({ ...PASS, code: 1, stderr: 'product red' }),
    false,
  );
  assertEquals(
    isRetryableAspireRestoreCancellation({
      ...PASS,
      code: 6,
      stderr: 'Failed to prepare: A task was canceled.',
    }),
    false,
  );
});
