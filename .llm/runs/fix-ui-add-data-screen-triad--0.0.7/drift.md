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
