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
