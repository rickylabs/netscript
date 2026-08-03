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

Plan/design are locked at clean `origin/main`. The current stub omits Redis registration; no product
source has changed. PLAN-EVAL is composed under the milestone D6 waiver. Shared-host preflight found
no AppHost or scaffold runtime process.

## Completed

- Read amended #1184 and re-baselined all load-bearing claims.
- Selected Archetype 5 + service overlay and required gates.
- Recorded supervisor identity, research, design, plan, waiver, and environmental drift.

## In Progress

- Slice 1: RED emitted-glue test and real unfixed scaffold reproduction.

## Next Steps

1. Commit/push run bootstrap and open the draft PR.
2. Add the generated-artifact assertion and capture its failing output.
3. Scaffold/start the unfixed project and preserve `KvConnectionError` evidence.
4. Apply the one-line stub fix and continue through owner runtime protocol.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Fix the stub with `@netscript/kv/redis` registration | plan D1 | Generated output is not user-editable authority. |
| Keep Deno-KV compatibility by relying on existing provider selection | plan D2 | Registration does not select Redis. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-sagas-kv-glue-registration--w2-f/*` | new | Harness bootstrap only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline | doc-lint: 15 existing private refs, 0 missing JSDoc |
| Fitness | pending | plan locks `quality:gate` + F-13 runtime evidence |
| Runtime | preflight pass | no active AppHost |
| Consumer | pending | real fresh scaffold required |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: milestone run artifacts and legacy service docs absent from this checkout; owner dispatch is authoritative.
- Debt: no new/deepened debt planned; #1093 untouched.

## Commits

- See the draft PR's commit list + per-slice PR comments.

