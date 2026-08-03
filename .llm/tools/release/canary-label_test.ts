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
    firstParentCommits: () => Promise.resolve(['sha-planned', '0b05217cc', 'sha-next']),
    associatedPullRequests: (commit) =>
      Promise.resolve([
        { 'sha-planned': 1079, '0b05217cc': 1092, 'sha-next': 1078 }[commit]!,
      ]),
    closingIssues: (pullRequest) =>
      Promise.resolve(pullRequest === 1092 ? [1024, 1061] : [pullRequest]),
  });
  assertEquals(payload.pullRequests, [1079, 1092, 1078]);
  assertEquals(payload.issues, [1024, 1061, 1078, 1079]);
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
        firstParentCommits: () => Promise.resolve(['sha']),
        associatedPullRequests: () => Promise.resolve([1122]),
        closingIssues: () => Promise.reject(new Error('GitHub unavailable')),
      }),
    Error,
    'GitHub unavailable',
  );
});

Deno.test('empty payload renders an explicit canary note', () => {
  const note = renderCanaryReleaseNote('0.0.4-canary.1', 'v0.0.3', {
    pullRequests: [],
    issues: [],
    pullRequestTitles: {},
    closedIssuesByPullRequest: {},
  }, 'rickylabs/netscript');
  assertEquals(note.includes('Empty payload: no pull requests merged'), true);
  assertEquals(note.includes('after `v0.0.3`'), true);
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
