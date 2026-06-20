/**
 * gh-pr.ts — leaf-PR lifecycle for the supervisor loop (create · verdict · merge).
 *
 * The supervisor repeatedly (1) opens a leaf PR from a slice branch into the
 * umbrella, (2) reads the OpenHands IMPL-EVAL verdict comment, and (3) merges the
 * leaf into the umbrella once the verdict is PASS. Doing that by hand from Windows
 * PowerShell + ad-hoc GitHub REST is fragile and token-expensive, so it lives here
 * as a suite tool — a thin CLI over the pure primitives in `agentic-lib.ts`.
 *
 * Encoded guardrails (the doctrine, in code):
 *   - `merge` gates on an IMPL/PLAN-EVAL `PASS` by default (the generator never
 *     self-certifies; merge only follows a passing separate-session eval). Bypass
 *     deliberately with `--no-eval-gate` for non-eval merges (e.g. umbrella→base).
 *   - `merge`/`create` refuse a `main` base unless `--allow-base-main`: leaves land
 *     on the umbrella, not on the default branch.
 *   - `merge` requires `mergeable_state == clean` unless `--force`, and pins the
 *     merge to the current head sha so a moved tip fails loudly.
 *
 * Token handling (classifier-enforced): the PAT is read from an env var the
 * supervisor sets in-process (`--token-env`, default GH_TOKEN -> GITHUB_TOKEN
 * fallback) and used ONLY as the Authorization header. Never written to a file,
 * passed on argv, or echoed. `--dry-run` needs no token and makes no network call.
 *
 * Usage:
 *   deno run --allow-read --allow-env --allow-net .llm/tools/agentic/gh-pr.ts \
 *     create --head feat/prime-time/auth-s3-kv-oauth --base feat/prime-time/auth \
 *     --title "S3 — …" --body-file <win-path> [--draft] [--allow-base-main]
 *
 *   deno run --allow-read --allow-env --allow-net .llm/tools/agentic/gh-pr.ts \
 *     verdict --pr 93
 *
 *   deno run --allow-read --allow-env --allow-net .llm/tools/agentic/gh-pr.ts \
 *     merge --pr 93 [--method merge|squash|rebase] [--title …] [--message …] \
 *     [--no-eval-gate] [--force] [--allow-base-main]
 *
 * Exit codes: 0 = ok / verdict PASS · 1 = api failure · 2 = usage error ·
 * 4 = missing token (non-dry-run) · 6 = base-main guard · 7 = not mergeable ·
 * 10 = eval FAIL · 11 = eval pending / not-final · 12 = no eval comment yet.
 */

import {
  buildMergeBody,
  buildPullRequestBody,
  type CommentLike,
  type EvalVerdict,
  githubRequest,
  type MergeMethod,
  parseEvalVerdict,
  parseOpenHandsStatusComment,
  parseRepoSlug,
  readTokenFromEnv,
  requireValue,
  selectLatestOpenHandsComment,
} from "./agentic-lib.ts";

type Sub = "create" | "verdict" | "merge";

interface Options {
  sub: Sub;
  repo: string;
  pr?: number;
  head?: string;
  base?: string;
  title?: string;
  body?: string;
  bodyFile?: string;
  draft: boolean;
  method: MergeMethod;
  message?: string;
  evalGate: boolean;
  force: boolean;
  allowBaseMain: boolean;
  tokenEnv: string;
  dryRun: boolean;
  pretty: boolean;
}

function printHelp(): void {
  console.log([
    "Usage:",
    "  gh-pr.ts create --head <branch> --base <branch> --title <t> (--body-file <path> | --body <s>) [--draft] [--allow-base-main]",
    "  gh-pr.ts verdict --pr <n>",
    "  gh-pr.ts merge  --pr <n> [--method merge|squash|rebase] [--title <t>] [--message <m>] [--no-eval-gate] [--force] [--allow-base-main]",
    "",
    "Common options:",
    "  --repo <owner/name>   Default: rickylabs/netscript.",
    "  --token-env <name>    Env var holding the GitHub token. Default: GH_TOKEN.",
    "  --dry-run             Print the intended action without posting (no token needed).",
    "  --pretty              Human-readable output instead of JSON.",
    "  --help                Show this help.",
    "",
    "merge gates on an IMPL/PLAN-EVAL PASS by default; use --no-eval-gate to bypass.",
  ].join("\n"));
}

