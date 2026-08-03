# Context Pack: sagas generated KV adapter registration

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sagas-kv-glue-registration--w2-f` |
| Branch | `fix/sagas-kv-glue-registration` |
| Current phase | `implement` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

Plan/design are locked. A RED emitted-artifact test now fails on the missing Redis registration, and
a real unfixed local-source scaffold exists under `.llm/tmp/1184-red/saga-kv-red`; its emitted
runtime was inspected and lacks the import. The live AppHost RED is queued behind a foreign #1191
AppHost that acquired the shared slot after preflight.

## Completed

- Read amended #1184 and re-baselined all load-bearing claims.
- Selected Archetype 5 + service overlay and required gates.
- Recorded supervisor identity, research, design, plan, waiver, and environmental drift.
- Captured the emitted-glue RED (exit 1) and verified the fresh scaffold artefact/cache wiring.

## In Progress

- Slice 1: wait for the shared AppHost slot, then capture the real unfixed `KvConnectionError`.

## Next Steps

1. Commit/push the RED test and evidence to draft PR #1193.
2. When the foreign #1191 AppHost stops, start the unfixed scaffold and preserve `KvConnectionError` evidence.
3. Apply the one-line stub fix and continue through owner runtime protocol.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Fix the stub with `@netscript/kv/redis` registration | plan D1 | Generated output is not user-editable authority. |
| Keep Deno-KV compatibility by relying on existing provider selection | plan D2 | Registration does not select Redis. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-sagas-kv-glue-registration--w2-f/*` | new | Harness bootstrap only. |
| `plugins/sagas/src/adapter/resources/resources.test.ts` | changed | RED semantic assertion over emitted runtime glue. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline | doc-lint: 15 existing private refs, 0 missing JSDoc |
| Fitness | pending | plan locks `quality:gate` + F-13 runtime evidence |
| Runtime | queued | foreign #1191 AppHost owns the slot |
| Consumer | RED partial | real scaffold emitted broken glue; live failure pending slot |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: milestone artifacts/legacy service docs absent; isolated start exited; sibling #1191 acquired the AppHost slot after preflight.
- Debt: no new/deepened debt planned; #1093 untouched.

## Commits

- See the draft PR's commit list + per-slice PR comments.
