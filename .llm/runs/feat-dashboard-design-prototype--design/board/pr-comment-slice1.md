## Slice 1 — `tools/design-sync/` v1 (registry → canvas sync system)

**Commit:** `4b31f44b`

**Scope:** the production-grade reusable sync core (future `netscript ui:design-sync`): converts the fresh-ui copy-source registry (Preact) into a synthetic React package, builds the CSS closure, bundles for the canvas, emits preview cards, and gates itself.

- `tools/design-sync/` — 11 modules behind ports (`RegistrySource`, `ClosureBuilder`): config loader, manifest+disk registry source, Preact→React converter (type-only-import recipe + `__ds/` shims), deterministic concat closure (fonts → tokens → base → layouts → per-unit CSS), native `deno bundle` (browser platform, classic JSX, npm React 19.2.0), card/prompt emitter, six trap checks, parity report.
- `resources/design/dashboard/.design-sync/config.json` — project `NetScript — NS One` (`ec262e10-…`), pkg `@netscript/ns-one` / global `NSOne`, exclusions + `subpaths` recorded.
- Root `design:sync` task + `.ds-sync/` gitignore.

**Key mechanics proven:**
- Registry carries **zero Tailwind utility classes** → closure is a deterministic concat, no Fresh build in the loop (plan OQ-4 moot; drift.md D3). `cn` shim drops clsx/tailwind-merge — **React is the only npm dep**.
- `subpaths` module-graph fold-in walks the 35-file `src/runtime` tree behind `@netscript/fresh-ui/interactive`, so the canvas global carries the 8 real interactive primitives (Dialog, Tabs, Popover, Drawer, Sheet, Combobox, Accordion, Tooltip).
- `markdown` unit excluded with reason (template-sourced chat renderer on the npm remark/rehype stack — deferred AI/chat collection).

**Gates (all evidence in worklog.md):**

| Gate | Result |
| ---- | ------ |
| `deno task design:sync check` | **PASS** — parity green 44/44 cards (30 components, 11 blocks, 3 islands), 180-file bundle |
| Sync idempotence | **PASS** — double-build tree hash `dfac420b48f8` |
| Trap checks a–f | theme-default / token-closure / compiled-css / raw-hex **PASS**; weak-dts WARN (theme-toggle only); render-blank WARN (26 floor cards — the slice-2/3 authoring target, by design) |
| Scoped check / lint / fmt (`tools/design-sync`, 11 files) | **PASS** |

Next: slice 2 (design brief + proposed components) with the 26 preview stories delegated per lane policy.
