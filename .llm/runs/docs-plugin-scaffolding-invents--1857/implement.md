use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(plugins): remove two fabricated `/scaffolding` subpath sections — refs #1857

Issue: https://github.com/rickylabs/netscript/issues/1857 (this is **step 1** of that issue — a
partial slice; reference `#1857` **without** a closing keyword)
Branch: `docs/plugin-scaffolding-invents-fix` (already pushed, tracks `origin/main` at `78be0e032`)
Run dir: `.llm/runs/docs-plugin-scaffolding-invents--1857/`
`PLAN-EVAL: N/A` — mechanical correction of a falsifiable, already-measured defect.

## The defect (verified from source; re-verify, don't trust this brief)

`docs/site/reference/triggers/index.md` and `docs/site/reference/workers/index.md` each document a
`/scaffolding` sub-path export that **does not exist**. `docs:exports-drift` reports it as
`INVENTS nonexistent/omitted entrypoint`.

Three independent confirmations, all of which you should reproduce yourself:

1. **The subpath is not published.** `plugins/triggers/deno.json` and `plugins/workers/deno.json`
   export `./scaffold` -> `./scaffold.ts`. Neither exports `./scaffolding`.
2. **The claimed module path does not exist.** Both pages cite `./src/scaffolding/mod.ts`;
   `plugins/{triggers,workers}/src/scaffolding/` is not present in the tree.
3. **The documented symbols do not exist anywhere.** `triggerScaffolder`, `TriggerScaffoldInput`,
   `TriggerScaffoldKind`, `createWorkersItemScaffolders`, `WORKERS_TASK_SCAFFOLD_RUNTIMES`,
   `WorkersScaffoldInput` and their siblings return **zero** hits for
   `grep -rn "export .*<symbol>" plugins/ packages/`.

So these are not stale names for real things — the sections describe a surface that is not shipped.
A consumer or agent following either page imports a specifier that cannot resolve.

The **real** `./scaffold` export publishes exactly four symbols (confirm with
`deno doc --json plugins/<plugin>/scaffold.ts`): `PluginLogger`, `PluginScaffoldEntrypoint`,
`ScaffoldResult`, `ScaffolderContext`.

## What to do

For **each** of `docs/site/reference/triggers/index.md` and `docs/site/reference/workers/index.md`:

1. **Remove the false sub-path table row** for `.../scaffolding` (`triggers` line ~57, `workers`
   line ~40 on current main — locate them, don't trust the numbers).
2. **Remove the false detail section** — `### Scaffolding (./scaffolding)` in `triggers`,
   `### @netscript/plugin-workers/scaffolding` in `workers` — including its symbol table, since every
   symbol in it is unverifiable.
3. **Add a truthful row for the real `./scaffold` export** in the same sub-path table, with its real
   module path (`./scaffold.ts`) and a Purpose grounded in what `deno doc --json` actually reports
   for that file. Do not invent capability language.
4. **Fix any surrounding prose that names `./scaffolding`** — e.g. `triggers` line ~20 lists it in a
   sentence enumerating sub-paths, and `workers` line ~9 mentions "scaffolding" in an intro
   sentence. Correct the specifier references; leave unrelated prose alone.
5. **Decide honestly whether to add a detail section for `./scaffold`.** If four symbols warrant a
   short table, add one built from `deno doc --json`. If the sub-path row alone is proportionate,
   say so in the PR body rather than padding the page. Either is acceptable; an inaccurate section
   is not.

**Do not** attempt to adopt these pages into `AUTHORITATIVE_MAPPING` — that is later work in #1857
and requires resolving remaining omissions first. This slice only removes published falsehoods and
documents the real export.

## Explicitly out of scope

- Any `plugins/*` or `packages/*` source change. The exports are correct; the pages are wrong.
- `AUTHORITATIVE_MAPPING` changes of any kind.
- The other five plugin reference pages, and the `auth` vs `plugin-auth` duplication question.
- Fixing the other (non-INVENTS) omissions on these two pages — later slices.

## Required gates (run all, report REAL exit codes)

- `deno task docs:exports-drift`
- `deno task --cwd docs/site check:source-format`, `build`, `check:links`, `check:caveats`
- `deno task docs:links`, `docs:accuracy`, `docs:snippets`
- `deno task check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`
- `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts`
- `git diff --check $(git merge-base origin/main HEAD) HEAD` — **must exit 0**. Note the bare
  `git diff --check` is a no-op after committing; always use this base-relative form.
- `git status --porcelain` after all regenerating gates (report exact output)
- confirm `deno.lock` unchanged vs `origin/main`
- confirm `provenance.json`'s `sourceCommit` is a true ancestor: `git merge-base --is-ancestor <sha> HEAD`

`docs/site/**` is a generator input, so after editing regenerate in this exact order:
`deno task gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`.

**Note:** `check:mcp-export-corpus` is currently red on `main` itself (tracked as #1668). Confirm that
independently in a clean worktree at `origin/main` and do not attribute it to this branch.

## Deliverable

Commit(s) on `docs/plugin-scaffolding-invents-fix`, pushed. **Keep this run's
`.llm/runs/docs-plugin-scaffolding-invents--1857/` artifacts committed** — scoped harness run
directories are intentional cross-agent context and must not be stripped.

Open a PR against `main` titled
`docs(plugins): remove fabricated /scaffolding sub-path from triggers and workers references`,
with:
- `Refs #1857` — **no closing keyword**, this is a partial slice
- a validation table with real exit codes at the pushed head
- evidence for each of the three confirmations above, reproduced by you
- labels `type:docs`, `area:docs`, `area:plugins`, `ci:skip-e2e`, `ci:skip-scaffold`, milestone `0.0.7`

Run `gh pr ready` **before** the first push if you open it non-draft — a draft push skips
`check-test`/`quality`, and marking ready afterwards does not re-trigger them.

Leave the PR at `status:impl`; the supervisor session handles evaluation and lifecycle labels.
