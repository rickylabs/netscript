# Docs-only voice pass: flatten candor-register phrasing in auth + durability explainers

## Summary

Validated the PR's docs-only changes to `docs/site/explanation/auth-model.md` and
`docs/site/explanation/durability-model.md`. All checks pass.

## Changes (from diff)

### `docs/site/explanation/auth-model.md`
- Removed `genuinely` from "supply only the sub-ports it genuinely owns" → "supply only the sub-ports it owns"
- Removed `genuinely` from "three genuinely different capability profiles" → "three distinct capability profiles"

### `docs/site/explanation/durability-model.md`
- Removed `genuinely` from callout title "What is genuinely live today" → "What is live today"
- Replaced `real and they compile` with `implemented and they compile`

All four changes flatten candor-register phrasing into plain factual prose without loss of technical meaning.

## Validation

| Check | Result |
|-------|--------|
| `deno task verify` (build + check:links + check:caveats) from `docs/site` | **exit 0** |
| Build | ✅ 308 files generated |
| check:links | ✅ 18722 internal links across 131 pages — all resolve |
| check:caveats | ✅ 30 caveat markers across 23 pages — all references resolve |
| Banned voice terms (honest/honesty/honestly/candor) | ✅ None introduced |
| Diff scope (only two target files) | ✅ Only `docs/site/explanation/auth-model.md` and `docs/site/explanation/durability-model.md` |
| No `packages/`/`plugins/` source touched | ✅ Confirmed — `git diff --name-only origin/main -- packages/ plugins/` returns empty |
| No Vento breakage | ✅ Build completed without template errors |
| Rewordings read as plain factual prose | ✅ All four edits are clean candor-register flattening |

## Raw exit code

`deno task verify` → **0**

## Remaining risks

None. The changes are purely cosmetic (word-level voice flattening) and the full docs build validates cleanly.
