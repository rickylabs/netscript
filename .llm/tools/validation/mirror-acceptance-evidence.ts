import {
  acceptanceCheckboxes,
  type AcceptanceEvidence,
  AcceptanceEvidenceValidationError,
  bodySha256,
  checkAcceptanceBoxes,
  extractClosingIssues,
  type IssueSnapshot,
  issueSnapshot,
  parseAcceptanceEvidence,
  validateEvidenceMapping,
} from './acceptance-evidence.ts';

interface Issue {
  number: number;
  title: string;
  body: string | null;
  updated_at: string;
  labels?: Array<{ name?: string } | string>;
  head?: { sha: string };
  merged?: boolean;
  pull_request?: Record<string, unknown>;
}

interface Comment {
  html_url: string;
  body: string | null;
}

export interface MirrorClient {
  getIssue(number: number): Promise<Issue>;
  getPullRequest(number: number): Promise<Issue>;
  getComments(number: number, allPages?: boolean): Promise<Comment[]>;
  isCommitOnMain(sha: string): Promise<boolean>;
  updateIssue(number: number, body: string): Promise<void>;
  postComment(number: number, body: string): Promise<void>;
}

interface MirrorIssueResult {
  changed: boolean;
  snapshot: IssueSnapshot;
  evidence: string[];
  notice?: string;
}

export interface MirrorOptions {
  pr: number;
  /** Explicit post-merge target; absent for the existing label-gated CI mode. */
  issue?: number;
  dryRun?: boolean;
  /** Post-merge writes require this opt-in, even for programmatic callers. */
  apply?: boolean;
}

export interface MirrorRunContext {
  evaluatedAt?: string;
}

