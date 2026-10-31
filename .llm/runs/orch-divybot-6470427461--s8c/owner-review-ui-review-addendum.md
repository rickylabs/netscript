**Verdict: PASS**

I found no blockers in either change.

### CSS change (`docs/site/styles/components.css:555-561`)

- **It only touches symbol-table signatures.** The new rules apply only to signature cells in `data-variant="symbols"` tables. Component-rendered object and generic tables keep their existing layout.
- **Identifiers can't be split.** `min-width:24ch` stops signature columns collapsing on mobile. Normal `overflow-wrap` and `word-break` on the signature `code` replace the inherited `overflow-wrap:anywhere` (`components.css:534-540`). Signatures can still wrap at spaces, but never in the middle of an identifier.
- **Width growth stays local.** Any extra width widens the table inside the existing `overflow-x:auto` wrapper, not the page. The test's `documentElement.scrollWidth <= innerWidth` check still guards that.
- **It doesn't regress the earlier fixes.** The symbol-name no-wrap rules (`components.css:548-554`) are unchanged. No colour or token values changed, and syntax highlighting still reads the same `code` elements.

### Test change (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:1042-1072`)

- **The original checks are all kept.** Every `.ns-api-table__name code` is still measured with no filter. The checks for more than 50 symbols, the `DatabaseConnectionOptions` sentinel, single-line Range geometry, the wrapper's `overflow-x:auto` and the absence of page overflow are unchanged.
- **The addition only adds coverage.** Direct highlighted `span` children of symbol-table signature `code` are now measured when their text is a single identifier. Nothing was dropped.
- **Coverage limit (not a blocker).** Plain identifiers that highlight.js leaves as bare text nodes aren't measured individually. They are still protected by the same `overflow-wrap:normal` / `word-break:normal` rule.

I'm relying on your report of the browser and CI results (112/112 serialized rerun, the three negative controls failing as intended, and the green hosted test-3 retry and aggregate check-test in run 40711367098); I didn't observe them myself. Native carrier regeneration and the `docs/site/deno.lock` restoration remain slice 2, followed by final IMPL-EVAL.
