use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(five single-entrypoint packages) — #1793

Issue: https://github.com/rickylabs/netscript/issues/1793
Branch: `docs/five-single-entrypoint-exports` (already pushed, tracks `origin/main` at `96d44758d`)
Run dir: `.llm/runs/docs-five-single-entrypoint-exports--1793/`
`PLAN-EVAL: N/A` — mechanical, uniform-shape fix across five tiny packages; no architectural decision.

## What's wrong

`.llm/tools/docs/check-exports-drift.ts`'s `parseDocContent()` (lines ~543-596) only registers a
documented package export from a table row shaped `| \`@netscript/...\` | \`./path.ts\` | ...`
appearing under a `## Sub-path exports` or `## Exports` heading. Five packages' reference pages
mention their own package name in prose (title/heading/import example) but have **no such heading
and no such row at all** — so even though the package is genuinely and correctly documented in
prose, the checker cannot see it, and none of these five packages can be adopted into
`AUTHORITATIVE_MAPPING`.

The five packages, each with a single root Deno export (`.` -> `./mod.ts`) and nothing else:

| Package | Doc page |
| --- | --- |
| `watchers` | `docs/site/reference/watchers/index.md` |
| `runtime-config` | `docs/site/reference/runtime-config/index.md` |
| `prisma-adapter-mysql` | `docs/site/reference/prisma-adapter-mysql/index.md` |
| `auth-workos` | `docs/site/reference/auth-workos/index.md` |
| `auth-better-auth` | `docs/site/reference/auth-better-auth/index.md` |

## What to do, per package

1. Add a small `## Exports` section to the page with exactly one table row:

   ```
   ## Exports

   | Export | Path |
   | --- | --- |
   | `@netscript/<pkg>` | `./mod.ts` |
   ```

   Place it wherever fits the page's existing structure best (a natural first or last section is
   fine) — do not otherwise restructure or reflow the page.

2. Add the package to `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`, following
   the exact shape of existing entries (see e.g. the `aspire`/`cli`/`kv` entries already in the
   array). Required fields: `name`, `packagePath: 'packages/<pkg>'`, `docPath`, `packageName:
   '@netscript/<pkg>'`, `excludedExports: []`, and `symbolCoverage: { mode, reason }`.

   **The `mode`/`reason` choice is an editorial decision, not a mechanical copy** — per #1777's own
   rule, don't default every package to `entrypoints-only` without looking. Since each of these five
   packages has only ONE export (the root `mod.ts`) and the page already documents its primary
   factories/types/symbols in prose sections, check with `deno doc --json packages/<pkg>/mod.ts`
   whether the page's existing content already amounts to a complete symbol inventory for that single
   entrypoint. If it does, `mode: 'complete'` with a reason saying so is more honest than
   `entrypoints-only`. If the page deliberately curates only primary/stable symbols and omits some
   exported internals, use `entrypoints-only` and say why in the `reason`. Decide per package — they
   need not all get the same mode.

3. Regenerate the derived docs-corpus chain, in this exact order, since `docs/site/**` is a generator
   input:

   ```
   deno task gen:agent-docs-prose
   deno task gen:assets-barrel
   deno task gen:publish-assets
   ```

## Explicitly out of scope

- Any `packages/*` source change.
- The other ten remaining #1777 packages — do not touch their pages or add them to the mapping.
- Reformatting anything beyond the one added `## Exports` section per page.

## Required gates (run all, report real exit codes)

- `deno task docs:exports-drift` — must pass with the five new mappings
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
- `git diff --check` (no whitespace/EOF violations)
- `git status --porcelain` after all regenerating gates (report the exact output)
- confirm `deno.lock` is unchanged vs `origin/main`

## Deliverable

Commit(s) on `docs/five-single-entrypoint-exports`, pushed. Then open a PR against `main` titled
`docs(watchers,runtime-config,prisma-adapter-mysql,auth-workos,auth-better-auth): add Exports table
and adopt into docs:exports-drift`, with `Closes #1793`, a validation table with real exit codes at
the pushed head, and the acceptance-evidence fenced block for issue #1793's four Acceptance boxes.
Do not set `status:ready-merge` yourself — leave the PR at `status:impl`; the supervisor session
handles evaluation and lifecycle labels.