const READY_LABEL = 'status:ready-merge';
const MAX_MIRROR_ATTEMPTS = 2;
const MAIN_BRANCH = 'main';
const COMMENTS_PAGE_SIZE = 100;
const SHA_PATTERN = /\b[0-9a-f]{4,40}\b/gi;
const EXPLICIT_SHA_PREFIX =
  /(?:\b(?:sha(?:-?1)?|commit|head|merged\s+as)\s*[:=]?\s*`?|\/commits?\/)$/i;

type ClosingReferenceClassification = 'issue' | 'pull request' | 'lookup failed';

/** Explains how to refresh the CI-owned mirror after the ready label is applied. */
export function readyLabelRepairNotice(): string {
  return `Mirror skipped because live PR labels do not include ${READY_LABEL}; apply the label, then rerun the existing CI workflow with "gh run rerun <run-id>" so its live reads observe the label without moving the evaluated head.`;
}

/** Selects mirror targets from resolved classifications without performing network access. */
export function closingMirrorIssues(
  numbers: readonly number[],
  classifications: ReadonlyMap<number, ClosingReferenceClassification>,
): { issues: number[]; notices: string[] } {
  const issues: number[] = [];
  const notices: string[] = [];
  for (const number of numbers) {
    const classification = classifications.get(number) ?? 'lookup failed';
    const excluded = classification === 'pull request';
    if (!excluded) issues.push(number);
    const classificationText = classification === 'lookup failed'
      ? 'classification lookup failed'
      : `classified as ${classification}`;
    notices.push(
      `Closing reference #${number} ${classificationText}; ${
        excluded ? 'excluded from' : 'retained for'
      } acceptance mirroring.`,
    );
  }
  return { issues, notices };
}

async function main(): Promise<void> {
  const pretty = Deno.args.includes('--pretty');
  let dryRun = true;
  try {
    const options = parseMirrorArgs(Deno.args, Deno.env.get('GITHUB_REPOSITORY') ?? '');
    dryRun = options.dryRun;
    const token = Deno.env.get('GITHUB_TOKEN') ?? Deno.env.get('GH_TOKEN');
    if (!token) throw new Error('GITHUB_TOKEN or GH_TOKEN is required');
    const report = await runAcceptanceEvidenceMirror(
      new GitHubClient(options.repo, token),
      options,
    );
    printReport(report, options.pretty);
    if (!report.ok) Deno.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    printReport({
      ok: false,
      dryRun,
      changed: [],
      headSha: 'unavailable',
      evaluatedAt: new Date().toISOString(),
      issues: [],
      warnings: [],
      errors: [message],
    }, pretty);
    Deno.exitCode = 1;
  }
}

/** Runs the live mirror and converts expected evidence authoring failures into a JSON verdict. */
export async function runAcceptanceEvidenceMirror(
  client: MirrorClient,
  options: MirrorOptions,
  context: MirrorRunContext = {},
): Promise<MirrorReport> {
  const pr = await client.getPullRequest(options.pr);
  const evaluatedAt = context.evaluatedAt ?? new Date().toISOString();
  const headSha = pr.head?.sha ?? 'unavailable';
  const postMerge = options.issue !== undefined;
  const dryRun = postMerge ? !options.apply : options.dryRun ?? false;
  const labels = pr.labels ?? [];
  const closingReferences = postMerge ? [] : extractClosingIssues(pr.body ?? '');
  const classifications = new Map<number, ClosingReferenceClassification>();
  await Promise.all(closingReferences.map(async (number) => {
    try {
      const reference = await client.getIssue(number);
      classifications.set(number, reference.pull_request ? 'pull request' : 'issue');
    } catch {
      classifications.set(number, 'lookup failed');
    }
  }));
  const classified = closingMirrorIssues(closingReferences, classifications);
  const issueNumbers = options.issue === undefined ? classified.issues : [options.issue];
  if (!postMerge && !hasLabel(labels, READY_LABEL)) {
    const snapshots = await Promise.all(
      issueNumbers.map(async (issueNumber) => issueSnapshot(await client.getIssue(issueNumber))),
    );
    return {
      ok: true,
      dryRun,
      changed: [],
      headSha,
      evaluatedAt,
      issues: snapshots,
      warnings: [
        ...classified.notices,
        readyLabelRepairNotice(),
      ],
      errors: [],
    };
  }

  const warnings = [...classified.notices];
  const snapshots: IssueSnapshot[] = [];
  try {
    if (postMerge && pr.merged !== true) {
      throw new AcceptanceEvidenceValidationError([
        `PR #${options.pr} must be merged before post-merge acceptance mirroring.`,
      ]);
    }
    if (postMerge && options.apply && options.dryRun) {
      throw new AcceptanceEvidenceValidationError([
        '--apply and --dry-run are mutually exclusive.',
      ]);
    }
    const comments = await client.getComments(options.pr, postMerge);
    const parsed = [pr.body ?? '', ...comments.map((comment) => comment.body ?? '')]
      .map(parseAcceptanceEvidence);
    const entries = parsed.flatMap((result) => result.entries);
    const evidence = postMerge ? entries.filter((entry) => entry.issue === options.issue) : entries;
    warnings.push(...parsed.flatMap((result) => result.warnings));
    if (postMerge && evidence.length === 0) {
      throw new AcceptanceEvidenceValidationError([
        `PR #${options.pr}: no acceptance-evidence entries for issue #${options.issue} in its body or comments.`,
      ]);
    }
    // Validate the complete live mapping before the first mutation. A bad later issue must not
    // leave an earlier closing issue partially mirrored.
    for (const issueNumber of issueNumbers) {
      const issue = await client.getIssue(issueNumber);
      snapshots.push(await issueSnapshot(issue));
      validateEvidenceMapping(
        issueNumber,
        acceptanceCheckboxes(issue.body ?? ''),
        evidence,
      );
    }
    if (postMerge) await validateMainAncestry(client, evidence);
    const results: Array<MirrorIssueResult & { issue: number }> = [];
    for (const issueNumber of issueNumbers) {
      const result = await mirrorIssue(client, issueNumber, evidence, dryRun);
      results.push({ issue: issueNumber, ...result });
      if (result.changed && !dryRun) {
        await postProvenanceCommentOnce(client, options.pr, issueNumber, result);
      }
      if (result.notice) warnings.push(result.notice);
    }

    return {
      ok: true,
      dryRun,
      changed: results.filter((item) => item.changed).map((item) => item.issue),
      headSha,
      evaluatedAt,
      issues: results.map((item) => item.snapshot),
      warnings: [...new Set(warnings)],
      errors: [],
    };
  } catch (error) {
    if (!(error instanceof AcceptanceEvidenceValidationError)) throw error;
    return {
      ok: false,
      dryRun,
      changed: [],
      headSha,
      evaluatedAt,
      issues: snapshots,
      warnings: [...new Set(warnings)],
      errors: error.errors,
    };
  }
}

