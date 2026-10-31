# Phase2b research — 2026-10-31

Re-baseline is predecessor31cc758 on main ancestor15cffa2. Phase2a is independently
reviewed at4c4f41e, with608 package and302 browser tests passing. Its hosted
Postgres runtime now passes120/0/0 and SQLite113/0/0 at exactly31cc758; required
CI readiness is still separate. The native Desktop step reproduces the narrow
open#859 staged-update callback exception and is not a native Desktop PASS.

The remaining17 identities already have typed/JSON research contracts marked
shipped=false: Layout L9–L12, AI I3–I7, Docs X2–X9. Desktop K1–K6 already ships
and requires an audit. The predecessor shell-archetype-audit.md records the
AppShell/Sidebar/TopBar and baseline StatsGrid/DataTable work. No duplicate
component identity or second DocsTopBar is needed. Native platform primitives
and existing runtime ports remain preferred; UI owns no backend/upload/search
service.

The completed Figma spec/ledgers are present on the baseline. Ledger differences
matter: Resizable defaults are280px horizontal/160px vertical; ScrollArea adds
its bordered frame but scrollbars stay native; Direction has no extra wrapper;
FileTree is read-only, no ARIA tree/selection/chevrons; FilePathChip26px and
AttributeChip borderless follow the live docs; Toc uses13/20 text and a native
mobile disclosure; RuledGrid uses private docs-card anatomy and feature gap32;
Hero mobile uses existing48/52 title roles. No new token values are authorized.

Registry v2 authoring is registry.json. The actual source style is style-utility,
a registry:style item with meta.components. CSS support items are also typed
registry:style, so type alone cannot discover source styles. Token presets are
separate. The legacy projector reserves meta.netscript for kind/layer/tags;
putting an extensions-only object there would break its validator. The pinned
upstream schemas must remain byte-identical. Use a dedicated publisher metadata
field for style declarations, not edits to those snapshots or legacy projection.

Owner declaration authority:
https://github.com/rickylabs/netscript/issues/2416#issuecomment-6541012019.
The plan must allow declared x additions while leaving base items immutable.
The current checker only runs Utility at index0 and does not reject unknown
attributes; that is preparation, not the requested all-style harness.

A private actual-render audit found existing non-contract data attributes in27
component scopes: native payloads, layout helper flags and nested base-component
bindings. These must be explicitly classified by component/part/purpose or
reconciled with canonical public axes. A blanket data-* exemption or generating
expectations from the style's output would hide undeclared additions. Shared
browser tests currently import Utility directly; source-style selection must
reach a real fixture renderer and CSS set, with missing adapters failing.

JSR planned surface: new copy components use explicit Preact props/returns; new
style-extension types/reader get full JSDoc and native publication checks. Keep
schemaVersion1 component catalog/JSON export and existing public paths. The
inherited123 TypeScript+1JSON documentation baseline remains accepted debt#2531;
no new diagnostic, suppression, package version or dependency family is allowed.
