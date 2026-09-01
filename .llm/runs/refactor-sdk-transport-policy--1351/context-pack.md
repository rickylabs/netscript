# Context Pack: #1351 SDK transport policy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `refactor-sdk-transport-policy--1351` |
| Branch | `refactor/sdk-transport-policy` |
| Current phase | implement — Slice 1 complete pending commit |
| Archetype | `2 — Integration` |
| Scope overlays | none |

## Current State

PLAN-EVAL passed at `871caac96`. Slice 1 implements the approved public contract and internal
resolver on the current pinned oRPC graph; HTTP and Desktop dispatch are intentionally not wired
yet. No dependency configuration or lock file changed.

## Completed

- Contract-owned `policy.cache` metadata and inference/storage tests.
- Public upstream-neutral `transportPolicy?` option vocabulary for HTTP and Desktop typed clients.
- Exact exported-internal `resolveTransportPolicy` with direct behavior/validation tests.
- Public declaration neutrality and internal non-export proof.
- Slice 1 structured static, focused runtime, and quality gates.

## In Progress

- Slice 1 commit/push and draft PR creation.

## Next Steps

1. Commit and push Slice 1, then open the draft PR with the required taxonomy and milestone.
2. Wire the resolved decision through the stable-v1 logical epoch and sole HTTP link.
3. Prove genuinely overlapping header-safe dedupe and unary/reconnect lifetimes.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Four locked slices, in order | `plan.md`; `plan-eval.md` | Contract is proved before wiring |
| No dependency integration | coordinator ruling / #1879 | Current v1.14.x seams are sufficient |
| Contributions never receive method | locked plan | Exact five-field snapshot remains the only callback input |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/contracts/src/domain/procedure-meta.ts` | changed | additive cache policy metadata |
| `packages/contracts/tests/*procedure-meta*`, `README.md` | changed | storage/inference/docs |
| `packages/sdk/src/ports/service-client.ts` and existing barrels/Desktop types | changed | public option contract |
| `packages/sdk/src/internal/transport-policy.ts` | new | unexported central resolver |
| `stable-v1-adapter.ts` | changed | normalize/freeze `policy.cache` in existing metadata port |
| `packages/sdk/tests/transport-policy_test.ts` | new | direct policy/validation proof |
| `procedure-meta-independence_test.ts` | changed | public neutrality/private absence |
| scoped run artifacts | new/changed | implementation evidence and resumable state |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Slice 1 PASS | structured check/lint/fmt wrappers |
| Fitness | Slice 1 PASS | `quality:gate`; doc JSON boundary test |
| Runtime | Slice 1 PASS | structured focused tests, 7/7 |
| Consumer | Slice 1 PASS | public declaration neutrality/internal absence |

## Open Questions

- None. A locked-decision contradiction is a stop-and-report condition.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened; existing doc/cardinality warnings remain out of scope.

## Commits

- See the draft PR's commit list + per-slice PR comments after Slice 1 lands.
