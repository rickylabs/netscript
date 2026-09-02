# Drift Log: SDK contribution conflict diagnostics

## 2026-09-02 — Local RTK proxy unavailable

- **What:** `rtk` is not installed or not on `PATH` in this worktree environment.
- **Source:** focused `rtk rg` and `rtk ls` invocations exited 127.
- **Expected:** AGENTS.md and the `rtk` skill describe an installed machine-level proxy.
- **Actual:** focused raw `rg`/Git reads are required.
- **Severity:** minor
- **Action:** accept; retain structured wrappers and raw exit codes for authoritative gates.
- **Evidence:** bootstrap command output in the active session.

## 2026-09-02 — PR opens non-draft

- **What:** The owner requires a non-draft PR with `status:impl` in the same opening action.
- **Source:** task PR contract.
- **Expected:** Harness default opens a draft PR from the bootstrap commit.
- **Actual:** The completed slice will be pushed and opened directly as non-draft with the exact
  owner-specified metadata.
- **Severity:** minor
- **Action:** accept as explicit owner override.
- **Evidence:** `supervisor.md` and eventual PR metadata.

## 2026-09-02 — Diagnostic-id policy extracted after quality review

- **What:** The first implementation pushed `prepared-call.ts` from 484 to 514 lines and introduced
  a new F-1 warning, so the reusable id parser moved to `contribution-diagnostic-id.ts`.
- **Source:** `deno task quality:gate` SDK doctrine report and `wc -l` A/B.
- **Expected:** No new/deepened doctrine debt.
- **Actual:** The initial in-file implementation crossed the 500-line review threshold.
- **Severity:** minor
- **Action:** fix within the slice; preserve the id pattern and all contribution validation policy.
- **Evidence:** final quality gate and file-size comparison.
