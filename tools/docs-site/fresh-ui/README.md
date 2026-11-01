# Fresh UI documentation

`deno task --cwd docs/site build` enumerates every `registry:component` and `registry:block`
in `packages/fresh-ui/registry.json`. It generates a page and Markdown twin for each item, plus
the static `/create/` builder. No page list needs updating when a registry component arrives.

`generate.ts` prepares registry template sources in `.llm/tmp/fresh-ui-docs/`, merges their declared
consumer import mappings, runs native `deno doc --json --private`, and bundles actual components
with Preact. `examples.ts` supplies rich examples; other items derive their minimal example from
the documented props. The same expression is compiled into the live preview and shown as usage.
Required props that cannot be derived fail the build with an actionable error; add a rich example
for those components. `catalog.ts` is the generated-data contract. S3 contracts supply behavior,
keyboard and token roles; implementation props are kept separate from planned design values.

The build calls the freshness checker after rendering. To verify an existing build independently:

```sh
deno task docs:components:check
```

It compares the input digest, registry census, HTML/Markdown presence, and actual UTF-8 page sizes
against MCP's imported `DOC_CONTENT_BUDGET` (12,288 bytes). The generated catalog and bundles are build artifacts, not a
second maintained component inventory. Tests include changed-input and added-component controls.

The builder imports the CLI's existing `ns1_` codec. The 24 fixed presets determine accent,
geometry, fonts, density and menu values; scheme is independent. Previews use the docs site's
self-hosted fonts and the preset's declared platform fallback stacks for other families. They never
inject runtime font-provider links. `COMPONENT_STYLES` is the extension seam; Utility is the sole shipped
anatomy. Add another style only with its real registry implementation. Native desktop and MCP
host actions are represented by explicit browser examples, with their host boundary documented.

The preview document isolates component CSS from the docs shell. All theme and component assets
are static; publishing the built directory requires no application server.
