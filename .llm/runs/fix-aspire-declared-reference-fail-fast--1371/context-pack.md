# Context Pack: emitted fail-fast for declared background references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-declared-reference-fail-fast--1371` |
| Branch | `fix/aspire-declared-reference-fail-fast` |
| Current phase | `gate` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Current State

Slice 1 is committed as `099370709` with the expected RED evidence (3 passed / 6 failed). Slice 2 now emits required reference preflight before `addExecutable`; the new suite is green 9/9 and the three-suite neighborhood proof is green 69/69. The preliminary full gate set is green, including quality `allowCount: 7`, unchanged assets, and disclosed CLI publish/JSR WARN baselines.

## Completed

- Harness/skill/doctrine bootstrap and base verification.
- Bounded research, locked design, gate selection, and drift note.
- RED emitted-module tests covering raw-key parity, positive service/plugin binding, missing resources, unresolved endpoints, and pre-registration ordering.
- Emitted service/plugin preflight and deterministic configuration error before processor registration.
- Preliminary full static/fitness/publish gate pass.

## In Progress

- Implementation sign-off commit, followed by final-head receipt production.

## Next Steps

1. Commit the implementation/harness sign-off slice.
2. Rerun every required receipt at that exact head, atomically push, and open/update the draft PR without marking it ready.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Preflight before `addExecutable` | plan D1 | Stronger than only ordering before returned-map insertion. |
| Exact deterministic message | plan D2 | Asserted as contract. |
| Raw key preserved | plan D3 | Compared to SDK consumer builder. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-aspire-declared-reference-fail-fast--1371/` | new | Harness state and evidence. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-background_test.ts` | new | RED-first emitted-module contract and runtime-style matrix. |
| `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts` | changed | Pre-registration service/plugin endpoint fail-fast. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | preliminary PASS | Focused 9/9; neighborhood 69/69; root test 4,242 pass / 19 ignored; root check/lint/fmt green. |
| Fitness | preliminary PASS | `quality:scan` allowCount 7; arch/assets/publish/audit exit 0 with baseline warnings disclosed. |
| Runtime | N/A | No runtime lease; emitted-module execution only. |
| Consumer | PASS | Emitted service/plugin key equals SDK `createServerServiceEnvKey('workers-api')`; underscore form absent. |

## Open Questions

- None.

## Drift and Debt

- Drift: requested `implementation-gate.md` absent; canonical static gate used.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
