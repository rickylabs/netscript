# Plan: make generated Fresh Markdown builds deterministic on clean CI runners

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-790-md-hydration-ci--codex` |
| Branch | `fix/790-md-hydration-ci` |
| Phase | `plan` |
| Target | `packages/fresh` Vite integration and `packages/fresh-ui` Markdown regression |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

Archetype 4 is the doctrine classification for both `@netscript/fresh` and
`@netscript/fresh-ui`. The slice changes the Vite behavior exposed by the Fresh builder/integration
surface and its generated Fresh consumer proof; no larger runtime archetype is introduced.

## Current Doctrine Verdict

- `@netscript/fresh`: **Restructure** for existing builder layout debt; this focused Vite file does
  not deepen it.
- `@netscript/fresh-ui`: **Keep**; confirm the runtime registry shape.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A7 | Use Vite's resolver and the generated app import map rather than a new package loader. |
| A8 | Keep dependency identity policy in the existing Vite integration concern. |
| A14 | The clean-runner production build remains executable hydration fitness evidence. |

## Goal

Make the generated Fresh Markdown production build pass from a clean Deno cache, retain the
hydration gate, and emit actionable labeled child-process output on future failures.

## Scope

- Extend the package-owned Vite resolver/dedupe policy to the `@preact/signals` runtime used by
  Fresh client hydration.
- Add a focused resolver regression that is red on the baseline.
- Improve the Markdown production-build assertion to include labeled stdout and stderr.
- Prove the exact generated consumer build with both normal and isolated Deno caches.

## Non-Scope

- The unrelated `@tanstack/ai-preact` peer-version warning; it did not fail Rollup.
- Blanket CI skips, hydration-gate removal, or externalizing the Signals runtime.
- Public API changes, dependency upgrades, or repo-wide lockfile churn.
- Evaluator dispatch or merge; explicitly retained by the supervisor/owner.

## Hidden Scope

- The focused Markdown test scaffolds a full local-source workspace, so the fix must live in the
  generated app's existing `@netscript/fresh/vite` policy rather than a test-only cache warm-up.
- The clean-cache run is the acceptance reproduction because a warm local cache masks the defect.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Canonicalize versioned `npm:`/`npm:/` `@preact/signals` imports to the generated app's bare `@preact/signals` import-map entry before delegated Vite resolution. | The app already owns a deterministic direct pin; the failing transitive range must converge on it. |
| D2 | Add `@preact/signals` to Vite dedupe beside `preact`. | Signals and Preact are a coupled browser runtime and must resolve to one app-owned instance. |
| D3 | Preserve aliases first, `skipSelf`, delegated metadata, and final-ID normalization. | These are the established resolver invariants from the Windows Preact fix. |
| D4 | Report both child stdout and stderr with command context on assertion failure. | Future CI evidence must be actionable without reconstructing swallowed/mixed output. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Change the TanStack AI peer pins | safe to defer | Warning is noisy but not causal; dependency work would broaden scope. |
| Add an explicit cache-prewarm command to generated builds | safe to defer | The owning resolver fix removes cache dependence without encoding Fresh internals in tasks/tests. |
| Run separate evaluator sessions | safe to defer | Explicit owner instruction forbids this lane from dispatching its own evals. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Rewriting similarly prefixed packages | Exact scoped-package regex and negative focused coverage. |
| Losing Vite resolution metadata | Delegate through `this.resolve(..., { skipSelf: true })` and spread the result. |
| False local green from warm cache | Run the exact test with an isolated `DENO_DIR`. |
| Broad framework regression | Run focused Vite tests, focused Markdown tests, Fresh package tests, and scoped check/lint/fmt. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-18 | risk | Assert build semantics and emitted bundle, not a generated-string snapshot. |
| AP-25 | existing edge | Keep command/process behavior in tests and Vite integration; add no load-time side effect. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-3/F-5 | yes | No layering/export changes; `arch:check` passes. |
| F-6/F-7 | yes | `@netscript/fresh` publish dry-run/doc-lint remain clean for `./vite`. |
| F-10 | yes | Focused semantic tests retain the production-build assertion. |
| F-19 | yes | Scoped check/lint/fmt wrappers pass for touched package roots. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| Existing `@netscript/fresh` restructure verdict | none | This Vite-focused fix does not touch the builder debt. |
| New debt | none | No suppression, skip, or deferred violation is planned. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Resolver regression red/green | focused `vite.test.ts` filter/full file | New test fails before implementation and passes after. |
| 2 | Clean-cache consumer | isolated-`DENO_DIR` Markdown production-build test | Production client/server bundles emitted. |
| 3 | Focused Markdown suite | `deno test -A --unstable-kv packages/fresh-ui/tests/registry/markdown-renderer.test.ts` | 2 passed. |
| 4 | Touched roots | scoped check/lint/fmt wrappers for `packages/fresh` and `packages/fresh-ui` | zero findings. |
| 5 | Framework quality | `deno task quality:gate` plus focused package tests/publish surface checks | pass or pre-existing findings explicitly attributed. |
| 6 | Acceptance | Draft PR `check-test` job | green on `feat/beta10-integration` base. |

## Risks

- Clean-cache runs download dependencies and may expose unrelated registry availability; the build
  output formatter keeps those failures diagnosable.

## Dependencies

- Fresh core `2.3.3`, Fresh Vite plugin `1.1.2`, Vite `7.2.2`, Preact `10.29.2`, and
  `@preact/signals` as already pinned by the scaffold catalog.

## Drift Watch

- Any need to change dependency pins, lockfiles, generated scaffold tasks, or hydration coverage.

