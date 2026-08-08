# Context Pack: W2-A #1325 generated trigger KV bootstrap

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/w2-a-1325` |
| Branch | `fix/triggers-generated-kv-adapter-bootstrap` |
| Current phase | `close` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

Implementation, gates, Tier-A review, and the separate Claude/Fable IMPL-EVAL are complete. A
current-head repo-wide test then exposed an ordering mismatch between runtime resources and the
capability list. The focused repair preserves the pre-existing interleaved API/runtime wait order
and derives both consumers from `KV_BACKGROUND_RUNTIME_RESOURCES`; both focused test files pass.
Generated-workspace probes still cover Redis registration and real Deno KV set/get. The granted
exact one-pass `scaffold.runtime` exited 0 with 76 passed/0 failed; it was not rerun for this repair.

Tier-A review finding fixed: generated probe files now use ignored `plugins/triggers/.tmp/`, outside
the plugin's `src/**/*.ts` publish include, without changing module resolution.

## Completed

- Skills, issue, harness workflow, doctrine, debt, public API, sibling seam, and current E2E gates read.
- Branch/base verified exactly.
- Provider selection/registration authority identified in `@netscript/kv`.
- Accepted verification-shape and connector-convergence debt recorded without expansion.

## In Progress

- Push and comment the focused current-head CI repair for orchestrator pre-merge rerun.

## Next Steps

1. Commit, push, and comment the focused CI repair with raw exit codes.
2. Orchestrator reruns the pre-merge gate on the new head and merges only when green.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Core owns provider selection/registration | `packages/kv` + doctrine A5/A10 | Plugin stays thin. |
| Behavioral generated-output proof | issue acceptance + AP-18 | Text-only import assertions are insufficient. |
| Shared enumerated runtime invariant | issue acceptance | Prevents saga/trigger sibling drift. |

## Files Changed

- Trigger generated-runtime glue and its behavioral resource tests.
- CLI E2E KV-background-runtime enumeration and healthy-wait wiring.
- Slice harness evidence and plugin-local `.tmp/` ignore surface.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | Separate PLAN-EVAL comment `5228434053` |
| Static/Fitness/Runtime/Consumer | PASS | See `worklog.md`; serialized suite 76/0 |
| Separate IMPL-EVAL | PASS | PR #1394 comment `5228627533` |
| Current-head CI repair | PASS locally | suite registry 16/16; runtime builders 14/14 |

## Open Questions

- None within W2-A scope.

## Drift and Debt

- Drift: stale prepared supervisor identity/evaluator, missing shared-contract file path, and the
  Deno KV live-AppHost narrowing with its defect-specific rationale.
- Debt: existing triggers verification-shape and connector convergence accepted; neither deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
