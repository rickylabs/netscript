# Context Pack: Slice G consumer guidance and hosted acceptance hook

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-cli-resource-slice-acceptance--1354-g` |
| Branch | `feat/cli-resource-slice-acceptance` |
| Current phase | `live-main exact-head evidence complete — isolated hosted PASS and fresh IMPL-EVAL pending` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Exactly the eight amended product files remain in scope after merging `origin/main` `e14322c511bbf26018c617c12f639474b6092c32` without rebasing. Product head `a2366577fd8232c8e08e078b03d1e3cc84793b92` generates `people` and orders `database.codegen` → `generated.service-client-contract` → resource first run → resource rerun → UI data-screen → generated quality/type-check. Exact-head focused tests are 68/68 and the full CLI suite is 1788/1788; all Tier-A gates are green. Two full shared-host runtime runs passed 42 gates and timed out only at Aspire startup because DCP-advertised proxy ports diverged from healthy Docker mappings. PR #1958 remains open and must be retargeted to `main`.

## Completed

- Read the requested skills, harness workflow, Archetype 6 guidance, relevant doctrine, and locked upstream plan.
- Implemented IDs, resource gate definitions, composition, runtime selection, exact command/stdout tests, rendered guidance, and the authorized runner stdout fixture in exactly eight product files.
- Focused regressions pass 68/68; full CLI tests pass 1788/1788; CLI check reports 0 diagnostics across 1004 files; scoped lint/fmt report 0 findings.
- Asset/publish/docs/JSR/fitness gates all exit 0; doctrine reports `FAIL=0` throughout and quality scan reports 0 findings.
- An isolated stock-init sqlite proof passed init, service generation, codegen, first resource generation (11 writes), and identical rerun (11 skips) without invoking the hosted runtime suite.
- Merged final Slice F from main without rebasing, preserved the eight-file Slice G diff, and verified all four carrier freshness gates.
- Ran the full unsplit runtime suite: the first live-main run found and resolved the UI data-screen ordering prerequisite; two exact-head runs then proved the complete #1354 prefix before a repeated shared-host Aspire/DCP infrastructure timeout.
- Recorded `PLAN-EVAL: N/A` per owner direction.

## In Progress

- Isolated hosted runtime execution on the PR and fresh native opposite-family IMPL-EVAL.

## Next Steps

1. Commit and push the live-main evidence head; retarget PR #1958 to `main` and update its body/lifecycle honestly.
2. Obtain an isolated green `scaffold.runtime` receipt through the PR's hosted lane.
3. Run fresh separate-session IMPL-EVAL for the final product/evidence SHA and advance lifecycle only if both pass.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Generate `people` from client `users`, procedure `list`, with `--partial`. | IMPL-EVAL cycle 1 | Explicit selection avoids two-client ambiguity; `people` avoids init's existing `users` router alias. |
| Execute after database codegen and `generated.service-client-contract`, before UI data-screen. | IMPL-EVAL cycle 1 + live-main runtime | Codegen materializes the imported Zod contract; resource reconciliation must precede the UI gate's quoted router-key mutation. |
| Rerun must report 11 skips and zero writes/conflicts. | planner/stager/reconciler | Eight owned leaves plus three shared files. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| eight amended Slice G product paths | modified/new | Implementation complete, including authorized item 8. |
| `.llm/runs/feat-cli-resource-slice-acceptance--1354-g/*` | new | Required harness context and blocker evidence. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Focused 68/68; full CLI 1788/1788; check 1004 files/0 diagnostics; lint/fmt 8 files/0 findings. |
| Fitness | PASS | `arch:check` and `quality:gate` exit 0; `FAIL=0`; scanner findings 0. |
| Runtime | #1354 prefix PASS / Aspire tail INFRA FAIL | Two exact-head runs: 42 passed, 1 failed at `runtime.aspire-start`, cleanup passed; isolated hosted PASS pending. |
| Consumer | PASS | Guidance, first-write, identical zero-write rerun, UI ordering, and generated-project quality/type-check all executed successfully. |

## Open Questions

- Whether the isolated PR runner avoids the shared-host DCP proxy mismatch; lifecycle remains blocked until a complete one-pass PASS.

## Drift and Debt

- Drift: captured-stdout reachability required item 8; PR #1891 authorized and resolved it. Cycle 1 exposed untraced codegen and route-alias prerequisites. The first live-main run exposed a further UI router-mutation prerequisite. All product drift is resolved inside the ceiling; repeated Aspire proxy mismatch is recorded as infrastructure drift.
- Debt: none.

## Commits

- Main merge: `008d3264c5352abf6d1e3798d580550ec98e7e7c`.
- Live-main ordering fix / product head: `a2366577fd8232c8e08e078b03d1e3cc84793b92`.
- PR: #1958, head `feat/cli-resource-slice-acceptance`; base update to `main` pending.
