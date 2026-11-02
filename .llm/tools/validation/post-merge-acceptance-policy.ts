import {
  type AcceptanceEvidence,
  AcceptanceEvidenceValidationError,
} from './acceptance-evidence.ts';

/** Canonical REST identity; a fork's head repository does not own the pull request. */
export interface RepositoryIdentity {
  repository_url?: string;
  html_url?: string;
  url?: string;
  base?: { repo?: { full_name?: string } };
}

export interface PullRequestCommit {
  commit: { message: string };
}

const REPOSITORY_MISMATCH = 'post-merge-repository-mismatch';
const MISSING_REFERENCE = 'post-merge-issue-not-referenced';
const ISSUE_REFERENCE =
  /(?:https:\/\/(?:api\.github\.com\/repos|github\.com)\/([\w.-]+\/[\w.-]+)\/issues\/|([\w.-]+\/[\w.-]+)?#)(\d+)\b/gi;
const REPOSITORY_URL =
  /^https:\/\/(?:api\.github\.com\/repos|github\.com)\/([\w.-]+\/[\w.-]+)(?:[/?#]|$)/i;
const QUALIFIED_COMMIT = /\b([\w.-]+\/[\w.-]+)@[0-9a-f]{4,40}\b/gi;
const EVIDENCE_LINK =
  /https:\/\/(?:api\.github\.com\/repos|github\.com)\/([\w.-]+\/[\w.-]+)(?=[^\w.-]|$)/gi;
const NON_REPOSITORY_GITHUB_ROUTES = new Set(['user-attachments', 'orgs', 'advisories']);

/** Requires an explicit repository for post-merge calls, including programmatic ones. */
export function postMergeRepository(repo: string | undefined): string {
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    refuse(REPOSITORY_MISMATCH, 'post-merge mode requires --repo owner/name.');
  }
  return repo.toLowerCase();
}

/** Rejects missing or contradictory ownership before any issue mutation. */
export function validateRepositoryIdentity(
  repo: string,
  identity: RepositoryIdentity,
  source: string,
): void {
  const repositories = [
    identity.base?.repo?.full_name,
    ...[identity.repository_url, identity.html_url, identity.url].map((url) =>
      url === undefined ? undefined : url.match(REPOSITORY_URL)?.[1] ?? 'unverified repository'
    ),
  ].filter((value): value is string => value !== undefined);
  if (repositories.length === 0) {
    refuse(
      REPOSITORY_MISMATCH,
      `${source}: repository identity is unavailable for --repo ${repo}.`,
    );
  }
  for (const candidate of repositories) assertRepository(repo, candidate, source);
}

/** A comment's evidence cannot establish the PR-to-issue association by itself. */
export async function validateIssueAssociation(
  repo: string,
  issue: number,
  pr: number,
  body: string,
  getCommits: () => Promise<PullRequestCommit[]>,
): Promise<void> {
  if (referencesIssue(body, repo, issue, `PR #${pr} body`)) return;
  const commits = await getCommits();
  let associated = false;
  for (const commit of commits) {
    if (referencesIssue(commit.commit.message, repo, issue, `PR #${pr} commit`)) associated = true;
  }
  if (!associated) {
    refuse(
      MISSING_REFERENCE,
      `PR #${pr} body or commits must reference #${issue} in ${repo}; an evidence comment alone is insufficient.`,
    );
  }
}

/** Names foreign evidence metadata before the shared numeric-issue parser rejects it. */
export function validateEvidenceBlockRepositories(
  markdown: string,
  repo: string,
  issue: number,
): void {
  const fences = /^\s*```acceptance-evidence\s*\r?\n([\s\S]*?)^\s*```\s*$/gim;
  for (const fence of markdown.matchAll(fences)) {
    const fields = [...fence[1].matchAll(/^\s*-?\s*(issue|repo|repository):\s*(.+)$/gm)]
      .map((field) => ({ key: field[1], value: scalar(field[2]) }));
    const targets = fields.filter((field) => field.key === 'issue');
    if (
      !targets.some((field) =>
        Number(field.value) === issue ||
        [...field.value.matchAll(ISSUE_REFERENCE)].some((match) => Number(match[3]) === issue)
      )
    ) continue;
    for (const field of fields) {
      if (field.key === 'issue') referencesIssue(field.value, repo, issue, 'Acceptance evidence');
      else assertRepository(repo, field.value, 'Acceptance evidence');
    }
  }
}

/** Selected evidence must not silently resolve foreign commit links in the local repository. */
export function validateEvidenceRepositories(evidence: AcceptanceEvidence[], repo: string): void {
  for (const entry of evidence) {
    for (const match of entry.evidence.matchAll(ISSUE_REFERENCE)) {
      const qualifiedRepo = match[1] ?? match[2];
      if (qualifiedRepo) assertRepository(repo, qualifiedRepo, 'Acceptance evidence');
    }
    for (const match of entry.evidence.matchAll(QUALIFIED_COMMIT)) {
      assertRepository(repo, match[1], 'Acceptance evidence');
    }
    for (const match of entry.evidence.matchAll(EVIDENCE_LINK)) {
      // Uploaded assets, organization discussions and global advisories have no owning repo.
      if (
        /^https:\/\/github\.com\//i.test(match[0]) &&
        NON_REPOSITORY_GITHUB_ROUTES.has(match[1].split('/')[0].toLowerCase())
      ) continue;
      assertRepository(repo, match[1], 'Acceptance evidence');
    }
  }
}

function referencesIssue(text: string, repo: string, issue: number, source: string): boolean {
  // Fenced examples/evidence do not establish a Markdown issue reference.
  const lines: string[] = [];
  let fence: string | undefined;
  for (const line of text.split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
    } else if (!fence) lines.push(line);
  }
  let found = false;
  for (const match of lines.join('\n').matchAll(ISSUE_REFERENCE)) {
    if (Number(match[3]) !== issue) continue;
    const qualifiedRepo = match[1] ?? match[2];
    if (qualifiedRepo) assertRepository(repo, qualifiedRepo, source);
    found = true;
  }
  return found;
}

function scalar(value: string): string {
  const text = value.trim();
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      const decoded: unknown = JSON.parse(text);
      if (typeof decoded === 'string') return decoded;
    } catch { /* The shared parser still reports malformed YAML. */ }
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replaceAll("''", "'");
  }
  return text.replace(/\s+#.*$/, '').trim();
}

function assertRepository(repo: string, candidate: string, source: string): void {
  if (candidate.toLowerCase() !== repo) {
    refuse(REPOSITORY_MISMATCH, `${source} belongs to ${candidate}, not --repo ${repo}.`);
  }
}

function refuse(name: string, detail: string): never {
  throw new AcceptanceEvidenceValidationError([`${name}: ${detail}`]);
}
