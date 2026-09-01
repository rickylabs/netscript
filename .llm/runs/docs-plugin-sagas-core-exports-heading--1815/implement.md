use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(plugin-sagas-core): unrecognized Exports heading — #1815

Issue: https://github.com/rickylabs/netscript/issues/1815
Branch: `docs/plugin-sagas-core-exports-heading` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-plugin-sagas-core-exports-heading--1815/`
`PLAN-EVAL: N/A` — mechanical, single-package fix; the one judgment call (symbolCoverage mode) is
scoped and evidence-checkable.

## What's wrong

`docs/site/reference/plugin-sagas-core/index.md` already has a correct, complete nineteen-row export
table under a `## Entrypoints` heading (around line 21), matching
`packages/plugin-sagas-core/deno.json`'s exports map exactly (root + 18 subpaths).
`.llm/tools/docs/check-exports-drift.ts`'s `parseDocContent()` (~line 543) only recognizes this row
shape under a heading starting `## Sub-path exports` or `## Exports` — not `## Entrypoints`. The
table itself needs no content change; only the heading text is the defect (same class of fix already
applied in PRs #1796, #1798, #1808, #1813 — read one of their diffs for the exact pattern if useful).

## What to do

1. Rename `## Entrypoints` to `## Exports` in `docs/site/reference/plugin-sagas-core/index.md`.
   Do not change the table rows or any other content on the page.

2. Add `plugin-sagas-core` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`
   (`name: 'plugin-sagas-core'`, `packagePath: 'packages/plugin-sagas-core'`, `docPath:
   'docs/site/reference/plugin-sagas-core/index.md'`, `packageName: '@netscript/plugin-sagas-core'`,
   `excludedExports: []`, `symbolCoverage: { mode, reason }`).

   **Determine the mode honestly:**
   - Run `deno doc --json` against all 19 entrypoint modules (`packages/plugin-sagas-core/mod.ts`,
     `.../src/builders/mod.ts`, `.../src/domain/mod.ts`, `.../src/ports/mod.ts`,
     `.../src/runtime/mod.ts`, `.../src/adapters/mod.ts`, `.../src/transports/mod.ts`,
     `.../src/stores/mod.ts`, `.../src/middleware/mod.ts`, `.../src/integration/workers/mod.ts`,
     `.../src/integration/publisher/mod.ts`, `.../src/telemetry/mod.ts`, `.../src/config/mod.ts`,
     `.../src/contracts/v1/mod.ts`, `.../src/streams/mod.ts`, `.../src/presets/mod.ts`,
     `.../src/abstracts/mod.ts`, `.../src/testing/mod.ts`, `.../src/agent/mod.ts`), extract real
     exported symbol names (`nodes[<uri>].symbols[].name`, excluding `"default"`) for each.
   - The page's own text notes entrypoint export counts overlap where a type is re-exported through
     more than one layer. When computing gaps, check whether a symbol is documented ANYWHERE on the
     page (any section), not just under its own subpath's heading, before calling it missing.
   - If every real export for all 19 entrypoints is documented somewhere on the page, `mode:
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

- Any `packages/plugin-sagas-core` source change.
- Rewriting/restructuring the page's existing symbol tables beyond what step 2 requires.
- The last remaining #1777 package (`fresh`).

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

Commit(s) on `docs/plugin-sagas-core-exports-heading`, pushed. Open a PR against `main` titled
`docs(plugin-sagas-core): recognize the existing Exports table and adopt into docs:exports-drift`,
with `Closes #1815`, a validation table with real exit codes at the pushed head, and the
acceptance-evidence fenced block for issue #1815's four Acceptance boxes.

**Copy the issue's four Acceptance-box lines into your `acceptance-evidence` block's `box:` fields by
literal copy-paste of the text between `- [ ] ` and the end of the line** — do not retype them, and
make sure every leading backtick survives. Diff your four `box:` strings against the issue's four
lines character-for-character before finishing.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
