# Context Pack: #1351 SDK transport policy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `refactor-sdk-transport-policy--1351` |
| Branch | `refactor/sdk-transport-policy` |
| Current phase | implement — Slice 3 complete pending commit |
| Archetype | `2 — Integration` |
| Scope overlays | none |

## Current State

PLAN-EVAL passed at `871caac96`. Slices 1–3 implement the approved contract, wire one frozen
decision through the sole HTTP stack, and make the typed Desktop client consume the same resolver
without changing MessagePort frames. No dependency configuration or lock file changed.

## Completed

- Contract-owned `policy.cache` metadata and inference/storage tests.
- Public upstream-neutral `transportPolicy?` option vocabulary for HTTP and Desktop typed clients.
- Exact exported-internal `resolveTransportPolicy` with direct behavior/validation tests.
- Public declaration neutrality and internal non-export proof.
- Slice 1 structured static, focused runtime, and quality gates.
- HTTP method/fallback/max-URL/dedupe/cache-group projections now come only from the owned policy.
- Unary attempts reuse one policy/descriptor/prepared call; iterator reconnect creates a fresh
  decision and preparation.
- Real pending-fetch tests prove same authorization/locale headers coalesce and differing headers
  dispatch separately.
- Typed Desktop calls resolve policy before raw link dispatch; invalid override results produce no
  outbound frame and POST-only adaptation is not serialized.
- Compile-time exact-key, runtime exact-snapshot, public-doc, and packed-import probes enforce the
  contribution method-secrecy boundary.

## In Progress

- Slice 3 commit/push and PR evidence comment.

## Next Steps

1. Commit and push Slice 3 with its PR evidence comment.
2. Document and regression-test the deprecated no-op `port`/`timeout` options.
3. Take the single final `main` integration and run the approved 10-step validation plan.

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
| `http-client-link.ts`, `service-client.ts` | changed | sole HTTP link consumes the owned policy |
| stable-v1 adapter ports/prepared-call | changed | one policy/descriptor per logical epoch |
| contribution adapter/runtime/observability tests | changed | hard HTTP/retry/reconnect/dedupe proof |
| typed Desktop client + Desktop tests | changed | common policy resolution, unchanged framing |
| contribution validation/private/type tests | changed | exact method-secrecy enforcement |
| scoped run artifacts | new/changed | implementation evidence and resumable state |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Slices 1–3 PASS | structured check/lint/fmt wrappers |
| Fitness | Slices 1–3 PASS | `quality:gate`; source/doc/packed boundary checks |
| Runtime | Slice 3 PASS | structured Desktop/secrecy suite, 17/17 |
| Consumer | Slice 3 PASS | POST-only simulation, no-frame invalid result, exact snapshot |

## Open Questions

- None. A locked-decision contradiction is a stop-and-report condition.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened; existing doc/cardinality warnings remain out of scope.

## Commits

- See draft PR #1889's commit list and per-slice evidence comments.