function parseArgs(args: string[]): Options | null {
  const raw = args[0];
  if (raw === undefined || raw === "--help") {
    printHelp();
    return null;
  }
  if (raw !== "create" && raw !== "verdict" && raw !== "merge") {
    throw new Error(`Unknown subcommand '${raw}'. Expected create | verdict | merge.`);
  }
  const sub: Sub = raw;
  const o: Options = {
    sub,
    repo: "rickylabs/netscript",
    draft: false,
    method: "merge",
    evalGate: true,
    force: false,
    allowBaseMain: false,
    tokenEnv: "GH_TOKEN",
    dryRun: false,
    pretty: false,
  };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case "--repo": o.repo = requireValue(args, i, a); i++; break;
      case "--pr": o.pr = Number(requireValue(args, i, a)); i++; break;
      case "--head": o.head = requireValue(args, i, a); i++; break;
      case "--base": o.base = requireValue(args, i, a); i++; break;
      case "--title": o.title = requireValue(args, i, a); i++; break;
      case "--body": o.body = requireValue(args, i, a); i++; break;
      case "--body-file": o.bodyFile = requireValue(args, i, a); i++; break;
      case "--draft": o.draft = true; break;
      case "--method": o.method = requireValue(args, i, a) as MergeMethod; i++; break;
      case "--message": o.message = requireValue(args, i, a); i++; break;
      case "--no-eval-gate": o.evalGate = false; break;
      case "--force": o.force = true; break;
      case "--allow-base-main": o.allowBaseMain = true; break;
      case "--token-env": o.tokenEnv = requireValue(args, i, a); i++; break;
      case "--dry-run": o.dryRun = true; break;
      case "--pretty": o.pretty = true; break;
      case "--help": printHelp(); return null;
      default: throw new Error(`Unknown argument: ${a}`);
    }
  }
  return o;
}

function emit(pretty: boolean, prettyLines: string[], json: unknown): void {
  console.log(pretty ? prettyLines.join("\n") : JSON.stringify(json));
}

function requireToken(o: Options): string {
  const token = readTokenFromEnv(o.tokenEnv) ?? readTokenFromEnv("GITHUB_TOKEN");
  if (!token) {
    console.error(
      `No token in env ${o.tokenEnv} (or GITHUB_TOKEN). Set it in-process before invoking; never pass it on argv or in a file.`,
    );
    Deno.exit(4);
  }
  return token;
}

async function fetchLatestVerdict(
  owner: string,
  repo: string,
  pr: number,
  token: string,
): Promise<{ comment: CommentLike | null; verdict: EvalVerdict; jobFinal: boolean; runUrl: string | null }> {
  const res = await githubRequest(
    "GET",
    `/repos/${owner}/${repo}/issues/${pr}/comments?per_page=100`,
    token,
  );
  if (!res.ok) {
    console.log(JSON.stringify({ ok: false, status: res.status, error: res.body?.message ?? res.body }));
    Deno.exit(1);
  }
  const comment = selectLatestOpenHandsComment(res.body as CommentLike[]);
  const body = comment?.body ?? "";
  const status = parseOpenHandsStatusComment(body);
  return { comment, verdict: parseEvalVerdict(body), jobFinal: status.isFinal, runUrl: status.runUrl };
}

