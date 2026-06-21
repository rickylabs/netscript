/**
 * agentic-lib_test.ts — unit tests for the pure primitives of the agentic suite.
 *
 * Zero external deps: a tiny local `assert`/`assertEquals` (the repo's other tool
 * tests, e.g. fitness/check-ds-gates_test.ts, also avoid `@std/assert` because the
 * root import map is empty). Covers path mapping, bash quoting, handoff-contract
 * validation, Codex thread-log parsing against the REAL launch fixture, push-safety
 * evaluation, repo-slug parsing, OpenHands comment building, and status parsing
 * against a real-shaped status comment fixture.
 *
 * Run: deno test --allow-read .llm/tools/agentic/agentic-lib_test.ts
 */

import {
  buildMergeBody,
  buildOpenHandsComment,
  buildPullRequestBody,
  evaluateGitSafety,
  type GitInfo,
  parseEvalVerdict,
  parseOpenHandsStatusComment,
  parseRepoSlug,
  parseThreadInfo,
  selectLatestOpenHandsComment,
  sq,
  validateHandoffContract,
  winToWsl,
} from "./agentic-lib.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}
function assertEquals<T>(actual: T, expected: T, msg = ""): void {
  if (actual !== expected) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)} ${msg}`);
  }
}

const here = new URL(".", import.meta.url).pathname;
// On Windows the pathname is like /C:/...; strip the leading slash for Deno.readTextFile.
const fixtureDir = `${here.replace(/^\/([A-Za-z]:)/, "$1")}__fixtures__`;

// --- winToWsl -------------------------------------------------------------
Deno.test("winToWsl maps a Windows path to /mnt", () => {
  assertEquals(winToWsl("C:\\Dev\\repos\\x\\y.md"), "/mnt/c/Dev/repos/x/y.md");
  assertEquals(winToWsl("D:/a/b"), "/mnt/d/a/b");
});
Deno.test("winToWsl passes through a POSIX path", () => {
  assertEquals(winToWsl("/home/codex/repos/wt"), "/home/codex/repos/wt");
});

// --- sq (bash single-quoting) --------------------------------------------
Deno.test("sq wraps plain strings", () => {
  assertEquals(sq("/home/codex/x"), "'/home/codex/x'");
});
Deno.test("sq escapes embedded single quotes", () => {
  assertEquals(sq("it's"), "'it'\\''s'");
});

// --- validateHandoffContract ---------------------------------------------
Deno.test("validateHandoffContract passes a compliant brief", () => {
  const brief = "use harness\n\n## SKILL\n- netscript-harness\n\nbody";
  const c = validateHandoffContract(brief);
  assert(c.ok, "should be ok");
  assert(c.useHarness && c.skillChapter, "both flags true");
  assertEquals(c.problems.length, 0);
});
Deno.test("validateHandoffContract fails without use harness", () => {
  const c = validateHandoffContract("## SKILL\n- x\n\nbody");
  assert(!c.ok, "not ok");
  assert(!c.useHarness && c.skillChapter, "missing use harness only");
});
Deno.test("validateHandoffContract fails without SKILL chapter", () => {
  const c = validateHandoffContract("use harness\n\nbody");
  assert(!c.ok, "not ok");
  assert(c.useHarness && !c.skillChapter, "missing skill only");
});
Deno.test("validateHandoffContract tolerates CRLF briefs", () => {
  const c = validateHandoffContract("use harness\r\n\r\n## SKILL\r\n- x\r\n");
  assert(c.ok, "CRLF brief should still validate");
});

// --- parseThreadInfo against the REAL launch fixture ----------------------
Deno.test("parseThreadInfo extracts the thread id from the real fixture", async () => {
  const log = await Deno.readTextFile(`${fixtureDir}/codex-launch-s1.head.log`);
  const info = parseThreadInfo(log);
  assertEquals(info.threadId, "019ee68a-9a41-7f01-b7d5-072fbd469b09");
  assert(
    info.rollout?.endsWith("rollout-2026-06-20T21-38-23-019ee68a-9a41-7f01-b7d5-072fbd469b09.jsonl") ?? false,
    `rollout path should match, got ${info.rollout}`,
  );
  assertEquals(info.cwd, "/home/codex/repos/netscript-pt-auth-s1-contract");
});
Deno.test("parseThreadInfo returns nulls for a log with no thread", () => {
  const info = parseThreadInfo("nothing useful here");
  assertEquals(info.threadId, null);
  assertEquals(info.rollout, null);
});

// --- evaluateGitSafety ----------------------------------------------------
const cleanInfo: GitInfo = { found: true, branch: "feat/x", head: "abc1234", upstream: "NONE", dirty: 0 };
Deno.test("evaluateGitSafety passes a clean no-upstream worktree", () => {
  const v = evaluateGitSafety(cleanInfo, { branch: "feat/x" });
  assert(v.ok, "should pass");
  assertEquals(v.code, 0);
});
Deno.test("evaluateGitSafety flags an inherited upstream (push hazard)", () => {
  const v = evaluateGitSafety({ ...cleanInfo, upstream: "origin/feat/prime-time/auth" }, {});
  assert(!v.ok, "should fail");
  assertEquals(v.code, 4);
  assert(v.problems.some((p) => p.includes("upstream")), "names the upstream problem");
});
Deno.test("evaluateGitSafety flags a wrong branch and wrong base", () => {
  const v = evaluateGitSafety(cleanInfo, { branch: "feat/other", expectBase: "deadbee" });
  assert(!v.ok, "should fail");
  assertEquals(v.problems.length, 2);
});
Deno.test("evaluateGitSafety returns code 5 for a missing worktree", () => {
  const v = evaluateGitSafety({ found: false, branch: "", head: "", upstream: "", dirty: 0 }, {});
  assertEquals(v.code, 5);
});

// --- parseRepoSlug --------------------------------------------------------
Deno.test("parseRepoSlug splits owner/name", () => {
  const s = parseRepoSlug("rickylabs/netscript");
  assertEquals(s.owner, "rickylabs");
  assertEquals(s.repo, "netscript");
});
Deno.test("parseRepoSlug rejects malformed slugs", () => {
  let threw = false;
  try {
    parseRepoSlug("not-a-slug");
  } catch {
    threw = true;
  }
  assert(threw, "should throw on malformed slug");
});

// --- buildOpenHandsComment ------------------------------------------------
Deno.test("buildOpenHandsComment emits the trigger line and body", () => {
  const body = buildOpenHandsComment({
    model: "openrouter/qwen/qwen3.7-max",
    outputMode: "pr-comment",
    iterations: 800,
    provider: "openrouter",
    prompt: "use harness\n\n## SKILL\n- x",
  });
  const first = body.split("\n")[0];
  assert(first.startsWith("@openhands-agent"), "mentions @openhands-agent");
  assert(first.includes("model=openrouter/qwen/qwen3.7-max"), "carries model");
  assert(first.includes("output=pr-comment"), "carries output");
  assert(first.includes("iterations=800"), "carries iterations");
  assert(first.includes("provider=openrouter"), "carries provider");
  assert(body.includes("use harness"), "includes the prompt body");
});
Deno.test("buildOpenHandsComment omits unset tokens and strips CRLF", () => {
  const body = buildOpenHandsComment({ model: "x/y", prompt: "use harness\r\n## SKILL\r\n" });
  const first = body.split("\n")[0];
  assert(!first.includes("iterations="), "no iterations token when unset");
  assert(!first.includes("output="), "no output token when unset");
  assert(!body.includes("\r"), "CRLF stripped from body");
});

// --- parseOpenHandsStatusComment against the real-shaped fixture ----------
Deno.test("parseOpenHandsStatusComment parses a completed status", async () => {
  const body = await Deno.readTextFile(`${fixtureDir}/openhands-status.completed.md`);
  const s = parseOpenHandsStatusComment(body);
  assertEquals(s.heading, "Completed");
  assertEquals(s.verdict, "completed");
  assertEquals(s.model, "openrouter/qwen/qwen3.7-max");
  assertEquals(s.provider, "OPENROUTER");
  assertEquals(s.jobStatus, "success");
  assert(s.isFinal, "completed is final");
  assert(s.runUrl?.includes("actions/runs/27412819714") ?? false, "captures run url");
});
Deno.test("parseOpenHandsStatusComment treats Running as non-final", () => {
  const s = parseOpenHandsStatusComment("<!-- openhands-agent-summary -->\n## OpenHands Agent — Running\n\nModel: `x/y`\n");
  assertEquals(s.heading, "Running");
  assertEquals(s.verdict, "running");
  assert(!s.isFinal, "running is not final");
});
Deno.test("parseOpenHandsStatusComment maps failure headings", () => {
  assertEquals(
    parseOpenHandsStatusComment("## OpenHands Agent — Agent failed\n").verdict,
    "agent-failed",
  );
  assertEquals(
    parseOpenHandsStatusComment("## OpenHands Agent — Bootstrap failed\n").verdict,
    "bootstrap-failed",
  );
});

// --- buildPullRequestBody / buildMergeBody --------------------------------
Deno.test("buildPullRequestBody carries the core fields and omits draft when unset", () => {
  const b = buildPullRequestBody({ title: "S3", head: "feat/x", base: "feat/umbrella", body: "why" });
  assertEquals(b.title, "S3");
  assertEquals(b.head, "feat/x");
  assertEquals(b.base, "feat/umbrella");
  assertEquals(b.body, "why");
  assert(!("draft" in b), "no draft key when unset");
});
Deno.test("buildPullRequestBody sets draft when requested", () => {
  assertEquals(buildPullRequestBody({ title: "t", head: "h", base: "b", body: "", draft: true }).draft, true);
});
Deno.test("buildMergeBody passes method and pins the head sha", () => {
  const b = buildMergeBody({ method: "merge", title: "S3 merge", sha: "deadbee" });
  assertEquals(b.merge_method, "merge");
  assertEquals(b.commit_title, "S3 merge");
  assertEquals(b.sha, "deadbee");
  assert(!("commit_message" in b), "no commit_message when unset");
});

// --- parseEvalVerdict -----------------------------------------------------
Deno.test("parseEvalVerdict reads a PASS from a Verdict line", () => {
  const v = parseEvalVerdict("## Verdict: IMPL-EVAL: PASS\n\nall gates green");
  assertEquals(v.kind, "IMPL");
  assertEquals(v.verdict, "PASS");
  assert(v.isPass && !v.isFail, "is a pass");
});
Deno.test("parseEvalVerdict reads a FAIL_FIX verdict", () => {
  const v = parseEvalVerdict("**Verdict: IMPL-EVAL: FAIL_FIX** — one cast remains");
  assertEquals(v.verdict, "FAIL_FIX");
  assert(v.isFail && !v.isPass, "is a fail");
});
Deno.test("parseEvalVerdict prefers the Verdict line over an instructional echo", () => {
  // A body that quotes the instruction (FAIL_RESCOPE) before the real verdict (PASS).
  const body = "Emit `IMPL-EVAL: FAIL_RESCOPE` if scope is wrong.\n\n## Verdict: IMPL-EVAL: PASS";
  assertEquals(parseEvalVerdict(body).verdict, "PASS");
});
Deno.test("parseEvalVerdict returns null verdict when absent", () => {
  const v = parseEvalVerdict("## OpenHands Agent — Running\nstill working");
  assertEquals(v.verdict, null);
  assert(!v.isPass && !v.isFail, "neither pass nor fail");
});
Deno.test("parseEvalVerdict reads a standalone VERDICT: PASS (no IMPL/PLAN kind)", () => {
  // The shape OpenHands posted for PR #100 S6: bolded, kindless verdict line.
  const v = parseEvalVerdict("## Verdict\n**VERDICT: PASS** — Certify S6 slice only.");
  assertEquals(v.kind, null);
  assertEquals(v.verdict, "PASS");
  assert(v.isPass && !v.isFail, "is a pass");
});
Deno.test("parseEvalVerdict treats PASS-WITH-NITS as a pass", () => {
  const v = parseEvalVerdict("VERDICT: PASS-WITH-NITS (doc polish only)");
  assertEquals(v.verdict, "PASS-WITH-NITS");
  assert(v.isPass && !v.isFail, "nits are non-blocking");
});
Deno.test("parseEvalVerdict reads a standalone FAIL_FIX without a kind", () => {
  const v = parseEvalVerdict("VERDICT: FAIL_FIX — one cast remains");
  assertEquals(v.verdict, "FAIL_FIX");
  assert(v.isFail && !v.isPass, "is a fail");
});
Deno.test("parseEvalVerdict never parses a menu echo as a verdict", () => {
  // The instruction line that lists the options must not register as PASS.
  const v = parseEvalVerdict("Emit `VERDICT: PASS | FAIL | PASS-WITH-NITS` as a PR comment.");
  assertEquals(v.verdict, null);
  assert(!v.isPass && !v.isFail, "menu is not a verdict");
});

// --- selectLatestOpenHandsComment -----------------------------------------
Deno.test("selectLatestOpenHandsComment picks the last tagged comment", () => {
  const marker = "<!-- openhands-agent-summary -->";
  const comments = [
    { body: "human chatter" },
    { body: `${marker}\n## OpenHands Agent — Running` },
    { body: "more chatter" },
    { body: `${marker}\n## OpenHands Agent — Completed\nVerdict: IMPL-EVAL: PASS` },
  ];
  const latest = selectLatestOpenHandsComment(comments);
  assert(latest?.body?.includes("Completed") ?? false, "should be the completed one");
});
Deno.test("selectLatestOpenHandsComment returns null when none tagged", () => {
  assertEquals(selectLatestOpenHandsComment([{ body: "a" }, { body: "b" }]), null);
});
