# Research

- Read assignment completely, including final-report file handoff. Specific operator instructions take precedence over generic closing-keyword and pipeline defaults: use Refs, stop at READY, no merge.
- Consulted prior fixture/Lume DOM and environment memories before code. NetScript MCP find_guidance followed by search_docs supplied no fixture-specific helper.
- Issue comments and all-state PR search found no covering PR or triage duplicate.
- Fixture article() parses via Lume DOMParser, selects article.ns-prose and unsafely bridges to the serializer's browser Element type. Lume exports its own runtime Element constructor; a probe confirms parsed articles are its instances.
- Existing markdown-render_test.ts bridge runs the standalone site's import map and all fixture cases. Lume DOM and browser DOM types differ; retain the existing serializer boundary through a runtime-checked predicate accepting unknown.
- Code quality repo job uses run-gate.ts quality-scan-repo (quality:scan:repo). PR trigger paths omit docs/site/** and run artifacts, so a green PR Code quality check may be unavailable within approved scope.
- No scaffold output/runtime wiring touched; expensive local scaffold.runtime is explicitly forbidden.
