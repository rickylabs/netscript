# Drift

- 2026-10-28: Dispatcher checkout was an older shallow commit. With a clean
  worktree, moved the assigned branch to current main/S0 as the brief requires.
- RTK absent; direct CLI used. NetScript MCP tools absent from attached tools;
  called the repository MCP server locally before designing.
- Actual playground is scaffolded from CLI templates. Declared write surface
  includes `packages/cli/src/kernel/assets/app/**`, generated asset manifests,
  kernel token adapters/ports, public command dependencies, and S0 browser
  tests; these take the place of the nonexistent checked-in playground.
- Density wording reconciled with GUIDELINES §2.3: enumerate all 72 resolver
  inputs, while each language preset retains its fixed effective density.

- Source-slice supervisor review returned FAIL_FIX twice. The dispatcher leaf profile requires ending the loop after two failed terminal reviews; no third evaluator round was launched. This stops S1 before outputs, checks, CLI, and migration.
- To leave S0 working, staged DTCG sources were moved into `packages/fresh-ui/tokens/v2/`; existing token inputs and generated artifacts retain the exact S0 bytes. This is a partial, unapproved implementation, not a completed or signed-off slice.
- Remaining review blocker: NS One leading aliases all use the same 24px value. The second verdict supplies per-role corrections; they are intentionally left for the next authorized iteration.

- Root `deno.lock` is also an allowed write surface for the two exact, already-resolved validator/conversion specifier mappings. This keeps root frozen checks from rejecting the isolated source files; no dependency versions or integrity entries may change.

- Explicit user continuation reopens implementation after the prior stopped iteration. Stopped-state notes are historical; the source gate is being repaired before outputs.

- SD output validation found four type collisions in the approved Figma WEB syntax: Studio table cell/head/row rule and topbar rule names each denote both COLOR and FLOAT. Original names are retained for colors; dimensions receive explicit -width names in tokens/name-migrations.json. Values and raw Figma snapshots are unchanged.
- Color.js parsed oklch components may also be boxed Numbers; normalize them before finite checks, as with alpha.

