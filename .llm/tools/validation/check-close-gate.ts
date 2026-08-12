import {
  acceptanceCheckboxes,
  extractClosingIssues,
  type IssueSnapshot,
  issueSnapshot,
} from './acceptance-evidence.ts';

interface Options {
  repo: string;
  pr?: number;
  issues: number[];
  token?: string;
  pretty: boolean;
  overrideLabel: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  updated_at: string;
  labels: Array<{ name?: string } | string>;
  pull_request?: Record<string, unknown>;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  head: { sha: string };
}

export interface Finding {
  issue: number;
  title: string;
  line: number;
  section: string;
  text: string;
  action: string;
}

export interface PrFinding {
  pr: number;
  title: string;
  line: number;
  section: string;
  text: string;
  action: string;
}

export interface Report {
  gate: 'close-gate';
  ok: boolean;
  repo: string;
  pr?: number;
  headSha: string;
  evaluatedAt: string;
  overrideLabel: string;
  overrideActive: boolean;
  closingIssues: number[];
  closingIssueReferences: ClosingIssueReference[];
  issues: IssueSnapshot[];
  findings: Finding[];
  prFindings: PrFinding[];
  notes: string[];
}

interface HeadingState {
  level: number;
  title: string;
  relevant: boolean;
}

const CHECKBOX_PATTERN = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const DEFAULT_OVERRIDE_LABEL = 'status:close-gate-override';
const GITHUB_API_MAX_ATTEMPTS = 4;
const GITHUB_API_RETRY_DELAY_MS = 1_000;

interface GitHubFetchOptions {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  maxAttempts?: number;
  request?: RequestInit;
  publicFallback?: boolean;
}

export type ClosingReferenceSource = 'body keyword' | 'manual link' | 'commit message';

export interface ClosingIssueReference {
  issue: number;
  sources: ClosingReferenceSource[];
  classification?: ClosingReferenceClassification;
  excluded?: boolean;
}

export type ClosingReferenceClassification = 'issue' | 'pull request' | 'lookup failed';

interface GitHubClosingContext {
  closingIssues: number[];
  commitMessages: string[];
}

/** Fetch GitHub JSON while tolerating bounded transient API failures. */
export async function fetchGitHubJsonWithRetry<T>(
  url: string,
  token: string,
  options: GitHubFetchOptions = {},
): Promise<T> {
  const fetchImpl = options.fetch ?? fetch;
  const sleep = options.sleep ?? ((milliseconds) =>
    new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    }));
  const maxAttempts = options.maxAttempts ?? GITHUB_API_MAX_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetchImpl(url, requestInit(options.request, token));
    if (response.ok) return await response.json() as T;

    const body = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`GitHub API ${url} failed: ${response.status} ${body}`);
    }
    if (options.publicFallback !== false) {
      const publicResponse = await fetchImpl(url, requestInit(options.request));
      if (publicResponse.ok) return await publicResponse.json() as T;
      await publicResponse.body?.cancel();
    }
    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1_000
      : GITHUB_API_RETRY_DELAY_MS * attempt;
    await sleep(delay);
  }
  throw new Error(`GitHub API ${url} exhausted retries`);
}

function requestInit(request: RequestInit | undefined, token?: string): RequestInit {
  const headers = new Headers(request?.headers);
  headers.set('accept', 'application/vnd.github+json');
  headers.set('x-github-api-version', '2022-11-28');
  if (token) headers.set('authorization', `Bearer ${token}`);
  return { ...request, headers };
}

/** Resolves GitHub's authoritative closing set and explains every reference source. */
export function resolveClosingIssueReferences(
  authoritativeIssues: readonly number[],
  body: string,
  commitMessages: readonly string[],
  classifications?: ReadonlyMap<number, ClosingReferenceClassification>,
): ClosingIssueReference[] {
  const bodyIssues = new Set(extractClosingIssues(body));
  const commitIssues = new Set(commitMessages.flatMap(extractClosingIssues));
  const issueNumbers = [
    ...new Set([
      ...authoritativeIssues,
      ...bodyIssues,
      ...commitIssues,
    ]),
  ].sort((a, b) => a - b);

  return issueNumbers.map((issue) => {
    const sources: ClosingReferenceSource[] = [];
    if (bodyIssues.has(issue)) sources.push('body keyword');
    if (commitIssues.has(issue)) sources.push('commit message');
    if (authoritativeIssues.includes(issue) && sources.length === 0) sources.push('manual link');
    const classification = authoritativeIssues.includes(issue)
      ? undefined
      : classifications?.get(issue);
    return {
      issue,
      sources,
      ...(classification === undefined ? {} : { classification }),
      ...(classification === 'pull request' ? { excluded: true } : {}),
    };
  });
}

