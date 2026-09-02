## Summary

Exclude the entire `packages/fresh/tests/` tree from `@netscript/fresh` publication. The dry-run publish set drops from 19 test entries to zero without moving source or changing any public export.

## Scope

- Archetype / area: Archetype 4 / `packages/fresh` publish metadata
- Chosen option: option 1, bare `tests/` exclusion. All 19 pre-change entries are fixtures/tests, all 17 export-map modules pass `deno doc`, and none imports `tests/`; no published allowlist is needed.
- Closes #1897
- Refs #1590
- Refs #1895

## Slices

- [x] S1 Exclude Fresh tests and prove the resulting publish set — final branch head

## Validation

- `deno publish --dry-run --allow-dirty` from `packages/fresh` — exit 0; stderr entries 155 → 136; `tests/` entries 19 → 0
- scoped Fresh check wrapper — exit 0; 207 files, 0 findings
- Fresh source test wrapper — exit 0; 254 passed, 0 failed, 0 ignored
- evaluator whole-package Fresh test wrapper — exit 0; 276 passed, 0 failed, 0 ignored
- `deno task check:assets-barrel` — exit 0
- `deno task check:publish-assets` — exit 0
- `deno task check:mcp-export-corpus` — exit 1 on unrelated baseline staleness. Diagnostic regeneration produced the same carrier SHA-256 with and without this exclusion, so the unrelated carrier delta was reverted.
- `deno task quality:gate` — exit 0
- focused Fresh JSR audit — exit 0 (pre-existing warnings only)
- `deno.lock` SHA-256 before/after — `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`

## Harness

- Run dir: `.llm/runs/build-fresh-publish-tests-exclude--1897/`
- Phase: impl-eval complete; see committed evaluator artifact.
- PLAN-EVAL: N/A because #1897 supplies the complete mechanical contract, alternatives, scope, and gates.

## Drift / Debt

- No new or deepened architecture debt.
- The required corpus freshness check exposed unrelated baseline staleness; a controlled with/without causality check proved #1897 does not generate that delta.

## Definition of Done

- [x] `@netscript/fresh` dry-run publish set contains zero `tests/` entries.
- [x] Public export entrypoints do not consume files under `tests/`.
- [x] The one-line exclusion composes with #1895 without copying or rewriting its patterns.
- [x] Required scoped checks and source tests pass, with the unrelated corpus baseline failure disclosed.
- [x] `deno.lock` is byte-identical before and after.
