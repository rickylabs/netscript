/** Read-only latest-run-per-name pull-request check rollup. */

import { normalizeTaskArguments } from '../lib/task-arguments.ts';

export const CHECK_CURRENT_PASS = 'current-pass' as const;
export const CHECK_CURRENT_FAIL = 'current-fail' as const;
export const CHECK_SUPERSEDED = 'superseded' as const;
export const CHECK_CANCELLED = 'cancelled' as const;
export const CHECK_STALE_POST_MERGE = 'stale-post-merge' as const;
export const CHECK_PENDING = 'pending' as const;

export type CheckRunClassification =
  | typeof CHECK_CURRENT_PASS
  | typeof CHECK_CURRENT_FAIL
  | typeof CHECK_SUPERSEDED
  | typeof CHECK_CANCELLED
  | typeof CHECK_STALE_POST_MERGE
  | typeof CHECK_PENDING;

export interface CheckRun {
  readonly id: number;
  readonly name: string;
  readonly head_sha: string;
  readonly status: string;
  readonly conclusion: string | null;
  readonly started_at: string;
  readonly completed_at?: string | null;
  readonly html_url?: string;
  readonly latest_attempt?: boolean;
}

export interface ClassifiedCheckRun extends CheckRun {
  readonly classification: CheckRunClassification;
}

export interface WorkflowJob {
  readonly id: number;
  readonly name: string;
  readonly status: string;
  readonly conclusion: string | null;
  readonly started_at: string | null;
  readonly completed_at: string | null;
  readonly check_run_url: string;
  readonly html_url?: string;
  readonly run_id: number;
  readonly run_attempt: number;
  readonly workflow_run_started_at?: string;
}

export interface PrCheckReport {
  readonly gate: 'pr-checks';
  readonly ok: boolean;
  readonly repo: string;
  readonly pr: number;
  readonly headSha: string;
  readonly evaluatedAt: string;
  readonly checks: readonly ClassifiedCheckRun[];
  readonly currentFailures: number;
}

interface Options {
  readonly repo: string;
  readonly pr: number;
  readonly pretty: boolean;
}

interface PullRequestResponse {
  readonly head: { readonly sha: string };
  readonly merged_at: string | null;
}

interface CheckRunsResponse {
  readonly check_runs: readonly CheckRun[];
}

interface WorkflowRun {
  readonly id: number;
  readonly head_sha: string;
  readonly run_started_at: string;
}

interface WorkflowRunsResponse {
  readonly workflow_runs: readonly WorkflowRun[];
}

interface WorkflowJobsResponse {
  readonly jobs: readonly WorkflowJob[];
}

const FAILURE_CONCLUSIONS = new Set([
  'action_required',
  'failure',
  'startup_failure',
  'timed_out',
]);

/** Adds latest-attempt Actions jobs to the commit check-run candidates. */
export function mergeLatestWorkflowJobs(
  checkRuns: readonly CheckRun[],
  jobs: readonly WorkflowJob[],
  headSha: string,
): CheckRun[] {
  const runsById = new Map(checkRuns.map((run) => [run.id, run]));
  for (const job of jobs) {
    const checkRunId = checkRunIdFromUrl(job.check_run_url);
    const existing = runsById.get(checkRunId);
    runsById.set(checkRunId, {
      id: checkRunId,
      name: job.name,
      head_sha: headSha,
      status: job.status,
      conclusion: job.conclusion,
      started_at: job.started_at ?? job.workflow_run_started_at ?? '1970-01-01T00:00:00Z',
      completed_at: job.completed_at,
      html_url: job.html_url ?? existing?.html_url,
      latest_attempt: true,
    });
  }
  return [...runsById.values()];
}

function checkRunIdFromUrl(url: string): number {
  const match = /\/check-runs\/(\d+)$/.exec(url);
  const id = Number(match?.[1]);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error(`Invalid Actions job check_run_url: ${url}`);
  }
  return id;
}

/** Classifies check runs without performing I/O. */
export function classifyCheckRuns(
  runs: readonly CheckRun[],
  headSha: string,
  mergedAt?: string,
): ClassifiedCheckRun[] {
  const latestByName = new Map<string, CheckRun>();
  for (const run of runs) {
    const latest = latestByName.get(run.name);
    if (!latest || compareStartedAt(run, latest) > 0) latestByName.set(run.name, run);
  }

  return runs.map((run): ClassifiedCheckRun => {
    let classification: CheckRunClassification;
    if (latestByName.get(run.name)?.id !== run.id) {
      classification = CHECK_SUPERSEDED;
    } else if (isStale(run, headSha, mergedAt)) {
      classification = CHECK_STALE_POST_MERGE;
    } else if (run.status !== 'completed') {
      classification = CHECK_PENDING;
    } else if (run.conclusion === 'cancelled') {
      classification = CHECK_CANCELLED;
    } else if (FAILURE_CONCLUSIONS.has(run.conclusion ?? '')) {
      classification = CHECK_CURRENT_FAIL;
    } else {
      classification = CHECK_CURRENT_PASS;
    }
    return { ...run, classification };
  });
}

