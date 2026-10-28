**Verdict: PASS**

The repair fixes the leak I flagged, and I found nothing else blocking in slice 1.

### The fix closes every route the gallery had into public output

- **Pagefind search:** `docs/site/_includes/layouts/base.vto:97` now leaves `data-pagefind-body` off the article on internal pages. Every other page still carries it, so Pagefind skips the gallery entirely. `base.vto:26` also puts `data-pagefind-ignore="all"` on the body as a second guard.
- **Search engines:** `base.vto:7` adds `<meta name="robots" content="noindex">` to internal pages.
- **Markdown links:** both "View as Markdown" links are hidden on internal pages (`base.vto:90` and `base.vto:103`).
- **Markdown twin, `llms.txt`, `llms-full.txt` and the CLI agent docs:** `docs/site/_plugins/ai-tooling.ts:90` skips pages with `internal: true` before it builds any twin or index entry. The CLI agent docs bundle is built only from those twins and `llms-full.txt`, so the gallery no longer reaches it either.
- **The flag is set:** `docs/site/fixtures/callouts.md:8` has `internal: true`. The page is still built, so the callout browser test can visit it.
- **Nothing breaks on a missing twin:** none of the `docs/site/_plugins/check-*.ts` checkers expects every page to have one.

### The new test fails loudly if any of this regresses

`tools/fresh-ui-browser/docs-tests/docs.spec.ts:683-707` asserts that:
- the page has the noindex meta tag;
- it has no `[data-pagefind-body]` and no `.ns-md-link`;
- `internal/callouts/index.md` doesn't exist;
- `llms.txt` and `llms-full.txt` don't contain `/internal/callouts/`;
- a real Pagefind search for the exact phrase "Callout gallery" returns zero results.

The Pagefind module path uses the configured base path (`tools/fresh-ui-browser/docs.playwright.config.ts:7`). If the search index failed to load, the import would throw and the test would fail, so a zero count can't pass by accident.

The expanded browser run is still going, so I haven't seen its result. This verdict is based only on the source above.
