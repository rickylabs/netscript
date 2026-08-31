use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(mcp): missing Exports summary table — #1799

Issue: https://github.com/rickylabs/netscript/issues/1799
Branch: `docs/mcp-exports-table` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-mcp-exports-table--1799/`
`PLAN-EVAL: N/A` — mechanical, single-package fix; the one judgment call (symbolCoverage mode) is
scoped and evidence-checkable.

## What's wrong

`docs/site/reference/mcp/index.md` has a `## Sub-path exports` heading — the exact text
`.llm/tools/docs/check-exports-drift.ts`'s `parseDocContent()` (~line 543) recognizes — but nothing
under it is in the top-level row shape the checker scans for (`| \`@netscript/...\` | \`./path.ts\` |
...`). It only has an `### @netscript/mcp/cli` subsection with a per-symbol table. The root export
and `/openapi-projection` aren't mentioned under this heading at all.

`packages/mcp/deno.json` exports:
```json
{ ".": "./mod.ts", "./cli": "./cli.ts", "./openapi-projection": "./openapi-projection.ts" }
```

## What to do

1. Add a small summary table directly under `## Sub-path exports`, before the existing `###
   @netscript/mcp/cli` subsection:

   ```
   | Export | Path |
   | --- | --- |
   | `@netscript/mcp` | `./mod.ts` |
   | `@netscript/mcp/cli` | `./cli.ts` |
   | `@netscript/mcp/openapi-projection` | `./openapi-projection.ts` |
   ```

   Keep the existing `### @netscript/mcp/cli` subsection exactly as-is below the new table. Do not
   add new per-symbol subsections for the root or `/openapi-projection` — that's out of scope.

2. Add `mcp` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`
   (`name: 'mcp'`, `packagePath: 'packages/mcp'`, `docPath: 'docs/site/reference/mcp/index.md'`,
   `packageName: '@netscript/mcp'`, `excludedExports: []`, `symbolCoverage: { mode, reason }`).

   **Determine the mode honestly:** run `deno doc --json` against `packages/mcp/mod.ts`,
   `packages/mcp/cli.ts`, and `packages/mcp/openapi-projection.ts`, extract real exported symbol
   names (`nodes[<uri>].symbols[].name`, excluding `"default"`). The root and `/openapi-projection`
   have no dedicated per-symbol section on this page, and `/cli`'s existing table likely doesn't
   cover 100% of `cli.ts`'s real exports either. This strongly points to `mode: 'entrypoints-only'`,
   but verify rather than assume — check what's actually documented elsewhere on the page (the page
   has several other tables like `## Default adapters`, `## Command policy`, etc. that may already
   cover some root symbols) before finalizing the `reason` text, and name the real, substantial gaps
   specifically (which symbols, not just "some symbols").

3. Regenerate the derived docs-corpus chain, in this exact order:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/mcp` source change.
- New per-symbol documentation beyond the one summary table.
- The other seven remaining #1777 packages.

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

Commit(s) on `docs/mcp-exports-table`, pushed. Open a PR against `main` titled
`docs(mcp): add Exports summary table and adopt into docs:exports-drift`, with `Closes #1799`, a
validation table with real exit codes at the pushed head, and the acceptance-evidence fenced block
for issue #1799's four Acceptance boxes.

**Copy the issue's four Acceptance-box text verbatim into your `acceptance-evidence` block's `box:`
fields** — single unwrapped lines, exact match, no paraphrasing.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
