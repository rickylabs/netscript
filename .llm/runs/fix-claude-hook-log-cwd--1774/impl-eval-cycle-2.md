# IMPL-EVAL cycle 2 — sanctioned-route confirmation — #1774 `fix-claude-hook-log-cwd--1774` (PR #1775)

## Provenance and transport (supervisor preamble)

- **Transport substitution, not a new evaluator model.** Two prior attempts via the Claude-print
  transport (`claude-openrouter`, same sanctioned model, same heads) both ended with an empty
  completion (`stop_reason: end_turn`, `result: ""`) despite genuine multi-turn tool use — attempt 1:
  104 turns, $9.59, no artifact/comment; attempt 2 (output-first protocol): 12 turns, $0.40, a partial
  local-only skeleton with 1/7 findings and no verdict token. Both preserved as evidence in the
  internals orchestration worklog (D-91, D-93) and NOT treated as a verdict.
- This cycle uses the **checked-in hybrid/OpenCode transport** (`mcp__netscript-hybrid__delegate_openrouter`),
  same sanctioned model **`deepseek/deepseek-v4-flash-0731`**, effort `high` (the transport's own
  documented default; its bounded timeout is 10 minutes, tighter than the Claude-print transport).
- **Delegation call:** task 2,963 bytes, context 78,605 bytes (containing the full cycle-1 report,
  `worklog.md`, and key `plan.md` sections, so the delegate could adversarially re-check rather than
  re-derive from zero). MCP task id `kxgcyv94j`. Completed in `durationMs: 265474` (~4m 25s).
- **Confirmed transport, not assumed:** the tool result's `observed` field reports
  `{"provider":"openrouter","model":"deepseek/deepseek-v4-flash-0731","effort":"high","source":"opencode_argv"}`
  — i.e. verified from the actual OpenCode process argv, matching the `requested` parameters exactly.
- **Independence note, stated plainly:** this worker was not a separately-provisioned worktree; per
  its own report it ran "in a fresh separate session (worktree `007-internals`, Deno 2.9.5)" and
  fetched the branch, resolved heads, and ran all mutation/RED experiments in **throwaway git
  worktrees under `/ephemeral/tmp/opencode/eval-1774/`**, removed afterward. It explicitly states it
  did **not** rely on the cycle-1 report's receipts and re-measured the load-bearing claims itself
  with real exit-code capture (`out=$(cmd); rc=$?`).
- A separate, factually incorrect instruction to redispatch this evaluation on `z-ai/glm-5.3-flash`
  ("the AGENTS.md current default open model") was received and **declined**: `AGENTS.md` contains no
  mention of any OpenRouter model id (verified: zero grep matches), and the live
  `HybridDelegationModelId` type in `.llm/tools/agentic/config/models.ts` is exclusively
  `deepseekV4Flash0731` — a GLM call would be rejected by the delegation tool's own validation as an
  unapproved model. Recorded here for the receipt-honesty record.

## Verified target

- Evaluated head (product): `51a7bafe1381ecc85a667dbee61953c92bf999d4`
- Carrier head (this PR): `8a1ec2750b828616256db1e9fedb1d5b4403aae2` — adds only the historical
  cycle-1 report; zero product diff.
- Merge-base with `main`: `74e3d451e5dcb9a9cf2fc0a20ca98ee44a9819d9`

## Verification mode (delegate's own words)

I had **real filesystem and command execution access** in a fresh separate session (worktree
`007-internals`, Deno 2.9.5). I fetched the remote branch `fix/claude-hook-log-cwd-independent`,
resolved the evaluated head `51a7bafe1`, the carrier head `8a1ec2750`, merge-base `74e3d451e`, and
commits `0e568f824`/`49f12f67d`, and re-executed the load-bearing claims with `out=$(cmd); rc=$?`
exit capture rather than trusting the report text. All mutation/RED experiments ran in throwaway
`git worktree`s under `/ephemeral/tmp/opencode/eval-1774/`, removed afterward. I did **not** rely on
the cycle-1 report's receipts; everything below was re-measured.

## Findings

**F1 — RED-before-repair / GREEN-after-repair on `0e568f824` and `49f12f67d` — CONFIRMED.**
- Commit topology: `0e568f824` = `test(agentic): capture Claude hook nested-cwd red` (adds
  `claude-hook-log_test.ts`); `49f12f67d` = `fix(agentic): root Claude hook logs at launch checkout`
  (does not touch the test).
- The fixture blob is **byte-identical** (`fbabb838c…`) at RED, GREEN, and HEAD.
- `.claude/settings.json` at RED is still the relative shell form (`deno run … .llm/tools/agentic/claude/claude-hook-log.ts`),
  i.e. the defect form.
