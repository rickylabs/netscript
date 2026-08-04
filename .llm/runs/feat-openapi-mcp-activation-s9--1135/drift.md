# Drift Log: OMB S9 activation surfaces and migration fixture

## 2026-08-04 — Current registry supersedes issue lineage count

- **What:** The carried-in issue/design describes the prior server as 14 tools; current main has 21.
- **Source:** `packages/mcp/tests/registry_test.ts`, `packages/mcp/tests/stdio_test.ts`, live source.
- **Expected:** Historical 14-tool state from #1135 lineage.
- **Actual:** 21 tools after S6, S7, and #1218.
- **Severity:** minor
- **Action:** accept
- **Evidence:** current `TOOL_NAMES`; instructions and fixtures will not assert the stale count.

## 2026-08-04 — Milestone PLAN-EVAL waiver

- **What:** No local formal PLAN-EVAL is launched for this per-PR milestone slice.
- **Source:** owner prompt citing `milestone-run.md` evaluator protocol and ruling D6.
- **Expected:** standard run-loop separate PLAN-EVAL.
- **Actual:** Plan-Gate rows composed and locked under orchestrator waiver; same-run implementation.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`, `supervisor.md`.

## 2026-08-04 — Configured Claude review route unavailable

- **What:** Both the canonical `review_codex` Fable identity and its in-plan Opus fallback failed
  before inference with `model_not_found`.
- **Source:** `claude-print` sessions `57ca2322-7578-417a-a5a4-28f1e288f118` and
  `1e4b34c3-78ea-4fb3-aa42-59118324ac0c`.
- **Expected:** Claude-family substantive code review before supervisor sign-off.
- **Actual:** Both configured identities returned HTTP 404 with zero input/output tokens and zero
  cost; neither produced a review verdict.
- **Severity:** significant
- **Action:** defer sign-off; use WIP implementation commit and require the milestone's separate
  open-model IMPL-EVAL before any supervisor sign-off/readiness transition.
- **Evidence:** streamed launcher results; `slice-1-review-prompt.md`.

## 2026-08-04 — Planned sign-off slices carried as one WIP commit

- **What:** The two implementation slices are carried together in a WIP commit rather than two
  supervisor sign-off commits.
- **Source:** review route failure above and the no-self-certification invariant.
- **Expected:** review, sign off, push, and comment after each of the two planned slices.
- **Actual:** Both focused-green implementations are pushed for the milestone evaluator to inspect;
  neither is represented as a supervisor sign-off.
- **Severity:** significant
- **Action:** accept as WIP only; final evaluator PASS and a later supervisor evidence commit are
  required before readiness.
- **Evidence:** draft PR #1232 commit trail and this run worklog.
