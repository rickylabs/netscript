# Drift Log: OMB S5 ServiceEndpointDirectoryPort + adapters

Drift is append-only.

## 2026-08-04 — Milestone evaluator composition replaces local formal PLAN-EVAL

- **What:** No local formal PLAN-EVAL is launched; the plan gate is recorded as composed waiver.
- **Source:** User-relayed `.llm/harness/workflow/milestone-run.md` evaluator rule and orchestrator D6.
- **Expected:** Normal run-loop would require a separate local formal PLAN-EVAL.
- **Actual:** Draft→ready augment + OpenHands + orchestrator pre-merge evaluation compose per-PR
  evaluation; implementation proceeds in the same run after plan lock.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan-eval.md`, `worklog.md` Plan Gate row.

## 2026-08-04 — True baseline is fetched origin/main

- **What:** Local `main` pointed to an older commit while this branch matched remote `main`.
- **Source:** raw git rev-parse/fetch/ls-remote.
- **Expected:** re-baseline against current `main`.
- **Actual:** fetched `origin/main` is `2c8865e8c`; branch is identical and clean.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` re-baseline.

## 2026-08-04 — Current manifest run id must be injected

- **What:** S-8 says a manifest is eligible only when `runId` is current, but S5 has no independent
  current-run token source; trusting the file's own token or wall clock would not prove currency.
- **Source:** canonical discovery design vs P1 experiment/evidence and S7 ownership boundary.
- **Expected:** identity binding `projectRoot + runId` before use.
- **Actual:** S5 will require an expected current run id at composition. A present manifest without
  it, or with a mismatch, reports a failed source outcome. S7 can wire the token later.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `research.md` finding 8/open-question resolution; `plan.md` D4.