/** Checks every selected citation, including evidence for boxes already checked. */
async function validateMainAncestry(
  client: MirrorClient,
  evidence: AcceptanceEvidence[],
): Promise<void> {
  const shas = new Set<string>();
  for (const entry of evidence) {
    for (const match of entry.evidence.matchAll(SHA_PATTERN)) {
      const sha = match[0];
      // Numeric run IDs and byte counts are not implicit SHA citations. Explicit
      // commit links/labels and full-length hashes still accept numeric-only SHAs.
      if (
        (sha.length >= 7 && /[a-f]/i.test(sha)) || sha.length === 40 ||
        EXPLICIT_SHA_PREFIX.test(entry.evidence.slice(0, match.index))
      ) shas.add(sha.toLowerCase());
    }
  }
  const errors: string[] = [];
  for (const sha of shas) {
    try {
      if (!await client.isCommitOnMain(sha)) {
        errors.push(`Cited SHA ${sha} is not reachable from ${MAIN_BRANCH}.`);
      }
    } catch (error) {
      errors.push(
        `Unable to verify cited SHA ${sha} on ${MAIN_BRANCH}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  if (errors.length) throw new AcceptanceEvidenceValidationError(errors);
}

/** Mirrors one issue from a freshly fetched body and retries once if the post-PATCH body diverges. */
export async function mirrorIssue(
  client: MirrorClient,
  issueNumber: number,
  evidence: AcceptanceEvidence[],
  dryRun: boolean,
): Promise<MirrorIssueResult> {
  for (let attempt = 1; attempt <= MAX_MIRROR_ATTEMPTS; attempt++) {
    const issue = await client.getIssue(issueNumber);
    const beforeHash = await bodySha256(issue.body ?? '');
    const boxes = acceptanceCheckboxes(issue.body ?? '');
    const mapping = validateEvidenceMapping(issueNumber, boxes, evidence);
    const postMerge = boxes.filter((box) => box.postMerge);
    const desiredBody = checkAcceptanceBoxes(issue.body ?? '', new Set(mapping.keys()));
    if (desiredBody === (issue.body ?? '') || dryRun) {
      return {
        changed: desiredBody !== (issue.body ?? ''),
        snapshot: await issueSnapshot(issue),
        evidence: evidenceLines(boxes, mapping),
        notice: postMergeNotice(issueNumber, postMerge.map((box) => box.text)),
      };
    }

    await client.updateIssue(issueNumber, desiredBody);
    const after = await client.getIssue(issueNumber);
    const afterHash = await bodySha256(after.body ?? '');
    const desiredHash = await bodySha256(desiredBody);
    if (afterHash === desiredHash) {
      return {
        changed: true,
        snapshot: await issueSnapshot(after),
        evidence: evidenceLines(boxes, mapping),
        notice: postMergeNotice(issueNumber, postMerge.map((box) => box.text)),
      };
    }
    if (attempt === MAX_MIRROR_ATTEMPTS) {
      throw new Error(
        `Issue #${issueNumber}: body changed during acceptance mirroring (before ${beforeHash}, expected ${desiredHash}, live ${afterHash}); retry from the latest issue body after the concurrent edit finishes.`,
      );
    }
  }
  throw new Error(`Issue #${issueNumber}: acceptance mirroring exhausted its retry.`);
}

async function postProvenanceCommentOnce(
  client: MirrorClient,
  pr: number,
  issue: number,
  result: MirrorIssueResult,
): Promise<void> {
  const marker = `<!-- acceptance-evidence-mirror:pr=${pr};issue=${issue} -->`;
  const comments = await client.getComments(issue);
  if (comments.some((comment) => comment.body?.includes(marker))) return;
  await client.postComment(
    issue,
    [
      marker,
      `Acceptance evidence mirrored from #${pr}.`,
      '',
      ...result.evidence.map((line) => `- ${line}`),
      '',
      `Provenance: updatedAt=${result.snapshot.updatedAt}; bodySha256=${result.snapshot.bodySha256}`,
    ].join('\n'),
  );
}

function evidenceLines(
  boxes: ReturnType<typeof acceptanceCheckboxes>,
  mapping: Map<number, AcceptanceEvidence>,
): string[] {
  return [...mapping].map(([index, entry]) => {
    const box = boxes.find((candidate) => candidate.index === index);
    return `"${box?.text ?? `box-index ${index}`}" — ${entry.evidence}`;
  });
}

function postMergeNotice(issue: number, texts: string[]): string | undefined {
  return texts.length
    ? `Issue #${issue}: excluded post-merge box(es) ${
      texts.map((text) => `"${text}"`).join(', ')
    }; verify in a follow-up comment and tick after merge.`
    : undefined;
}

export interface MirrorReport {
  ok: boolean;
  dryRun: boolean;
  changed: number[];
  headSha: string;
  evaluatedAt: string;
  issues: IssueSnapshot[];
  warnings: string[];
  errors: string[];
}

