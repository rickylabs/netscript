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

PLAN-EVAL cycle 2 is terminal `PASS`; S1, S2, and S3 are accepted. S3 preserves loader-owned cache
age in both canonical island dialects, guards the emitted shape, and adds a controlled-clock browser
fixture through the public Fresh query wrapper. The browser fixture is wired into `test:browser` but
has not run because the gate remains lease-blocked. The ruled CLI generator/migration and Fresh
hydration notes live in the publishable package READMEs. Full CLI and Fresh non-browser suites are
green. S4 resumed from its initial fail-closed formatting record using explicit per-member configs:
format, lint, asset freshness, and exact-pin audits pass. The full export-map doc audit passes for
CLI and carries Fresh's 45 and SDK's 3 pre-existing diagnostics with exact attribution at
`c53726c69`; the plugin-streams finding remains distinct as newly exposed, not newly caused. All
three per-member JSR audits exit 0 with WARN-only findings, and all three checked per-member publish
dry-runs pass. Binding `check` passes at `35061bc80`, but binding `test` fails one of 4,221 results:
S2 added `generated.deno-lint` to the service suite without updating its E2E registry expectation.
The focused test passes 19/19 at `c53726c69`, so this was leaf-caused rather than carried. Tier-A
authorized a one-line, order-sensitive expectation repair at `32ea23f50`; all four fresh binding
receipts now PASS at that head, including 4,202/0 tests and the workspace publish dry-run. Draft PR
#1664 retains both closing keywords and remains draft. S4 is cheaply sufficient; expensive gates
remain lease-blocked and unrun. Tier-A subsequently proved Expensive-Gate Release Condition 3 was
documentation-only: no CLI E2E gate executed the planned second-service, key-isolation, or
settled-refetch scenarios. S4-F2 is therefore a pre-S5 implementation repair. Its plan amendment is
locked before E2E code. The four gates and split static/CDP probe are implemented with 25/0 focused
tests and clean focused check/lint. Recovery review then found that the first browser adapter resumed
a response-stage pause with the wrong CDP command and used a fixed-delay baseline. The additive
repair switches to `Fetch.continueResponse`, explicitly establishes a completed positive list
baseline across a 500 ms quiet window, and adds late-initial-request plus source-wiring regressions
(focused probe file: 8/0). The two receipts at `787cfa928` are superseded-only. Four replacement
binding receipts now PASS at corrected content head `2c8219968`: check has zero diagnostics, tests
are 4,210/0 with 19 ignored, workspace publish dry-run passes, and architecture check has zero
failures. Exact-set recomputation is SUFFICIENT. A subsequently leased `scaffold.runtime` run at
`b14975af7` passed both real add/generate gates but failed the static contract probe (6 passed / 1
failed): database codegen still followed the probe, leaving the real generated Zod import absent,
and the probe reused a users-shaped input against the offset-based payments contract. Cleanup passed,
the leak report is clean, and the lease was released before F3 repair. F3 scope/design is being
committed before product edits. F3 now preserves canonical database codegen and moves the static
probe after it, fails explicitly if real generated Zod output is absent, derives users/payments
inputs independently from their real generated contract schemas, and proves own/cross key-prefix
behavior without tail equality. Focused check is clean, probe plus registry tests pass 29/0, and a
no-Aspire/no-Docker replay of real database codegen plus only the static probe exits 0. No new lease
or expensive command is authorized.

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

- F4 amendment is independently committed at `b40616a81`; repaired content is committed at
  `7876aa109`. Focused validation passes and all four `s5-f4-*` binding receipts PASS at that exact
  content head. Exact-set sufficiency is SUFFICIENT with no reasons. Earlier S5/S4 failures and
  attributed baselines remain append-only. Lease released; no expensive gate is authorized.

## Next Steps

1. Commit and explicitly push the four generated `s5-f4-*` receipts and evidence summary.
2. Post one structured F4 receipt covering amendment, repair, sequence tests, and exact-set
   sufficiency.
3. Stop for fresh features Tier-A; do not request or run an expensive gate.

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
| `packages/cli/e2e/tests/presentation/suite-registry_test.ts` | Modified | Exact service-suite expectation now includes the intentional generated lint gate in emitted order. |
| `packages/cli/e2e/src/application/gates/scaffold/service-client-{runtime,input}-probe.ts` | New | Real-contract, schema-ready two-service static proof. |

## Gates

| Gate family | Current status                                                                                                                    | Evidence                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Static      | Four `s5-f4-*` binding receipts PASS at `7876aa109`; exact-set sufficiency SUFFICIENT. All earlier FAIL and superseded evidence remains preserved. | `worklog.md`; binding receipts |
| Fitness     | Terminal cycle-2 PLAN-EVAL `PASS`                                                                                                 | `plan-eval.md`               |
| Runtime     | `scaffold.runtime` FAIL: 20 passed / 1 failed / 0 skipped; `generated.service-client-contract` failed. Cleanup proven empty. | `reports/s5-runtime-failure.md`; suite-owned raw log |
| Consumer    | `fresh-browser` NOT_RUN because the runtime prerequisite failed; no catalog receipt exists. | S5 conditional contract |

## Open Questions

- The Fresh/SDK documentation defects require separate scope if they are to be repaired; this leaf
  carries them with attribution and does not repair them inline.
- The S2 service-suite `generated.deno-lint` expectation gap is resolved by the reviewed S4-FIX1
  test-only repair.

## Drift and Debt

- Drift: issue paths/names moved; naming fixed; stale SDK comment; missing frontend reference; and
  the initial plan misclassified `scaffold.runtime` as a catalog-backed receipt gate before Tier-A
  corrected it to the release-gate class.
- Debt: no new or updated architecture debt proposed.

## Commits

- See draft PR #1664's commit list and per-slice PR comments.
