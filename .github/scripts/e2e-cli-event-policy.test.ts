import { assertEquals } from '@std/assert';
import { decide } from './ci-classify-changes.ts';

Deno.test('e2e-cli schedules code/lifecycle events but never label metadata events', async () => {
  const source = await Deno.readTextFile('.github/workflows/e2e-cli.yml');
  const pullRequestTypes = /pull_request:\s*\n\s*types:\s*\[([^\]]+)\]/.exec(source)?.[1]
    .split(',')
    .map((value) => value.trim());

  assertEquals(pullRequestTypes, [
    'opened',
    'synchronize',
    'reopened',
    'ready_for_review',
  ]);
  assertEquals(pullRequestTypes?.includes('labeled'), false);
  assertEquals(pullRequestTypes?.includes('unlabeled'), false);
});

Deno.test('e2e-cli skip labels still short-circuit on the next normal trigger', () => {
  const skipped = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:skip-e2e', 'ci:skip-scaffold'],
  });
  assertEquals(skipped.runStatic, false);
  assertEquals(skipped.runRuntimeSqlite, false);
  assertEquals(skipped.runRuntime, false);

  const unlabelled = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: [],
  });
  assertEquals(unlabelled.runStatic, true);
  assertEquals(unlabelled.runRuntimeSqlite, true);
  assertEquals(unlabelled.runRuntime, true);
});
