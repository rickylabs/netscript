# Drift Log: JSR-readiness additive valid set

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-06-22 — Missing implementation tracking artifacts

- **What:** The run directory had `research.md`, `plan.md`, `plan-eval.md`, and `implement.md`, but
  did not have `worklog.md`, `context-pack.md`, `commits.md`, or `drift.md` when the implementation
  generator started.
- **Source:** Direct filesystem listing of `.llm/tmp/run/jsr-readiness-additive`.
- **Expected:** Harness activation/run-loop requires these implementation tracking artifacts to exist
  before implementation and the user requested worklog/commit updates.
- **Actual:** The files were absent.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Created the missing files before applying S1 implementation changes.

## 2026-06-22 — `arch:check` exposed baseline auth doctrine failures

- **What:** After S2 prepended `deps:check` to main's current multi-root `arch:check`, the preserved
  auth doctrine roots failed on two existing auth-layer findings: an `@ts-expect-error` directive in
  `packages/auth-better-auth/tests/better-auth_test.ts` and an appsettings type assertion in
  `plugins/auth/services/src/main.ts`.
- **Source:** `deno task arch:check`.
- **Expected:** The plan expected `arch:check` to go green after task reconciliation only.
- **Actual:** The dependency portion passed, then the preserved main auth roots exposed baseline
  doctrine failures unrelated to the dependency task wiring.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Replaced the negative compile directive with a type-level key assertion, declared the
  auth audit appsettings shape in `plugins/auth/services/src/backend-registry.ts`, and narrowed via
  `hasAuthAppsettings()` instead of asserting a widened context.
