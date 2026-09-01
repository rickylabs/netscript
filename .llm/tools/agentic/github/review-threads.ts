/** Read-only review-thread reporter and unanswered-thread merge gate. */

import { GITHUB_GRAPHQL_API_URL } from '../config/endpoints.ts';
import { resolveGithubToken } from '../lib/agentic-lib.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';

interface Options {
  repo: string;
  pr: number;
  token?: string;
  pretty: boolean;
}

interface ReviewComment {
  readonly author: { readonly login: string } | null;
  readonly body: string;
}

export interface ReviewThreadNode {
  readonly isOutdated: boolean;
  readonly path: string;
  readonly line: number | null;
  readonly originalLine: number | null;
  readonly comments: {
    readonly totalCount: number;
    readonly nodes: readonly ReviewComment[];
  };
}

export interface ReviewThreadFinding {
  readonly author: string;
  readonly path: string;
  readonly line: number;
  readonly severity: string | null;
  readonly answered: boolean;
  readonly outdated: boolean;
  readonly blocking: boolean;
}

export interface ReviewThreadReport {
  readonly gate: 'review-threads';
  readonly ok: boolean;
  readonly repo: string;
  readonly pr: number;
  readonly threads: readonly ReviewThreadFinding[];
  readonly unanswered: number;
}

interface GraphQlResponse {
  readonly data?: {
    readonly repository?: {
      readonly pullRequest?: {
        readonly reviewThreads: {
          readonly nodes: readonly ReviewThreadNode[];
          readonly pageInfo: {
            readonly hasNextPage: boolean;
            readonly endCursor: string | null;
          };
        };
      } | null;
    } | null;
  };
  readonly errors?: readonly { readonly message: string }[];
}

const REVIEW_THREADS_QUERY = `
  query ReviewThreads($owner: String!, $name: String!, $pr: Int!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100, after: $cursor) {
          nodes {
            isOutdated
            path
            line
            originalLine
            comments(first: 100) {
              totalCount
              nodes { author { login } body }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }
`;

/** Reduces GitHub review threads to the reply-based gate contract. */
export function assessReviewThreads(
  repo: string,
  pr: number,
  threads: readonly ReviewThreadNode[],
): ReviewThreadReport {
  const findings = threads.map((thread): ReviewThreadFinding => {
    const initial = thread.comments.nodes[0];
    const initiatingAuthor = initial?.author?.login ?? null;
    const answered = thread.comments.totalCount > 1 && thread.comments.nodes.slice(1).some(
      (comment) => comment.author?.login !== initiatingAuthor,
    );
    const outdated = thread.isOutdated;
    return {
      author: initial?.author?.login ?? 'unknown',
      path: thread.path,
      line: thread.line ?? thread.originalLine ?? 0,
      severity: extractSeverity(initial?.body ?? ''),
      answered,
      outdated,
      blocking: !outdated && !answered,
    };
  });
  const unanswered = findings.filter((thread) => thread.blocking).length;
  return { gate: 'review-threads', ok: unanswered === 0, repo, pr, threads: findings, unanswered };
}

/** Reads every review-thread page through GitHub GraphQL without mutation. */
export async function fetchReviewThreads(
  repo: string,
  pr: number,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ReviewThreadNode[]> {
  const [owner, name] = repo.split('/');
  const threads: ReviewThreadNode[] = [];
  let cursor: string | null = null;
  do {
    const response = await fetchImpl(GITHUB_GRAPHQL_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/vnd.github+json',
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28',
      },
      body: JSON.stringify({ query: REVIEW_THREADS_QUERY, variables: { owner, name, pr, cursor } }),
    });
    const payload = await response.json() as GraphQlResponse;
    if (!response.ok || payload.errors?.length) {
      const detail = payload.errors?.map((error) => error.message).join('; ') ??
        response.statusText;
      throw new Error(`GitHub review-thread query failed: ${response.status} ${detail}`);
    }
    const pullRequest = payload.data?.repository?.pullRequest;
    if (!pullRequest) throw new Error(`Pull request ${repo}#${pr} was not found`);
    const page = pullRequest.reviewThreads;
    threads.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    if (page.pageInfo.hasNextPage && !cursor) {
      throw new Error('GitHub review-thread pagination returned no end cursor');
    }
  } while (cursor);
  return threads;
}

function extractSeverity(body: string): string | null {
  return body.match(/\bseverity\s*[:=-]\s*\**\s*(critical|high|medium|low|info)\b/i)?.[1]
    ?.toLowerCase() ?? null;
}

function parseArgs(args: readonly string[]): Options {
  args = normalizeTaskArguments(args);
  let repo = readEnv('GITHUB_REPOSITORY') ?? '';
  let pr = 0;
  let token: string | undefined;
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
      case '--repo':
        repo = value();
        break;
      case '--pr':
        pr = Number(value());
        break;
      case '--token':
        token = value();
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
  return { repo, pr, token, pretty };
}

function readEnv(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

function printReport(report: ReviewThreadReport, pretty: boolean): void {
  if (!pretty) {
    console.log(JSON.stringify(report));
    return;
  }
  for (const thread of report.threads) {
    const status = thread.answered ? 'answered' : 'unanswered';
    const outdated = thread.outdated ? ' outdated=ignored' : '';
    const severity = thread.severity ? ` severity=${thread.severity}` : '';
    console.log(`${status} ${thread.author} ${thread.path}:${thread.line}${severity}${outdated}`);
  }
  console.log(
    `review-threads ${report.ok ? 'PASS' : 'FAIL'} ${report.repo}#${report.pr} ` +
      `threads=${report.threads.length} unanswered=${report.unanswered}`,
  );
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  const token = options.token ?? readEnv('GITHUB_TOKEN') ?? readEnv('GH_TOKEN') ??
    (await resolveGithubToken()).token;
  const threads = await fetchReviewThreads(options.repo, options.pr, token);
  const report = assessReviewThreads(options.repo, options.pr, threads);
  printReport(report, options.pretty);
  Deno.exit(report.ok ? 0 : 1);
}

if (import.meta.main) await main();
