# Fresh UI registry v2

`packages/fresh-ui/registry.json` is the authoring source. The original TypeScript manifest is a
compatibility projection for existing scaffolds. Component sources remain app-owned after copying.

The protocol uses the twelve `registry:*` item types and the published shadcn registry and item
schemas. `cssVars`, nested `css`, `docs`, `categories`, `meta` and package/item dependencies retain
their upstream shapes. Runtime validation checks the pinned published schema before planning files.

Compatibility reference: shadcn CLI **4.23.0**, source commit
`96da9cc7f1aa10580a3741664e2a77c721206c00`, checked 2026-10-28. The unmodified schema snapshots in
`schemas/` were fetched from [registry.json](https://ui.shadcn.com/schema/registry.json) and
[registry-item.json](https://ui.shadcn.com/schema/registry-item.json). Their SHA-256 values are:

- Registry: `e716ebe595bbc189db2627cb75f0484cd765a09eb397a89b1f1c49074220d4bb`
- Item: `cdf0fba75a26ebf594018264eff2d55407ec14deb3071d0fce0e2b20848e5d44`

The snapshots retain their upstream MIT license. Ajv's bundled draft-07 dialect uses the equivalent
HTTP metaschema URI; the validation adapter normalizes that URI without altering either snapshot.

NetScript extensions live in metadata:

- Catalog `meta.collections` holds named item groups used by the existing scaffold.
- Item `meta.netscript` preserves legacy kind, layer, tags and CSS import contributions.
- A style's `meta.components` maps each logical component id to a registry item reference. Keep
  destinations and the shared component contract stable across styles. `style-utility` points to the
  current component sources. Additional style sources can be published as normal registry items.

To add a component, author its item, files and dependencies in `registry.json`, include it in the
appropriate collection and style map, and regenerate the embedded registry carrier. To extend a
style, change its source map and supply items with the same public component contract.

## Static hosting

Build a registry whose file paths are relative to its source directory:

```sh
netscript ui:build --registry registry.json --output public/r
```

For Fresh UI's repository-relative sources, select the repository root explicitly:

```sh
netscript ui:build --registry packages/fresh-ui/registry.json --source-root . --output public/r
```

The output contains `registry.json` and `<name>.json` with embedded UTF-8 file content. Serve this
directory as static files on any HTTP host. Source chunks use `include` with explicit relative
`registry.json` paths. All sources and includes validate before output is written, and paths must
stay within the selected root through filesystem links. The docs site's normal build publishes the
same artifacts under `r/`.

## Theme documentation

Each built-in preset `registry:theme` item carries `DESIGN.md` and `SKILL.md` with explicit targets
`.agents/skills/fresh-ui-theme-<preset-id>/`. The canonical source is
`docs/design-system/themes/<language>/`; NS One and the Studio flavors share the Studio docs.
Static publication embeds the exact source bytes. The existing asset generator also embeds them
under package-relative keys, so published installations need no repository checkout.

The legacy manifest intentionally retains its original file list for existing scaffolds and
design-sync; protocol-only theme skills are installed by the v2 installer. To extend a built-in
theme, update its two canonical document paths and targets in `registry.json`, then run
`deno task gen:assets-barrel`. `registry-theme-docs.test.ts` checks every preset and exact bytes.

CLI-hosted MCP (`netscript agent mcp --project-root <app>`) reads that app's `components.json`.
Its registry search combines the built-in catalog and configured namespaces, qualifies names as
`@namespace/item`, and views items through the same client and environment-header transport as
the CLI. Discovery writes no config, locks, installed files, or diagnostic receipts.

## Application installation and presets

`components.json` stores local aliases, a style item id, icon library and named registry URL/header
templates. `fresh-ui.lock.json` stores source provenance, SHA-256 baselines and copied text.
`ui:add @acme/x --diff` compares that installed baseline to local and current registry bytes without
writing. Updates skip edited copies; removal checks required items and shared ownership.

Use `ui:add <style-item>` or an encoded preset's `style` field to select a different component source
map. Source items must retain explicit file targets and the same public component contract. Edited
copies stop regeneration with filenames and diffs, even with `--force`. Later additions and updates
continue to use the configured style. Real alternative component sources can be added without
changing app pages or the installer.

`ui:init --preset <code>` initializes and applies a preset in one staged operation.
`ui:apply --preset <code>` calls the existing token compiler and installs matching theme skills;
a theme-only preset preserves component code. `--only theme` also preserves fonts, while
`--only font` preserves theme outputs/settings. Token source and semantic override paths survive;
the chosen theme persists in `tokens.config.json`. `theme-seed` installs the NS One skill docs.

The preset payload is `{version:1,theme?,style?,font?,iconLibrary?}`. `ui:preset url` encodes choices,
and `ui:preset decode` accepts that code, its share URL, or a plain token preset id. A `registry:font`
item supplies portable font metadata and optional files/package dependencies.

To extend installation behavior, start at
`packages/cli/src/kernel/application/ui/v2/install-registry.ts`; style resolution and token preset
staging are its neighboring flows. Schema/build/theme-doc tests live in `packages/fresh-ui/tests/`,
and the native command fixtures live in `packages/cli/src/public/features/ui/`.

Component source styles also own their declared files and CSS imports. Selecting another style retires
the old selection's unshared files; edited copies stop the whole plan, including files being retired.
Shared dependencies, independent stylesheet items and generated core token assets are preserved.
The lock's `appliedStyle` records the completed selection, so changing `components.json` cannot hide
a pending regeneration. Per-item `componentStyle` identifies source-map styles separately from ordinary
CSS style items. Token-only apply preserves that applied component-style baseline.
