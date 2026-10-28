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