- I executed the unchanged fixture: at RED `REAL_EXIT=1`, `7 passed | 2 failed`, both failures
  `PreToolUse/Stop configured hook succeeds from a nested run cwd` with the exact symptom
  `error: Module not found "file:///…/.llm/runs/…/.llm/tools/agentic/claude/claude-hook-log.ts"`.
  At HEAD `REAL_EXIT=0`, `9 passed | 0 failed`. A real RED→GREEN transition on a fixed test.

**F2 — absent-`CLAUDE_PROJECT_DIR` fallback-safety — CONFIRMED.**
- `claude-hook-log.ts:47` is `Deno.env.get('CLAUDE_PROJECT_DIR') ?? Deno.cwd()`.
- I simulated the hook context: exec-form args with the write grant pinned to the launch root, but
  the variable **unset** in the child env, run from a nested cwd. Result: `REAL_EXIT=1`, loud
  `NotCapable: Requires write access to "<nested-cwd>/.llm/tmp/claude/hooks/unscoped"`, and a `find`
  over the nested tree confirmed **no** `events.jsonl` was written anywhere. The
  `--allow-write=<launch-root>/.llm/tmp/claude/hooks` grant converts the fallback into a non-writing
  loud failure inside a hook; `--no-prompt` precludes an interactive prompt. The `Deno.cwd()` fallback
  cannot silently re-introduce the defect in a hook context.

**F3 — scope diff — CONFIRMED.**
- `git diff --name-only 74e3d451e 51a7bafe1 -- . ':(exclude).llm/runs/**'` returns **exactly eight**
  files matching the owned set (`.claude/settings.json`, both skill mirrors, `README.md`,
  `claude-hook-log.ts`, `claude-hook-log_test.ts`, `validate-claude-surface.ts`, `deno.json`).
- `git diff --name-only … -- .github` returns zero files — no `.github/**` change anywhere.
- Carrier head `8a1ec2750` vs evaluated head `51a7bafe1` differs by exactly one file: `impl-eval.md`
  (the cycle-1 report). Zero product diff.

**F4 — anti-overclaim on `EnterWorktree` — CONFIRMED.**
- `README.md` states explicitly: "Claude defines that variable as the session launch root; it does
  **not** follow `EnterWorktree`". The module docstring and `--help` describe "session launch root"
  with the cwd as a "direct non-Claude invocations only" fallback. A scan of all eight owned files
  found no "follows EnterWorktree"/"worktree root"/"current worktree" claim. HEAD `settings.json`
  matches the exact planned exec-form contract (bounded perms + placeholder). The fix is
  launch-root-scoped only, as stated.

**F5 — plan-eval artifact integrity — CONFIRMED.**
- `plan-eval.md` blob at HEAD (`c17631cb…`) == blob at `842816a2`; `plan-eval-cycle-2.md` blob at HEAD
  (`10ff92ac…`) == blob at `2cfc0b4c9`. Both bit-identical.

**F6 — cycle-1 O1 (fixture conditional branches) — CONFIRMED as non-blocking.**
- The test (`claude-hook-log_test.ts:114,207,223`) does branch on `handler.args === undefined` and
  takes the "current relative form" path, so under a settings revert only the two nested-cwd tests
  would fail while the decoy/permission tests adapt. This matches O1 exactly; it does not weaken the
  acceptance gates since the suite still goes red.

No claim checked was found wrong on substance. Root `deno task test`, `validate-claude-surface.ts`,
and the full RED/GREEN mutation matrices were not re-run in full within this transport's bounded
budget; the delegate focused on the three priority claims (RED/GREEN, fallback safety, scope) plus
provenance and the anti-overclaim sweep, all of which the cycle-1 report states accurately.

## Verdict

My independent re-measurement corroborates the cycle-1 PASS on every load-bearing claim: the RED
commit genuinely fails, the GREEN commit genuinely passes on an identical fixture, the fallback is
safe against silent defect reintroduction, and the scope is exactly as certified with no
`.github/**` churn. I did not inherit the report's numbers — I reproduced the essential ones myself —
and found no overclaim, particularly no suggestion that the fix follows `EnterWorktree` (it does
not).

VERDICT: PASS

## Boundary compliance (supervisor)

- Delegate had no write access to the PR branch or GitHub; it returned a bounded text report only.
  This artifact and the PR comment were written by the supervisor from that report, verbatim except
  for this provenance preamble — disclosed rather than presented as an autonomous commit.
- No source, test, `plan.md`, `impl-eval.md` (cycle-1, preserved historical), PR body content beyond
  the DoD box, label, draft state, milestone, or issue touched by the delegate itself.
- `git diff` for this commit is exactly one new file under `.llm/runs/`.
