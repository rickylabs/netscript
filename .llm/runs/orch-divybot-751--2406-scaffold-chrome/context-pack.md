# Context Pack: scaffold chrome on every page + linked `ui:add page` (#2406 items 1, 4)

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `orch-divybot-751--2406-scaffold-chrome`     |
| Branch         | `orch/divybot-751`                           |
| Current phase  | `plan` → `implement`                         |
| Archetype      | `6 - CLI tooling`                            |
| Scope overlays | `frontend` (scaffold output), `docs` (skill) |

## Current State

Plan & Design written (`plan.md`, `worklog.md` § Design). `PLAN-EVAL: N/A` recorded. No code yet.
Sibling session #752 owns the docs/MCP/app-guidance half of #2406.

## Completed

- Slice 0: run dir, research, plan, design checkpoint.

## In Progress

- Slice 1: chrome on every page via `navigation.ts`.

## Next Steps

1. Slices 1–4 per `worklog.md` § Design, each committed + pushed + PR-commented.
2. Slice 5 consumer proof (local scaffold, `/notes` renders inside the chrome).
3. IMPL-EVAL on `muse_spark_1_3` via OpenCode/OpenRouter (separate session).

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Opt-out chrome (`chromelessRoutePrefixes = [/design]`) | plan §1 | keeps one `page` Partial |
| Nav as data in `navigation.ts` | plan §2 | CLI appends like `router.ts` |
| Top-level pages auto-linked; `--nav [label]` / `--no-nav` | plan §3 | nested pages opt in |
| Preserve `styles.css` custom tail | plan §7 | makes #752's theme recipe durable |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/orch-divybot-751--2406-scaffold-chrome/*` | new | run artifacts |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static      | pending        |          |
| Fitness     | pending        |          |
| Runtime     | pending        |          |
| Consumer    | pending        |          |

## Open Questions

- none

## Drift and Debt

- Drift: lane override (owner dispatch), #752 split, stale baseline, issue premise — `drift.md`.
- Debt: none.

## Commits

| Slice | Commit | Gate |
| --- | --- | --- |
