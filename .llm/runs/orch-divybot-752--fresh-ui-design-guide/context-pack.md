# Context Pack: Fresh UI design guide + brandable tokens (harness#752 → netscript#2406)

## Run Metadata

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Run ID         | `orch-divybot-752--fresh-ui-design-guide`                                 |
| Branch / PR    | `orch/divybot-752` / rickylabs/netscript#2408 (`Refs #2406`)              |
| Current phase  | `evaluate` (IMPL-EVAL round 1, Muse Spark 1.3 via OpenCode/OpenRouter)    |
| Archetype      | 4 — DSL/Builder (`packages/fresh-ui`), 6 — CLI tooling (guidance builder) |
| Scope overlays | frontend, docs                                                            |

## Current State

All implementation slices landed (S1 tokens, S2 docs, S3 MCP, S4 app guidance + standalone get_doc slugs).
IMPL-EVAL brief: `evaluate-implementation-brief.md`; evaluated head in `impl-eval-head.txt`; launch receipt
`impl-eval-launch.jsonl`; verdict will land in `evaluate.md`. Repo gates run through `run-gate.ts` with receipts
under `.llm/tmp/gate-receipts/752/` (summary copied into `worklog.md` § Close).
Complementary caveats issue: rickylabs/netscript#2410 (from `caveats.md`, includes harness#751's CLI items).

## Next Steps

1. Read `evaluate.md`; on `FAIL_FIX` fix and re-steer the SAME OpenCode session (`-s <session>`), max 5 rounds,
   two consecutive terminal failures end the loop.
2. If #2407 (harness#751) merged first: rebase on main, take main's generated carriers and regenerate
   (`gen:assets-barrel`, `gen:agent-docs-prose`, `gen:publish-assets`), then add the cross-references:
   - `agent-conventions.ts` `## Design and theming`: `navigation.ts` + `--nav` / `--no-nav`, reference
     `{ id: 'app-navigation', path: 'navigation.ts' }` (update exact lists in `agent-conventions_test.ts`).
   - `skills/netscript-build/SKILL.md` (#2407's file): add slug `web-layer/how-to/design-with-fresh-ui`.
   - `customize-fresh-ui.md` `## App chrome and navigation`: `navigation.ts`, `chromelessRoutePrefixes`,
     `--nav` / `--no-nav`, `ui:remove page` unlinks the nav entry; design guide rule 3 likewise.
3. Mark PR ready; write `.divybot-final-report.md`.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Derive tints/hover/accent/ring via `color-mix()`/`var()`, no new token names | `plan.md` #1 | Bridge + components unchanged; browser-verified |
| One theming mechanism; presets are docs | `plan.md` #2 | WCAG-checked presets in the guide |
| Three narrow guidance concepts, no bare "theme" alias | S3 | Scalar `theme:` question stays unrouted (tested) |
| Release corpus resolves bare site slugs | S4a | Makes every hard-coded `get_doc` slug work on standalone MCP |
| Split with harness#751 | `supervisor.md` | Second merger adds cross-references |

## Drift and Debt

- Drift: `drift.md` (owner-directed Claude implementer, sibling split, tokens lock, MCP scope extension).
- Debt: none added to `.llm/harness/debt/arch-debt.md`; follow-ups are product issues in #2410.
