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

The builder dynamically imports the CLI's existing `ns1_` codec only for an imported code or shared URL. Ordinary preset changes reuse build-time codes. The 24 fixed presets determine accent,
geometry, fonts, density and menu values; scheme is independent. Previews use the docs site's
self-hosted fonts and the preset's declared platform fallback stacks for other families. They never
inject runtime font-provider links. `COMPONENT_STYLES` is the extension seam; Utility is the sole shipped
anatomy. Add another style only with its real registry implementation. Native desktop and MCP
host actions are represented by explicit browser examples, with their host boundary documented.

The preview document isolates component CSS from the docs shell. All theme and component assets
are static; publishing the built directory requires no application server.

## Payload policy

`payload-budgets.ts` keeps the component CSS ceiling and the builder ceilings together. The site
build's `check:fresh-ui` measures the static import closure of the builder, preview bootstrap and
default workspace, including shared chunks. JavaScript is limited to 120,000 raw / 38,000 gzip bytes;
compact preset metadata to 16,000 raw / 4,000 gzip bytes. Gzip is measured per response. The browser
budget test also counts the docs shell scripts and every actual script request from the iframe.
The full documentation catalog, preset codec and unrelated component examples must remain absent
from initial requests. Budget negative controls fail raw and gzip independently.

`presets.json` contains only preset identity, precomputed codes and displayed token values.
`catalog.json` remains available for the reference census, without a runtime dependency. Native
Deno code splitting generates one lazy example module per component; the workspace composes only
`WORKSPACE_COMPONENTS` from `catalog.ts`. All chunks and CSS are static deployment assets. Adding a
component needs its registry entry and an example, not a maintained preview inventory.

## Remaining independent pickers

Only Utility anatomy ships today. Styles beyond Utility await S6b registry implementations before
being added to `COMPONENT_STYLES`. Icon library and font family are not independently selectable in
this builder: `UiPreset` can encode those fields, but this builder does not resolve a matching
preview and therefore rejects them. Menu style has no independent `UiPreset` resolver field.
Accent, radius and density also follow the fixed preset rather than arbitrary picker overrides.

After S6b supplies the other styles, add the actual style registry entries and resolver mappings,
then wire the style picker and parity tests. Add icon/font/menu and other independent pickers only
when the CLI resolver and static preview can reproduce the same values. Preserve round-trip import
validation; never silently discard unsupported axes. Scheme remains an independent preview choice.
