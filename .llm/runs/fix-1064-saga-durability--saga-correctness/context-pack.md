# Context Pack: saga engine correctness

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `fix-1064-saga-durability--saga-correctness` |
| Branch         | `fix/1064-saga-durability`                   |
| Current phase  | `implement`                                  |
| Archetype      | `2`, `3`, `5`                                |
| Scope overlays | `docs`                                       |

## Current State

#1064 is implemented and gated: dead Redis fails loudly and boundedly, while a real Redis adapter
lists saga data and admits exactly one concurrent expected-version save. The written supervisor
waiver permits implementation despite the credential-blocked PLAN-EVAL lane.

## Completed

- Required skills/doctrine/harness profiles read.
- Full issue and PR context re-baselined.
- Owned Redis/Garnet diagnosis completed without touching foreign resources.
- Public-surface scan and Design checkpoint completed.

## In Progress

- Commit, push, and comment #1064 evidence before starting #1065.

## Next Steps

1. Commit, push, and comment #1064.
2. Implement and gate #1065 without touching concurrent scaffold-owned files.
3. Repeat for #1066.
4. Run aggregate gates and supervisor review; drive draft PR to ready-for-merge.

## Key Decisions

| Decision                                               | Source         | Notes                                                  |
| ------------------------------------------------------ | -------------- | ------------------------------------------------------ |
| #1064 has two distinct targets                         | research       | Bound dead-endpoint failure and repair concurrent CAS. |
| No new public exports                                  | plan/jsr scan  | Drift trigger if implementation contradicts this.      |
| Effect and instance identity resolution are exhaustive | issue/doctrine | No silent fallthrough or message-id identity.          |

## Files Changed

| Path                                                    | Status      | Notes                                         |
| ------------------------------------------------------- | ----------- | --------------------------------------------- |
| Redis adapter, connection manager, and real Redis tests | changed/new | #1064 implementation and regression evidence. |

## Gates

| Gate family | Current status   | Evidence                                 |
| ----------- | ---------------- | ---------------------------------------- |
| Static      | planning PASS    | `deno doc` surface scan                  |
| Fitness     | PASS with waiver | supervisor waiver; quality and arch pass |
| Runtime     | #1064 PASS       | real Redis plus bounded dead endpoint    |
| Consumer    | pending          | docs/tests after implementation          |

## Open Questions

- None blocking slice 1 delivery.

## Drift and Debt

- Drift: healthy/dead Redis distinction and capability redirect recorded.
- Debt: none proposed; existing KV adapter audit remains open.

## Commits

- See the draft PR's commit list + per-slice PR comments.