function printReport(report: MirrorReport, pretty: boolean): void {
  if (!pretty) {
    console.log(JSON.stringify(report));
    return;
  }
  console.log(formatMirrorReport(report));
}

/** Formats the human-readable mirror summary while retaining the same explicit pass/fail verdict. */
export function formatMirrorReport(report: MirrorReport): string {
  const mode = report.dryRun ? 'DRY-RUN' : 'APPLIED';
  const outcome = report.ok
    ? report.changed.map((issue) => `#${issue}`).join(', ') || 'no changes'
    : 'FAILED';
  return [
    `acceptance-mirror ${mode}: ${outcome}`,
    `provenance: head=${report.headSha} evaluated=${report.evaluatedAt}`,
    ...report.issues.map((issue) =>
      `snapshot: #${issue.number} updated=${issue.updatedAt} bodySha256=${issue.bodySha256}`
    ),
    ...report.warnings.map((warning) => `notice: ${warning}`),
    ...report.errors.map((error) => `error: ${error}`),
  ].join('\n');
}

/** Selects safe post-merge defaults while preserving the CI invocation's write default. */
export function parseMirrorArgs(
  args: string[],
  defaultRepo = '',
): MirrorOptions & { repo: string; dryRun: boolean; pretty: boolean } {
  let repo = defaultRepo;
  let pr = 0;
  let issue: number | undefined;
  let dryRun = false;
  let apply = false;
  let pretty = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--repo') repo = args[++index] ?? '';
    else if (args[index] === '--pr') pr = Number(args[++index]);
    else if (args[index] === '--issue') issue = Number(args[++index]);
    else if (args[index] === '--apply') apply = true;
    else if (args[index] === '--dry-run') dryRun = true;
    else if (args[index] === '--pretty') pretty = true;
    else throw new Error(`Unknown argument: ${args[index]}`);
  }
  if (
    !/^[^/\s]+\/[^/\s]+$/.test(repo) || !Number.isSafeInteger(pr) || pr < 1 ||
    (issue !== undefined && (!Number.isSafeInteger(issue) || issue < 1))
  ) {
    throw new Error(
      'Usage: --repo owner/name --pr number [--issue number [--apply]] [--dry-run] [--pretty]',
    );
  }
  if (apply && issue === undefined) throw new Error('--apply requires --issue (post-merge mode).');
  if (apply && dryRun) throw new Error('--apply and --dry-run are mutually exclusive.');
  return { repo, pr, issue, dryRun: issue === undefined ? dryRun : !apply, apply, pretty };
}

function hasLabel(labels: NonNullable<Issue['labels']>, name: string): boolean {
  return labels.some((label) => (typeof label === 'string' ? label : label.name) === name);
}

/** GitHub REST adapter; compare treats main as the descendant of each cited SHA. */
export class GitHubClient implements MirrorClient {
  constructor(private repo: string, private token: string, private fetcher: typeof fetch = fetch) {}
  getIssue(number: number): Promise<Issue> {
    return this.request<Issue>('GET', `/issues/${number}`);
  }
  getPullRequest(number: number): Promise<Issue> {
    return this.request<Issue>('GET', `/pulls/${number}`);
  }
  async getComments(number: number, allPages = false): Promise<Comment[]> {
    const path = `/issues/${number}/comments`;
    if (!allPages) return this.request<Comment[]>('GET', path);
    const comments: Comment[] = [];
    for (let page = 1;; page++) {
      const batch = await this.request<Comment[]>(
        'GET',
        `${path}?per_page=${COMMENTS_PAGE_SIZE}&page=${page}`,
      );
      comments.push(...batch);
      if (batch.length < COMMENTS_PAGE_SIZE) return comments;
    }
  }
  async isCommitOnMain(sha: string): Promise<boolean> {
    const comparison = await this.request<{ status: string }>(
      'GET',
      `/compare/${encodeURIComponent(sha)}...${MAIN_BRANCH}`,
    );
    return comparison.status === 'ahead' || comparison.status === 'identical';
  }
  async updateIssue(number: number, body: string): Promise<void> {
    await this.request<Issue>('PATCH', `/issues/${number}`, { body });
  }
  async postComment(number: number, body: string): Promise<void> {
    await this.request<Comment>('POST', `/issues/${number}/comments`, { body });
  }
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.fetcher(`https://api.github.com/repos/${this.repo}${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${this.token}`,
        'x-github-api-version': '2022-11-28',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(
        `GitHub API ${method} ${path} failed: ${response.status} ${await response.text()}`,
      );
    }
    return await response.json() as T;
  }
}

if (import.meta.main) await main();
