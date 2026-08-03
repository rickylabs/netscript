import { assertEquals } from '@std/assert';
import { buildPrCheckReport, type CheckRun, classifyCheckRuns } from './pr-checks.ts';

function checkRun(values: Partial<CheckRun> = {}): CheckRun {
  return {
    id: 1,
    name: 'test',
    head_sha: 'head-sha',
    status: 'completed',
    conclusion: 'success',
    started_at: '2026-08-03T10:00:00Z',
    completed_at: '2026-08-03T10:01:00Z',
    ...values,
  };
}

Deno.test('cancelled run with newer green sibling is superseded and clean', () => {
  const checks = classifyCheckRuns([
    checkRun({ id: 1, conclusion: 'cancelled' }),
    checkRun({ id: 2, started_at: '2026-08-03T10:02:00Z' }),
  ], 'head-sha');
  const report = buildPrCheckReport('rickylabs/netscript', 1094, 'head-sha', 'now', checks);

  assertEquals(checks.map((check) => check.classification), ['superseded', 'current-pass']);
  assertEquals(report.currentFailures, 0);
  assertEquals(report.ok, true);
});

Deno.test('genuinely failed latest run is an exit-relevant current failure', () => {
  const checks = classifyCheckRuns([
    checkRun({ conclusion: 'failure' }),
  ], 'head-sha');
  const report = buildPrCheckReport('rickylabs/netscript', 1170, 'head-sha', 'now', checks);

  assertEquals(checks[0]?.classification, 'current-fail');
  assertEquals(report.currentFailures, 1);
  assertEquals(report.ok, false);
});

Deno.test('in-progress latest run is pending and clean, never a pass', () => {
  const checks = classifyCheckRuns([
    checkRun({ status: 'in_progress', conclusion: null, completed_at: null }),
  ], 'head-sha');
  const report = buildPrCheckReport('rickylabs/netscript', 1170, 'head-sha', 'now', checks);

  assertEquals(checks[0]?.classification, 'pending');
  assertEquals(checks[0]?.classification === 'current-pass', false);
  assertEquals(report.currentFailures, 0);
  assertEquals(report.ok, true);
});

Deno.test('post-merge run on deleted head ref is stale and not a failure', () => {
  const checks = classifyCheckRuns(
    [
      checkRun({
        conclusion: 'failure',
        started_at: '2026-08-03T11:01:00Z',
      }),
    ],
    'head-sha',
    '2026-08-03T11:00:00Z',
  );
  const report = buildPrCheckReport('rickylabs/netscript', 1094, 'head-sha', 'now', checks);

  assertEquals(checks[0]?.classification, 'stale-post-merge');
  assertEquals(report.currentFailures, 0);
  assertEquals(report.ok, true);
});

Deno.test('only latest run with the same name counts', () => {
  const checks = classifyCheckRuns([
    checkRun({ id: 1, conclusion: 'failure' }),
    checkRun({ id: 2, started_at: '2026-08-03T10:02:00Z' }),
  ], 'head-sha');

  assertEquals(checks.map((check) => check.classification), ['superseded', 'current-pass']);
  assertEquals(checks.filter((check) => check.classification === 'current-fail').length, 0);
});

Deno.test('report includes head SHA and evaluation timestamp', () => {
  const report = buildPrCheckReport(
    'rickylabs/netscript',
    1170,
    'abc123',
    '2026-08-03T12:00:00.000Z',
    [],
  );

  assertEquals(report.headSha, 'abc123');
  assertEquals(report.evaluatedAt, '2026-08-03T12:00:00.000Z');
});
