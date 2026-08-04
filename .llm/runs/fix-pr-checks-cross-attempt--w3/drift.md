# Drift Log: cross-attempt PR-check supersession

## 2026-08-04 — Live recurrence and evidence-comment count

- **What:** The owner's continuation raises recurrence count from five to six; GitHub currently
  returns one evidence comment although the staged brief says two.
- **Source:** owner message; GitHub issue #1187 and comments API.
- **Expected:** recurrence five and two evidence comments.
- **Actual:** recurrence six; issue body plus one exposed escalation comment.
- **Severity:** minor.
- **Action:** accept the newer owner count and preserve the mismatch without inventing evidence.
- **Evidence:** `research.md`.

## 2026-08-04 — Milestone composed evaluation

- **What:** No local formal PLAN-EVAL is run for this delegated milestone PR.
- **Source:** owner directive citing `milestone-run.md` evaluator protocol and orchestrator ruling D6.
- **Expected:** standard single-run local PLAN-EVAL.
- **Actual:** composed GitHub-triggered evaluation and milestone-supervisor review.
- **Severity:** significant.
- **Action:** accept authorized milestone-run override and record it explicitly.
- **Evidence:** `supervisor.md`, `plan-eval.md`.

## 2026-08-04 — Issue evidence run/check provenance mismatch

- **What:** The issue associates failing check-run `91809338954` with workflow run `30849924186`,
  but the live API resolves them to different heads/runs.
- **Source:** authenticated GitHub API reads of the check run, check suite, workflow run, and jobs.
- **Expected:** one workflow run whose rerun attempts own both stale and fresh check IDs.
- **Actual:** failing check head `c7248eb…` belongs to run `30850545671`; named run
  `30849924186` has head `7442d2e…` and latest-attempt successes.
- **Severity:** significant.
- **Action:** fix the general same-head cross-attempt defect from API identities; record the
  mismatch and avoid claiming the current PR reproduces the historical stale landscape.
- **Evidence:** `worklog.md` historical/live section.

## 2026-08-04 — Review route fallback

- **What:** The canonical Fable review launch returned `model_not_found`; the approved Opus
  fallback performed the slice review.
- **Source:** repo `claude-print.ts` launch output; sessions
  `fffd4c28-b837-4f58-9ae8-266abdce204b`, `b46ce7f7-bc9c-47be-88a4-c4e0ebcfc4e9`, and
  `833cdc49-8d3f-42ea-a8a9-0f9416d5aef2`.
- **Expected:** `review_codex` primary Fable route.
- **Actual:** no primary review occurred; Opus review found six issues, then passed the corrected
  slice on re-review.
- **Severity:** minor.
- **Action:** accept configured fallback; preserve both the failed primary and successful review.
- **Evidence:** `worklog.md` progress and gate tables.
