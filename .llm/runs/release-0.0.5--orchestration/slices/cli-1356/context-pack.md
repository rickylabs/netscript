# Context Pack: #1356 UI app-root resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/cli-1356` |
| Branch | `fix/ui-commands-resolve-app-root` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Clean Tier-D branch at `origin/main@1395f3989`. Research and design are current. `PLAN-EVAL: N/A`
is justified and recorded before product edits because the issue fully locks resolution behavior and
gates. No implementation files have changed yet.

## Completed

- Skills, run loop, Archetype 6, doctrine, gate matrix, plan gate, live issue, source, and debt read.
- Pre-fix source mechanism and wrong E2E root confirmed.
- One-slice implementation and negative-control plan locked.

## In Progress

- Bootstrap commit and draft PR, then behavioral RED tests.

## Next Steps

1. Commit/push bootstrap artifacts and open draft PR with `Closes #1356` / `status:impl`.
2. Add behavioral tests; capture pre-fix exit 1 without product source changes.
3. Implement resolver/commands/gate; run gates; update artifacts; commit/push/comment.
4. Stop for owner-launched separate-session IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| PLAN-EVAL N/A | run-loop §4 | Mechanical, no open decision. |
| Shared kernel application resolver | doctrine A6/A8/AP-25 | Existing `FileSystemPort`; no new port/base. |
| App precedence and ambiguity | live issue #1356 | Explicit, current app, single app, otherwise error. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| this run directory | new | bootstrap/research/design only |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | implementation not started |
| Fitness | NOT_RUN | implementation not started |
| Runtime | N/A locally | serialized token not granted |
| Consumer | NOT_RUN | focused CLI/E2E discriminator planned |

## Open Questions

- None for implementation. Owner/CI must provide the full runtime acceptance row before merge.

## Drift and Debt

- Drift: Tier-D runtime identity was not registered; recorded in `supervisor.md` and `drift.md`.
- Debt: pre-existing CLI restructure only; no change planned.

## Commits

- See draft PR commit list + per-slice comments after bootstrap.

