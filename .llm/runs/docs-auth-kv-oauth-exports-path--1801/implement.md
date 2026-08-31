use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(auth-kv-oauth): missing Path column and a backtick-broken row — #1801

Issue: https://github.com/rickylabs/netscript/issues/1801
Branch: `docs/auth-kv-oauth-exports-path` (already pushed, tracks `origin/main` at `5197e70b7`)
Run dir: `.llm/runs/docs-auth-kv-oauth-exports-path--1801/`
`PLAN-EVAL: N/A` — mechanical, single-page table fix; the one judgment call (symbolCoverage mode) is
scoped and evidence-checkable.

## What's wrong

`docs/site/reference/auth-kv-oauth/index.md` already has a `## Sub-path exports` heading with a table
listing all eight exports of `@netscript/auth-kv-oauth` — but the table is **Export | Purpose**, with
no path column. `.llm/tools/docs/check-exports-drift.ts`'s `parseDocContent()` (~line 543) captures
the row's second cell as the export's path and compares it against the real `deno.json` path, so
every row whose regex still matches is reported as a **path mismatch** (the "path" it finds is really
the Purpose prose). One row — `@netscript/auth-kv-oauth/providers`, whose Purpose cell contains an
embedded code span (`` Provider presets and `defineOAuthProvider`. ``) — has its own internal
backtick break the row-matching regex entirely (`[^\`|]+` cannot span a backtick), so that row is
dropped from parsing altogether and reported as a full **omission** instead of a mismatch.

`packages/auth-kv-oauth/deno.json` exports:
```json
{ ".": "./mod.ts", "./providers": "./src/providers.ts", "./store": "./src/store.ts",
  "./crypto": "./src/crypto.ts", "./cookies": "./src/cookies.ts", "./flow": "./src/flow.ts",
  "./backend": "./src/backend.ts", "./errors": "./src/errors.ts" }
```

## What to do

1. Add a **Path** column to the existing `## Sub-path exports` table (e.g. Export | Path | Purpose),
   giving each of the eight rows its real path from the `deno.json` exports map above. Keep every
   existing Export name and Purpose description unchanged — only add the new column's values.

2. Fix the `/providers` row's Purpose cell so it no longer contains an embedded backtick-quoted term
   that breaks the row regex. Rephrase (e.g. "Provider presets and the `defineOAuthProvider`
   helper." → something without an internal code span, such as "Provider presets and the
   defineOAuthProvider helper.") without changing its meaning. Verify after your edit that this row's
   line matches the same row shape as the other seven.

3. Add `auth-kv-oauth` to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`
   (`name: 'auth-kv-oauth'`, `packagePath: 'packages/auth-kv-oauth'`, `docPath:
   'docs/site/reference/auth-kv-oauth/index.md'`, `packageName: '@netscript/auth-kv-oauth'`,
   `excludedExports: []`, `symbolCoverage: { mode, reason }`).

   **Determine the mode honestly:** run `deno doc --json` against each of the eight entrypoint
   modules (`packages/auth-kv-oauth/mod.ts`, `packages/auth-kv-oauth/src/providers.ts`,
   `.../src/store.ts`, `.../src/crypto.ts`, `.../src/cookies.ts`, `.../src/flow.ts`,
   `.../src/backend.ts`, `.../src/errors.ts`), extract real exported symbol names
   (`nodes[<uri>].symbols[].name`, excluding `"default"`) for each. The page has other sections
   (`## Backend and flow factories`, `## Cookie, environment, and discovery helpers`, `## Main
   types`) with their own symbol tables — diff each entrypoint's real exports against what's actually
   documented anywhere on the page. If every real export for all eight entrypoints is documented
   somewhere, `mode: 'complete'` is honest; if real gaps exist, use `mode: 'entrypoints-only'` and
   name the specific missing symbols in `reason`. Do not default to `entrypoints-only` without
   checking, and do not guess `complete` without checking either — verify both directions.

4. Regenerate the derived docs-corpus chain, in this exact order:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/auth-kv-oauth` source change.
- Restructuring the page's other sections beyond what step 3's honesty check requires.
- The other six remaining #1777 packages.

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

Commit(s) on `docs/auth-kv-oauth-exports-path`, pushed. Open a PR against `main` titled
`docs(auth-kv-oauth): add Path column to Sub-path exports and adopt into docs:exports-drift`, with
`Closes #1801`, a validation table with real exit codes at the pushed head, and the
acceptance-evidence fenced block for issue #1801's four Acceptance boxes.

**Copy the issue's four Acceptance-box text verbatim, backticks included, into your
`acceptance-evidence` block's `box:` fields** — exact single-line match, no paraphrasing, no dropped
backticks. Two prior slices' close-gate runs failed from exactly this kind of text mismatch — check
your final `box:` strings character-for-character against the issue body before finishing.

Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
