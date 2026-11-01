# Figma component library

Start here to extend the component-library pipeline. It reads Fresh UI's code-owned registry,
component contracts and token identities, then generates a portable library document, imports
structural component specimens into a separate Figma page, and produces HTML Code Connect templates.
Figma continues to own variable values. The importer requires existing local variables and never
creates or edits them. Visual restyling and style-specific composition remain separate work.

## Source ownership

- `packages/fresh-ui/contracts.ts` owns anatomy, props, data-attribute vocabularies, slots,
  accessibility and token roles. `plannedValues` and compatibility values remain metadata; variants
  use the canonical `attributes.values` only.
- `packages/fresh-ui/registry.json`, exposed through `freshUiRegistryJson`, owns physical source
  items. A component style's `meta.components` maps logical items to exact source items. Every
  generated component retains both identities and the source filepath.
- Existing Figma token carriers own collection/variable names, types, modes and WEB syntax.
  `defaultLibraryInput()` reuses their existing name validator. Role lookup uses Scheme, Theme set,
  then Density. Historical `SF:` roles bind specifically to Theme set, preserving theme routing.
  Theme, Theme B, Studio flavor and backing palette collections are not direct component targets.
- `src/default-sources.ts` contains seven identity-only joins for established differing names:
  form-field/field, markdown/prose, sidebar-shell/sidebar, responsive-table/table and the three
  desktop-prefixed sources. Their evidence is in the existing Utility contract render fixtures.
  This table contains no anatomy, variant or visual specification.

Registry items without contracts, stale aliases, duplicate source/contract claims and unmapped visual
items fail. Contracts without registry items are listed with their shipped/planned flags in coverage.
They are never turned into invented source items. After S3 inventory changes, regenerate and inspect
this derived coverage before claiming complete S5 acceptance.

Token shorthand expands exactly: `chart/1..5` is an inclusive range; `h2|h3|h4` gives whole-segment
alternatives; `padding-x|y` replaces the first sibling's final hyphen suffix to give padding-x and
padding-y. Every expanded identity must exist. Missing roles never become hardcoded literals.

## Generate and verify

Run commands from the repository root with Deno 2.9.7. Output directories must be new, with an
existing parent. Existing destinations are refused even when their contents look generated.

```sh
deno run --frozen --allow-read tools/figma-component-library/cli.ts inventory
deno run --frozen --allow-read --allow-write tools/figma-component-library/cli.ts generate --output artifacts/component-library
deno run --frozen --allow-read tools/figma-component-library/cli.ts verify --library artifacts/component-library/library.json
```

`inventory` is read-only and exits nonzero for source binding gaps. `generate` validates all input
contract structure, registry identities and the complete selected output before creating its output
directory. Semantic regeneration rejects missing, duplicate, unknown or changed components,
variants, references and bindings. Output IO errors remove only the newly created output directory.
This is validation before effects and rollback, not a crash-safe filesystem transaction.

