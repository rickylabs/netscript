# Context pack — docs #1411

## Current state

- Phase: Round 2 implementation and Tier-D gates complete; PR evidence update pending.
- Branch/base: `fix/docs-versionless-jsr-specifiers` at `399f60185`.
- `PLAN-EVAL: N/A` was recorded before source edits because the slice is fully specified and
  mechanical.
- Sweep result: five unpinned install/import specifier occurrences across the four named sites
  (the import-map site contains two targets), repaired in three docs pages. The exact tree also has
  76 raw `jsr:@netscript/` textual prefixes when private plans, templates, placeholders, and prose
  mentions are included.

## Boundaries

- Do not touch `packages/**`, `plugins/**`, lockfiles, generated corpus/assets, runtime E2E, Aspire,
  or containers.
- Do not weaken or narrow `check:netscript-jsr-specifiers` and do not add an allowance for embedded
  documentation.
- The orchestrator owns separate-session IMPL-EVAL, CI, and merge.

## Evidence

- All requested docs/static gates exited 0; exact command results are in `worklog.md`.
- Rendered output pins each repaired target to `@0.0.4`.
- Only three docs source pages and this slice's run artifacts are owned; no package, plugin,
  lockfile, corpus, or generated asset is changed.
- Implementation commit: `9d27817e8`; draft PR: https://github.com/rickylabs/netscript/pull/1412.
- Review correction complete: four additional `deno add jsr:@netscript/ai` instructions are pinned.
  Across both rounds, nine defective published specifiers were repaired. The final sweep classified
  55 published command/import-map candidates and found zero unpinned.
- All Round 2 requested gates exit 0; rendered output shows the four AI instructions at `@0.0.4`.
