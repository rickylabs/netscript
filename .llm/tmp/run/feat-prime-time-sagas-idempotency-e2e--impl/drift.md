# Drift Log: sagas-idempotency-e2e

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-06-20 — Root Gate Baseline Failures Outside Slice

- **What:** Root `deno task arch:check` and root `deno task fmt:check` do not produce an all-green
  verdict on this worktree.
- **Source:** Final gate run.
- **Expected:** Approved plan names final architecture/format gates as merge-readiness evidence.
- **Actual:** Slice-owned scoped gates are green, but root `fmt:check` fails on untouched
  `plugins/triggers/src/runtime/trigger-runtime-processor_test.ts`; root `arch:check` reports
  broad existing CLI/plugin/package doctrine debt. Scoped `packages/plugin-sagas-core` doctrine has
  0 FAIL; scoped `plugins/sagas` doctrine reports existing non-idempotency findings including
  `SagasCliCommand` and file-size/default-export warnings.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `deno task fmt:check` exit 1; `deno task arch:check` exit 1;
  `check-doctrine.ts --root packages/plugin-sagas-core --text` exit 0.
