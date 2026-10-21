# Context Pack: Fresh UI design guide + brandable tokens (harness#752 → netscript#2406)

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `orch-divybot-752--fresh-ui-design-guide`          |
| Branch         | `orch/divybot-752`                                 |
| Current phase  | `implement`                                        |
| Archetype      | 4 — DSL/Builder (`packages/fresh-ui`), 6 — CLI tooling (guidance builder) |
| Scope overlays | frontend, docs                                     |

## Current State

Plan locked (`plan.md`). Implementation starts at S1 (derived tokens).

## Next Steps

1. S1: derive intent tints/borders/hover/accent/ring in the DTCG sources; regenerate with the `--no-lock` recipe.
2. S2–S4 per `plan.md`; S5 IMPL-EVAL on `muse_spark_1_3` (OpenCode/OpenRouter).

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Derive tints via `color-mix()`, no new token names | `plan.md` #1 | Keeps bridge + components unchanged |
| One theming mechanism; presets are docs | `plan.md` #2 | Answers the invented `data-ns-theme` failure |
| Split with harness#751 | `supervisor.md` | #751: chrome/nav/skill; this run: docs/MCP/guidance/tokens |

## Drift and Debt

- Drift: see `drift.md`.
- Debt: none yet.
