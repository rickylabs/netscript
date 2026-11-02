# Research

Re-baselined at 6a1d84a6e04c0d39df3926528e0380e267316aee. Earlier PR #2557 is a superseded planning-only run (seven Markdown files, no implementation). No orchid-triage comment exists. Consulted S8/S8b retained context and docs tooling README before code.

Lume/Vento owns the static site, with React JSX config; actual Fresh UI preview bundles need a separate Preact config. Registry metadata currently discovers 41 components and 11 blocks. Contracts expose keyboard behavior, planned anatomy, token roles and compatibility notes. Native deno doc --json --private supplies real implementation prop types. Registry entries may have .template sources and consumer imports: prepare a build-only local copy using registry dependency metadata before documenting/bundling those sources.

TOKEN_PRESETS defines 24 presets, with fixed base/accent/flavor/density; scheme is independent. No font registry entries exist. Icon-library config alone does not provide a supported rendered icon axis. Use truthful effective values, no fabricated independent axes. Existing CLI kernel ui-preset.ts is the browser-compatible ns1_ codec; reuse directly.

Component HTML and Markdown twins can be generated through one Lume page generator. Existing aiTooling emits twins from rendered HTML and canonical prose carriers include all public twins. get_doc allows 12,288 bytes per page; assert sizes after generation. guidance-index is the existing deterministic retrieval seam. Callout content bypasses inlineCode; absoluteUrl currently only guards one existing base prefix and needs regression coverage through actual xref rendering.

Deno 2.9.7 available; RTK missing. No memory connector exposed; retained run and project handoff notes supply prior memory. No dependencies or package exports planned. Public paths remain repository-relative; raw browser/evaluator/leak output stays private.
