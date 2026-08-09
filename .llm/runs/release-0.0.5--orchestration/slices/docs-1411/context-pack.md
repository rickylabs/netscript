# Context pack — docs #1411

## Current state

- Phase: Round 3 implementation and Tier-D gates complete; awaiting orchestrator IMPL-EVAL and CI.
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
- Round 2 implementation commit: `362714bbc`; structured evidence comment:
  https://github.com/rickylabs/netscript/pull/1412#issuecomment-5230543249.
- Round 3 scope: add Vento+Markdown processing to three reference pages and extend the rendered
  output gate from homepage semantics to a full-site literal-placeholder scan, with RED-before-fix
  and GREEN-after-fix evidence.
- Round 3 result: pre-fix gate exit 1 named streams/plugin-auth leaks; post-fix exit 0 scanned 220
  HTML files. The one legitimate CLI syntax surface is bounded to four exact occurrences and has an
  overflow test. All final docs/root static gates exit 0, including a complete rerun after targeted
  formatting of the owned checker/test files.
- Round 3 implementation commit: `f94c0ac28`; structured evidence comment:
  https://github.com/rickylabs/netscript/pull/1412#issuecomment-5230615501.