async function classifyRegexReferences(
  client: GitHubClient,
  authoritativeIssues: readonly number[],
  body: string,
  commitMessages: readonly string[],
): Promise<Map<number, ClosingReferenceClassification>> {
  const authoritative = new Set(authoritativeIssues);
  const candidates = new Set([
    ...extractClosingIssues(body),
    ...commitMessages.flatMap(extractClosingIssues),
  ]);
  const classifications = new Map<number, ClosingReferenceClassification>();
  await Promise.all(
    [...candidates].filter((number) => !authoritative.has(number)).map(
      async (number) => {
        try {
          const reference = await client.getIssue(number);
          classifications.set(number, reference.pull_request ? 'pull request' : 'issue');
        } catch {
          classifications.set(number, 'lookup failed');
        }
      },
    ),
  );
  return classifications;
}

/** Fails if the close-gate job regresses to frozen pull-request label payloads. */
export function assertCloseGateWorkflowUsesLiveLabels(workflow: string): void {
  const job = workflow.match(/\n  close-gate:\n([\s\S]*?)(?=\n  [a-z][\w-]*:\n)/)?.[1] ?? '';
  if (job.includes('github.event.pull_request.labels')) {
    throw new Error(
      'close-gate job reads frozen github.event.pull_request.labels; fetch live PR labels through the API instead.',
    );
  }
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  const token = options.token ?? Deno.env.get('GITHUB_TOKEN') ?? Deno.env.get('GH_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN or GH_TOKEN is required for GitHub API access');

  const client = new GitHubClient(options.repo, token);
  const notes: string[] = [];
  let issueNumbers = [...options.issues];
  let overrideActive = false;
  let headSha = 'not-applicable';
  let prFindings: PrFinding[] = [];
  let closingIssueReferences: ClosingIssueReference[] = [];

  if (options.pr !== undefined) {
    const pr = await client.getPullRequest(options.pr);
    const closingContext = await client.getClosingContext(options.pr);
    headSha = pr.head.sha;
    prFindings = findUncheckedPrBody(pr);
    const classifications = await classifyRegexReferences(
      client,
      closingContext.closingIssues,
      pr.body ?? '',
      closingContext.commitMessages,
    );
    closingIssueReferences = resolveClosingIssueReferences(
      closingContext.closingIssues,
      pr.body ?? '',
      closingContext.commitMessages,
      classifications,
    );
    issueNumbers = [
      ...new Set([
        ...issueNumbers,
        ...closingIssueReferences.filter((reference) => !reference.excluded).map((reference) =>
          reference.issue
        ),
      ]),
    ].sort((a, b) => a - b);
    const prIssue = await client.getIssue(options.pr);
    overrideActive = hasLabel(prIssue.labels, options.overrideLabel);
    if (issueNumbers.length === 0) {
      notes.push(
        'GitHub reports no closing references; close-gate has no referenced issues to check.',
      );
    }
  }

  issueNumbers = [...new Set(issueNumbers)].sort((a, b) => a - b);
  const findings: Finding[] = [];
  const snapshots: IssueSnapshot[] = [];
  for (const issueNumber of issueNumbers) {
    const issue = await client.getIssue(issueNumber);
    snapshots.push(await issueSnapshot(issue));
    const result = findUncheckedAcceptance(issue);
    findings.push(...result.findings);
    notes.push(...result.notices);
  }

  const ok = closeGatePasses(overrideActive, findings, prFindings);
  const report: Report = {
    gate: 'close-gate',
    ok,
    repo: options.repo,
    pr: options.pr,
    headSha,
    evaluatedAt: new Date().toISOString(),
    overrideLabel: options.overrideLabel,
    overrideActive,
    closingIssues: issueNumbers,
    closingIssueReferences,
    issues: snapshots,
    findings,
    prFindings,
    notes,
  };
  printReport(report, options.pretty);
  Deno.exit(ok ? 0 : 1);
}