The current pinned prose contract expands to absent `Theme set/prose/h4/tracking`. Full generation
therefore fails before writing anything. The tools tests expose that exact source defect; they do
not omit its binding or certify the full library. Contract/token repair belongs to the S3/token
surfaces, including [#2538](https://github.com/rickylabs/netscript/pull/2538), outside this tool.

An explicit selection is useful while the source inventory is incomplete:

```sh
deno run --frozen --allow-read --allow-write tools/figma-component-library/cli.ts generate --items button,input --output artifacts/component-library-selection
```

Its coverage says `complete: false`, enumerates omitted registry items and retains unmatched
contracts. It never claims full-library or all-S5 acceptance. Limits of 1,024 variants per component
and 8,192 per library reject accidental Cartesian explosions before effects. Source defaults lead
the native variant order.

## Import and inspect in Figma

```sh
deno run --frozen --allow-read --allow-write --allow-run tools/figma-component-library/build.ts
```

In Figma Desktop, import `.llm/tmp/figma-component-library/manifest.json` as a development plugin.
This is a separate entry/build target; the token/preset plugin is unchanged. Import the existing
variables with that plugin first. Run **NetScript component library**, enter the current file key
when the host cannot supply it, and load a generated `library.json` or choose explicit registry items.

**Import to editor** validates the whole bundle and all required local collection modes, variable
types and WEB syntax before creating any page. It creates one owned page, real component sets with
the exact data-attribute property names, full Cartesian variants and declared element anatomy.
Native/pseudo/context anatomy remains contract metadata rather than extra layout wrappers.
Contracts without attribute axes produce a single component.

Dedicated token inspection layers bind COLOR to a solid paint, FLOAT to frame spacing, STRING to
text content and BOOLEAN to visibility. They demonstrate and audit exact variable identities; they
do not infer a theme's component geometry or pretend to be its finished visual implementation.
The existing designed library is preserved. Runtime errors roll back the page and every new node,
including handles initially attached to the previous current page.

**Inspect and export** reads native variant definitions, values/defaults, anatomy and actual variable
aliases. Missing/changed bindings, extra or removed nodes and mismatched identities fail. Reimporting
an identical, intact document returns the same node IDs without mutation. A changed source hash,
different selection, duplicate generated page or incomplete prior import is refused. To replace a
generated library, first preserve needed work and explicitly remove that tool-owned page in the
editor; the tool does not replace it automatically.

Download `library.json` and `receipt.json` after native inspection. Receipts contain the exact
bundle hash, file key, page ID and registry-item/node pairs. Provenance is host-reported evidence,
not cryptographic proof of editor execution. Never hand-edit a fixture receipt into an editor claim.

The build evaluates the existing compressed carriers in Deno and emits synchronous projections for
the native sandbox. An injected digest port uses the iframe's standard WebCrypto; there is no second
token resolver, hash implementation or runtime network dependency. Only small identity/hash/selection
records are stored as plugin data, not a multi-megabyte library document.

## Generate and publish Code Connect

```sh
deno run --frozen --allow-read --allow-write tools/figma-component-library/cli.ts connect --library artifacts/component-library-selection/library.json --receipt artifacts/receipt.json --output artifacts/code-connect
```

The command checks receipt hash, provenance, unique native IDs and exact registry mapping coverage
before output. It emits one `.figma.ts` file per generated component, `figma.config.json` with
HTML/html, and `mappings.json` with source/registry/node coverage. Each template uses its actual
receipt URL, a source header, `figma.selectedInstance.getEnum` and `figma.code`. Attributes are placed
on their declared parts; non-DOM anatomy is represented as comments. These are HTML contract
skeletons linked to the exact registry implementation, preserving freedom for styles to change tags
and layout. They are not fictional custom elements or a second Preact implementation.

This uses Figma's maintained [template-file format](https://developers.figma.com/docs/code-connect/template-files/)
and [Template API](https://developers.figma.com/docs/code-connect/template-api/), rather than the legacy
framework parser. Generated virtual-module files are output artifacts, not checked-in source.

Review the mappings and run the official CLI from the generated directory. Configure credentials as
described in Figma's documentation, then validate and publish explicitly:

```sh
cd artifacts/code-connect
npx --yes --package @figma/code-connect figma connect parse
npx --yes --package @figma/code-connect figma connect publish
```

No repository dependency is added, and neither the plugin nor generator publishes automatically.
Reinspect immediately before publishing: a receipt describes the captured native state, not remote
currency after later editor changes.
Fixture receipts are rejected for normal output. `connect --dry-run` permits clearly marked
`.figma.preview.ts` files that do not match the publisher's `*.figma.ts` discovery pattern.

## Extend and validate

Add a component to its existing contract catalog, registry source item and style map. The tool
discovers it automatically. Add an identity join only when an established source/contract name
differs, then include an exact source reference and a negative alias control. Do not copy component
specifications into this directory. Add new token names/modes to their owning source pipeline first.

```sh
deno run --allow-read --allow-write --allow-run tools/figma-component-library/ci.ts
```

The dedicated CI workflow runs structured check/test/lint/format wrappers, a zero-allowance tools
quality scan and both bundles through the repository's allowlisted gate runner. Root wrappers alone
exclude tools. The domain report distinguishes pipeline/fixture success from full inventory readiness
and records source gaps. Required checks and the dedicated `figma-component-library` check must pass
before readiness is reported.

Tests cover deterministic JSON/native round trips, all fixture variants, scoped template rendering,
exact inventory partition, new registry entries, malformed/missing/unknown controls before writes,
native rollback and repeated imports. The actual bundled native entry also runs in a VM without
browser globals. This proves isolated compatibility, not live host execution.

Live Figma editor/MCP execution, official CLI publication and editor round-trip acceptance remain
**UNPROVEN** until real evidence exists. [#2418](https://github.com/rickylabs/netscript/issues/2418)
and [#2412](https://github.com/rickylabs/netscript/issues/2412) retain those S3-dependent/editor gates;
S6 [#2419](https://github.com/rickylabs/netscript/issues/2419) owns visual restyling.
