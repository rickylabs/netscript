#!/usr/bin/env -S deno run --allow-net --allow-env
/**
 * gh-watch.ts — block until a leaf PR's IMPL/PLAN-EVAL verdict is terminal.
 *
 * The supervisor loop dispatches an OpenHands evaluator to a PR, then must wait
 * for the verdict without a human re-waking it. This watcher polls the PR's
 * OpenHands summary comment until it carries a terminal verdict (PASS/FAIL) or
 * the evaluator job finishes (final heading) without one. Run it as a background
 * process: it exits when the state is terminal, which re-wakes the supervisor
 * turn — no polling loop kept in the agent's context, no manual wake-up.
 *
 *   deno run --allow-net --allow-env gh-watch.ts --pr <n> [options]
 *
 * Options:
 *   --pr <n>                 PR (issue) number to watch. Required.
 *   --repo <owner/name>      Default: rickylabs/netscript.
 *   --token-env <name>       Env var holding the GitHub token. Default: GH_TOKEN.
 *   --interval-seconds <n>   Poll cadence (min 15). Default: 60.
 *   --timeout-seconds <n>    Give up after this long (min 60). Default: 3600.
 *   --pretty                 Human-readable lines instead of JSON per poll.
 *   --help
 *
 * Exit codes (aligned with gh-pr.ts verdict, plus terminal-no-verdict + timeout):
 *   0  = verdict PASS (terminal)            10 = verdict FAIL_* (terminal)
 *   12 = job final but no parseable verdict 2  = timeout / usage error
 *   4  = no token                           1  = GitHub API failure
 *
 * The token is read from env only (never argv/disk) and used solely as the
 * Authorization header.
 */

import {
  type CommentLike,
  githubField,
  githubRequest,
  parseEvalVerdict,
  parseOpenHandsStatusComment,
  parseRepoSlug,
  requireValue,
  resolveGithubToken,
  selectLatestOpenHandsComment,
} from '../lib/agentic-lib.ts';

interface WatchOptions {
  repo: string;
  pr?: number;
  runId?: number;
  tokenEnv: string;
  intervalSeconds: number;
  timeoutSeconds: number;
  pretty: boolean;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  gh-watch.ts --pr <n> [--repo owner/name] [--run-id <id>] [--interval-seconds n] [--timeout-seconds n] [--pretty]',
    '',
    "Blocks until the PR's IMPL/PLAN-EVAL verdict is terminal, then exits so a",
    'background launch re-wakes the supervisor. With --run-id, also watches the',
    'triggered GitHub Actions run and exits early if it fails (no verdict can come).',
    'Exit: 0 PASS · 10 FAIL · 12 final-no-verdict · 13 action-run-failed',
    '· 2 timeout/usage · 4 no-token · 1 api-failure.',
  ].join('\n'));
}

