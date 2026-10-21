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

S1 landed: intent tints/borders/hovers/accent/ring derive from their base token; tokens.css header maps the theme chain. Next: S2 docs.

## Next Steps

1. S2: new `design-with-fresh-ui` guide + `customize-fresh-ui` theme chain.
2. S3 MCP corpus/concept, S4 app guidance; S5 IMPL-EVAL on `muse_spark_1_3` (OpenCode/OpenRouter).
3. Caveats for the complementary issue: `caveats.md` (includes harness#751's CLI-side list).

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Derive tints via `color-mix()`, no new token names | `plan.md` #1 | Keeps bridge + components unchanged |
| One theming mechanism; presets are docs | `plan.md` #2 | Answers the invented `data-ns-theme` failure |
| Split with harness#751 | `supervisor.md` | #751: chrome/nav/skill; this run: docs/MCP/guidance/tokens |

## Drift and Debt

- Drift: see `drift.md`.
- Debt: none yet.
