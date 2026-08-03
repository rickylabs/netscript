/** Read-only latest-run-per-name pull-request check rollup. */

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
}

export interface ClassifiedCheckRun extends CheckRun {
  readonly classification: CheckRunClassification;
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

const FAILURE_CONCLUSIONS = new Set([
  'action_required',
  'failure',
  'startup_failure',
  'timed_out',
]);

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

function compareStartedAt(left: CheckRun, right: CheckRun): number {
  const timeDifference = Date.parse(left.started_at) - Date.parse(right.started_at);
  return timeDifference || left.id - right.id;
}

function isStale(run: CheckRun, headSha: string, mergedAt?: string): boolean {
  if (run.head_sha !== headSha) return true;
  return mergedAt !== undefined && Date.parse(run.started_at) > Date.parse(mergedAt);
}

function parseArgs(args: readonly string[]): Options {
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
      case '--':
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
  const runs = await fetchCheckRuns(options.repo, pullRequest.head.sha);
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
  Deno.exit(report.ok ? 0 : 1);
}

if (import.meta.main) await main();
