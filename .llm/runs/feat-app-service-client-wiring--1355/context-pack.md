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

PLAN-EVAL cycle 2 is terminal `PASS`; S1 and S2 are accepted. S3 now preserves loader-owned cache
age in both canonical island dialects, guards the emitted shape, and adds a controlled-clock browser
fixture through the public Fresh query wrapper. The browser fixture is wired into `test:browser` but
has not run because the gate remains lease-blocked. The ruled CLI generator/migration and Fresh
hydration notes live in the publishable package READMEs. Full CLI and Fresh non-browser suites are
green. Draft PR #1664 retains both closing keywords and remains draft. No expensive gate has run.

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
- Repaired S2-F1 by reusing validation-only client planning before the add path's first write; the
  add-specific missing-contract regression proves appsettings/workspace byte identity and absence
  of service, contract, and Aspire-helper output.
- Repaired S2-F2 by removing the test's pre-C1 `bridgeInvalidation` expectation and asserting the
  complete SDK import set equals only client/query, with the direct invalidation after queries.
- Passed `props.cachedAt` as `initialDataUpdatedAt` in both DB and memory showcase islands and
  regenerated `embedded.generated.ts` canonically.
- Added omission regressions for both rendered islands and a lease-gated browser fixture comparing
  an old (`hydrationNow - 60_000`) and fresh (`hydrationNow`) snapshot at `staleTime: 15_000`.
- Documented the generator ownership/flags/atomic validation/disabled-service/dialect/migration
  contract in the CLI README and the hydration-age contract in the Fresh README.

## In Progress

- S3 is complete and stopped for fresh Tier-A and pre-expensive-gate convergence review.

## Next Steps

1. Await the coordinator's S3 Tier-A and pre-expensive-gate convergence verdict; do not start S4.
2. Keep both expensive gates lease-blocked until explicit release.

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
| `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab*.tsx.template` | Modified | Preserve loader-owned cache age in both dialects. |
| `packages/cli/README.md` and `packages/fresh/README.md` | Modified | Ruled generator migration and hydration-age notes. |
| `packages/fresh/tests/query-hydration-age_browser.ts` and fixture | New | Controlled old/fresh public-wrapper browser scenarios. |
| `packages/fresh/deno.json` | Modified | Include hydration-age coverage in the lease-gated browser task. |

## Gates

| Gate family | Current status                                                                                                                    | Evidence                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Static      | CLI check and full source suite PASS (598/598); Fresh check and full non-browser suite PASS (245/245). CLI export doc lint passes. Fresh export-map doc lint carries 45 pre-existing diagnostics; S4 owns final attribution. Asset freshness is rechecked at the committed head. | `worklog.md` |
| Fitness     | Terminal cycle-2 PLAN-EVAL `PASS`                                                                                                 | `plan-eval.md`               |
| Runtime     | NOT_RUN / lease-blocked                                                                                                           | `plan.md` release conditions |
| Consumer    | NOT_RUN / implementation-dependent                                                                                                | `plan.md` S5                 |

## Open Questions

- None for S3. S4 remains blocked pending fresh Tier-A and separate dispatch.

## Drift and Debt

- Drift: issue paths/names moved; naming fixed; stale SDK comment; missing frontend reference; and
  the initial plan misclassified `scaffold.runtime` as a catalog-backed receipt gate before Tier-A
  corrected it to the release-gate class.
- Debt: no new or updated architecture debt proposed.

## Commits

- See draft PR #1664's commit list and per-slice PR comments.
