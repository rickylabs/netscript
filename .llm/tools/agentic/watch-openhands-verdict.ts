/**
 * watch-openhands-verdict.ts — poll a PR for an OpenHands eval verdict, layered.
 *
 * OpenHands evaluators are supposed to post the formal
 * `**[PHASE: IMPL-EVAL] [VERDICT: X]**` comment, but real runs frequently
 * exhaust their iteration budget and the runner posts a *synthesized*
 * `<!-- openhands-agent-summary -->` comment carrying the verdict in ad-hoc
 * forms (`**Verdict: PASS.**`, `## Verdict\n**PASS**`, or buried in a context
 * dump). This watcher extracts the verdict through layered matching
 * (`extractVerdict` in agentic-lib.ts), in priority order:
 *   1. the machine-readable `OPENHANDS_VERDICT: <token>` contract line (exact);
 *   2. the formal `**[PHASE: …-EVAL] [VERDICT: X]**` header (exact);
 *   3. heuristics on synthesized summary comments (confidence: heuristic).
 * Trigger/prompt comments (the `@openhands-agent` dispatch, which quotes the
 * `[VERDICT: <verdict>]` template) are never matched.
 *
 * Token handling (classifier-enforced): the PAT is read from an env var the
 * supervisor sets in-process (`--token-env`, default GH_TOKEN -> GITHUB_TOKEN
 * fallback) and used ONLY as the Authorization header; never logged.
 *
 * Usage:
 *   deno run --allow-env --allow-net .llm/tools/agentic/watch-openhands-verdict.ts \
 *     --repo rickylabs/netscript --pr 86 [--since 2026-07-05T10:00:00Z] \
 *     [--timeout-seconds 1800] [--interval-seconds 30] [--token-env GH_TOKEN] [--pretty]
 *
 * Prints one JSON line {ok, verdict, confidence, commentUrl, elapsedSeconds}.
 * Exit codes: 0 = verdict found · 2 = timeout heartbeat (re-armable) ·
 * 1 = bad args / auth / persistent API failure.
 */

import {
  extractVerdict,
  githubRequest,
  parseRepoSlug,
  readTokenFromEnv,
  type RepoSlug,
  requireValue,
  type VerdictSourceComment,
} from './agentic-lib.ts';

interface Options {
  repo: string;
  pr?: number;
  since?: string;
  timeoutSeconds: number;
  intervalSeconds: number;
  tokenEnv: string;
  pretty: boolean;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-env --allow-net .llm/tools/agentic/watch-openhands-verdict.ts \\',
    '    --repo owner/name --pr N [options]',
    '',
    'Options:',
    '  --repo <owner/name>      Target repo. Default: rickylabs/netscript.',
    '  --pr <n>                 Target PR number. Required.',
    '  --since <iso>            Only consider comments created after this ISO timestamp.',
    '                           Default: all comments (a pre-existing verdict returns immediately).',
    '  --timeout-seconds <n>    Give up (exit 2, re-armable heartbeat) after n seconds. Default: 1800.',
    '  --interval-seconds <n>   Poll interval. Default: 30.',
    '  --token-env <name>       Env var with the GitHub token. Default: GH_TOKEN.',
    '  --pretty                 Human-readable output instead of one JSON line.',
    '  --help                   Show this help.',
    '',
    'Exit codes: 0 = verdict found · 2 = timeout heartbeat · 1 = bad args/auth.',
  ].join('\n'));
}

