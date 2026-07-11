import {
  acceptanceCheckboxes,
  checkAcceptanceBoxes,
  extractClosingIssues,
  parseAcceptanceEvidence,
  validateEvidenceMapping,
} from './acceptance-evidence.ts';

interface Issue {
  number: number;
  title: string;
  body: string | null;
}
interface Comment {
  html_url: string;
  body: string | null;
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  const token = Deno.env.get('GITHUB_TOKEN') ?? Deno.env.get('GH_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN or GH_TOKEN is required');
  const client = new GitHubClient(options.repo, token);
  const pr = await client.get<Issue>(`/pulls/${options.pr}`);
  const issueNumbers = extractClosingIssues(pr.body ?? '');
  if (!issueNumbers.length) {
    console.log(
      options.pretty
        ? 'acceptance-mirror NOOP: no closing-keyword issues'
        : JSON.stringify({ ok: true, changed: [] }),
    );
    return;
  }
  const comments = await client.get<Comment[]>(`/issues/${options.pr}/comments`);
  const evidence = [pr.body ?? '', ...comments.map((comment) => comment.body ?? '')]
    .flatMap(parseAcceptanceEvidence);
  const candidates: Array<{ issue: Issue; boxes: ReturnType<typeof acceptanceCheckboxes> }> = [];
  for (const issueNumber of issueNumbers) {
    const issue = await client.get<Issue>(`/issues/${issueNumber}`);
    const boxes = acceptanceCheckboxes(issue.body ?? '');
    candidates.push({ issue, boxes });
  }
  const mapping = validateEvidenceMapping(candidates.flatMap((item) => item.boxes), evidence);
  const changes: Array<{ issue: Issue; body: string; evidence: string[] }> = [];
  for (const { issue, boxes } of candidates) {
    const issueEntries = boxes.filter((box) => !box.checked).map((box) => mapping.get(box.text)!)
      .filter(Boolean);
    if (issueEntries.length) {
      changes.push({
        issue,
        body: checkAcceptanceBoxes(
          issue.body ?? '',
          new Set(issueEntries.map((entry) => entry.text)),
        ),
        evidence: issueEntries.map((entry) => `${entry.text} — ${entry.evidence}`),
      });
    }
  }
  for (const change of changes) {
    if (!options.dryRun) {
      await client.patch(`/issues/${change.issue.number}`, { body: change.body });
      await client.post(`/issues/${change.issue.number}/comments`, {
        body: `Acceptance evidence mirrored from #${options.pr}.\n\n${
          change.evidence.map((line) => `- ${line}`).join('\n')
        }`,
      });
    }
  }
  const prefix = options.dryRun ? 'DRY-RUN' : 'APPLIED';
  console.log(
    options.pretty
      ? `acceptance-mirror ${prefix}: ${
        changes.map((item) => `#${item.issue.number} (${item.evidence.length})`).join(', ') ||
        'no changes'
      }`
      : JSON.stringify({
        ok: true,
        dryRun: options.dryRun,
        changed: changes.map((item) => item.issue.number),
      }),
  );
}

function parseArgs(args: string[]): { repo: string; pr: number; dryRun: boolean; pretty: boolean } {
  let repo = Deno.env.get('GITHUB_REPOSITORY') ?? '';
  let pr = 0;
  let dryRun = false;
  let pretty = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo') repo = args[++i] ?? '';
    else if (args[i] === '--pr') pr = Number(args[++i]);
    else if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--pretty') pretty = true;
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo) || !Number.isInteger(pr) || pr < 1) {
    throw new Error('Usage: --repo owner/name --pr number [--dry-run] [--pretty]');
  }
  return { repo, pr, dryRun, pretty };
}

class GitHubClient {
  constructor(private repo: string, private token: string) {}
  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }
  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }
  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`https://api.github.com/repos/${this.repo}${path}`, {
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
