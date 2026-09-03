use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(fresh): missing Exports table, four undocumented entrypoints — #1817

Issue: https://github.com/rickylabs/netscript/issues/1817
Branch: `docs/fresh-exports-table` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-fresh-exports-table--1817/`
`PLAN-EVAL: N/A` — mechanical, single-package fix; the judgment calls (four new one-line Purpose
descriptions, symbolCoverage mode) are scoped and evidence-checkable via `deno doc`, not
architectural.

## What's wrong

`docs/site/reference/fresh/index.md` has no `## Sub-path exports` or `## Exports` heading anywhere.
`.llm/tools/docs/check-exports-drift.ts`'s `parseDocContent()` (~line 543) requires exactly one of
those two headings with a top-level summary table under it. This page instead documents each
entrypoint under its own individual heading (`## Root entrypoint`, `` ## `@netscript/fresh/server` ``,
etc. — 12 such headings exist). Four of the package's 16 real exports have **no heading section at
all** anywhere on the page: `/desktop`, `/defer/island`, `/ai`, `/ai/sandbox`.

`packages/fresh/deno.json` exports (16 total: root + 15 subpaths):
```json
{ ".": "./mod.ts", "./server": "./src/runtime/server/mod.ts", "./desktop": "./src/runtime/desktop/mod.ts",
  "./builders": "./src/application/builders/mod.ts", "./route": "./src/application/route/mod.ts",
  "./defer": "./src/application/defer/mod.ts", "./defer/island": "./src/application/defer/island.ts",
  "./form": "./src/application/form/mod.ts", "./error": "./src/diagnostics/error/mod.ts",
  "./streams": "./src/runtime/streams/mod.ts", "./ai": "./src/runtime/ai/mod.ts",
  "./ai/sandbox": "./src/runtime/ai/sandbox.ts", "./query": "./src/application/query/mod.ts",
  "./interactive": "./src/runtime/interactive/mod.ts", "./vite": "./src/application/vite/vite.ts",
  "./testing": "./src/testing/mod.ts" }
```

## What to do

1. Add one summary table under a new `## Exports` heading (place it near the top of the page,
   similar to how `mcp`'s or `plugin-ai-core`'s reference page structures its summary table — read
   `docs/site/reference/mcp/index.md` or `docs/site/reference/plugin-ai-core/index.md` for the
   pattern if useful), listing all sixteen exports with their real `deno.json` paths:

   ```
   | Export | Path | Purpose |
   | --- | --- | --- |
   | `@netscript/fresh` | `./mod.ts` | ... |
   | `@netscript/fresh/server` | `./src/runtime/server/mod.ts` | ... |
   | `@netscript/fresh/desktop` | `./src/runtime/desktop/mod.ts` | ... |
   | `@netscript/fresh/builders` | `./src/application/builders/mod.ts` | ... |
   | `@netscript/fresh/route` | `./src/application/route/mod.ts` | ... |
   | `@netscript/fresh/defer` | `./src/application/defer/mod.ts` | ... |
   | `@netscript/fresh/defer/island` | `./src/application/defer/island.ts` | ... |
   | `@netscript/fresh/form` | `./src/application/form/mod.ts` | ... |
   | `@netscript/fresh/error` | `./src/diagnostics/error/mod.ts` | ... |
   | `@netscript/fresh/streams` | `./src/runtime/streams/mod.ts` | ... |
   | `@netscript/fresh/ai` | `./src/runtime/ai/mod.ts` | ... |
   | `@netscript/fresh/ai/sandbox` | `./src/runtime/ai/sandbox.ts` | ... |
   | `@netscript/fresh/query` | `./src/application/query/mod.ts` | ... |
   | `@netscript/fresh/interactive` | `./src/runtime/interactive/mod.ts` | ... |
   | `@netscript/fresh/vite` | `./src/application/vite/vite.ts` | ... |
   | `@netscript/fresh/testing` | `./src/testing/mod.ts` | ... |
   ```

   For the twelve entrypoints that already have their own dedicated heading elsewhere on the page,
   write a one-line Purpose summarizing what that existing section already says (do not duplicate
   its full content, do not change the existing section itself).

   For the four entrypoints with **no** existing section (`/desktop`, `/defer/island`, `/ai`,
   `/ai/sandbox`), run `deno doc --json` on each real module
   (`packages/fresh/src/runtime/desktop/mod.ts`, `packages/fresh/src/application/defer/island.ts`,
   `packages/fresh/src/runtime/ai/mod.ts`, `packages/fresh/src/runtime/ai/sandbox.ts`) and write an
   accurate one-line Purpose based on what each one actually exports. Do not guess, do not invent
   capabilities, and do not describe them by analogy to another NetScript package's `/ai` or
   `/desktop` surface — describe only what `packages/fresh`'s own modules actually contain.

2. Add `fresh` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts` (`name:
   'fresh'`, `packagePath: 'packages/fresh'`, `docPath: 'docs/site/reference/fresh/index.md'`,
   `packageName: '@netscript/fresh'`, `excludedExports: []`, `symbolCoverage: { mode, reason }`).
   Verify with `deno doc --json` against all 16 entrypoint modules and name the real, substantial gap
   categories in `reason`. Given four entrypoints have zero per-symbol tables and the twelve
   documented ones are unlikely to be fully exhaustive, `mode: 'entrypoints-only'` is the likely
   honest choice, but verify rather than assume — check whether any entrypoint's existing section is
   actually complete before deciding the overall mode. A category-level summary in `reason` is fine
   for a large gap (as used for other large packages already in this mapping); do not enumerate
   hundreds of symbols individually.

3. Regenerate the derived docs-corpus chain, in this exact order:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/fresh` source change.
- Writing new dedicated per-symbol documentation sections for `/desktop`, `/defer/island`, `/ai`, or
  `/ai/sandbox` — only the one-line summary-table Purpose is required for each.
- Restructuring or rewriting any of the twelve existing per-entrypoint sections.

This is the final #1777 package in the current serial queue.

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

Commit(s) on `docs/fresh-exports-table`, pushed. Open a PR against `main` titled `docs(fresh): add
Exports table for all sixteen entrypoints and adopt into docs:exports-drift`, with `Closes #1817`, a
validation table with real exit codes at the pushed head, and the acceptance-evidence fenced block
for issue #1817's four Acceptance boxes.

**Copy the issue's four Acceptance-box lines into your `acceptance-evidence` block's `box:` fields by
literal copy-paste of the text between `- [ ] ` and the end of the line** — do not retype them, and
make sure every leading backtick survives. Diff your four `box:` strings against the issue's four
lines character-for-character before finishing.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
