# Close-gate remediation

CI at be648dc failed because #2552's three acceptance boxes were unchecked. The earlier PR closed the parent while carrying only its code half. Required closing keyword is retained; no close-gate override or policy bypass.

## Self-contained closure

Normal-merged companion #2554 at b2fe065a75ee80675159dc8e1ff048a2baf8bf83. This PR now carries the theme recipe, customization update, skill pointers, generated MCP prose/publish/skill carriers, and generated app/page guidance. There is no remaining dependency on merging a separate docs PR first.

The newer companion content invalidates earlier bb2bd43 doc evidence. Reran all configured docs/carrier commands on current merged source; all exit 0:

| Gate | Evidence |
| --- | --- |
| docs/site verify | Built 260 pages; 25,552 internal links and 13 caveat markers resolve |
| docs:links | 105 docs, 0 broken |
| docs:accuracy | Current source/corpus/CLI contract scan passes |
| docs:snippets | 700 scanned; 36 tier-1 snippets compiled, 13 exempt; no malformed snippets. Does not assert compilation of every displayed block |
| docs:contract-derivation | Tests and contract derivation check pass |
| check:agent-docs-prose | Child health docs and current rendered prose match |
| check:mcp-export-corpus | Export corpus current |
| check:publish-assets | Published corpus manifest current |
| check:assets-barrel | Registry/token embeddings and generated carriers current; no drift |

## Review repair

Same independent Claude Opus 5.5/high-requested session found FAIL_FIX: new recipe uses registered semantic override, while generated guidance still suggested tokens init. Rewrote the clause to create a semantic override, register it under `override` in an existing config, then tokens build. Test rejects tokens init advice. Avoided optional file names in backticks so scaffold reference checks still require only existing scaffold files.

After repair: four structured test suites pass **35/35**; scoped check/lint/fmt process all four changed TS files with zero findings; quality:gate passes with existing warnings only. Formatting repair was whitespace-only in the new assertion.

## Corpus proof

Actual decoded theme recipe: 11,949 bytes, SHA matches carrier. Same independent reviewer invoked real get_doc against the staged release corpus: theme recipe returned `verbatim`, no cursor/omissions. JSON-escaped content 12,190 bytes fits 12,288-byte content budget by 98 bytes. Small future edits may cross budget; no size increase introduced by guidance repair. Customization guide remains available as extract plus full/cursor retrieval, as at baseline.

## Acceptance mapping

1. Box 2 — current recipe documents Studio Utility, 24 presets, token aliases, ui:apply, registry themes, app-wide HTML theme attributes, inherited page shell/navigation and migration. Docs/site verification passes.
2. Box 3 — both recipes in actual MCP corpus and published manifest; build skill and generated skill carrier include pointers; generated app guidance and page hint point to correct slugs. Focused tests resolve required local files in both scaffold modes.
3. Docs gate box — all build/link/snippet/contract/carrier tasks above pass against current merged content.

Check only these proven premerge acceptance criteria after final independent PASS, with structured evidence linking this report. Checking acceptance does not assert that main is merged, nor does it assert runtime success.

## Runtime scope

Earlier local scaffold.runtime remains UNPROVEN due Aspire doctor/Docker environment. Current remote workflow classifies scaffold runtime jobs skipped-by-policy for guidance/docs scope. Record as skip, never runtime PASS. This is not a release cut. No merge or release performed.

## Final independent sign-off

Same evaluator returned **PASS** after repair, independently repeated all 35 focused tests and scoped formatting, and explicitly approved all three acceptance mappings. Structured check/lint/fmt raw exits 0; quality:gate raw exit **0**, existing warnings only. No code or docs edits after this sign-off beyond evidence artifacts.
