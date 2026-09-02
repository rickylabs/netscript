# Context Pack: Slice G consumer guidance and hosted acceptance hook

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-cli-resource-slice-acceptance--1354-g` |
| Branch | `feat/cli-resource-slice-acceptance` |
| Current phase | `IMPL-EVAL cycle-2 fix complete — evaluator/hosted gates pending` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Exactly the eight amended product files remain in scope on Slice F head `8c27ffe164fc8dab8e16796e602693e6dea95c1e`. IMPL-EVAL cycle 1 exposed codegen ordering and `users` route-alias collision defects. Cycle 2 now generates `people` and executes the pair after database codegen plus its immediately adjacent service-client contract probe. Focused tests are 88/88 and the full CLI suite is 1716/1716; all requested author-lane gates are green. Non-draft stacked PR #1958 remains open. Hosted runtime remains CI-owned.

## Completed

- Read the requested skills, harness workflow, Archetype 6 guidance, relevant doctrine, and locked upstream plan.
- Implemented IDs, resource gate definitions, composition, runtime selection, exact command/stdout tests, rendered guidance, and the authorized runner stdout fixture in exactly eight product files.
- Focused regressions pass 88/88; full CLI tests pass 1716/1716; CLI check reports 0 diagnostics; scoped lint/fmt report 0 findings.
- Asset/publish/docs/JSR/fitness gates all exit 0; doctrine reports `FAIL=0` throughout and quality scan reports 0 findings.
- An isolated stock-init sqlite proof passed init, service generation, codegen, first resource generation (11 writes), and identical rerun (11 skips) without invoking the hosted runtime suite.
- Recorded `PLAN-EVAL: N/A` per owner direction.

## In Progress

- Hosted runtime execution and separate IMPL-EVAL by downstream CI/evaluator lanes.

## Next Steps

1. Run separate-session IMPL-EVAL cycle 2 for the final head.
2. Await hosted `scaffold.runtime` evidence on PR #1958.
3. Advance lifecycle only after those downstream gates pass.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Generate `people` from client `users`, procedure `list`, with `--partial`. | IMPL-EVAL cycle 1 | Explicit selection avoids two-client ambiguity; `people` avoids init's existing `users` router alias. |
| Execute after database codegen and `generated.service-client-contract`. | IMPL-EVAL cycle 1 + existing order regression | Codegen materializes the imported Zod contract; the probe remains adjacent to codegen and the resource pair follows it before generated quality/type-check gates. |
| Rerun must report 11 skips and zero writes/conflicts. | planner/stager/reconciler | Eight owned leaves plus three shared files. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| eight amended Slice G product paths | modified/new | Implementation complete, including authorized item 8. |
| `.llm/runs/feat-cli-resource-slice-acceptance--1354-g/*` | new | Required harness context and blocker evidence. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Focused 88/88; full CLI 1716/1716; check 980 files/0 diagnostics; lint/fmt 8 files/0 findings. |
| Fitness | PASS | `arch:check` and `quality:gate` exit 0; `FAIL=0`; scanner findings 0. |
| Runtime | hosted only | Local run prohibited. |
| Consumer | static PASS / hosted pending | Guidance and resource definition tests pass; runtime execution is CI-owned. |

## Open Questions

- None in the author lane; hosted runtime and separate IMPL-EVAL remain downstream gates.

## Drift and Debt

- Drift: captured-stdout reachability required item 8; PR #1891 authorized and resolved it. Cycle 1 then exposed untraced codegen and route-alias prerequisites; cycle 2 resolves both while preserving the existing codegen-to-contract adjacency.
- Debt: none.

## Commits

- Implementation commit: `97ad667cc0bf99f974e1673ed7d4dfce41932ba3`.
- PR: #1958, base `feat/cli-resource-slice-activate`, head `feat/cli-resource-slice-acceptance`.
