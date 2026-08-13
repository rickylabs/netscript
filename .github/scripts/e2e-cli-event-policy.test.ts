import { assertEquals } from '@std/assert';
import { decide } from './ci-classify-changes.ts';

Deno.test('e2e-cli schedules release tags and immediate opt-in label events', async () => {
  const source = await Deno.readTextFile('.github/workflows/e2e-cli.yml');
  const pullRequestTypes = /pull_request:\s*\n\s*types:\s*\[([^\]]+)\]/.exec(source)?.[1]
    .split(',')
    .map((value) => value.trim());

  assertEquals(pullRequestTypes, [
    'opened',
    'synchronize',
    'reopened',
    'ready_for_review',
    'labeled',
  ]);
  assertEquals(pullRequestTypes?.includes('labeled'), true);
  assertEquals(pullRequestTypes?.includes('unlabeled'), false);
  assertEquals(source.includes("tags: ['v*']"), true);
  assertEquals(source.includes("'desktop-native-gate'"), true);
  assertEquals(source.includes("'e2e-cli-gate'"), true);
  assertEquals(
    source.includes("needs.classify.result != 'skipped' }}\n    runs-on: ubuntu-latest"),
    true,
  );
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

Deno.test('report-only CI lanes are release or explicit opt-in', async () => {
  const surface = await Deno.readTextFile('.github/workflows/surface-diff.yml');
  assertEquals(surface.includes("tags: ['v*']"), true);
  assertEquals(surface.includes("'surface-diff-gate'"), true);
  assertEquals(surface.includes("'ci:full'"), true);

  const core = await Deno.readTextFile('.github/workflows/ci.yml');
  assertEquals(core.includes("tags: ['v*']"), true);
  assertEquals(
    core.includes("startsWith(github.ref, 'refs/tags/v')"),
    true,
  );
  assertEquals(
    core.includes(
      "github.event.pull_request.draft == false &&\n       contains(github.event.pull_request.labels.*.name, 'ci:full')",
    ),
    true,
  );
});
