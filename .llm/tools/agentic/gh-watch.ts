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
  githubRequest,
  parseEvalVerdict,
  parseOpenHandsStatusComment,
  parseRepoSlug,
  readTokenFromEnv,
  requireValue,
  selectLatestOpenHandsComment,
} from "./agentic-lib.ts";

interface WatchOptions {
  repo: string;
  pr?: number;
  tokenEnv: string;
  intervalSeconds: number;
  timeoutSeconds: number;
  pretty: boolean;
}

function printHelp(): void {
  console.log([
    "Usage:",
    "  gh-watch.ts --pr <n> [--repo owner/name] [--interval-seconds n] [--timeout-seconds n] [--pretty]",
    "",
    "Blocks until the PR's IMPL/PLAN-EVAL verdict is terminal, then exits so a",
    "background launch re-wakes the supervisor. Exit: 0 PASS · 10 FAIL · 12 final-no-verdict",
    "· 2 timeout/usage · 4 no-token · 1 api-failure.",
  ].join("\n"));
}

function parseArgs(args: string[]): WatchOptions | null {
  if (args[0] === "--help" || args.length === 0) {
    printHelp();
    return null;
  }
  const o: WatchOptions = {
    repo: "rickylabs/netscript",
    tokenEnv: "GH_TOKEN",
    intervalSeconds: 60,
    timeoutSeconds: 3600,
    pretty: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case "--repo": o.repo = requireValue(args, i, a); i++; break;
      case "--pr": o.pr = Number(requireValue(args, i, a)); i++; break;
      case "--token-env": o.tokenEnv = requireValue(args, i, a); i++; break;
      case "--interval-seconds": o.intervalSeconds = Number(requireValue(args, i, a)); i++; break;
      case "--timeout-seconds": o.timeoutSeconds = Number(requireValue(args, i, a)); i++; break;
      case "--pretty": o.pretty = true; break;
      case "--help": printHelp(); return null;
      default: throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (o.pr === undefined || Number.isNaN(o.pr)) {
    throw new Error("--pr <n> is required.");
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

  const token = readTokenFromEnv(o.tokenEnv) ?? readTokenFromEnv("GITHUB_TOKEN");
  if (!token) {
    console.error(
      `No token in env ${o.tokenEnv} (or GITHUB_TOKEN). Set it in-process before invoking; never pass it on argv or in a file.`,
    );
    Deno.exit(4);
  }

  const { owner, repo: name } = parseRepoSlug(o.repo);
  const startMs = Date.now();
  const deadlineMs = startMs + o.timeoutSeconds * 1000;
  let poll = 0;

  while (true) {
    poll++;
    const elapsed = Math.round((Date.now() - startMs) / 1000);
    const res = await githubRequest(
      "GET",
      `/repos/${owner}/${name}/issues/${o.pr}/comments?per_page=100`,
      token,
    );
    if (!res.ok) {
      line(o, { ok: false, poll, elapsed, status: res.status, error: "github-api" }, `poll ${poll} (t+${elapsed}s): GitHub API ${res.status} — retrying`);
      // Transient API hiccup: keep waiting unless we're out of time.
      if (Date.now() >= deadlineMs) {
        line(o, { ok: false, terminal: "api-failure", pr: o.pr }, `TIMEOUT after API failures (PR #${o.pr})`);
        Deno.exit(1);
      }
      await sleep(o.intervalSeconds * 1000);
      continue;
    }

    const comments = Array.isArray(res.body) ? res.body : [];
    const comment = selectLatestOpenHandsComment(comments);
    const body = comment?.body ?? "";
    const verdict = parseEvalVerdict(body);
    const status = comment ? parseOpenHandsStatusComment(body) : null;

    if (verdict.isPass) {
      line(o, { ok: true, terminal: "PASS", pr: o.pr, verdict: verdict.verdict, kind: verdict.kind, runUrl: status?.runUrl ?? null, poll, elapsed }, `TERMINAL PR #${o.pr}: ${verdict.verdict} (PASS) after ${elapsed}s`);
      Deno.exit(0);
    }
    if (verdict.isFail) {
      line(o, { ok: false, terminal: "FAIL", pr: o.pr, verdict: verdict.verdict, kind: verdict.kind, runUrl: status?.runUrl ?? null, poll, elapsed }, `TERMINAL PR #${o.pr}: ${verdict.verdict} (FAIL) after ${elapsed}s`);
      Deno.exit(10);
    }
    if (status?.isFinal) {
      // Job finished (success or failure heading) but no parseable verdict —
      // don't wait forever; surface for inspection.
      line(o, { ok: false, terminal: "final-no-verdict", pr: o.pr, heading: status.heading, jobStatus: status.jobStatus, runUrl: status.runUrl, poll, elapsed }, `TERMINAL PR #${o.pr}: job final '${status.heading}' but no verdict token — inspect (after ${elapsed}s)`);
      Deno.exit(12);
    }

    const state = comment ? (status?.heading ?? "running") : "no-openhands-comment-yet";
    line(o, { ok: true, terminal: null, pr: o.pr, state, poll, elapsed }, `poll ${poll} (t+${elapsed}s): PR #${o.pr} pending — ${state}`);

    if (Date.now() + o.intervalSeconds * 1000 > deadlineMs) {
      line(o, { ok: false, terminal: "timeout", pr: o.pr, state, elapsed }, `TIMEOUT PR #${o.pr}: no terminal verdict within ${o.timeoutSeconds}s (last state: ${state})`);
      Deno.exit(2);
    }
    await sleep(o.intervalSeconds * 1000);
  }
}

if (import.meta.main) {
  await main();
}