function parseArgs(args: string[]): Options {
  let repo = Deno.env.get('GITHUB_REPOSITORY') ?? '';
  let pr: number | undefined;
  const issues: number[] = [];
  let token: string | undefined;
  let pretty = false;
  let overrideLabel = DEFAULT_OVERRIDE_LABEL;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case '--repo':
        repo = requireValue(args, index, arg);
        index++;
        break;
      case '--pr':
        pr = parsePositiveInt(requireValue(args, index, arg), arg);
        index++;
        break;
      case '--issue':
        issues.push(parsePositiveInt(requireValue(args, index, arg), arg));
        index++;
        break;
      case '--token':
        token = requireValue(args, index, arg);
        index++;
        break;
      case '--override-label':
        overrideLabel = requireValue(args, index, arg);
        index++;
        break;
      case '--pretty':
        pretty = true;
        break;
      case '--help':
        printHelp();
        Deno.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    throw new Error('--repo must be owner/name, or set GITHUB_REPOSITORY');
  }
  if (pr === undefined && issues.length === 0) {
    throw new Error('Provide --pr <number> or at least one --issue <number>');
  }
  return { repo, pr, issues, token, pretty, overrideLabel };
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parsePositiveInt(value: string, flag: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-env --allow-net .llm/tools/validation/check-close-gate.ts --repo owner/repo --pr 123 --pretty',
    '  deno run --allow-env --allow-net .llm/tools/validation/check-close-gate.ts --repo owner/repo --issue 260 --pretty',
    '',
    'Checks authoritative PR-body checkboxes and closing-issue acceptance/gate checkboxes.',
  ].join('\n'));
}

export function findUncheckedAcceptance(
  issue: GitHubIssue,
): { findings: Finding[]; notices: string[] } {
  const findings: Finding[] = [];
  const notices: string[] = [];
  for (const box of acceptanceCheckboxes(issue.body ?? '')) {
    if (box.postMerge) {
      notices.push(
        `Issue #${issue.number}: excluded post-merge box "${box.text}" from the merge gate; verify it in a follow-up comment and tick it after merge.`,
      );
      continue;
    }
    if (box.checked) continue;
    findings.push({
      issue: issue.number,
      title: issue.title,
      line: box.line,
      section: 'acceptance/gate',
      text: box.text,
      action:
        `Tick issue #${issue.number} box "${box.text}" after attaching evidence, or add structured PR evidence, apply status:ready-merge, then rerun the existing CI workflow with "gh run rerun <run-id>" so its live reads observe the label without moving the evaluated head.`,
    });
  }
  return { findings, notices };
}

/** Finds unchecked authoritative checkboxes in a pull request body. */
export function findUncheckedPrBody(pr: GitHubPullRequest): PrFinding[] {
  const findings: PrFinding[] = [];
  const lines = (pr.body ?? '').split(/\r?\n/);
  const headingStack: HeadingState[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const heading = line.match(HEADING_PATTERN);
    if (heading) {
      const level = heading[1].length;
      const title = stripMarkdown(heading[2]);
      while ((headingStack.at(-1)?.level ?? 0) >= level) headingStack.pop();
      headingStack.push({ level, title, relevant: isAuthoritativePrSection(title) });
    }
    const checkbox = line.match(CHECKBOX_PATTERN);
    if (!checkbox || checkbox[1].toLowerCase() === 'x') continue;
    const relevantHeading = [...headingStack].reverse().find((entry) => entry.relevant);
    if (!relevantHeading) continue;
    const text = checkbox[2].trim();
    findings.push({
      pr: pr.number,
      title: pr.title,
      line: index + 1,
      section: relevantHeading.title,
      text,
      action: `Tick PR #${pr.number} box "${text}" only after its claim is true and evidenced.`,
    });
  }
  return findings;
}

/** Preserves the override while requiring both issue and PR-body authoritative boxes. */
export function closeGatePasses(
  overrideActive: boolean,
  issueFindings: readonly Finding[],
  prFindings: readonly PrFinding[],
): boolean {
  return overrideActive || (issueFindings.length === 0 && prFindings.length === 0);
}

function stripMarkdown(value: string): string {
  return value.replaceAll('`', '').replace(/\s+/g, ' ').trim();
}

function isAuthoritativePrSection(title: string): boolean {
  const normalized = title.toLowerCase();
  return normalized.includes('definition of done') || normalized.includes('acceptance');
}

