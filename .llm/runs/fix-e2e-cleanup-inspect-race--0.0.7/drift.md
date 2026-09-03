# Drift Log: cleanup container-inspect removal race

## 2026-09-03 — owner-selected generator effort

- **What:** The owner selected Codex GPT-5.6 Sol at high effort for this mechanical fix.
- **Source:** `implement-brief.md`.
- **Expected:** Lane guidance normally starts a targeted small fix on the light/low route.
- **Actual:** `complex_implementation` identity is used as explicitly requested.
- **Severity:** minor.
- **Action:** accept.
- **Evidence:** `supervisor.md` route table; no scope or gate change follows from the override.

## 2026-09-03 — main advanced after run activation

- **What:** `origin/main` advanced from the owner-pinned baseline `4afbd82a7` to `3903feea6` while
  S3 was running.
- **Source:** `git fetch origin main`; range `4afbd82a7..3903feea6`.
- **Expected:** The run began from the exact baseline in the implementation brief.
- **Actual:** Three unrelated commits landed: changelog, resource-slice plan artifacts, and a
  generated-client selector refactor. None changes cleanup evidence or its tests.
- **Severity:** minor.
- **Action:** accept; no merge/rebase is needed because the PR merge ref supplies current main and
  the target surface has no overlap.
- **Evidence:** `git diff 4afbd82a7..origin/main -- packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup.ts packages/cli/e2e/tests/application/gates/aspire-cleanup-evidence_test.ts` is empty.

## 2026-09-03 — ready transition owns IMPL-EVAL dispatch

- **What:** The planned native Fable evaluator is replaced by the PR lifecycle's single automatic
  opposite-family IMPL-EVAL dispatch.
- **Source:** Owner instruction to mark the draft ready after S1–S3; `netscript-pr` Draft ↔ ready
  rule; `agent-handoff.md` formal-phase trigger contract.
- **Expected:** Initial supervisor table selected native Fable for a local Codex-authored run.
- **Actual:** Draft→ready is explicitly required and automatically dispatches IMPL-EVAL; launching
  native Fable as well would duplicate the formal evaluator for the same head.
- **Severity:** minor.
- **Action:** accept; record requested and observed workflow identity, and do not claim reasoning
  effort because OpenHands does not expose it.
- **Evidence:** `supervisor.md`; PR #1979 ready transition and resulting workflow/comment.

## 2026-09-03 — scoped S3 gates missed the teardown source scan

- **What:** The first IMPL-EVAL found that the new test's joined command transcript contained the
  source phrase rejected by the repository-wide shared-host teardown guard.
- **Source:** Evaluator comment on PR #1979; `.llm/tools/agentic/teardown/forbidden-commands_test.ts`.
- **Expected:** S3 scoped tests and quality/doctrine evidence would predict the merge lane.
- **Actual:** Product behavior and focused tests were green, but `quality:gate` does not include the
  repository teardown source scan.
- **Severity:** moderate.
- **Action:** accept evaluator finding; represent captured calls as argv arrays, run the guard plus
  focused check/lint/fmt/tests, then require fresh exact-head CI and IMPL-EVAL.
- **Evidence:** teardown guard 1/1 PASS; cleanup tests 9/9 PASS after the test-only repair.
