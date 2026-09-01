# Context Pack: oRPC family 1.15.0

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `deps-orpc-family-1-15--1879` |
| Branch | `deps/orpc-family-1-15` |
| Current phase | `implement` — local proof green; final main integration pending |
| Archetype | N/A — dependency maintenance only |
| Scope overlays | none |

## Current State

All manifest/catalog oRPC declarations and the two exact upstream-tracking fixture imports are at
1.15.0. The graph is single-copy, frozen install succeeds, and the full root test suite is green.

## Completed

- Skills and harness contracts read.
- Every oRPC manifest occurrence enumerated.
- Stable authority, pre-change graph, and exact lock keys captured with exits 0.
- `PLAN-EVAL: N/A` recorded before implementation.
- Proved raised manifests can produce a one-copy/frozen/check-green graph.
- Proved root test then fails because completing the move requires forbidden files.
- Restored all dependency manifests and confirmed explicit lock-only updating cannot displace exact
  `1.14.6` source imports.
- Applied the owner-corrected key-level boundary and raised `plugin-workers-core` oRPC keys without
  touching any streams-core key.
- Applied the coordinator ruling to the two exact upstream fixture pins, regenerated the lock, and
  pruned only Deno's now-unreachable 1.14.6 package-key residue.
- Proved one `@orpc/shared@1.15.0`, one version per oRPC package, and frozen install with an unchanged
  lock hash.
- Classified the sole remaining test failure as direct stale scaffold dependency-catalog fallout;
  after its six oRPC catalog constants moved, the full suite passed with 4,639 tests passed and no
  failures.

## In Progress

- Commit the locally proven slice, integrate then-current `main` exactly once, regenerate/freeze,
  and capture the complete final proof set at the integrated head.

## Next Steps

1. Commit the pre-integration slice.
2. Integrate current `main` once and recapture all final gates.
3. Push explicitly and open the draft PR; owner retains IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| #1876 ownership is key-level | corrected owner boundary | Only streams-core keys are prohibited. |
| Exact SDK fixture tracks upstream | coordinator ruling | Both exact imports move to 1.15.0. |
| Owner runs IMPL-EVAL | owner directive | Stop after draft PR and captured exits. |

## Drift and Debt

- Drift: corrected boundary plus remaining stale-lock blocker; see `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