function hasLabel(labels: GitHubIssue['labels'], name: string): boolean {
  return labels.some((label) => (typeof label === 'string' ? label : label.name) === name);
}

function printReport(report: Report, pretty: boolean): void {
  if (!pretty) {
    console.log(JSON.stringify(report));
    return;
  }
  for (const line of formatPrettyReport(report)) console.log(line);
}

/** Formats the human-readable CI log with the same provenance as report JSON. */
export function formatPrettyReport(report: Report): string[] {
  const subject = report.pr === undefined ? report.repo : `${report.repo}#${report.pr}`;
  const lines = [
    `close-gate ${report.ok ? 'PASS' : 'FAIL'} ${subject}`,
    `provenance: head=${report.headSha} evaluated=${report.evaluatedAt}`,
  ];
  for (const issue of report.issues) {
    lines.push(
      `snapshot: #${issue.number} updated=${issue.updatedAt} bodySha256=${issue.bodySha256}`,
    );
  }
  if (report.overrideActive) lines.push(`override: ${report.overrideLabel}`);
  lines.push(
    report.closingIssues.length === 0
      ? 'closing issues: none'
      : `closing issues: ${report.closingIssues.map((issue) => `#${issue}`).join(', ')}`,
  );
  for (const reference of report.closingIssueReferences) {
    lines.push(
      `closing reference: #${reference.issue} source${reference.sources.length === 1 ? '' : 's'}: ${
        reference.sources.join(', ')
      }${reference.classification ? ` classification: ${reference.classification}` : ''}${
        reference.excluded ? ' excluded: yes' : ''
      }`,
    );
  }
  for (const note of report.notes) lines.push(`note: ${note}`);
  for (const finding of report.findings) {
    lines.push(
      `unchecked: #${finding.issue} line ${finding.line} [${finding.section}] "${finding.text}"; compared current live issue body. Fix: ${finding.action}`,
    );
  }
  for (const finding of report.prFindings) {
    lines.push(
      `unchecked PR body: #${finding.pr} line ${finding.line} [${finding.section}] "${finding.text}". Fix: ${finding.action}`,
    );
  }
  return lines;
}

class GitHubClient {
  constructor(private readonly repo: string, private readonly token: string) {}
  getPullRequest(number: number): Promise<GitHubPullRequest> {
    return this.getJson<GitHubPullRequest>(`/repos/${this.repo}/pulls/${number}`);
  }
  getIssue(number: number): Promise<GitHubIssue> {
    return this.getJson<GitHubIssue>(`/repos/${this.repo}/issues/${number}`);
  }
  async getClosingContext(number: number): Promise<GitHubClosingContext> {
    const [owner, name] = this.repo.split('/');
    const query = [
      'query ClosingIssues($owner: String!, $name: String!, $number: Int!) {',
      '  repository(owner: $owner, name: $name) {',
      '    pullRequest(number: $number) {',
      '      closingIssuesReferences(first: 100) { nodes { number } }',
      '      commits(first: 100) { nodes { commit { message } } }',
      '    }',
      '  }',
      '}',
    ].join('\n');
    const response = await fetchGitHubJsonWithRetry<{
      data?: {
        repository?: {
          pullRequest?: {
            closingIssuesReferences: { nodes: Array<{ number: number }> };
            commits: { nodes: Array<{ commit: { message: string } }> };
          };
        };
      };
      errors?: Array<{ message: string }>;
    }>('https://api.github.com/graphql', this.token, {
      publicFallback: false,
      request: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables: { owner, name, number } }),
      },
    });
    if (response.errors?.length) {
      throw new Error(
        `GitHub GraphQL closing-reference query failed: ${
          response.errors.map((error) => error.message).join('; ')
        }`,
      );
    }
    const pullRequest = response.data?.repository?.pullRequest;
    if (!pullRequest) throw new Error(`GitHub GraphQL did not return PR #${number}`);
    return {
      closingIssues: pullRequest.closingIssuesReferences.nodes.map((issue) => issue.number),
      commitMessages: pullRequest.commits.nodes.map((node) => node.commit.message),
    };
  }
  private getJson<T>(path: string): Promise<T> {
    return fetchGitHubJsonWithRetry<T>(`https://api.github.com${path}`, this.token);
  }
}

if (import.meta.main) await main();
