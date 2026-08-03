import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  assertPublishedCanary,
  canaryLabelFor,
  canaryReleasePayload,
  checkCanaryDrift,
  deriveCanaryPayload,
  initialCheckRecords,
  renderCanaryReleaseNote,
  resolvePreviousPoint,
} from './canary-label.ts';

async function git(cwd: string, ...args: string[]): Promise<string> {
  const result = await new Deno.Command('git', {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    throw new Error(new TextDecoder().decode(result.stderr).trim());
  }
  return new TextDecoder().decode(result.stdout).trim();
}

async function commitFile(repo: string, name: string, contents: string, message: string) {
  await Deno.writeTextFile(`${repo}/${name}`, contents);
  await git(repo, 'add', name);
  return await git(repo, 'commit', '-m', message).then(() => git(repo, 'rev-parse', 'HEAD'));
}

async function withMergeBuriedPullRequest(
  run: (
    fixture: { repo: string; previous: string; pullRequest: string; head: string },
  ) => Promise<void>,
) {
  const repo = await Deno.makeTempDir({ prefix: 'canary-merge-history-' });
  try {
    await git(repo, 'init', '--initial-branch=main');
    await git(repo, 'config', 'user.name', 'Canary Test');
    await git(repo, 'config', 'user.email', 'canary-test@example.invalid');
    const previous = await commitFile(repo, 'baseline.txt', 'previous\n', 'previous canary point');
    await git(repo, 'switch', '-c', 'release');
    await commitFile(repo, 'release.txt', 'release branch\n', 'release branch work');
    await git(repo, 'switch', 'main');
    await git(repo, 'switch', '-c', 'pr-1166');
    await commitFile(repo, 'payload.txt', 'payload\n', 'PR payload');
    await git(repo, 'switch', 'main');
    await git(repo, 'merge', '--no-ff', 'pr-1166', '-m', 'Merge pull request #1166');
    const pullRequest = await git(repo, 'rev-parse', 'HEAD');
    await git(repo, 'switch', 'release');
    await git(repo, 'merge', '--no-ff', 'main', '-m', 'Update release branch from main');
    const head = await git(repo, 'rev-parse', 'HEAD');
    await run({ repo, previous, pullRequest, head });
  } finally {
    await Deno.remove(repo, { recursive: true });
  }
}

Deno.test('payload includes a PR merge commit buried behind a release update merge', async () => {
  await withMergeBuriedPullRequest(async ({ repo, previous, pullRequest, head }) => {
    const baseline = (await git(
      repo,
      'rev-list',
      '--first-parent',
      '--reverse',
      `${previous}..${head}`,
    )).split('\n');
    assertEquals(baseline.includes(pullRequest), false);

    const payload = await deriveCanaryPayload(previous, head, {
      rangeCommits: async (from, to) =>
        (await git(repo, 'rev-list', '--topo-order', '--reverse', `${from}..${to}`)).split('\n'),
      associatedPullRequests: (commit) => Promise.resolve(commit === pullRequest ? [1166] : []),
      closingIssues: () => Promise.resolve([]),
    });
    assertEquals(payload.pullRequests, [1166]);
    assertEquals(payload.outcome, 'populated');
    assertEquals(payload.commitCount > 1, true);
  });
});

Deno.test('stable version is rejected instead of labelled', () => {
  assertThrows(() => canaryLabelFor('0.0.4'), Error, 'must match');
});

Deno.test('repo-style wrong-train label and published version fail drift both ways', () => {
  const drift = checkCanaryDrift(
    ['canary:0.0.3-canary.1'],
    ['0.0.4-canary.1'],
  );
  assertEquals(drift.ok, false);
  assertEquals(drift.labelsWithoutPublishedVersions, ['canary:0.0.3-canary.1']);
  assertEquals(drift.publishedVersionsWithoutLabels, ['0.0.4-canary.1']);
});

Deno.test('drift is scoped to the published canary train', () => {
  assertEquals(
    checkCanaryDrift(
      ['canary:0.0.3-canary.1', 'canary:0.0.4-canary.1'],
      ['0.0.3-canary.1', '0.0.4-canary.1'],
    ).ok,
    true,
  );
});

Deno.test('payload uses commit associations, not misleading commit-subject issue numbers', async () => {
  const payload = await deriveCanaryPayload('v0.0.3', 'HEAD', {
    rangeCommits: () => Promise.resolve(['sha-planned', '0b05217cc', 'sha-next']),
    associatedPullRequests: (commit) =>
      Promise.resolve([
        { 'sha-planned': 1079, '0b05217cc': 1092, 'sha-next': 1078 }[commit]!,
      ]),
    closingIssues: (pullRequest) =>
      Promise.resolve(pullRequest === 1092 ? [1024, 1061] : [pullRequest]),
  });
  assertEquals(payload.pullRequests, [1079, 1092, 1078]);
  assertEquals(payload.issues, [1024, 1061, 1078, 1079]);
  assertEquals(payload.commitCount, 3);
  assertEquals(payload.outcome, 'populated');
});

Deno.test('prior canary point is resolved from the published train', async () => {
  const calls: string[] = [];
  assertEquals(
    await resolvePreviousPoint(
      '0.0.4-canary.2',
      ['0.0.3-canary.9', '0.0.4-canary.1', '0.0.4-canary.2'],
      'head',
      {
        canarySource: (version) => {
          calls.push(version);
          return Promise.resolve('previous-source');
        },
        nearestStable: () => Promise.resolve('v0.0.3'),
      },
    ),
    'previous-source',
  );
  assertEquals(calls, ['0.0.4-canary.1']);
});

Deno.test('first canary falls back to nearest stable first-parent point', async () => {
  assertEquals(
    await resolvePreviousPoint('0.0.4-canary.1', ['0.0.4-canary.1'], 'head', {
      canarySource: () => Promise.reject(new Error('must not run')),
      nearestStable: (head) => Promise.resolve(`${head}-stable`),
    }),
    'head-stable',
  );
});

Deno.test('did-not-run checks are visibly distinct from passing checks in JSON', () => {
  const checks = initialCheckRecords();
  const encoded = JSON.parse(JSON.stringify({ checks })) as {
    checks: Array<{ name: string; ok: boolean | null; detail: string }>;
  };
  assertEquals(encoded.checks[0], {
    name: 'published-version',
    ok: null,
    detail: 'not run',
  });
  assertEquals(encoded.checks.some((check) => check.ok === true), false);
});

Deno.test('closing-link lookup failure prevents a false payload pass', async () => {
  await assertRejects(
    () =>
      deriveCanaryPayload('previous', 'head', {
        rangeCommits: () => Promise.resolve(['sha']),
        associatedPullRequests: () => Promise.resolve([1122]),
        closingIssues: () => Promise.reject(new Error('GitHub unavailable')),
      }),
    Error,
    'GitHub unavailable',
  );
});

Deno.test('empty payload renders an explicit canary note', () => {
  const note = renderCanaryReleaseNote('0.0.4-canary.1', 'v0.0.3', {
    commitCount: 0,
    outcome: 'genuine-empty',
    pullRequests: [],
    issues: [],
    pullRequestTitles: {},
    closedIssuesByPullRequest: {},
  }, 'rickylabs/netscript');
  assertEquals(note.includes('Genuine empty payload: no commits landed'), true);
  assertEquals(note.includes('0 commit(s) inspected; outcome: genuine-empty'), true);
  assertEquals(note.includes('after `v0.0.3`'), true);
});

Deno.test('a zero-commit range returns explicit genuine-empty evidence without association lookup', async () => {
  let associationLookups = 0;
  const payload = await deriveCanaryPayload('previous', 'head', {
    rangeCommits: () => Promise.resolve([]),
    associatedPullRequests: () => {
      associationLookups++;
      return Promise.resolve([]);
    },
    closingIssues: () => Promise.resolve([]),
  });
  assertEquals(payload.commitCount, 0);
  assertEquals(payload.outcome, 'genuine-empty');
  assertEquals(payload.pullRequests, []);
  assertEquals(associationLookups, 0);
});

Deno.test('a non-empty range without PR associations is a named derivation failure', async () => {
  await assertRejects(
    () =>
      deriveCanaryPayload('previous', 'head', {
        rangeCommits: () => Promise.resolve(['direct-commit']),
        associatedPullRequests: () => Promise.resolve([]),
        closingIssues: () => Promise.reject(new Error('must not mutate payload details')),
      }),
    Error,
    'inspected 1 commit(s) in previous..head but found no associated main-branch pull requests',
  );
  const checks = initialCheckRecords();
  assertEquals(checks.find((check) => check.name === 'merge-history-payload')?.ok, null);
  assertEquals(checks.find((check) => check.name === 'label-application')?.ok, null);
  assertEquals(checks.find((check) => check.name === 'release-note-publication')?.ok, null);
  assertEquals(checks.find((check) => check.name === 'drift')?.ok, null);
});

Deno.test('release note refuses a version absent from registry output', () => {
  assertThrows(
    () => assertPublishedCanary('0.0.4-canary.2', ['0.0.4-canary.1']),
    Error,
    '@netscript/cli@0.0.4-canary.2 is not published',
  );
});

Deno.test('canary release is a prerelease and can never become Latest', () => {
  const payload = canaryReleasePayload('0.0.4-canary.1', 'note');
  assertEquals(payload.prerelease, true);
  assertEquals(payload.make_latest, 'false');
});

Deno.test('drift is scoped to the target train and still catches real divergence', () => {
  // #1160: eleven canaries shipped before this surface existed. Comparing across trains made the
  // gate unpassable — the first live canary (0.0.4-canary.1) failed on 0.0.1/0.0.2/0.0.3 versions
  // that can never be labelled.
  const older = ['0.0.3-canary.5', '0.0.2-canary.1'];
  const clean = checkCanaryDrift(['canary:0.0.4-canary.1'], [...older, '0.0.4-canary.1'], '0.0.4');
  assertEquals(clean.ok, true);
  assertEquals(clean.publishedVersionsWithoutLabels, []);

  // The guard must keep firing on the target train, in both directions.
  const missing = checkCanaryDrift(['canary:0.0.4-canary.1'], [
    ...older,
    '0.0.4-canary.1',
    '0.0.4-canary.2',
  ], '0.0.4');
  assertEquals(missing.ok, false);
  assertEquals(missing.publishedVersionsWithoutLabels, ['0.0.4-canary.2']);

  const orphan = checkCanaryDrift(['canary:0.0.4-canary.9'], ['0.0.4-canary.1'], '0.0.4');
  assertEquals(orphan.ok, false);
  assertEquals(orphan.labelsWithoutPublishedVersions, ['canary:0.0.4-canary.9']);
});