/** Builds the provenance-bearing report used by both output modes and the exit gate. */
export function buildPrCheckReport(
  repo: string,
  pr: number,
  headSha: string,
  evaluatedAt: string,
  checks: readonly ClassifiedCheckRun[],
): PrCheckReport {
  const currentFailures = checks.filter((check) => check.classification === CHECK_CURRENT_FAIL)
    .length;
  return {
    gate: 'pr-checks',
    ok: currentFailures === 0,
    repo,
    pr,
    headSha,
    evaluatedAt,
    checks,
    currentFailures,
  };
}

/** Returns the CLI exit code for a completed PR-check report. */
export function exitCodeForPrCheckReport(report: PrCheckReport): number {
  return report.ok ? 0 : 1;
}

function compareStartedAt(left: CheckRun, right: CheckRun): number {
  const attemptDifference = Number(left.latest_attempt ?? false) -
    Number(right.latest_attempt ?? false);
  if (attemptDifference) return attemptDifference;
  const timeDifference = Date.parse(left.started_at) - Date.parse(right.started_at);
  return timeDifference || left.id - right.id;
}

function isStale(run: CheckRun, headSha: string, mergedAt?: string): boolean {
  if (run.head_sha !== headSha) return true;
  return mergedAt !== undefined && Date.parse(run.started_at) > Date.parse(mergedAt);
}

function parseArgs(args: readonly string[]): Options {
  args = normalizeTaskArguments(args);
  let repo = readEnv('GITHUB_REPOSITORY') ?? '';
  let pr = 0;
  let pretty = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const value = (): string => {
      const next = args[index + 1];
      if (!next || next.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      index++;
      return next;
    };
    switch (arg) {
      case '--json':
        break;
      case '--repo':
        repo = value();
        break;
      case '--pr':
        pr = Number(value());
        break;
      case '--pretty':
        pretty = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error('--repo must be owner/name');
  if (!Number.isInteger(pr) || pr < 1) throw new Error('--pr must be a positive integer');
  return { repo, pr, pretty };
}

function readEnv(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

async function ghApi<T>(endpoint: string, extraArgs: readonly string[] = []): Promise<T> {
  const command = new Deno.Command('gh', {
    args: ['api', endpoint, ...extraArgs],
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  if (!output.success) {
    const detail = new TextDecoder().decode(output.stderr).trim();
    throw new Error(`gh api ${endpoint} failed (${output.code}): ${detail}`);
  }
  return JSON.parse(new TextDecoder().decode(output.stdout)) as T;
}

async function fetchPullRequest(repo: string, pr: number): Promise<PullRequestResponse> {
  return await ghApi<PullRequestResponse>(`repos/${repo}/pulls/${pr}`);
}

async function fetchCheckRuns(repo: string, headSha: string): Promise<CheckRun[]> {
  const pages = await ghApi<readonly CheckRunsResponse[]>(
    `repos/${repo}/commits/${headSha}/check-runs?per_page=100`,
    ['--paginate', '--slurp'],
  );
  return pages.flatMap((page) => page.check_runs);
}

async function fetchLatestWorkflowJobs(repo: string, headSha: string): Promise<WorkflowJob[]> {
  const runPages = await ghApi<readonly WorkflowRunsResponse[]>(
    `repos/${repo}/actions/runs?per_page=100`,
    ['--method', 'GET', '-f', `head_sha=${headSha}`, '--paginate', '--slurp'],
  );
  const runs = runPages.flatMap((page) => page.workflow_runs)
    .filter((run) => run.head_sha === headSha);
  const jobs: WorkflowJob[] = [];
  for (const run of runs) {
    const pages = await ghApi<readonly WorkflowJobsResponse[]>(
      `repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`,
      ['--method', 'GET', '--paginate', '--slurp'],
    );
    jobs.push(
      ...pages.flatMap((page) => page.jobs).map((job) => ({
        ...job,
        workflow_run_started_at: run.run_started_at,
      })),
    );
  }
  return jobs;
}

function printReport(report: PrCheckReport, pretty: boolean): void {
  if (!pretty) {
    console.log(JSON.stringify(report));
    return;
  }
  for (const check of report.checks) {
    console.log(
      `${check.classification} ${check.name} status=${check.status} ` +
        `conclusion=${check.conclusion ?? 'none'} startedAt=${check.started_at}`,
    );
  }
  console.log(
    `pr-checks ${report.ok ? 'PASS' : 'FAIL'} ${report.repo}#${report.pr} ` +
      `headSha=${report.headSha} evaluatedAt=${report.evaluatedAt} ` +
      `checks=${report.checks.length} currentFailures=${report.currentFailures}`,
  );
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  const pullRequest = await fetchPullRequest(options.repo, options.pr);
  const [checkRuns, workflowJobs] = await Promise.all([
    fetchCheckRuns(options.repo, pullRequest.head.sha),
    fetchLatestWorkflowJobs(options.repo, pullRequest.head.sha),
  ]);
  const runs = mergeLatestWorkflowJobs(checkRuns, workflowJobs, pullRequest.head.sha);
  const checks = classifyCheckRuns(
    runs,
    pullRequest.head.sha,
    pullRequest.merged_at ?? undefined,
  );
  const report = buildPrCheckReport(
    options.repo,
    options.pr,
    pullRequest.head.sha,
    new Date().toISOString(),
    checks,
  );
  printReport(report, options.pretty);
  Deno.exit(exitCodeForPrCheckReport(report));
}

if (import.meta.main) await main();