async function main(): Promise<void> {
  let o: Options | null;
  try {
    o = parseArgs(Deno.args);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(2);
    return;
  }
  if (!o) return;

  let slug;
  try {
    slug = parseRepoSlug(o.repo);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(2);
    return;
  }
  const { owner, repo } = slug;

  // ---- create -------------------------------------------------------------
  if (o.sub === "create") {
    if (!o.head || !o.base || !o.title) {
      console.error("create requires --head, --base, and --title. See --help.");
      Deno.exit(2);
    }
    if (o.base === "main" && !o.allowBaseMain) {
      console.error("refusing base 'main' (leaves land on the umbrella). Pass --allow-base-main to override.");
      Deno.exit(6);
    }
    const body = o.bodyFile ? await Deno.readTextFile(o.bodyFile) : (o.body ?? "");
    const payload = buildPullRequestBody({ title: o.title!, head: o.head!, base: o.base!, body, draft: o.draft });
    if (o.dryRun) {
      emit(o.pretty, [
        "DRY-RUN create",
        `  repo  : ${owner}/${repo}`,
        `  head  : ${o.head} -> base ${o.base}${o.draft ? " (draft)" : ""}`,
        `  title : ${o.title}`,
        `  bytes : ${new TextEncoder().encode(body).length}`,
      ], { mode: "dry-run", sub: "create", ok: true, repo: o.repo, payload: { ...payload, body: `<${body.length} chars>` } });
      Deno.exit(0);
    }
    const token = requireToken(o);
    const res = await githubRequest("POST", `/repos/${owner}/${repo}/pulls`, token, payload);
    if (!res.ok) {
      console.log(JSON.stringify({ ok: false, status: res.status, error: res.body?.message ?? res.body, errors: res.body?.errors }));
      Deno.exit(1);
    }
    emit(o.pretty, [`CREATED PR #${res.body.number} -> ${res.body.html_url}`], {
      ok: true,
      number: res.body.number,
      url: res.body.html_url,
      head: o.head,
      base: o.base,
    });
    Deno.exit(0);
  }

  // ---- verdict / merge both need a PR number ------------------------------
  if (!o.pr || !Number.isFinite(o.pr)) {
    console.error(`${o.sub} requires --pr <n>. See --help.`);
    Deno.exit(2);
  }

  // ---- verdict ------------------------------------------------------------
  if (o.sub === "verdict") {
    const token = requireToken(o);
    const { comment, verdict, jobFinal, runUrl } = await fetchLatestVerdict(owner, repo, o.pr!, token);
    const json = {
      ok: true,
      pr: o.pr,
      hasComment: comment !== null,
      verdict: verdict.verdict,
      kind: verdict.kind,
      isPass: verdict.isPass,
      isFail: verdict.isFail,
      jobFinal,
      runUrl,
    };
    const lines = [
      `PR #${o.pr}: ${comment ? (verdict.verdict ?? "(no verdict token)") : "no OpenHands comment yet"}`,
      ...(runUrl ? [`  run: ${runUrl}`] : []),
    ];
    emit(o.pretty, lines, json);
    if (!comment) Deno.exit(12);
    if (verdict.isPass) Deno.exit(0);
    if (verdict.isFail) Deno.exit(10);
    Deno.exit(11); // comment exists but no final PASS/FAIL (e.g. still running)
  }

  // ---- merge --------------------------------------------------------------
  const token = requireToken(o);
  const prRes = await githubRequest("GET", `/repos/${owner}/${repo}/pulls/${o.pr}`, token);
  if (!prRes.ok) {
    console.log(JSON.stringify({ ok: false, status: prRes.status, error: prRes.body?.message ?? prRes.body }));
    Deno.exit(1);
  }
  const baseRef: string = prRes.body.base?.ref ?? "";
  const headSha: string = prRes.body.head?.sha ?? "";
  const mergeableState: string = prRes.body.mergeable_state ?? "unknown";

  if (baseRef === "main" && !o.allowBaseMain) {
    console.error(`PR #${o.pr} targets 'main'; refusing (leaves land on the umbrella). Pass --allow-base-main to override.`);
    Deno.exit(6);
  }

  if (o.evalGate) {
    const { comment, verdict, jobFinal } = await fetchLatestVerdict(owner, repo, o.pr!, token);
    if (!comment) {
      emit(o.pretty, [`BLOCKED PR #${o.pr}: no OpenHands eval comment yet (use --no-eval-gate to bypass).`], {
        ok: false, blocked: "no-eval-comment", pr: o.pr,
      });
      Deno.exit(12);
    }
    if (!verdict.isPass) {
      emit(o.pretty, [
        `BLOCKED PR #${o.pr}: eval verdict is ${verdict.verdict ?? "(none/non-final)"}${jobFinal ? "" : " (run not final)"} — not PASS.`,
        "  use --no-eval-gate to bypass deliberately.",
      ], { ok: false, blocked: "eval-not-pass", pr: o.pr, verdict: verdict.verdict, jobFinal });
      Deno.exit(verdict.isFail ? 10 : 11);
    }
  }

  if (mergeableState !== "clean" && !o.force) {
    emit(o.pretty, [
      `NOT MERGEABLE PR #${o.pr}: mergeable_state='${mergeableState}' (expected 'clean'). Use --force to override.`,
    ], { ok: false, blocked: "not-clean", pr: o.pr, mergeableState });
    Deno.exit(7);
  }

  const mergeBody = buildMergeBody({ method: o.method, title: o.title, message: o.message, sha: headSha || undefined });
  if (o.dryRun) {
    emit(o.pretty, [
      "DRY-RUN merge",
      `  pr     : #${o.pr} (${baseRef})`,
      `  method : ${o.method}`,
      `  state  : ${mergeableState}`,
      `  sha    : ${headSha}`,
      `  gate   : ${o.evalGate ? "eval-PASS required" : "bypassed (--no-eval-gate)"}`,
    ], { mode: "dry-run", sub: "merge", ok: true, pr: o.pr, baseRef, mergeableState, body: mergeBody });
    Deno.exit(0);
  }

  const res = await githubRequest("PUT", `/repos/${owner}/${repo}/pulls/${o.pr}/merge`, token, mergeBody);
  if (!res.ok) {
    console.log(JSON.stringify({ ok: false, status: res.status, error: res.body?.message ?? res.body }));
    Deno.exit(1);
  }
  emit(o.pretty, [`MERGED PR #${o.pr} -> ${res.body.sha}  (${baseRef})`], {
    ok: true,
    pr: o.pr,
    merged: res.body.merged,
    sha: res.body.sha,
    baseRef,
  });
  Deno.exit(0);
}

if (import.meta.main) await main();
