# Resume S3 phase 2

Branch orch/divybot-6538112485; draft PR2488; base main ad252e8.
Read plan.md/research.md/worklog.md. Owner says Refs #2416 only, no labels or
session IDs, never commit assignment/final-report files, stop at READY; Cockpit
merges. Two review units:2a core categories, then2b Layout/AI/Desktop/Docs/harness.
Same separate read-only Claude Opus5.5 high reviewer is required; final IMPL-EVAL
still pending. Review transport/private identity stays in external project runs.

Terminal PASS: all104 typed/JSON contracts; Actions3; Forms6 including Calendar/
DatePicker; Navigation4 including Menubar.79 shipped/25 remaining. Native
registry101 = baseline86 +13 reviewed components +2 copied support items.
Author registry.json and style-utility maps/collections, preserve compatibility
projection and frozen legacy-v1.json. Keep post-v1 allowlist/counts current.

Navigation slice5 terminal PASS after one closed-Escape boundary correction.
112 full rebuilt-source browser cases,142 focused tests, quality, preflight,
docs accuracy111, source/spec wrappers PASS. Runtime ActionMenu supports choices,
first/last entry, scoped traversal/typeahead, layout native popovers; outside
focus is preserved and submenu Escape stays at its own level. Interactive
Deno doc-lint123 diagnostics exactly match pre-slice c788023 full checkout by
code/message/relative file; no new diagnostics.9 design/doc-drift tests pass.
Final clean-source corpus/carrier refresh + push/comment completes slice5.

Next slice6: AlertDialog, HoverCard, ContextMenu; compose existing native runtime
and reuse menu-items helper. Then slice7: Item/Kbd/Chart/Collapsible/Carousel,
CodeBlock tabs/line/diff and Feedback/Label/PageHeader/docs-gap audit. Phase2a
needs full package/quality/JSR/preflight/docs/carrier/runtime gates and mandatory
same-session final IMPL-EVAL. Only exact-head required green CI allows READY.

Browser: tools/fresh-ui-browser/gap.playwright.config.ts rebuilds current sources
through gap-build.ts; it derives root catalog into ignored generated config.
Use that generated config for fixture type checks; Node specs use docs.deno.json.
Chromium needs existing project-run system libraries in LD_LIBRARY_PATH only for
Playwright; restricted Deno spawn wrappers reject that inherited env. See browser
README and memory-browser.md. No changed lock files/caches allowed.

Phase2b remains: Layout4, AI5, Docs8 + Desktop audit and all-style harness.
The current style ID table is still Utility-only; phase2b must derive native
source-style registrations, reject missing providers and all4 contract mutants.

Slice5 source de67b38 signed off; all four carrier freshness checks PASS after
clean-source MCP regeneration. No lock churn. Push/comment closes this slice.

Latest steering: current Pages build failure6b42a62 caused by two missing symbols
in docs/site/reference/fresh-ui/index.md, now corrected locally. Overlay has only
been researched; no code yet. Finish docs CI repair and carrier regeneration,
review/push/comment before resuming Overlays. docs:exports-drift and docs:snippets
are in flight. See external run ci-docs-* logs; no private log dumps in public.

CI repair local gates and independent review PASS: exports-drift, snippets,
Lume253 HTML,23734 links and13 caveat markers. Prose generated; commit source,
refresh clean-source corpus/publication, check all carriers and push. This fixes
the user-reported build failure; Overlay remains unimplemented. For every new
public export, run docs:exports-drift in addition to docs:accuracy.

CI build repair complete locally: reviewed source f21bff4; all four carrier
freshness checks PASS, no additional generated change after prose refresh.
Exports/snippets/build/links/caveats all PASS. Push triggers fresh Pages CI;
remote success remains pending. Resume Overlay slice after push/comment.
