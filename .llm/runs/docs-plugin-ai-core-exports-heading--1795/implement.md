use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(plugin-ai-core): unrecognized Exports heading — #1795

Issue: https://github.com/rickylabs/netscript/issues/1795
Branch: `docs/plugin-ai-core-exports-heading` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-plugin-ai-core-exports-heading--1795/`
`PLAN-EVAL: N/A` — mechanical, single-package fix; the one judgment call (symbolCoverage mode) is
scoped and evidence-checkable, not architectural.

## What's wrong

`docs/site/reference/plugin-ai-core/index.md` already has a correct, complete two-row export table
under a `## Entrypoints` heading (around line 21):

```
| `@netscript/plugin-ai-core` | `./mod.ts` | ... |
| `@netscript/plugin-ai-core/contracts/v1` | `./src/contracts/v1/mod.ts` | ... |
```

`.llm/tools/docs/check-exports-drift.ts`'s `parseDocContent()` (~line 543) only recognizes this row
shape under a heading starting `## Sub-path exports` or `## Exports` — not `## Entrypoints`. The
table itself needs no content change; only the heading text is the defect.

## What to do

1. Rename `## Entrypoints` to `## Exports` in `docs/site/reference/plugin-ai-core/index.md`. Do not
   change the table rows or any other content on the page.

2. Add `plugin-ai-core` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`,
   matching the shape of existing entries (`name`, `packagePath: 'packages/plugin-ai-core'`,
   `docPath: 'docs/site/reference/plugin-ai-core/index.md'`, `packageName:
   '@netscript/plugin-ai-core'`, `excludedExports: []`, `symbolCoverage: { mode, reason }`).

   **Determine the mode honestly, per entrypoint:**
   - Run `deno doc --json packages/plugin-ai-core/mod.ts` and `deno doc --json
     packages/plugin-ai-core/src/contracts/v1/mod.ts`, extract the real exported symbol names
     (`nodes[<uri>].symbols[].name`, excluding `"default"`).
   - The page has dedicated `## Root surface (...)` and `## Full contract surface (...)` sections
     with per-symbol tables for each entrypoint respectively. Diff the real export sets against what
     those sections actually document (backtick-quoted identifiers in the tables).
   - If every real export for both entrypoints appears somewhere in those sections, `mode: 'complete'`
     is the honest claim. If either entrypoint has real exports genuinely missing from the page's
     tables, use `mode: 'entrypoints-only'` and name the real gap in `reason` — do not invent a vague
     justification, and do not default to `entrypoints-only` without actually checking (that was
     called out explicitly in the issue as the wrong instinct).
   - If you find genuinely undocumented symbols and decide `entrypoints-only` is the honest mode,
     you do NOT need to add rows for them (out of scope per the issue) — just describe the real
     omission accurately in `reason`.

3. Regenerate the derived docs-corpus chain, in this exact order:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/plugin-ai-core` source change.
- Rewriting/restructuring the page's existing symbol tables beyond what step 2 requires.
- The other nine remaining #1777 packages.

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
  --is-ancestor <sourceCommit> HEAD` must exit 0 (this repo has a known recurring defect where a
  rebase can orphan this value — it should not apply here since you are not rebasing, but verify it
  anyway before reporting done)

## Deliverable

Commit(s) on `docs/plugin-ai-core-exports-heading`, pushed. Open a PR against `main` titled
`docs(plugin-ai-core): recognize the existing Exports table and adopt into docs:exports-drift`, with
`Closes #1795`, a validation table with real exit codes at the pushed head, and the
acceptance-evidence fenced block for issue #1795's four Acceptance boxes.

**Write the issue's four Acceptance-box `box:` text to match single-line, unwrapped text exactly** —
the issue body already has them on single lines; copy them verbatim into your `acceptance-evidence`
block's `box:` fields (do not paraphrase or re-wrap). A prior slice's close-gate failed once because
of a text mismatch here — do not repeat it.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
