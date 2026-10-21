# Fresh UI design guide and brandable tokens

PR #2408 (harness#752; theming and guidance half of #2406, sibling #2407 owns the chrome).
Run state: `.llm/runs/orch-divybot-752--fresh-ui-design-guide/`.

Lessons:

- **A primitive can make documented guidance false.** The rebrand recipe ("change `--ns-primary`") was untrue
  while intent tints, hovers, accent and ring were hard-coded copper. Before documenting a knob, prove it in a
  browser, and verify a one-line edit propagates. Here, the computed `.ns-badge--primary` background was read
  before and after.
- **Agent guidance has two corpora with different slugs.** The filesystem docs use `web-layer/...`, while the
  standalone MCP carrier used `pages/web-layer/...`. Any slug hard-coded into guidance must be tested through
  `get_doc` on the standalone corpus.
- **Curated `find_guidance` concepts need narrow aliases.** An activated concept replaces the query terms and
  filters out sections, so a broad alias (bare "theme", "page layout") silently hides the right answer for
  unrelated questions. Add a negative-control intent per concept.
- **Agent Markdown rendering differs from the HTML site.** xref links double-prefix, inline `<code>` inside
  callouts fragments, and `<placeholder>` strings in Vento tables are eaten as tags. Read the rendered
  `_site/**/index.md` that agents receive, not only the HTML.