function parseArgs(args: string[]): WatchOptions | null {
  if (args[0] === '--help' || args.length === 0) {
    printHelp();
    return null;
  }
  const o: WatchOptions = {
    repo: 'rickylabs/netscript',
    tokenEnv: 'GH_TOKEN',
    intervalSeconds: 60,
    timeoutSeconds: 3600,
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
      case '--run-id':
        o.runId = Number(requireValue(args, i, a));
        i++;
        break;
      case '--token-env':
        o.tokenEnv = requireValue(args, i, a);
        i++;
        break;
      case '--interval-seconds':
        o.intervalSeconds = Number(requireValue(args, i, a));
        i++;
        break;
      case '--timeout-seconds':
        o.timeoutSeconds = Number(requireValue(args, i, a));
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
  if (o.pr === undefined || Number.isNaN(o.pr)) {
    throw new Error('--pr <n> is required.');
  }
  // Clamp to sane floors so a typo can't hammer the API or exit instantly.
  o.intervalSeconds = Math.max(15, o.intervalSeconds || 60);
  o.timeoutSeconds = Math.max(60, o.timeoutSeconds || 3600);
  return o;
}

function line(o: WatchOptions, json: Record<string, unknown>, human: string): void {
  console.log(o.pretty ? human : JSON.stringify(json));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  let o: WatchOptions | null;
  try {
    o = parseArgs(Deno.args);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(2);
  }
  if (!o) return; // help printed

  let token: string;
  try {
    const resolved = await resolveGithubToken({ preferEnv: o.tokenEnv });
    console.error(`[gh-watch] token source: ${resolved.source}`);
    token = resolved.token;
  } catch (e) {
    console.error((e as Error).message);
    Deno.exit(4);
    return;
  }

  const { owner, repo: name } = parseRepoSlug(o.repo);
  const startMs = Date.now();
  const deadlineMs = startMs + o.timeoutSeconds * 1000;
  let poll = 0;

  while (true) {
    poll++;
    const elapsed = Math.round((Date.now() - startMs) / 1000);
    const res = await githubRequest(
      'GET',
      `/repos/${owner}/${name}/issues/${o.pr}/comments?per_page=100`,
      token,
    );
    if (!res.ok) {
      line(
        o,
        { ok: false, poll, elapsed, status: res.status, error: 'github-api' },
        `poll ${poll} (t+${elapsed}s): GitHub API ${res.status} — retrying`,
      );
      // Transient API hiccup: keep waiting unless we're out of time.
      if (Date.now() >= deadlineMs) {
        line(
          o,
          { ok: false, terminal: 'api-failure', pr: o.pr },
          `TIMEOUT after API failures (PR #${o.pr})`,
        );
        Deno.exit(1);
      }
      await sleep(o.intervalSeconds * 1000);
      continue;
    }

    // Watch the triggered Actions run directly: if it fails/cancels, no verdict
    // comment can ever come, so surface it immediately instead of timing out.
    if (o.runId) {
      const runRes = await githubRequest(
        'GET',
        `/repos/${owner}/${name}/actions/runs/${o.runId}`,
        token,
      );
      if (runRes.ok && runRes.body) {
        const statusField = githubField(runRes.body, 'status');
        const conclusionField = githubField(runRes.body, 'conclusion');
        const htmlField = githubField(runRes.body, 'html_url');
        const runStatus = typeof statusField === 'string' ? statusField : undefined;
        const conclusion = typeof conclusionField === 'string' ? conclusionField : null;
        const runHtml = typeof htmlField === 'string' ? htmlField : undefined;
        if (runStatus === 'completed' && conclusion && conclusion !== 'success') {
          line(
            o,
            {
              ok: false,
              terminal: 'action-run-failed',
              pr: o.pr,
              runId: o.runId,
              conclusion,
              runUrl: runHtml ?? null,
              poll,
              elapsed,
            },
            `TERMINAL PR #${o.pr}: Actions run ${o.runId} ${conclusion} — no verdict will come (after ${elapsed}s)`,
          );
          Deno.exit(13);
        }
      }
    }

    const comments: CommentLike[] = Array.isArray(res.body)
      ? res.body.flatMap((value) => {
        const body = githubField(value, 'body');
        const createdAt = githubField(value, 'created_at');
        return typeof body === 'string'
          ? [{ body, ...(typeof createdAt === 'string' ? { created_at: createdAt } : {}) }]
          : [];
      })
      : [];
    const comment = selectLatestOpenHandsComment(comments);
    const body = comment?.body ?? '';
    const verdict = parseEvalVerdict(body);
    const status = comment ? parseOpenHandsStatusComment(body) : null;

    // A verdict is only TERMINAL once the OpenHands job itself is final. The
    // "Running" acknowledge comment can transiently echo the dispatch prompt
    // (which quotes the canonical `Verdict: IMPL-EVAL: PASS` forms as examples),
    // so honoring `verdict.isPass` before `status.isFinal` would false-greenlight
    // an un-evaluated PR. Gate on isFinal first; keep polling while running.
    if (status?.isFinal) {
      if (verdict.isPass) {
        line(o, {
          ok: true,
          terminal: 'PASS',
          pr: o.pr,
          verdict: verdict.verdict,
          kind: verdict.kind,
          runUrl: status?.runUrl ?? null,
          poll,
          elapsed,
        }, `TERMINAL PR #${o.pr}: ${verdict.verdict} (PASS) after ${elapsed}s`);
        Deno.exit(0);
      }
      if (verdict.isFail) {
        line(o, {
          ok: false,
          terminal: 'FAIL',
          pr: o.pr,
          verdict: verdict.verdict,
          kind: verdict.kind,
          runUrl: status?.runUrl ?? null,
          poll,
          elapsed,
        }, `TERMINAL PR #${o.pr}: ${verdict.verdict} (FAIL) after ${elapsed}s`);
        Deno.exit(10);
      }
      // Job finished (success or failure heading) but no parseable verdict —
      // don't wait forever; surface for inspection.
      line(
        o,
        {
          ok: false,
          terminal: 'final-no-verdict',
          pr: o.pr,
          heading: status.heading,
          jobStatus: status.jobStatus,
          runUrl: status.runUrl,
          poll,
          elapsed,
        },
        `TERMINAL PR #${o.pr}: job final '${status.heading}' but no verdict token — inspect (after ${elapsed}s)`,
      );
      Deno.exit(12);
    }

    const state = comment ? (status?.heading ?? 'running') : 'no-openhands-comment-yet';
    line(
      o,
      { ok: true, terminal: null, pr: o.pr, state, poll, elapsed },
      `poll ${poll} (t+${elapsed}s): PR #${o.pr} pending — ${state}`,
    );

    if (Date.now() + o.intervalSeconds * 1000 > deadlineMs) {
      line(
        o,
        { ok: false, terminal: 'timeout', pr: o.pr, state, elapsed },
        `TIMEOUT PR #${o.pr}: no terminal verdict within ${o.timeoutSeconds}s (last state: ${state})`,
      );
      Deno.exit(2);
    }
    await sleep(o.intervalSeconds * 1000);
  }
}

if (import.meta.main) {
  await main();
}
