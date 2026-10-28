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
