# Context Pack: Slice G consumer guidance and hosted acceptance hook

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-cli-resource-slice-acceptance--1354-g` |
| Branch | `feat/cli-resource-slice-acceptance` |
| Current phase | `owner-authorized hosted acceptance correction implemented; exact-head gates pending` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

The owner resumed the run after the exact-head hosted failure and authorized a narrow correction
within #1354's accepted resource scope. The final product ceiling is eleven existing files: the
original eight plus the browser probe, its exact semantic test, and the resource command test.
The probe now covers final Slice F's neutral `/examples/users` resource and Slice G's generated
`/people` resource at both viewports; the resource gate test proves generation precedes the browser
gate; the command test proves unresolved app-root selection fails loudly with zero writes. Initial
focused tests pass 48/48. Exact-head Tier A, isolated hosted acceptance, and fresh IMPL-EVAL remain
pending, so PR #1958 stays `status:impl-eval` and #1354 acceptance remains unchanged for now.

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

- Exact-head validation, isolated hosted acceptance, and fresh separate-session IMPL-EVAL for the amended product head.

## Next Steps

1. Commit and push the eleven-file product head with the tracked Harness amendment.
2. Run exact-head Tier A and both isolated hosted runtime tiers; do not use a host runtime lease.
3. Obtain a fresh separate-session IMPL-EVAL, then update #1354/#1958 only from green evidence.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Generate `people` from client `users`, procedure `list`, with `--partial`. | IMPL-EVAL cycle 1 | Explicit selection avoids two-client ambiguity; `people` avoids init's existing `users` router alias. |
| Execute after database codegen and `generated.service-client-contract`, before UI data-screen. | IMPL-EVAL cycle 1 + live-main runtime | Codegen materializes the imported Zod contract; resource reconciliation must precede the UI gate's quoted router-key mutation. |
| Rerun must report 11 skips and zero writes/conflicts. | planner/stager/reconciler | Eight owned leaves plus three shared files. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| eleven owner-authorized Slice G product paths | modified/new | Original eight plus hosted probe/test and generator app-root negative regression. |
| `.llm/runs/feat-cli-resource-slice-acceptance--1354-g/*` | new | Required harness context and blocker evidence. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Focused 68/68; full CLI 1788/1788; check 1004 files/0 diagnostics; lint/fmt 8 files/0 findings. |
| Fitness | PASS | `arch:check` and `quality:gate` exit 0; `FAIL=0`; scanner findings 0. |
| Runtime | #1354 path PASS / full suite FAIL | Hosted retry: PostgreSQL 89/1 and SQLite 84/1; only `behavior.app-reference` failed, cleanup passed. |
| Consumer | PASS | Guidance, first-write, identical zero-write rerun, UI ordering, and generated-project quality/type-check all executed successfully. |

## Open Questions

- Whether both isolated database tiers render the two neutral resource routes with the pinned markers.

## Drift and Debt

- Drift: captured-stdout reachability required item 8; PR #1891 authorized and resolved it. Cycle 1 exposed untraced codegen and route-alias prerequisites. The first live-main run exposed a further UI router-mutation prerequisite. All Slice G product drift is resolved inside the ceiling. The isolated hosted browser tail and the final missing-app-root negative-test mapping require files outside the ceiling and remain explicit blockers.
- Debt: none.

## Commits

- Main merge: `008d3264c5352abf6d1e3798d580550ec98e7e7c`.
- Live-main ordering fix / product head: `a2366577fd8232c8e08e078b03d1e3cc84793b92`.
- Pushed evidence head: `0cc736365c1a3886129920e8599d9e61895a40f0` (cycle-3 evaluator receipt is the only current tracked modification).
- PR: #1958, head `feat/cli-resource-slice-acceptance`, base `main`, status `status:impl-eval`.
