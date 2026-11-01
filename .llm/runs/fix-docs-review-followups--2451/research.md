# Research

Main contains merged #2439 at f177c38. Random IDs occur in the diagram filter and tabbedCode template; afterRender has both page URL and DOM order and is the appropriate deterministic scope. Diagram source images must retain hidden/lazy and Markdown-twin semantics. Existing inline renderer can namespace the final SVG with a stable prefix without re-reading source assets. Lume lightningcss bundles CSS imports; copied styles currently bypass processing. Existing CSS source gates remain authoritative.

Pages build honors needs_pages, browser does not. Shared decide intentionally treats all non-PR events conservatively; preserve that default and opt Pages into its own complete push diff. Manual/release events still run. Existing source-only design test includes a fictional JSON source, so replace it with an actual source and separate synthetic config policy tests.

## Current-main audit — 2026-11-01

The paragraphs above describe the original 10-28 baseline, not today's defects. All ten #2451 findings have since been incorporated into main. Comparing the resolved merge tree with origin/main leaves only this original run directory; no maintained source difference remains.

| Finding | Current-main evidence and disposition |
| --- | --- |
| CSS import waterfall | docs/site/_config.ts uses lightningCss; docs.spec.ts checks bundled CSS. Keep main. |
| Browser ignores classifier | Pages utility-browser consumes classify and fails toward running; complete push diff opt-in is present. Keep main and rerun classifier/workflow tests. |
| Random rendered IDs | Page URL/DOM index identities precede Pagefind and twins; tab/comparison templates contain no random IDs. Keep main. |
| Generic permalink names | Heading aria-label is derived from heading text; browser regression already present. Keep main. |
| Positional navigation lane | getDocsLane resolves lane IDs; the expanded reorder test covers seven routes. Keep main. |
| Duplicate token authorities | tools/docs-site/generate-tokens.ts still consumes the separately recorded Figma snapshot. Explicit ownership remains #2450; token consolidation is outside this refresh. Preserve Studio Utility and current tokens v2. |
| dotenv not registered | Main registers highlight.js ini as dotenv and validates labels/languages together. Keep the richer current implementation. |
| Fictional classifier fixture | Existing canonical fixture test stat-checks real sources; future hypothetical policy is separate. Keep main. |
| Old S8 plan-only drift status | Main already carries the historical qualification. Keep main. |
| Uneven owned-file chip gaps | Main has the scoped margin reset and single stack gap with browser geometry coverage. Keep main. |

The seven merge conflicts are all overlapping fixes or subsequent expansions. Taking current main for those files preserves newer renderers, language support, navigation routing, browser coverage and workflow timeouts. Auto-merged maintained files also match main byte for byte. No replacement implementation is warranted.

#2453 remains open: current main still pins Lume's transitive Pagefind 1.3.0 and the existing bounded metadata comparison. The prior native 1.5.2 trial failed and was reverted. [Upstream Pagefind #1104](https://github.com/Pagefind/pagefind/pull/1104) documents remaining randomized Rust HashMap serialization; its fix does not establish that our full filter/meta output is deterministic. Reproduce strictly against the merged source before disposition. No custom binary postprocessor, filter removal or speculative dependency upgrade belongs in this refresh.
