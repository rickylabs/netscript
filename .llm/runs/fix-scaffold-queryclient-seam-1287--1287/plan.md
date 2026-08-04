# Plan: structurally sound scaffold QueryClient seam

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-scaffold-queryclient-seam-1287--1287` |
| Branch | `fix/scaffold-queryclient-seam-1287` |
| Phase | `plan` |
| Target | `packages/sdk`, `packages/cli/e2e`, Fresh query docs |
| Archetype | `2 - Integration Package` |
| Scope overlays | `frontend + docs + scaffold` |

## Archetype

Archetype 2 applies because the SDK owns a typed integration boundary over TanStack Query and the
Fresh package consumes that boundary. The scaffold overlay adds a generated-consumer proof.

## Current Doctrine Verdict

Strengthen the existing integration seam: expose the concrete capability the factory creates while
keeping package-owned narrow ports structurally derived and mockable.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| `A2` | Types at the package boundary must describe the runtime object truthfully. |
| `A6` | Generated consumers must be validated through their public workflow. |

## Goal

A fresh Postgres/service scaffold type-checks its catalog showcase without casts, and regression
coverage fails whenever generated application code leaves the workspace check surface.

## Scope

- Return the real TanStack `QueryClient` type from `createNetScriptQueryClient`.
- Derive `QueryClientPort` from the concrete client so narrow SDK consumers remain sound.
- Make the generated-project gate run the generated workspace's own `deno task check`.
- Remove the query-bridge cast and obsolete TS2551/TS2345 concession.
- Prove the result in a fresh `--db postgres --service --yes` scaffold with artifact evidence.

## Non-Scope

- No TanStack runtime behavior changes.
- No closure claim for umbrella #1278 beyond its query-bridge exemplar.
- No lockfile changes.

## Hidden Scope

- Update type fixtures so return-type erosion and loss of `prefetchQuery` fail compilation.
- Reconcile the #1278 inventory row after proof.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Factory returns `QueryClient`. | It constructs that exact runtime object and Fresh requires its full public contract. |
| D2 | `QueryClientPort` is a `Pick<QueryClient, ...>`. | The narrow injection seam remains, but cannot drift incompatibly from its implementation. |
| D3 | E2E gate runs `deno task check`. | The generated workspace owns its member list; duplicating it caused the missing `apps` coverage. |
| D6 | No local PLAN-EVAL. | Milestone ruling composes draft→ready augmentation with the orchestrator pre-merge gate. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Structural vs narrow fix | resolved | Structural fix is small and eliminates both generated and documented bridges. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Public port removal breaks consumers. | Retain compatibility exports; only derive the port's method set. |
| Scaffold gate loses JSR flags. | The workspace task is the requested user-facing contract; prove local-source fresh scaffold separately. |
| Validation mutates `deno.lock`. | Snapshot and preserve the pre-existing unowned row; stage explicit paths only. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| `AP-14` | risk | Reference the upstream type where truthful; do not create a parallel incompatible mirror. |
| Cast bridge | existing | Remove both SDK return cast and documentation double cast. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Type surface | yes | SDK type fixture accepts concrete `QueryClient` and `prefetchQuery`. |
| Scaffold coverage | yes | Gate contract asserts `deno task check`; fresh artifact lists zero errors. |
| Package quality | yes | Scoped SDK/Fresh/CLI checks and tests. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| Issue #1278 query-bridge inventory row | update | Mark only the cast/concession exemplar earned; umbrella remains open. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | RED type contract | SDK type fixture before implementation | Fails on `QueryClientPort`/`prefetchQuery`. |
| 2 | RED scaffold gate | focused scaffold-gates test before gate change | Fails because command omits generated task/apps. |
| 3 | Focused tests | SDK + CLI E2E focused test tasks | Pass. |
| 4 | Scoped check | repo check wrapper for touched TS roots | Zero diagnostics. |
| 5 | Fresh consumer | scaffold `--db postgres --service --yes`, then `deno task check` | Artifact records zero errors and catalog showcase inclusion. |

## Risks

- Upstream generic signatures may expose slow types; retain explicit factory return annotation and run JSR/type gates.

## Dependencies

- `@tanstack/query-core` is already a direct SDK dependency.

## Drift Watch

- Any need for generated casts, template edits, or exclusion of app routes is significant drift.
