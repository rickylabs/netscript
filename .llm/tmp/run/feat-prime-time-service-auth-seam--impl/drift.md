# Drift Log: service-auth-seam implementation

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state documentation.

## 2026-06-20 — No drift recorded

- **What:** Implementation started from the approved plan with no scope divergence.
- **Source:** `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-seam/plan.md`
- **Expected:** Implement the seven approved slices in `packages/service`.
- **Actual:** No divergence.
- **Severity:** minor
- **Action:** accept
- **Evidence:** This file remains the drift log for any future divergence.

## 2026-06-20 — Root architecture gate has pre-existing repo-wide failures

- **What:** `deno task arch:check` exits 1 on existing repo-wide doctrine findings outside the `service-auth-seam` slice.
- **Source:** `deno task arch:check`
- **Expected:** The plan listed `deno task arch:check` as a gate.
- **Actual:** Root command reports 58 FAIL, 143 WARN, and 1 INFO, primarily in CLI/plugin abstractions and Jest/Vitest-style tests outside `packages/service`. The service-scoped doctrine command `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/service` exits 0 with FAIL=0 and one existing docs warning.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Worklog gate table records both commands and outcomes.
