use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(plugin-streams-core): unrecognized Exports heading — #1797

Issue: https://github.com/rickylabs/netscript/issues/1797
Branch: `docs/plugin-streams-core-exports-heading` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-plugin-streams-core-exports-heading--1797/`
`PLAN-EVAL: N/A` — mechanical, single-package fix; the one judgment call (symbolCoverage mode) is
scoped and evidence-checkable, not architectural.

## What's wrong

`docs/site/reference/plugin-streams-core/index.md` already has a correct, complete four-row export
table under a `## Entrypoints` heading (around line 23), matching
`packages/plugin-streams-core/deno.json`'s `exports` map exactly:

```
| `@netscript/plugin-streams-core` | `./mod.ts` | ... |
| `@netscript/plugin-streams-core/sse` | `./src/sse/mod.ts` | ... |
| `@netscript/plugin-streams-core/telemetry` | `./src/telemetry/mod.ts` | ... |
| `@netscript/plugin-streams-core/testing` | `./src/testing/mod.ts` | ... |
```

`.llm/tools/docs/check-exports-drift.ts`'s `parseDocContent()` (~line 543) only recognizes this row
shape under a heading starting `## Sub-path exports` or `## Exports` — not `## Entrypoints`. The
table itself needs no content change; only the heading text is the defect (same class of fix as
#1795/PR #1796 for `plugin-ai-core` — read that PR's diff for the exact pattern if useful).

## What to do

1. Rename `## Entrypoints` to `## Exports` in `docs/site/reference/plugin-streams-core/index.md`.
   Do not change the table rows or any other content on the page.

2. Add `plugin-streams-core` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`,
   matching the shape of existing entries (`name`, `packagePath: 'packages/plugin-streams-core'`,
   `docPath: 'docs/site/reference/plugin-streams-core/index.md'`, `packageName:
   '@netscript/plugin-streams-core'`, `excludedExports: []`, `symbolCoverage: { mode, reason }`).

   **Determine the mode honestly, per entrypoint:**
   - Run `deno doc --json` against each of the four entrypoint modules: `packages/plugin-streams-core/mod.ts`,
     `packages/plugin-streams-core/src/sse/mod.ts`, `packages/plugin-streams-core/src/telemetry/mod.ts`,
     `packages/plugin-streams-core/src/testing/mod.ts`. Extract real exported symbol names
     (`nodes[<uri>].symbols[].name`, excluding `"default"`) for each.
   - The page has dedicated sections: `## Root surface (...)` for the root entrypoint, `## The SSE
     contract (...)` for `/sse`, and `## Telemetry and testing` covering both `/telemetry` and
     `/testing`. Diff each entrypoint's real export set against what its section actually documents
     (backtick-quoted identifiers in its tables).
   - If every real export for all four entrypoints appears somewhere in its section, `mode: 'complete'`
     is the honest claim. If any entrypoint has real exports genuinely missing from its section, use
     `mode: 'entrypoints-only'` and name the specific real gap(s) in `reason` — do not invent a vague
     justification, and do not default to `entrypoints-only` without actually checking.
   - You do NOT need to add rows for any genuinely undocumented symbols you find (out of scope) — just
     describe the real omission accurately in `reason` if you choose `entrypoints-only`.

3. Regenerate the derived docs-corpus chain, in this exact order:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/plugin-streams-core` source change.
- Rewriting/restructuring the page's existing symbol tables beyond what step 2 requires.
- The other eight remaining #1777 packages.

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

Commit(s) on `docs/plugin-streams-core-exports-heading`, pushed. Open a PR against `main` titled
`docs(plugin-streams-core): recognize the existing Exports table and adopt into docs:exports-drift`,
with `Closes #1797`, a validation table with real exit codes at the pushed head, and the
acceptance-evidence fenced block for issue #1797's four Acceptance boxes.

**Copy the issue's four Acceptance-box text verbatim into your `acceptance-evidence` block's `box:`
fields** — the issue body already has them on single unwrapped lines; do not paraphrase or re-wrap
them. A prior slice's close-gate failed once from a text mismatch here — do not repeat it.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
