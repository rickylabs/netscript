use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(plugin-triggers-core): unrecognized Exports heading — #1807

Issue: https://github.com/rickylabs/netscript/issues/1807
Branch: `docs/plugin-triggers-core-exports-heading` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-plugin-triggers-core-exports-heading--1807/`
`PLAN-EVAL: N/A` — mechanical, single-package fix; the one judgment call (symbolCoverage mode) is
scoped and evidence-checkable.

## What's wrong

`docs/site/reference/plugin-triggers-core/index.md` already has a correct, complete twelve-row
export table under a `## Entrypoints` heading (around line 22), matching
`packages/plugin-triggers-core/deno.json`'s exports map exactly (root + 11 subpaths). `.llm/tools/docs/check-exports-drift.ts`'s
`parseDocContent()` (~line 543) only recognizes this row shape under a heading starting `## Sub-path
exports` or `## Exports` — not `## Entrypoints`. The table itself needs no content change; only the
heading text is the defect (same class of fix as #1795/#1797 — read PR #1796 or #1798's diff for the
exact pattern if useful).

## What to do

1. Rename `## Entrypoints` to `## Exports` in `docs/site/reference/plugin-triggers-core/index.md`.
   Do not change the table rows or any other content on the page.

2. Add `plugin-triggers-core` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`
   (`name: 'plugin-triggers-core'`, `packagePath: 'packages/plugin-triggers-core'`, `docPath:
   'docs/site/reference/plugin-triggers-core/index.md'`, `packageName:
   '@netscript/plugin-triggers-core'`, `excludedExports: []`, `symbolCoverage: { mode, reason }`).

   **Determine the mode honestly, per entrypoint:**
   - Run `deno doc --json` against each of the 12 entrypoint modules (`packages/plugin-triggers-core/mod.ts`,
     `.../src/public/mod.ts`, `.../src/builders/mod.ts`, `.../src/domain/mod.ts`, `.../src/ports/mod.ts`,
     `.../src/runtime/mod.ts`, `.../src/adapters/mod.ts`, `.../src/stores/mod.ts`, `.../src/config/mod.ts`,
     `.../src/contracts/v1/mod.ts`, `.../src/telemetry/mod.ts`, `.../src/testing/mod.ts`), extract real
     exported symbol names (`nodes[<uri>].symbols[].name`, excluding `"default"`) for each.
   - The page's own text notes entrypoint export counts "overlap rather than sum" — several subpaths
     re-export shared domain/vocabulary symbols. When computing gaps, check whether a symbol is
     documented ANYWHERE on the page (any section), not just under its own subpath's heading, before
     calling it missing — a shared symbol documented once under `/domain` and merely re-exported by
     `/ports` is not an omission for `/ports`.
   - If every real export for all 12 entrypoints is documented somewhere on the page, `mode:
     'complete'` is honest. If real, substantial gaps remain after accounting for shared/re-exported
     symbols, use `mode: 'entrypoints-only'` and name the specific real omissions in `reason`. Do not
     guess either mode — verify.

3. Regenerate the derived docs-corpus chain, in this exact order:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/plugin-triggers-core` source change.
- Rewriting/restructuring the page's existing symbol tables beyond what step 2 requires.
- The other four remaining #1777 packages.

## Required gates (run all, report real exit codes)

- `deno task docs:exports-drift`
- `deno task --cwd docs/site check:source-format`
- `deno task --cwd docs/site build`
- `deno task --cwd docs/site check:links`
- `deno task --cwd docs/site check:caveats`
- `deno task docs:links`
- `deno task docs:accuracy`
- `deno task docs:snippets`
- `deno task check:agent-docs-prose`
- `deno task check:assets-barrel`
- `deno task check:publish-assets`
- `deno task check:mcp-export-corpus`
- `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts`
- `git diff --check`
- `git status --porcelain` after all regenerating gates (report the exact output)
- confirm `deno.lock` is unchanged vs `origin/main`
- confirm `provenance.json`'s `sourceCommit` is a valid ancestor of your final head: `git merge-base
  --is-ancestor <sourceCommit> HEAD` must exit 0

## Deliverable

Commit(s) on `docs/plugin-triggers-core-exports-heading`, pushed. Open a PR against `main` titled
`docs(plugin-triggers-core): recognize the existing Exports table and adopt into docs:exports-drift`,
with `Closes #1807`, a validation table with real exit codes at the pushed head, and the
acceptance-evidence fenced block for issue #1807's four Acceptance boxes.

**Copy the issue's four Acceptance-box text verbatim, backticks included, into your
`acceptance-evidence` block's `box:` fields** — exact single-line match, no paraphrasing, no dropped
backticks. Multiple prior slices' close-gate runs failed from exactly this kind of text mismatch —
check your final `box:` strings character-for-character against the issue body before finishing.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
