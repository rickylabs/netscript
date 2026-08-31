use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(ai): unrecognized heading + missing /skills row — #1809

Issue: https://github.com/rickylabs/netscript/issues/1809
Branch: `docs/ai-exports-heading-and-skills` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-ai-exports-heading-and-skills--1809/`
`PLAN-EVAL: N/A` — mechanical, single-package fix; the one judgment call (symbolCoverage mode) is
scoped and evidence-checkable.

## What's wrong

`docs/site/reference/ai/index.md` has an `## Export map` heading (around line 27) with a table
already in the correct row shape — but two distinct defects:

1. The heading text `## Export map` doesn't match what `.llm/tools/docs/check-exports-drift.ts`'s
   `parseDocContent()` (~line 543) recognizes (`## Sub-path exports` or `## Exports` only).
2. The table is missing one real export entirely: `@netscript/ai/skills` -> `./src/skills/mod.ts`
   (present in `packages/ai/deno.json`'s exports map, absent from the table).

`packages/ai/deno.json` exports:
```json
{ ".": "./mod.ts", "./anthropic": "./anthropic.ts", "./openai-compatible": "./openai-compatible.ts",
  "./openai-embeddings": "./openai-embeddings.ts", "./openrouter": "./openrouter.ts",
  "./ollama": "./ollama.ts", "./mcp": "./mcp.ts", "./agent": "./agent.ts",
  "./skills": "./src/skills/mod.ts", "./contracts": "./src/contracts/mod.ts",
  "./ports": "./src/ports/mod.ts", "./tools": "./tools.ts", "./testing": "./src/testing/mod.ts" }
```

## What to do

1. Rename `## Export map` to `## Exports` in `docs/site/reference/ai/index.md`. Do not change any
   existing row's Export, Entrypoint, or Purpose text.

2. Add one new row to the same table for `@netscript/ai/skills` -> `./src/skills/mod.ts`, matching
   the existing `| Export | Entrypoint | Purpose |` column format. Write an accurate one-line Purpose
   description based on what `packages/ai/src/skills/mod.ts` actually exports (`deno doc --json` it
   first) — do not guess or copy another row's wording.

3. Add `ai` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts` (`name: 'ai'`,
   `packagePath: 'packages/ai'`, `docPath: 'docs/site/reference/ai/index.md'`, `packageName:
   '@netscript/ai'`, `excludedExports: []`, `symbolCoverage: { mode, reason }`).

   **Determine the mode honestly:** run `deno doc --json` against all 13 entrypoint modules (root
   `mod.ts`, `anthropic.ts`, `openai-compatible.ts`, `openai-embeddings.ts`, `openrouter.ts`,
   `ollama.ts`, `mcp.ts`, `agent.ts`, `src/skills/mod.ts`, `src/contracts/mod.ts`, `src/ports/mod.ts`,
   `tools.ts`, `src/testing/mod.ts`), extract real exported symbol names (`nodes[<uri>].symbols[].name`,
   excluding `"default"`) for each. The page has dedicated sections for several entrypoints (`##
   Composition root and model registry`, `## Domain contracts`, `## Capability ports`, `## Model
   providers`, `## Tools`, `## Agent loop`, `## MCP`, `## Testing`) — diff each entrypoint's real
   exports against what's documented anywhere on the page. `/skills` almost certainly has no
   dedicated section (this issue does not ask you to add one) — reflect that honestly in the
   `reason` if choosing `entrypoints-only`, rather than pretending coverage that doesn't exist.

4. Regenerate the derived docs-corpus chain, in this exact order:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/ai` source change.
- Writing a new dedicated per-symbol section for `/skills` or any other entrypoint.
- The other three remaining #1777 packages.

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

Commit(s) on `docs/ai-exports-heading-and-skills`, pushed. Open a PR against `main` titled
`docs(ai): recognize Exports table, add missing /skills row, and adopt into docs:exports-drift`, with
`Closes #1809`, a validation table with real exit codes at the pushed head, and the
acceptance-evidence fenced block for issue #1809's four Acceptance boxes.

**Critical, recurring defect to avoid — read this carefully**: the last three implementation slices
in this queue each dropped backticks from the *first* code-identifier in an `acceptance-evidence`
`box:` string (e.g. writing `plugin-triggers-core is in ...` instead of `` `plugin-triggers-core` is
in ... ``), even though every other backtick in the same string was preserved correctly. Before you
finish, copy each of the issue's four Acceptance-box lines into your `acceptance-evidence` block by
literal copy-paste of the text between the ``- [ ] `` and the end of the line — do not retype it, and
do not let a code-formatting or auto-linting step strip the leading backtick pair. Then diff your
four `box:` strings against the issue's four lines character-for-character before finishing.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
