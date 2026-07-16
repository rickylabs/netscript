interface Options {
  repo: string;
  pr?: number;
  issues: number[];
  token?: string;
  pretty: boolean;
  overrideLabel: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
}

interface GitHubIssueWithLabels {
  labels: Array<{ name?: string } | string>;
}

interface Finding {
  issue: number;
  title: string;
  line: number;
  section: string;
  text: string;
}

interface HeadingState {
  level: number;
  title: string;
  relevant: boolean;
}

interface Report {
  gate: 'close-gate';
  ok: boolean;
  repo: string;
  pr?: number;
  overrideLabel: string;
  overrideActive: boolean;
  closingIssues: number[];
  findings: Finding[];
  notes: string[];
}

const CLOSING_KEYWORD_PATTERN =
  /\b(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+(?:(?:https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/)|#)(\d+)\b/gi;
const CHECKBOX_PATTERN = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const DEFAULT_OVERRIDE_LABEL = 'status:close-gate-override';
const GITHUB_API_MAX_ATTEMPTS = 4;
const GITHUB_API_RETRY_DELAY_MS = 1_000;

interface GitHubFetchOptions {
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  maxAttempts?: number;
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
    const response = await fetchImpl(url, {
      headers: {
        'accept': 'application/vnd.github+json',
        'authorization': `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
      },
    });
    if (response.ok) {
      return await response.json() as T;
    }

    const body = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`GitHub API ${url} failed: ${response.status} ${body}`);
    }

    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1_000
      : GITHUB_API_RETRY_DELAY_MS * attempt;
    await sleep(delay);
  }

  throw new Error(`GitHub API ${url} exhausted retries`);
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  const token = options.token ?? Deno.env.get('GITHUB_TOKEN') ?? Deno.env.get('GH_TOKEN');

  if (!token) {
    throw new Error('GITHUB_TOKEN or GH_TOKEN is required for GitHub API access');
  }

  const client = new GitHubClient(options.repo, token);
  const notes: string[] = [];
  let issueNumbers = [...options.issues];
  let overrideActive = false;

  if (options.pr !== undefined) {
    const pr = await client.getPullRequest(options.pr);
    issueNumbers = [...new Set([...issueNumbers, ...extractClosingIssues(pr.body ?? '')])].sort((
      a,
      b,
    ) => a - b);
    const prIssue = await client.getIssueForLabels(options.pr);
    overrideActive = hasLabel(prIssue.labels, options.overrideLabel);
    if (issueNumbers.length === 0) {
      notes.push(
        'No PR body closing keywords found; close-gate has no referenced issues to check.',
      );
    }
  }

  issueNumbers = [...new Set(issueNumbers)].sort((a, b) => a - b);
  const findings: Finding[] = [];

  for (const issueNumber of issueNumbers) {
    const issue = await client.getIssue(issueNumber);
    findings.push(...findUncheckedAcceptance(issue));
  }

  const ok = overrideActive || findings.length === 0;
  const report: Report = {
    gate: 'close-gate',
    ok,
    repo: options.repo,
    pr: options.pr,
    overrideLabel: options.overrideLabel,
    overrideActive,
    closingIssues: issueNumbers,
    findings,
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
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`);
  }
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
    'Checks PR body closing keywords against referenced issue acceptance/gate checkboxes.',
  ].join('\n'));
}

function extractClosingIssues(body: string): number[] {
  const issues = new Set<number>();
  for (const match of body.matchAll(CLOSING_KEYWORD_PATTERN)) {
    issues.add(Number(match[1]));
  }
  return [...issues];
}

function findUncheckedAcceptance(issue: GitHubIssue): Finding[] {
  const findings: Finding[] = [];
  const body = issue.body ?? '';
  const lines = body.split(/\r?\n/);
  const headingStack: HeadingState[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const heading = line.match(HEADING_PATTERN);
    if (heading) {
      const level = heading[1].length;
      const title = stripMarkdown(heading[2]);
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ level, title, relevant: isRelevantSection(title) });
    }

    const checkbox = line.match(CHECKBOX_PATTERN);
    if (!checkbox || checkbox[1].toLowerCase() === 'x') {
      continue;
    }

    const text = checkbox[2].trim();
    const gateCheckbox = /^`?gate:/i.test(text);
    const relevantHeading = [...headingStack].reverse().find((entry) => entry.relevant);
    if (!gateCheckbox && relevantHeading === undefined) {
      continue;
    }

    findings.push({
      issue: issue.number,
      title: issue.title,
      line: index + 1,
      section: gateCheckbox
        ? relevantHeading?.title ?? 'gate checkbox'
        : relevantHeading?.title ?? 'acceptance/gate',
      text,
    });
  }

  return findings;
}

function stripMarkdown(value: string): string {
  return value.replaceAll('`', '').replace(/\s+/g, ' ').trim();
}

function isRelevantSection(title: string): boolean {
  const normalized = title.toLowerCase();
  return normalized.includes('acceptance') ||
    normalized.includes('definition of done') ||
    normalized.includes('fitness gate') ||
    /\bgates?\b/.test(normalized);
}

function hasLabel(labels: GitHubIssueWithLabels['labels'], name: string): boolean {
  return labels.some((label) => (typeof label === 'string' ? label : label.name) === name);
}

function printReport(report: Report, pretty: boolean): void {
  if (!pretty) {
    console.log(JSON.stringify(report));
    return;
  }

  const subject = report.pr === undefined ? report.repo : `${report.repo}#${report.pr}`;
  console.log(`close-gate ${report.ok ? 'PASS' : 'FAIL'} ${subject}`);
  if (report.overrideActive) {
    console.log(`override: ${report.overrideLabel}`);
  }
  if (report.closingIssues.length === 0) {
    console.log('closing issues: none');
  } else {
    console.log(`closing issues: ${report.closingIssues.map((issue) => `#${issue}`).join(', ')}`);
  }
  for (const note of report.notes) {
    console.log(`note: ${note}`);
  }
  for (const finding of report.findings) {
    console.log(
      `unchecked: #${finding.issue} line ${finding.line} [${finding.section}] ${finding.text}`,
    );
  }
}

class GitHubClient {
  constructor(private readonly repo: string, private readonly token: string) {}

  getPullRequest(number: number): Promise<GitHubPullRequest> {
    return this.getJson<GitHubPullRequest>(`/repos/${this.repo}/pulls/${number}`);
  }

  getIssue(number: number): Promise<GitHubIssue> {
    return this.getJson<GitHubIssue>(`/repos/${this.repo}/issues/${number}`);
  }

  getIssueForLabels(number: number): Promise<GitHubIssueWithLabels> {
    return this.getJson<GitHubIssueWithLabels>(`/repos/${this.repo}/issues/${number}`);
  }

  private async getJson<T>(path: string): Promise<T> {
    return await fetchGitHubJsonWithRetry<T>(`https://api.github.com${path}`, this.token);
  }
}

if (import.meta.main) await main();
