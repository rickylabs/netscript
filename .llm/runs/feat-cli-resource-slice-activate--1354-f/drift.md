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

- **What:** `origin/feat/app-service-client-wiring` advanced after the integration branch was assembled.
- **Source:** `git rev-parse origin/feat/app-service-client-wiring`.
- **Expected:** Owner described integrated #1664 head `9295eabaa`.
- **Actual:** remote base is `e8983cca5`; this branch remains at the explicitly supplied integration commit `be3e3dded` and the PR will target the current branch name.
- **Severity:** minor
- **Action:** accept; do not merge or rebase onto `main`, and state the stacked-base relationship in the PR.
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

## 2026-09-03 — production-composition path accounting

- **What:** The product diff contains `public-command-dependencies.ts`, while enumerated item 24
  (`export-surface-corpus.generated.ts`) regenerated deterministically without a diff.
- **Source:** Formal IMPL-EVAL LOW-1 and raw `be3e3dded..HEAD` path accounting.
- **Expected:** Slice F activates the command using the Slice E integration point and reports its
  footprint against the amended 33-item list.
- **Actual:** 32 amended-F paths changed; the plan-scoped Slice E item-6 production composition
  seam is the 33rd product diff path. Item 24 is freshness evidence only and stayed byte-identical.
- **Severity:** evidence wording; non-blocking
- **Action:** Report the exact accounting instead of `33/33 planned paths`. The composition edit is
  authorized by the locked plan's Slice E item 6, this run's explicit scope, and the owner's
  instruction to wire Slice E's dependencies at activation time.
- **Evidence:** `evaluate.md`, `plan.md § Scope`, and `git diff --name-only be3e3dded..HEAD`.

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
