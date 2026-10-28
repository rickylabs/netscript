**Verdict: PASS (slice 1 of the owner-review delta only)**

I found no code blockers in the five owner-requested fixes. The serialized browser rerun is still pending, so this verdict rests on source review, not on observed browser results.

### The five fixes

1. **API identifiers stay intact and scroll inside their table.**
   - Markdown symbol tables are now wrapped in `.ns-api-table-wrap`, which has `overflow-x:auto` (`docs/site/_config.ts:263-266`, `docs/site/styles/components.css:504-508`).
   - `display:table` overrides the mobile `.ns-prose table{display:block}`, so scrolling stays on the wrapper (`components.css:545-547`, `docs/site/styles/docs.css:846-850`).
   - Symbol cells and name `code` have no-wrap and normal wrapping (`components.css:548-554`), and they win over the earlier `overflow-wrap:anywhere` because they come later in the file.
   - The test (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:1042-1068`) uses Range client rects to require one line for more than 50 real symbols, including `DatabaseConnectionOptions`. It also requires the wrapper to scroll and the page itself not to overflow. It runs in every viewport project.
2. **Kind mapping and badge anatomy follow the Utility spec.**
   - `tools/docs-site/api-kinds.ts:2-14` matches `docs/design-system/themes/studio/DESIGN.md:331-334` exactly, including module and namespace using the foreground colour.
   - `tools/docs-site/api-kinds_test.ts` checks this against a separate list, including the `deno doc` aliases.
   - The CSS (`components.css:555-589`) gives a transparent background, a 1px solid `currentColor` outline, `--ns-radius-badge` (2px in `tokens.css`) and Fragment Mono at 11px. The dot is a 6×6 unrounded `currentColor` square. Both the Markdown path (`_config.ts:278-286`) and the component path (`docs/site/_components/apiTable.vto:14`) emit it as `aria-hidden`.
   - The browser test (`docs.spec.ts:958-1040`) uses its own role table and checks every anatomy property. It measures contrast against the first non-transparent ancestor and requires all 11 kinds to appear.
3. **Heading code has no chip.**
   - `docs.css:421-432` makes heading `code` inherit the heading's size, weight and line-height, in the mono font, with no background, padding, border or radius.
   - Slash `wbr` break points (`_config.ts:241-250`) only touch heading code that has no child elements, and they don't change `textContent`. So anchors, permalink labels, Markdown twins and search are unaffected.
   - The test is at `docs.spec.ts:1070-1096`.
4. **The galleries are public in Design system → Docs kit.**
   - They live in `docs/site/design-system/docs-kit/{index,callouts,code}.md`, under the `/design-system/` lane root. Section navigation lists Docs kit (`docs/site/_plugins/design-system-render.ts:68`). The old fixtures and `internal: true` flags are gone, and nothing links to the old URLs.
   - The test (`docs.spec.ts:757-794`) checks:
     - the Docs kit link and the breadcrumb chain;
     - the sidebar links;
     - a single `data-pagefind-body`;
     - the twin file, and `llms.txt` and `llms-full.txt` entries;
     - a real Pagefind result filtered to the Design system lane;
     - that the old `/internal/` output is absent.
5. **Language and Copy align identically on the right.**
   - Each header now has a single flexible spacer: `.ns-code-language{margin-left:auto}`. Copy has `margin-left:0`, and the header gap is a fixed 12px (`components.css:354-358`, `370-378`, `388-400`).
   - The test (`docs.spec.ts:1098-1118`) checks the 12px gap and the 10px right inset in the filename block and the shared tab header after switching to each tab.

### Not a blocker

The `internal` branches in `docs/site/_includes/layouts/base.vto` and `docs/site/_plugins/ai-tooling.ts` are now unused. They're harmless.

### Gates still to show green before sign-off (not evidence yet)

- The full serialized browser rerun, after the mobile H1 `wbr` fix. The first pass failed only on the H1 overflow at mobile width.
- Docs build and internal links, now that the gallery URLs have moved.
- The CI test-3 shard retry result.
- Slice 2: regenerating the four native carriers in order (the public galleries will now enter the CLI prose carrier), restoring `docs/site/deno.lock` to exactly match main, the freshness checks, and the post-commit assets-barrel check.
- Final IMPL-EVAL.
