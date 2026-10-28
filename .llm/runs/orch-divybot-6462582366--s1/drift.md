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
