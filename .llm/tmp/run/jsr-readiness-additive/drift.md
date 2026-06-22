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

## 2026-06-22 — Additional auth README drift on current main

- **What:** Current `origin/main` has auth package/plugin README files that are absent or materially
  different on `origin/release/jsr-readiness`, so they are not byte-clean S3 files.
- **Source:** Blob comparison for README paths between merge-base `cc3b8731`, `origin/main`, and
  `origin/release/jsr-readiness`.
- **Expected:** The evaluated plan expected 21 byte-clean package/plugin READMEs plus two internal
  READMEs.
- **Actual:** Current-tree classification yielded 20 byte-clean package/plugin READMEs plus two
  internal READMEs. Auth READMEs (`packages/auth-better-auth`, `packages/auth-kv-oauth`,
  `packages/auth-workos`, `packages/plugin-auth-core`, `plugins/auth`) were excluded to avoid
  deleting or clobbering main-only auth documentation.
- **Severity:** minor
- **Action:** fix
- **Evidence:** S3 checkout intentionally omitted those auth README paths. S4 extended the same
  hand-reconcile approach to those five auth README files after aggregate `docs:readme:check` failed;
  `deno task docs:readme:check` now passes for all 31 package/plugin READMEs.

## 2026-06-22 — Fresh UI umbrella casts hand-reconciled

- **What:** The umbrella S5 TSX files added JSX prop casts while widening component prop types.
- **Source:** Diff scan after checking out S5 files from `origin/release/jsr-readiness`.
- **Expected:** PLAN-EVAL required fresh-ui fixes to introduce zero new casts.
- **Actual:** Direct checkout introduced new `as JSX.*` lines in fresh-ui component implementations.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Restored the existing component implementation shape, exported namespace types, and
  adjusted public prop aliases to use component-specific JSX element prop types. Focused check/lint
  passed and the final S5 diff scan reports no added `any` or `as` lines.
