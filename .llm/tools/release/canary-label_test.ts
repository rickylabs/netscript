import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  canaryLabelFor,
  checkCanaryDrift,
  deriveCanaryPayload,
  initialCheckRecords,
} from './canary-label.ts';

Deno.test('stable version is rejected instead of labelled', () => {
  assertThrows(() => canaryLabelFor('0.0.4'), Error, 'must match');
});

Deno.test('repo-derived wrong-train label fails drift against the published canary', () => {
  const drift = checkCanaryDrift(['canary:0.0.3-canary.1'], ['0.0.4-canary.1']);
  assertEquals(drift.ok, false);
  assertEquals(drift.labelsWithoutPublishedVersions, ['canary:0.0.3-canary.1']);
  assertEquals(drift.publishedVersionsWithoutLabels, ['0.0.4-canary.1']);
});

Deno.test('payload includes a PR merged out of plan order because history is authoritative', async () => {
  const payload = await deriveCanaryPayload('v0.0.3', 'HEAD', {
    firstParentSubjects: () =>
      Promise.resolve([
        'feat: planned wave item (#1079)',
        'fix: queue-jumping lane blocker (#1086)',
        'feat: next planned wave item (#1078)',
      ]),
    closingIssues: (pullRequest) =>
      Promise.resolve(pullRequest === 1086 ? [1082, 1089] : [pullRequest]),
  });
  assertEquals(payload.pullRequests, [1079, 1086, 1078]);
  assertEquals(payload.issues, [1078, 1079, 1082, 1089]);
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
        firstParentSubjects: () => Promise.resolve(['fix: merged (#1122)']),
        closingIssues: () => Promise.reject(new Error('GitHub unavailable')),
      }),
    Error,
    'GitHub unavailable',
  );
});
