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
