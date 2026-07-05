# analysis/A-dashboard/ — INDEX (B2)

Exhaustive codebase-surface analysis: fresh-ui vs NS One gap, design-sync extraction, plugin
archetype grounding, issue #218 prior art. The depth corpus for the Opus 4.8 deep-dive.

| file | description |
|---|---|
| `01-fresh-ui-current-surface-inventory.md` | `@netscript/fresh-ui` public surface: 46 registry components, tokens, runtime primitives, exports map, the `ui:add` copy-source CLI model, and the missing L3 layer. |
| `02-eis-chat-design-sync-full-extraction.md` | Full NS One extraction: `--ns-*` tokens, layout objects, 30-component preview set + real 41-component `apps/dashboard` set, prompt.md+d.ts convention, `_ds_bundle.css` truth chain, L0–L4 layering, the previews/-vs-real-app two-trees trap. |
| `03-fresh-ui-vs-nsone-gap-inventory.md` | **D-NSONE cost surface.** 41-component parity table; headline: shared L0–L2 layer is byte-identical (copy-source), real gap = fresh-ui has no L3 blocks layer. Verdict-neutral promote-cost / borrow-cost columns. |
| `04-plugin-archetype-grounding.md` | Thin-plugin/fat-core split (workers + streams references), base contract/service seam, ARCHETYPE-5 requirements, `plugin add dashboard` CLI mechanics (no code change needed), and a folders-only SKETCH for `plugins/dashboard` + `packages/plugin-dashboard-core`. |
| `05-issue-218-prior-art.md` | NetScript issue #218 (CLOSED) content: wire Aspire's native browser-logs devtools by default (motivated by invisible client-side ElectricSQL decode error); "wrap don't reinvent" + HTTP/1.1 6-connection ceiling note. |