function parseArgs(args: string[]): Options | null {
  const o: Options = {
    repo: 'rickylabs/netscript',
    timeoutSeconds: 1800,
    intervalSeconds: 30,
    tokenEnv: 'GH_TOKEN',
    pretty: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--repo':
        o.repo = requireValue(args, i, a);
        i++;
        break;
      case '--pr':
        o.pr = Number(requireValue(args, i, a));
        i++;
        break;
      case '--since':
        o.since = requireValue(args, i, a);
        i++;
        break;
      case '--timeout-seconds':
        o.timeoutSeconds = Number(requireValue(args, i, a));
        i++;
        break;
      case '--interval-seconds':
        o.intervalSeconds = Number(requireValue(args, i, a));
        i++;
        break;
      case '--token-env':
        o.tokenEnv = requireValue(args, i, a);
        i++;
        break;
      case '--pretty':
        o.pretty = true;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return o;
}

/** Narrow one GitHub issue-comment payload item to the fields extraction needs. */
function toVerdictComment(v: unknown): VerdictSourceComment | null {
  if (typeof v !== 'object' || v === null) return null;
  const body = 'body' in v && typeof v.body === 'string' ? v.body : '';
  const url = 'html_url' in v && typeof v.html_url === 'string' ? v.html_url : '';
  const createdAt = 'created_at' in v && typeof v.created_at === 'string' ? v.created_at : '';
  if (!body || !createdAt) return null;
  return { body, url, createdAt };
}

/** Fetch all issue comments for the PR (paged; GitHub `since` filters on update time). */
async function fetchComments(
  slug: RepoSlug,
  pr: number,
  token: string,
  since: string | undefined,
): Promise<VerdictSourceComment[]> {
  const out: VerdictSourceComment[] = [];
  for (let page = 1; page <= 10; page++) {
    const query = `per_page=100&page=${page}` +
      (since ? `&since=${encodeURIComponent(since)}` : '');
    const res = await githubRequest(
      'GET',
      `/repos/${slug.owner}/${slug.repo}/issues/${pr}/comments?${query}`,
      token,
    );
    if (!res.ok) {
      throw new GithubApiError(res.status, String(res.body?.message ?? res.body ?? 'unknown'));
    }
    const items: unknown[] = Array.isArray(res.body) ? res.body : [];
    for (const item of items) {
      const c = toVerdictComment(item);
      if (c) out.push(c);
    }
    if (items.length < 100) break;
  }
  return out;
}

class GithubApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(`GitHub API ${status}: ${message}`);
  }
}

async function main(): Promise<void> {
  let o: Options | null;
  try {
    o = parseArgs(Deno.args);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(1);
    return;
  }
  if (!o) return;

  if (!o.pr || !Number.isFinite(o.pr)) {
    console.error('--pr (a number) is required. See --help.');
    Deno.exit(1);
  }
  if (!Number.isFinite(o.timeoutSeconds) || o.timeoutSeconds <= 0) {
    console.error('--timeout-seconds must be a positive number.');
    Deno.exit(1);
  }
  if (!Number.isFinite(o.intervalSeconds) || o.intervalSeconds <= 0) {
    console.error('--interval-seconds must be a positive number.');
    Deno.exit(1);
  }
  if (o.since !== undefined && Number.isNaN(Date.parse(o.since))) {
    console.error(`--since must be an ISO timestamp, got '${o.since}'.`);
    Deno.exit(1);
  }
  let slug: RepoSlug;
  try {
    slug = parseRepoSlug(o.repo);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(1);
    return;
  }
  const token = readTokenFromEnv(o.tokenEnv) ?? readTokenFromEnv('GITHUB_TOKEN');
  if (!token) {
    console.error(`No token in env ${o.tokenEnv} (or GITHUB_TOKEN).`);
    Deno.exit(1);
    return;
  }

  const sinceMs = o.since ? Date.parse(o.since) : null;
  const start = Date.now();
  while (true) {
    let comments: VerdictSourceComment[] = [];
    try {
      comments = await fetchComments(slug, o.pr, token, o.since);
    } catch (e) {
      if (e instanceof GithubApiError && (e.status === 401 || e.status === 403)) {
        console.error(e.message);
        Deno.exit(1);
      }
      // Transient API failure: log and keep polling until the timeout.
      console.error(`[watch-openhands-verdict] poll failed: ${(e as Error).message}`);
    }
    const eligible = sinceMs === null
      ? comments
      : comments.filter((c) => Date.parse(c.createdAt) > sinceMs);
    const found = extractVerdict(eligible);
    const elapsedSeconds = Math.round((Date.now() - start) / 1000);
    if (found) {
      if (o.pretty) {
        console.log(`verdict    : ${found.verdict} (confidence=${found.confidence})`);
        console.log(`comment    : ${found.url || '?'}`);
        console.log(`elapsed(s) : ${elapsedSeconds}`);
      } else {
        console.log(JSON.stringify({
          ok: true,
          verdict: found.verdict,
          confidence: found.confidence,
          commentUrl: found.url || null,
          elapsedSeconds,
        }));
      }
      Deno.exit(0);
    }
    if ((Date.now() - start) / 1000 + o.intervalSeconds > o.timeoutSeconds) {
      console.log(
        o.pretty
          ? `TIMEOUT after ${elapsedSeconds}s — no verdict yet (re-arm to keep waiting)`
          : JSON.stringify({
            ok: false,
            verdict: null,
            confidence: null,
            commentUrl: null,
            elapsedSeconds,
            timedOut: true,
          }),
      );
      Deno.exit(2);
    }
    await new Promise((r) => setTimeout(r, o.intervalSeconds * 1000));
  }
}

if (import.meta.main) await main();
