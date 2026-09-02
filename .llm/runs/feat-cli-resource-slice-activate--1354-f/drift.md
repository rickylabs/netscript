# Drift Log: Slice F activation (#1354)

## 2026-09-02 — RTK unavailable

- **What:** The preferred output-compression proxy is not installed.
- **Source:** `rtk ls ...` returned `/bin/bash: rtk: command not found`.
- **Expected:** Repository tooling guidance says `rtk` is on `PATH`.
- **Actual:** Scoped raw `git`, `rg`, and `find` reads are required.
- **Severity:** minor
- **Action:** accept for this run; structured wrappers remain authoritative gate sources.
- **Evidence:** bootstrap terminal output.

## 2026-09-02 — stacked base advanced

- **What:** `origin/feat/app-service-client-wiring` advanced after the integration branch was
  assembled.
- **Source:** `git rev-parse origin/feat/app-service-client-wiring`.
- **Expected:** Owner described integrated #1664 head `9295eabaa`.
- **Actual:** remote base is `e8983cca5`; this branch remains at the explicitly supplied integration
  commit `be3e3dded` and the PR will target the current branch name.
- **Severity:** minor
- **Action:** accept; do not merge or rebase onto `main`, and state the stacked-base relationship in
  the PR.
- **Evidence:** raw git rev-parse/log output.

## 2026-09-02 — retire-set consumer required plan amendment

- **What:** Focused convention resolution exposed an additional rendered consumer outside the
  original 32-item Slice F enumeration.
- **Source:** `packages/cli/src/kernel/templates/app/agent-conventions.ts`, where
  `serviceReferences()` referenced five retired canonical paths: `service-route-contract`,
  `service-island`, `service-shared`, `service-form`, and `service-authorization`.
- **Expected:** The locked plan required implementation to stop on any additional importer or
  rendered consumer rather than preserve a compatibility asset or invent an extension point.
- **Actual:** Implementation stopped with the partial source changes uncommitted and reported the
  consumer. The owner amended PR #1891 / `feat/cli-resource-slice-plan` with item 33 and raised the
  ceiling to 33.
- **Severity:** scope amendment
- **Action:** Resume only after fetching the amended plan; re-point each convention to an existing
  planner-generated role or remove it when no standalone planner leaf exists. Slice G retains the
  guidance rewrite and new focused convention test.
- **Evidence:** amended plan at `origin/feat/cli-resource-slice-plan` and the existing
  `assertAppConventionsResolve` failure in `public-command-tree_test.ts`.

## 2026-09-03 — Slice E production-composition absorption (IMPL-EVAL M-1)

- **What:** Slice F absorbed Slice E's deferred plan item 6 in
  `packages/cli/src/public/features/root/public-command-dependencies.ts` to compose the resource
  command at registration time, but that file is outside Slice F's amended 33-item enumeration.
- **Source:** Formal IMPL-EVAL M-1 and raw `be3e3dded..8c27ffe16` path accounting.
- **Expected:** Slice F's touch accounting distinguishes its 33 enumerated paths from any explicitly
  absorbed prerequisite.
- **Actual:** Scope is 33 enumerated Slice F paths plus 1 absorbed Slice E composition path. Of the
  enumerated paths, 32 have a product diff and item 24 (`export-surface-corpus.generated.ts`)
  regenerated deterministically without one; the absorbed path makes the product diff 33 files.
- **Severity:** minor scope/accounting correction
- **Action:** Keep the absorbed composition file, correct `context-pack.md` and `implement.md`, and
  report the footprint as **33 enumerated + 1 absorbed**, never as `33/33`.
- **Evidence:** `evaluate.md`, `plan.md § Scope`, and `git diff --name-only be3e3dded..HEAD`.

## 2026-09-03 — composition-root IO debt and Slice E LOW-2 deferral (IMPL-EVAL M-2/L-4)

- **What:** The absorbed stager and `deno eval` procedure probe perform adapter-grade IO in
  `public-command-dependencies.ts`; related non-reconciler pre-apply failures still surface as plain
  `Error` rather than `CliExitError`.
- **Source:** Formal IMPL-EVAL M-2 and L-4; Doctrine R-COMP-DECL/AP-25.
- **Expected:** Filesystem/process effects live under `kernel/adapters/`, and public CLI failures
  use the established exit-error discipline.
- **Actual:** The command is behaviorally covered, but adapter extraction and error normalization
  are deferred because this closeout permits no product changes.
- **Severity:** accepted architecture debt
- **Action:** Track the extraction and error normalization in the canonical architecture debt entry
  `cli-resource-composition-io-1354`; do not change product code in this closeout.
- **Evidence:** `.llm/harness/debt/arch-debt.md`, PR #1956, issue #1354, and `evaluate.md`.

## 2026-09-03 — full-package lint/format baseline

- **What:** The root Deno config excludes `packages/cli`; a full CLI diagnostic with the isolated
  CLI quality config reports existing lint and format drift.
- **Source:** Structured wrappers over all 977 CLI TypeScript files.
- **Expected:** Slice-authored TypeScript must pass structured lint and format without expanding the
  locked product footprint to rewrite unrelated baseline files.
- **Actual:** The 12 authored files pass both wrappers with exit 0 and zero findings. The wider
  diagnostic exits 1 with 59 lint occurrences across 34 paths and 214 format findings across 214
  paths; neither path set intersects `git diff --name-only be3e3dded..HEAD`.
- **Severity:** pre-existing baseline; non-blocking for the slice
- **Action:** Preserve the touched-file verdict and report the wider diagnostic exactly; do not
  mutate 248 unrelated paths under a locked 33-file ceiling.
- **Evidence:** `.llm/tmp/1354-f-full-lint.json`, `.llm/tmp/1354-f-full-fmt.json`, and the recorded
  changed-path intersection command (temporary reports are ignored and not committed).
