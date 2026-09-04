import { assertEquals } from '@std/assert';
import { cleanupHarnessState, parseCleanupArgs } from './cleanup-state.ts';
import { join } from '@std/path';

async function fixture(): Promise<string> {
  const root = await Deno.makeTempDir();
  await Deno.mkdir(join(root, '.llm', 'runs'), { recursive: true });
  await Deno.mkdir(join(root, '.llm', 'tmp'), { recursive: true });
  for (
    const name of [
      'release-0.0.5--orchestration',
      'release-0.0.6-features--orchestration',
      'release-0.0.6-fixes--orchestration',
      'release-0.0.7--orchestration',
      'docs-rfc-command-composition--rfc',
      'plan-devtools-contribution--seed',
      'plan-fable-remediation--seed',
      'ordinary-stale-run',
    ]
  ) await Deno.mkdir(join(root, '.llm', 'runs', name));
  await Deno.writeTextFile(
    join(root, '.llm', 'runs', 'plan-devtools-contribution--seed', 'RFC-AUTHORITY.md'),
    '# RFC authority\n',
  );
  await Deno.mkdir(
    join(root, '.llm', 'runs', 'plan-fable-remediation--seed', 'design', 'rfcs'),
    { recursive: true },
  );
  await Deno.mkdir(join(root, '.llm', 'tmp', 'old-scratch'));
  return root;
}

Deno.test('cleanup defaults to a non-mutating age-filtered dry run', async () => {
  const root = await fixture();
  try {
    const report = await cleanupHarnessState({
      repoRoot: root,
      apply: false,
      allUnretained: false,
      allTmp: false,
      runOlderThanDays: 30,
      tmpOlderThanHours: 72,
      now: new Date(),
    });
    assertEquals(report.retainedReleaseVersions, ['0.0.7', '0.0.6']);
    assertEquals(report.preservedRuns, [
      '.llm/runs/docs-rfc-command-composition--rfc',
      '.llm/runs/plan-devtools-contribution--seed',
      '.llm/runs/plan-fable-remediation--seed',
      '.llm/runs/release-0.0.6-features--orchestration',
      '.llm/runs/release-0.0.6-fixes--orchestration',
      '.llm/runs/release-0.0.7--orchestration',
    ]);
    assertEquals(report.selectedRuns, []);
    assertEquals(report.skippedRecentRuns, [
      '.llm/runs/ordinary-stale-run',
      '.llm/runs/release-0.0.5--orchestration',
    ]);
    assertEquals((await Array.fromAsync(Deno.readDir(join(root, '.llm', 'runs')))).length, 8);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('explicit sweep removes only unretained runs and requested temp entries', async () => {
  const root = await fixture();
  try {
    const report = await cleanupHarnessState({
      repoRoot: root,
      apply: true,
      allUnretained: true,
      allTmp: true,
      runOlderThanDays: 30,
      tmpOlderThanHours: 72,
      now: new Date(),
    });
    assertEquals(report.removedRuns, 2);
    assertEquals(report.removedTmp, 1);
    assertEquals(
      (await Array.fromAsync(Deno.readDir(join(root, '.llm', 'runs')))).map((entry) => entry.name)
        .sort(),
      [
        'docs-rfc-command-composition--rfc',
        'plan-devtools-contribution--seed',
        'plan-fable-remediation--seed',
        'release-0.0.6-features--orchestration',
        'release-0.0.6-fixes--orchestration',
        'release-0.0.7--orchestration',
      ],
    );
    assertEquals((await Array.fromAsync(Deno.readDir(join(root, '.llm', 'tmp')))).length, 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI parser keeps destructive modes explicit', () => {
  assertEquals(parseCleanupArgs([]), {
    apply: false,
    allUnretained: false,
    allTmp: false,
    runOlderThanDays: 30,
    tmpOlderThanHours: 72,
    pretty: false,
  });
  assertEquals(parseCleanupArgs(['--apply', '--all-unretained', '--all-tmp', '--pretty']), {
    apply: true,
    allUnretained: true,
    allTmp: true,
    runOlderThanDays: 30,
    tmpOlderThanHours: 72,
    pretty: true,
  });
});
