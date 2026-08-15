# Context Pack: app-side service client/query wiring

## Run Metadata

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Run ID         | `feat-app-service-client-wiring--1355`               |
| Branch         | `feat/app-service-client-wiring`                     |
| Current phase  | `impl`                                               |
| Archetype      | `2 — Integration` (SDK seam; CLI 6/Fresh 4 retained) |
| Scope overlays | `frontend`                                           |

## Current State

PLAN-EVAL cycle 2 is terminal `PASS`. S1 is accepted and S2 implements the released CLI generator
contract: all manifest services receive owned modules, all expected V1 contracts are validated
before any client or Aspire write, dry-run/force govern both command halves, and invalidation is
emitted directly from `<svc>Queries.list.clientKey()` after the query factory. The rendered SDK
import allowlist is executable coverage. Draft PR #1664 retains both closing keywords and remains
draft. No expensive gate has run.

## Completed

- Verified branch/worktree/base/clean-tree identity and no designed upstream.
- Read the required harness, doctrine, CLI, tooling, Deno/JSR, PR, Fresh, and RTK guidance.
- Re-verified both issue contracts and all current code paths.
- Recorded compatibility, three-package public delta, JSR bar, slice plan, receipt set, and lease
  conditions.
- Committed and pushed S0, opened draft PR #1664, and advanced its single lifecycle label from
  `status:research` to `status:plan` alongside the two phase comments.
- Applied the Tier-A T-1/T-2 plan repair without product, gate-catalog, lockfile, or docs changes.
- Read the cycle-1 evaluator artifact in full and accepted its direct-emit, README, owned-path, and
  whole-command flag rulings.
- Amended research, design, slices, compatibility, and exact scenarios without editing
  `packages/**`.
- Received terminal PLAN-EVAL `PASS`, implemented and stopped after accepted S1, then implemented
  only the separately released S2.
- Corrected the stale server/query-factory key shapes and documented `clientKey()` as the
  factory-consistent path.
- Added and passed two fail-capable `bridgeInvalidation` semantic tests; focused check,
  changed-module doc lint, and `quality:gate` also pass.
- Added an exported all-service generator with deterministic plan/write results and kept its owned
  path to `apps/<app>/lib/<service>.ts`.
- Added 0.0.6-compatible rendered-import/literal-order tests, two-service isolation, disabled-service,
  atomic failure, idempotency, dry-run/force, collision, procedure-rename, add-flow, and Aspire flag
  coverage; regenerated `embedded.generated.ts`.

## In Progress

- S2 is complete and stopped at its Tier-A boundary.

## Next Steps

1. Await a separate coordinator dispatch for S3.
2. Keep both expensive gates lease-blocked until cheap convergence and explicit release.

## Key Decisions

| Decision                                            | Source                 | Notes                                                          |
| --------------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| Router identity is the resource identity            | `plan.md` D1           | Manifest-derived and collision-safe.                           |
| Existing apps change only on generation             | Research compatibility | Regeneration is an explicit source migration.                  |
| Both expensive gates are lease-blocked              | Leaf brief / plan      | Run only after cheap gates are green and coordinator releases. |
| Direct `clientKey()` filter; no SDK overload        | PLAN-EVAL cycle 1      | Preserves SDK 0.0.6 compatibility and satisfies A6.            |
| Client generator owns `apps/<app>/lib/<service>.ts` | PLAN-EVAL cycle 1      | Init-owned showcase remains separate but shares the template.  |
| Disabled services receive owned modules             | PLAN-EVAL cycle 2 C2   | `Enabled` affects runtime registration, not source generation. |

## Files Changed

| Path                                                             | Status   | Notes                                     |
| ---------------------------------------------------------------- | -------- | ----------------------------------------- |
| `.llm/runs/feat-app-service-client-wiring--1355/supervisor.md`   | New      | Session identity and routes.              |
| `.llm/runs/feat-app-service-client-wiring--1355/research.md`     | New      | Re-baselined findings and determinations. |
| `.llm/runs/feat-app-service-client-wiring--1355/plan.md`         | New      | Contract-first slice and gate plan.       |
| `.llm/runs/feat-app-service-client-wiring--1355/worklog.md`      | New      | Design ledger and Phase-1 record.         |
| `.llm/runs/feat-app-service-client-wiring--1355/context-pack.md` | New      | Resumption state.                         |
| `.llm/runs/feat-app-service-client-wiring--1355/drift.md`        | New      | Append-only rebaseline/reference drift.   |
| `packages/sdk/src/query-client/key-bridge.ts`                    | Modified | Accurate key-shape docs and factory path. |
| `packages/sdk/src/query-client/key-bridge_test.ts`               | New      | Match/mismatch semantic regressions.      |
| `packages/cli/mod.ts` and service generate/add feature files     | Modified | Export and wire the all-service generator. |
| `packages/cli/src/kernel/adapters/service/*`                     | Modified | Validate, plan, compare, and write owned modules. |
| `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template` | Modified | Per-service query namespace and direct invalidation. |
| `packages/cli/src/kernel/assets/embedded.generated.ts`           | Modified | Regenerated shipped template asset.       |
| `packages/cli/src/public/features/services/generate/*_test.ts`   | New      | Generator semantics and type-negative proof. |
| `packages/cli/src/public/features/generate/aspire/generate-aspire_test.ts` | New | Whole-command option propagation. |

## Gates

| Gate family | Current status                                                                                                                    | Evidence                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Static      | Focused S2 check (14 files), tests (31), CLI doc lint, and quality gate PASS; SDK export doc lint carries exactly two unrelated pre-existing private-type diagnostics | `worklog.md` |
| Fitness     | Terminal cycle-2 PLAN-EVAL `PASS`                                                                                                 | `plan-eval.md`               |
| Runtime     | NOT_RUN / lease-blocked                                                                                                           | `plan.md` release conditions |
| Consumer    | NOT_RUN / implementation-dependent                                                                                                | `plan.md` S5                 |

## Open Questions

- None for S2. S3 requires a separate implementation dispatch.

## Drift and Debt

- Drift: issue paths/names moved; naming fixed; stale SDK comment; missing frontend reference; and
  the initial plan misclassified `scaffold.runtime` as a catalog-backed receipt gate before Tier-A
  corrected it to the release-gate class.
- Debt: no new or updated architecture debt proposed.

## Commits

- See draft PR #1664's commit list and per-slice PR comments.
