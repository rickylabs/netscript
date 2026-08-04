import { assertEquals } from '@std/assert';
import { GITHUB_API_BASE_URL } from '../config/endpoints.ts';
import {
  buildPrCheckReport,
  type CheckRun,
  classifyCheckRuns,
  exitCodeForPrCheckReport,
  mergeLatestWorkflowJobs,
  type WorkflowJob,
} from './pr-checks.ts';

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

function workflowJob(values: Partial<WorkflowJob> = {}): WorkflowJob {
  return {
    id: 200,
    name: 'test',
    status: 'completed',
    conclusion: 'success',
    started_at: '2026-08-03T10:02:00Z',
    completed_at: '2026-08-03T10:03:00Z',
    check_run_url: `${GITHUB_API_BASE_URL}/repos/rickylabs/netscript/check-runs/2`,
    run_id: 10,
    run_attempt: 2,
    ...values,
  };
}

Deno.test('latest workflow attempt supersedes a stale failed check-run', () => {
  const runs = mergeLatestWorkflowJobs(
    [checkRun({ id: 1, conclusion: 'failure' })],
    [workflowJob()],
    'head-sha',
  );
  const checks = classifyCheckRuns(runs, 'head-sha');
  const report = buildPrCheckReport('rickylabs/netscript', 1181, 'head-sha', 'now', checks);

  assertEquals(checks.map((check) => check.classification), ['superseded', 'current-pass']);
  assertEquals(report.ok, true);
});

Deno.test('latest successful workflow attempt supersedes a stale cancellation', () => {
  const runs = mergeLatestWorkflowJobs(
    [checkRun({ id: 1, conclusion: 'cancelled' })],
    [workflowJob()],
    'head-sha',
  );
  const checks = classifyCheckRuns(runs, 'head-sha');

  assertEquals(checks.map((check) => check.classification), ['superseded', 'current-pass']);
  assertEquals(checks.some((check) => check.classification === 'cancelled'), false);
});

Deno.test('genuinely failed latest workflow attempt remains exit-relevant', () => {
  const runs = mergeLatestWorkflowJobs(
    [checkRun({ id: 1 })],
    [workflowJob({ conclusion: 'failure' })],
    'head-sha',
  );
  const checks = classifyCheckRuns(runs, 'head-sha');
  const report = buildPrCheckReport('rickylabs/netscript', 1181, 'head-sha', 'now', checks);

  assertEquals(checks.map((check) => check.classification), ['superseded', 'current-fail']);
  assertEquals(report.ok, false);
  assertEquals(exitCodeForPrCheckReport(report), 1);
});

Deno.test('job id cannot overwrite an unrelated check-run id', () => {
  const unrelated = checkRun({
    id: 200,
    name: 'external security scan',
    conclusion: 'failure',
  });
  const runs = mergeLatestWorkflowJobs([unrelated], [workflowJob()], 'head-sha');

  assertEquals(runs.map((run) => [run.id, run.name]), [
    [200, 'external security scan'],
    [2, 'test'],
  ]);
});

Deno.test('latest-attempt identity wins a timestamp tie', () => {
  const runs = mergeLatestWorkflowJobs(
    [checkRun({ id: 9, conclusion: 'failure', started_at: '2026-08-03T10:02:00Z' })],
    [workflowJob()],
    'head-sha',
  );
  const checks = classifyCheckRuns(runs, 'head-sha');

  assertEquals(checks.map((check) => check.classification), ['superseded', 'current-pass']);
});

Deno.test('queued latest-attempt job is pending instead of exposing stale failure', () => {
  const runs = mergeLatestWorkflowJobs(
    [checkRun({ id: 1, conclusion: 'failure' })],
    [workflowJob({
      status: 'queued',
      conclusion: null,
      started_at: null,
      completed_at: null,
      workflow_run_started_at: '2026-08-03T10:02:00Z',
    })],
    'head-sha',
  );
  const checks = classifyCheckRuns(runs, 'head-sha');

  assertEquals(checks.map((check) => check.classification), ['superseded', 'pending']);
});

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
