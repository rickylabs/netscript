# Drift Log: #1357 `ui:add` data-screen triad

Drift is append-only. These entries compare the owner/issue/doctrine expectations with the exact
locked base.

## 2026-08-30 — Issue citations and #1356 facts moved

- **What:** Reverified every #1357 citation recorded at `fac9e339042c`.
- **Source:** issue #1357 plus focused reads at `de57fab0`.
- **Expected:** agent convention at 137–139; input omits route/island/query/app; no force.
- **Actual:** convention is now 155–157; closed #1356 added route/island/query/app to the input and
  a command-level force flag, but force still does not reach page/island scaffolding. Core defect is
  otherwise unchanged.
- **Severity:** minor.
- **Action:** accept and design against the actual tree; no #1356 reimplementation.
- **Evidence:** `agent-conventions.ts`, `add-ui-input.ts`, `add-ui-command.ts`, issue #1356 closed.

## 2026-08-30 — Archetype-6 ideal differs from legacy CLI spine

- **What:** Doctrine checkpoint found pre-existing structural differences outside this leaf.
- **Source:** `ARCHETYPE-6-cli-tooling.md` versus `packages/cli/src/kernel/**/abstracts`.
- **Expected:** five spine abstracts including `CliCommand<Input,Result>` and `CliCommandGroup`, and
  layer-2 abstracts justified by their required concretes.
- **Actual:** CLI has `CliCommand<TDefinition>` and no `CliCommandGroup`; `ScaffoldCommand` has one
  current concrete. Other relevant layer-2 abstractions are established.
- **Severity:** significant (pre-existing), not caused by #1357.
- **Action:** defer; no spine/abstract mutation is authorized by the 12-path ceiling.
- **Evidence:** research doctrine inventory and `rg extends` counts.

## 2026-08-30 — Required RTK proxy unavailable

- **What:** Repo guidance prefers `rtk` for read-heavy commands.
- **Source:** `.agents/skills/rtk/SKILL.md` and command lookup.
- **Expected:** `rtk` binary available.
- **Actual:** binary is not installed in this worktree environment; commands ran directly with
  bounded output.
- **Severity:** minor.
- **Action:** accept for S1 and preserve direct command evidence.
- **Evidence:** shell command-not-found result during initial inspection.

## 2026-08-30 — Lint/fmt verdict commands are red at base

- **What:** Measured the promised scoped and package tasks instead of assuming green.
- **Source:** structured wrappers and package-local tasks at `de57fab0`.
- **Expected:** package lint/fmt and a mixed exact-path selection might be usable green gates.
- **Actual:** the mixed wrapper refuses partial coverage (CLI files dropped), while package-local
  tasks resolve `.llm/tools/...` below their package and exit 1. Root-wide CLI wrapper attempts also
  hit nested config exclusion. Findings are not evidence of #1357 product failure; coverage itself
  is invalid.
- **Severity:** significant tooling baseline.
- **Action:** accept baseline; S2 uses root wrappers split by package/config, treats any coverage
  refusal as failure, and never promises the base-red commands green.
- **Evidence:** worklog static gate table.

## 2026-08-30 — Owner retains PR and evaluator dispatch

- **What:** Harness defaults normally create a draft PR early and dispatch a separate evaluator.
- **Source:** harness run-loop versus explicit owner request.
- **Expected:** author creates draft PR and may launch PLAN-EVAL through the prescribed route.
- **Actual:** owner said “Do not open a PR” and will handle PR creation, taxonomy, and PLAN-EVAL
  dispatch after S1 is pushed.
- **Severity:** minor, explicitly authorized.
- **Action:** accept; push only with the exact refspec and stop before S2.
- **Evidence:** user kickoff and `supervisor.md` override.

## 2026-08-30 — PLAN-EVAL cycle 1 exposed selector and generated-corpus ceiling drift

- **What:** Cycle 1 found that the locked S2C claim could neither select its runtime gate nor edit
  its documentation path without violating the shared-carrier rule.
- **Source:** PLAN-EVAL verdict `1a1a0d53` at author head `402c552f`, posted to PR #1781; owner
  confirmation against the base tree.
- **Expected:** The original 12 paths covered both E2E gate definition/selection and a local how-to
  correction while the four generated-derivative checks remained unchanged.
- **Actual:** `packages/cli/e2e/suites/scaffold/capability-suites.ts:50` owns `RUNTIME_GATES` and is
  the only runtime-suite selector, but was absent from the ceiling. Conversely,
  `docs/site/web-layer/how-to/customize-fresh-ui.md` emits the
  `pages/web-layer/how-to/customize-fresh-ui/index.md` member listed in
  `packages/cli/src/kernel/assets/agent-docs.generated.ts:181`; editing it would move shared agent
  docs/publish/assets carriers that D17 correctly reserves for the supervisor.
- **Severity:** significant, cycle-1 plan repair.
- **Action:** keep the ceiling at 12 by swapping the how-to out and `capability-suites.ts` in. Keep
  D17 locked. Defer all public-doc corrections below to their owning docs/generated-carrier work;
  they are known-stale, owned elsewhere, and out of scope for this leaf:
  - `docs/site/web-layer/how-to/customize-fresh-ui.md` — generated-corpus member; planned edit
    deferred.
  - `docs/site/quickstart.vto:247-260` — still describes the old three-file output and manual
    binding/check path.
  - `docs/site/cli-reference.md:104` — still says `ui:add` has no dry-run surface.
  - `docs/site/web-layer/fresh-ui.md:245-249` — still describes re-copy/force behavior that the
    corrected planned semantics supersede.
- **Evidence:** focused base reads of the selector, generated asset membership, and the exact three
  stale passages; corrected ceiling/cascade/S2C rows in `plan.md`.

## 2026-08-30 — `initialDataUpdatedAt` wording overstated the Fresh surface

- **What:** D10's boundary was correct, but the worklog described the option as required.
- **Source:** PLAN-EVAL cycle 1 advisory and
  `deno doc --filter IslandQueryOptions
  packages/fresh/src/application/query/mod.ts` at the locked
  base.
- **Expected:** required `initialDataUpdatedAt` field.
- **Actual:** `initialDataUpdatedAt?: number` is optional in `IslandQueryOptions`.
- **Severity:** minor; no boundary or dependency change.
- **Action:** state that the upstream option is optional while the #1357 generated-data contract
  deliberately always supplies it with seeded `initialData`; #1360 remains independent.
- **Evidence:** real `deno doc` output and corrected D10/worklog wording.

## 2026-08-30 — S2A whole-suite composition advanced one in-ceiling fixture

- **What:** The kernel's typed route-registration preflight made three untouched app-root command
  tests fail because their synthetic Fresh apps contained only directories and no `router.ts`.
- **Source:** First whole `packages/cli` run after the focused kernel suite went green.
- **Expected:** S2A would touch ceiling paths 1–2; path 6 was scheduled with S2B.
- **Actual:** Whole-package exit 1 reported 835 passed (541 steps) and three failures, all in
  `ui-app-root-command_test.ts` at the missing-router precondition. The file is already locked
  ceiling path 6 and its fixture models the composed consumer of the S2A behavior.
- **Severity:** minor, in-ceiling slice-order drift; no scope or public-surface expansion.
- **Action:** Advance only the canonical `router.ts` fixture setup into S2A. Leave all path-6 public
  option/help assertions for S2B. Rerun the entire CLI and nested E2E package suites.
- **Evidence:** focused consumer 7/0; whole CLI 838/0 (541 steps); nested E2E 168/0.
