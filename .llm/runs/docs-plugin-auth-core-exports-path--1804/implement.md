use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(plugin-auth-core): missing Path column — #1804

Issue: https://github.com/rickylabs/netscript/issues/1804
Branch: `docs/plugin-auth-core-exports-path` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-plugin-auth-core-exports-path--1804/`
`PLAN-EVAL: N/A` — mechanical, single-page table fix; the one judgment call (symbolCoverage mode) is
scoped and evidence-checkable.

## What's wrong

`docs/site/reference/plugin-auth-core/index.md` already has a `## Sub-path exports` heading with a
table listing all nine exports of `@netscript/plugin-auth-core` — but the table is **Export |
Purpose**, with no path column. `.llm/tools/docs/check-exports-drift.ts`'s `parseDocContent()` (~line
543) captures the row's second cell as the export's path and compares it against the real
`deno.json` path, so every row is reported as a **path mismatch** (the "path" it finds is really the
Purpose prose).

`packages/plugin-auth-core/deno.json` exports:
```json
{ ".": "./mod.ts", "./domain": "./src/domain/mod.ts", "./ports": "./src/ports/mod.ts",
  "./contracts/v1": "./src/contracts/v1/mod.ts", "./telemetry": "./src/telemetry/mod.ts",
  "./streams": "./src/streams/mod.ts", "./config": "./src/config/mod.ts",
  "./presets": "./src/presets/mod.ts", "./testing": "./src/testing/mod.ts" }
```

This is the same defect class PR #1803 just fixed for `auth-kv-oauth` — read that PR's diff for the
exact pattern (add a Path column; no embedded-backtick row issue here, since none of these nine
Purpose cells contain a code span).

## What to do

1. Add a **Path** column to the existing `## Sub-path exports` table (Export | Path | Purpose),
   giving each of the nine rows its real path from the `deno.json` exports map above. Keep every
   existing Export name and Purpose description unchanged — only add the new column's values.

2. Add `plugin-auth-core` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`
   (`name: 'plugin-auth-core'`, `packagePath: 'packages/plugin-auth-core'`, `docPath:
   'docs/site/reference/plugin-auth-core/index.md'`, `packageName: '@netscript/plugin-auth-core'`,
   `excludedExports: []`, `symbolCoverage: { mode, reason }`).

   **Determine the mode honestly:** run `deno doc --json` against each of the nine entrypoint
   modules (`packages/plugin-auth-core/mod.ts`, `.../src/domain/mod.ts`, `.../src/ports/mod.ts`,
   `.../src/contracts/v1/mod.ts`, `.../src/telemetry/mod.ts`, `.../src/streams/mod.ts`,
   `.../src/config/mod.ts`, `.../src/presets/mod.ts`, `.../src/testing/mod.ts`), extract real
   exported symbol names (`nodes[<uri>].symbols[].name`, excluding `"default"`) for each. The page
   has other sections (`## Backend ports and errors`, `## Factories and helpers`, `## Contracts,
   schemas, and constants`, `## Common types`) with their own symbol tables — diff each entrypoint's
   real exports against what's actually documented anywhere on the page. If every real export for
   all nine entrypoints is documented somewhere, `mode: 'complete'` is honest; if real gaps exist, use
   `mode: 'entrypoints-only'` and name the specific missing symbols in `reason`. Check both directions
   — do not assume either mode without verifying.

3. Regenerate the derived docs-corpus chain, in this exact order:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/plugin-auth-core` source change.
- Restructuring the page's other sections beyond what step 2's honesty check requires.
- The other five remaining #1777 packages.

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

Commit(s) on `docs/plugin-auth-core-exports-path`, pushed. Open a PR against `main` titled
`docs(plugin-auth-core): add Path column to Sub-path exports and adopt into docs:exports-drift`, with
`Closes #1804`, a validation table with real exit codes at the pushed head, and the
acceptance-evidence fenced block for issue #1804's four Acceptance boxes.

**Copy the issue's four Acceptance-box text verbatim, backticks included, into your
`acceptance-evidence` block's `box:` fields** — exact single-line match, no paraphrasing, no dropped
backticks. Prior slices' close-gate runs failed from exactly this kind of text mismatch — check your
final `box:` strings character-for-character against the issue body before finishing.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
