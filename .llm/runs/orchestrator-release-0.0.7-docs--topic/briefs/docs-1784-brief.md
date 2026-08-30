use harness

# Slice brief — docs-1784 logger sub-path surface (`Closes #1784`)

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-tools`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-doctrine` for public-surface questions. Read `AGENTS.md` first. **docs**
archetype (`SCOPE-docs.md`): no hand-written `packages/`/`plugins/` source — the only `packages/`
files you may change are generator outputs, and only by running their generators.

## Worktree and push rule

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1784`
- Branch `docs/logger-subpath-surface`, based on `origin/main` `38439740f` (**no upstream** by design)
- Issue **#1784** — read it and umbrella **#1777** in full first. Milestone 0.0.7, `status:impl`.
- Run dir to create: `.llm/runs/docs-logger-subpath-surface--1784/`
- Push only by explicit refspec: `git push origin HEAD:refs/heads/docs/logger-subpath-surface`
- Do **not** merge, relabel/close issues, touch other PRs, or run `git stash`. `deno.lock` must not
  change.
- **Do not start Aspire or Docker.** The sole host runtime lease is held by another supervisor;
  everything this slice needs is static.

## The defect

`docs/site/reference/logger/index.md`, `## Sub-path exports`:

> The following entrypoints are published alongside the root export. **Their reference pages are
> generated separately from their own `deno doc` surface.**

**No such pages exist.** `docs/site/reference/logger-middleware`, `logger/middleware`, `logger-orpc`
and `logger/orpc` all return zero tracked files on `main`. So the page promises documentation that was
never generated, and the symbols appear nowhere: `LoggerContextVariables`, `LoggerMiddlewareOptions`,
`injectLogger`, `LoggerMiddleware`, `LoggerMiddlewareEnv` each grep to **0** in the page.

`deno.json` publishes `.` → `./mod.ts`, `./middleware` → `./middleware.ts`, `./orpc` → `./orpc.ts`.

**Re-derive all of this yourself before writing.** If any part of my reading is wrong — if a separate
page does exist somewhere, or a symbol is documented after all — **stop and report** rather than
writing prose to match this brief.

## What to write

1. **Fix the false promise.** The page must not claim separately generated reference pages exist.
   Replace it with what is true once you have documented the symbols here.
2. **Document every symbol** exported by `middleware.ts` and `orpc.ts`, in the page's existing table
   style. Read the source for each — what it is, and when a consumer meets it. Do not infer from the
   name.
3. **Re-exports:** `Logger` is re-exported by both sub-paths from the root. Say it is a re-export
   rather than duplicating its description as though it were a distinct symbol.
4. **Be exact about completeness.** If you write "every symbol" or "all", that claim must be true.
   This lane has shipped a conditional-stated-as-unconditional defect twice and had it caught
   externally both times. Prefer a claim you can prove over one that sounds tidy.

Keep it proportionate: a corrected sentence and symbol tables, not a restructuring of the page.

## Explicitly out of scope

- **Any `packages/logger` source change.** The exports are correct; the page is wrong.
- **Creating new separate reference pages.** This slice consolidates onto the existing page. If you
  conclude a separate page is genuinely the better structure, record it in `drift.md` for #1777 and
  **stop** — do not build it here.
- **`AUTHORITATIVE_MAPPING` — do not touch it.** Re-adopting `logger` at `mode: 'complete'` is a later
  slice with its own verification.
- `database` and `cli` — separate #1777 slices.

## Derived work

Your edit changes `docs/site/**`, a **generator input**. Read
`.llm/tools/docs/build-agent-docs-bundle.ts`, `.llm/tools/generate-cli-assets-barrel.ts` and
`.llm/tools/generate-publish-assets.ts` and confirm the chain yourself:

`docs/site/**` → `_site` → `.llm/assets/agent-docs/{prose.json.gz,provenance.json}` →
`packages/cli/src/kernel/assets/agent-docs.generated.ts` **and**
`packages/mcp/src/publish-assets.generated.ts`.

`check:publish-assets` and `check:assets-barrel` are **unconditional**.

## Commit shape

Two commits, so `provenance.json` `sourceCommit` is the prose commit immediately preceding the
regeneration — never an orphan regeneration:

- **S1** — the page plus run-dir artifacts
- **S2** — the four derived assets only, isolated so a later rebase stays cheap

## Gates — real exit codes, never report one you did not run

```
deno task --cwd docs/site check:source-format
deno task --cwd docs/site build
deno task --cwd docs/site check:links
deno task --cwd docs/site check:caveats
deno task docs:links
deno task docs:accuracy
deno task docs:snippets
deno task docs:exports-drift
deno task check:agent-docs-prose
deno task check:assets-barrel
deno task check:publish-assets
deno task check:mcp-export-corpus
deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts
```

`docs:readme:check` exits 1 on `packages/bench/README.md` — pre-existing baseline; reproduce on clean
`origin/main` and report it as such. `diagrams:check` — determine applicability from your diff.

`git status --porcelain` must show no drifted generated asset. Report it verbatim.

## PR — the body is part of the deliverable

Against `main`, not draft, **`Closes #1784`** on its own line, and reference **#1777 without a closing
keyword** (umbrella; must not close — check your commit messages too). Labels: `type:docs`,
`area:docs`, `priority:p2`, `ci:skip-e2e`, `ci:skip-scaffold`, exactly one `status:` — `status:impl`.
Milestone **0.0.7**.

`gh pr edit` fails on this token (`read:org`); use
`gh api -X POST repos/rickylabs/netscript/issues/<PR>/labels -f 'labels[]=...'`.

Body must contain `## Summary`, `## Scope`, **a table of every `/middleware` and `/orpc` symbol with
its source file and what it is**, `## Validation` with the gate table and real exit codes (baseline
red called out as such), `## Definition of Done` with checkable boxes each true when ticked, and a
fenced ` ```acceptance-evidence ` block with `issue: 1784` and one `box-index:` → `evidence:` entry
per acceptance box citing the pushed head SHA.

`PLAN-EVAL: N/A` **only if you believe it** — this slice removes a false claim and adds a
completeness claim, so if you think it warrants a plan review, say so.

**Do not** set `status:ready-merge`, tick issue checkboxes, or dispatch your own evaluator. Tier-A and
a supervisor-dispatched IMPL-EVAL follow.

## Definition of done

- [ ] The page makes no claim about separately generated pages that do not exist
- [ ] Every `middleware.ts` and `orpc.ts` export documented, verified from source
- [ ] Re-exported root types identified as re-exports
- [ ] Zero `packages/logger` source changes; `AUTHORITATIVE_MAPPING` untouched
- [ ] Derived chain regenerated; `provenance.json` `sourceCommit` == the S1 prose commit
- [ ] Every gate run with a real exit code; `deno.lock` unchanged
- [ ] PR open with `Closes #1784`, `#1777` referenced without a keyword, full body and evidence block

Report the pushed head SHA and the PR number.