- Output integration exposes a stale design-gallery catalog snapshot when adding the 18 registry themes. Extend the write surface to `.llm/tools/generate-design-registry-catalog.ts` and its call in `.llm/tools/generate-cli-assets-barrel.ts`; regenerate the existing CLI design catalog from the manifest so this gate remains enforced.
- The actual registry authority is `packages/fresh-ui/registry.manifest.ts` (the declared `registry/manifest.ts` path was a spelling error).
- Root frozen checking now reaches the public build engine. Extend the root lock allowance to the exact Style Dictionary 5.7.1 package and Color.js 0.5.2 specifier already locked by S0 in fresh-ui; preserve all existing dependency resolutions and integrity entries.
- Extend the write surface to `.llm/harness/debt/arch-debt.md` for the required persistent record of the generated export-directory cardinality advisories. No doctrine rule or exclusion changes.
- CI follow-up on output head: Pages `build` failed its complete export-drift gate because the new tokens entrypoint and symbols were absent from the site reference. Extend the write surface to `docs/site/reference/fresh-ui/index.md` and the fresh-ui explanatory coverage reason in `.llm/tools/docs/check-exports-drift.ts`. Preserve complete coverage and all existing checks; this is a documentation completion, not a gate exemption.
- Contrast coverage follows GUIDELINES §2.5: all seven intents have default/hover/fg/subtle/border/text; only Primary declares container/on-container. The plan bullet's generic container wording does not introduce six extra unsupported intent roles.
- AA diagnostics refine only new NS One gaps, using existing S0 palette steps: light intent text uses copper-8 (primary/accent), slate-7 (secondary/info), teal-7 (success), red-7 (destructive), and existing fg (warning). Dark text keeps its already passing legacy intent aliases. New border-control uses gray-6, block-purple uses slate-4, info-hover uses secondary, and accent-solid-hover uses copper-5. These are alias choices for newly introduced names; all existing declarations, Figma values and current component colors stay unchanged.
- Component key tokens belong to the declared Terminal variant and alias terminal/* roles. Contrast coverage therefore measures that variant in Terminal, consistent with pack ownership, rather than pretending it is a shared key component in every language. All core and shared component foregrounds still measure in every preset.
- Contrast matrix models Fluent's approved compound focus correctly: its outer 2px indicator is measured on base/layer/control backgrounds, together with the core ring. The decorative inner 1px line is not treated as a standalone indicator on the control fill. Added explicit card/control alpha stacks and all Liquid/Cupertino field/material surfaces; foreground and background omissions and weakened text thresholds now fail coverage validation.
- Extend the write surface to `.llm/tools/gates/catalog.ts` for an allowlisted token-quality receipt and `.github/workflows/fresh-ui-quality.yml` for its CI step. Existing token freshness/build/package gates remain intact.
- Checks review found destructive-hover was also a new NS One gap, not an old declaration. It now aliases the existing red-6 step in both schemes; its two exclusions are removed. A regression permits NS One exclusions only for legacy names, or component aliases whose resolved colors exactly match explicitly named S0 roles. The remaining 17 S0 entries are inherited pairs; Figma's 389 entries are unchanged.
- CLI slice writes the token engine port/adapter, token settings contract and kernel application flow under `packages/cli/src/kernel/{ports,adapters/tokens,domain/tokens,application/tokens}/`, plus public command composition/tests. Extend documentation scope to `packages/cli/README.md`, `docs/site/cli-reference.md` and `docs/site/reference/cli/commands.md` so the live command audit remains complete.
- The CLI adds one root group and three direct commands. Extend the write surface to the existing docs accuracy check's explicit census (93 to 97); preserve the exhaustive live-tree coverage assertion.
- Migration uses the actual registry copies: ThemeToggle.tsx, theme/styles.css, and button/form-control/card CSS under registry/components/ui. These are the necessary consuming bindings for the approved typography/radius/border/density/motion work. Their scope was implicit in the migration plan; record these exact paths explicitly now. NS One keeps existing component dimensions while other language geometry uses component roles.
- Browser proof exposed inaccessible accent labels in legacy badge CSS when used by Utility. Add badge.css to the registry binding surface and use the already registered *-text roles for new languages, retaining NS One declarations. Design specimens keep authored swatch colors and paint their new-language captions on neutral readable surfaces; no Figma value is changed or excluded from the scan.
- Extend the registry style surface to styles/layouts.css: new-language navigation group captions remove legacy opacity reduction so the authored muted-fg retains its passing contrast. NS One's existing opacity remains unchanged.
- The focused CLI template suite exposed an old text assertion against the newly generated catalog's object-key spelling. Replace it with a runtime catalog-content assertion, preserving the requirement that responsive-table is present. This avoids coupling the gate to quote formatting.
- The generated catalog now has18 additional theme cards. Their inherited warning kind badges would multiply an S0 contrast finding. Theme-kind metadata badges now use the existing readable muted style; actual component demos remain unchanged. Record the lowered old theme-seed allowance with the new empty findings for added theme cards.

- Independent migration review requires a button geometry regression in the existing Utility mobile browser case. The fix uses only existing control-height roles; no source value, preset axis, contrast exclusion or NS One rule changes.

- Final evaluation requires CSS sharding for default-output performance. The generated preset directory gains18 CSS siblings (68 total SD artifacts). App-managed files become23 (five core +18 opt-in preview CSS), and the design shell links only the selected preview stylesheet. Update registry paths, CLI whitelist/docs and current evidence; retain historical50-output/five-file slice records.
- Fresh's static-file middleware is the public asset authority: preview CSS is copied to static/presets and linked under /presets. Core files remain in assets. Direct unregistered Vite source paths returned404 in the candidate browser run; use the existing static surface rather than adding a serving route or loading all styles through imports. CLI cleanup uses the same exact target mapping and preserves unrelated static files.
- The actual theme-copy proof caught the registry planner's one-source/one-target contract: listing the configured CSS both as tokens.css and as its own preview path drops the first target. Theme items therefore install their configured CSS once as tokens.css and copy only the other17 preview files. The token CLI still builds all18 preview assets; the configured preset never requests its own preview. A regression requires unique copy-source paths per generated theme item. No registry planner behavior changes.

## CI and review follow-up

CI identified a stale MCP export corpus and contributor CLI command expectation.
Extend the write surface to the generated MCP export corpus and its provenance,
`packages/fresh-ui/registry.theme-items.generated.ts`, and the token asset embedding
script. Published JSON imports will become explicitly typed generated constants;
JSON remains authoritative and freshness is checked without repair. The existing
release preflight remains unchanged. Review follow-up also covers native DTCG color
spaces, optional hex hints, and document navigation out of language previews.

2026-10-28 review repair: add `tools/fresh-ui-browser/README.md` to declared documentation writes and the browser workflow setup to explicitly install theme-previews. Normal scaffolds no longer serve preview styles by default; browser coverage remains unchanged and opts in. This is a fixture setup change, not a gate exemption.

2026-10-28: new lightweight token-config export requires the Fresh UI reference inventory and refreshed MCP corpus/prose carriers. Declare `docs/site/reference/fresh-ui/index.md` and `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` as output writes. No coverage mode is reduced.

2026-10-28: also refresh `docs/site/reference/cli/commands.md` to describe the new previews flag and preset-preserving clean behavior. This keeps the command reference consistent with the changed CLI.
