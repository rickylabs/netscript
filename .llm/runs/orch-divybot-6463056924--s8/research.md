# Research

Re-baselined against main `2560bf564d3c99d6c021fd3f6a0966303ee9b569` on 2026-10-28 after coordinator corrected stale checkout. PR #2427 is merged; #2435 (S1) is open. No existing PR covers #2430. Memory consulted: default-theme Utility, dark-mode, CI local-run traps, and swarm dispatch notes. RTK is absent; use unfiltered commands and wrapper JSON evidence.

The site is Lume 2.5.4 / Vento with plain CSS and native browser enhancements, not a Fresh application. Existing component names and parameters must remain stable. `docs/site/deno.json` build includes source-format and rendered-output gates; verify adds links and caveats. Pages CI also checks exports drift and snippets. S0 provides pinned Playwright Test and axe dependencies, a screenshot matrix and upload conventions; docs need a separate strict suite with no baseline exemptions.

Read implementation handoff, exported collection index/schema, Studio Utility rules and guidelines; visually inspected home Light, article Dark and search Light reference exports. Home has no sidebar; article has active-lane-only navigation and TOC; reference has section anchors. Figma Scheme exposes CSS names via codeSyntax. Alias resolution must select each target collection mode independently. Fonts are Host Grotesk and Fragment Mono. Existing diagrams are renderer-owned Mermaid SVG output with copper colours. Keep them byte-identical and inline their content with semantic palette replacement at build time; prove `diagrams:check` remains green.

NetScript MCP stdio initialized through local CLI; `search_docs` returned Fresh UI and customization guidance. `find_guidance` requires `intent`, not `task`; corrected call is required before code. No server or browser resources started yet.

Corrected MCP `find_guidance({intent,limit:3})` succeeded with high confidence, citing token/component CSS customization and Markdown-twin/llms.txt preservation.
