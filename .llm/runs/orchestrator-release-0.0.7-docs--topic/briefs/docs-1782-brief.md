use harness

# Slice brief — docs-1782 aspire `/public` surface (`Closes #1782`)

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-tools`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-doctrine` for public-surface questions. Read `AGENTS.md` first. **docs**
archetype (`SCOPE-docs.md`): no hand-written `packages/`/`plugins/` source — the only `packages/`
files you may change are generator outputs, and only by running their generators.

## Worktree and push rule

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1782`
- Branch `docs/aspire-public-surface`, based on `origin/main` `2a65a8cd` (**no upstream** by design)
- Issue **#1782** — read it and umbrella **#1777** in full first. Milestone 0.0.7, `status:impl`.
- Run dir to create: `.llm/runs/docs-aspire-public-surface--1782/`
- Push only by explicit refspec: `git push origin HEAD:refs/heads/docs/aspire-public-surface`
- Do **not** merge, relabel/close issues, touch other PRs, or run `git stash`. `deno.lock` must not
  change.

## The defect

`docs/site/reference/aspire/index.md:237` claims `@netscript/aspire/public`:

> re-exports **all public config, schema, types, constants, application composition, adapters,
> diagnostics, and testing symbols** from a single import path

That frames it as a pure aggregate of the other published sub-paths. **It is not.**
`packages/aspire/src/public/mod.ts` also exports four symbols sourced from `../domain/` and
`../ports/`, which are **not** published sub-paths:

```
:56  export { AspireError, DuplicateContributionError } from '../domain/errors.ts';
:70  export type { ReferenceSpec } from '../domain/reference-spec.ts';
:72  export type { AspireRuntime } from '../ports/aspire-runtime-port.ts';
```

`deno.json` exports are `.`, `./config`, `./schema`, `./types`, `./constants`, `./application`,
`./adapters`, `./testing`, `./public` — so those four are reachable **only** through `/public`, and
the page mentions none of them.

**Re-derive all of this from source before writing.** Read `src/public/mod.ts` and the `deno.json`
export map yourself. If my reading is wrong in any particular, **stop and report** rather than
writing prose to match this brief — the whole point of the slice is that the page currently says
something untrue.

## What to write

1. **Correct the `/public` description** so it is true: it aggregates the published sub-paths **and**
   additionally surfaces domain/port types published nowhere else. Keep it a description, not an
   apology — do not narrate the bug.
2. **Document the four symbols** — `AspireError`, `DuplicateContributionError`, `AspireRuntime`,
   `ReferenceSpec` — each with what it is and when a consumer meets it, in the page's existing table
   style. Read their definitions (`src/domain/errors.ts`, `src/domain/reference-spec.ts`,
   `src/ports/aspire-runtime-port.ts`) rather than inferring from the names.
3. **State each symbol's reachable entrypoint accurately.** If a symbol turns out to be reachable by
   more than one path, say so.

Keep it proportionate: a corrected paragraph and a table addition, not a rewrite of the page.

## Explicitly out of scope

- **Any `packages/aspire` source change.** The exports are correct; the page is wrong. If a symbol
  looks like it *should* be re-exported from a sub-path, record it as a candidate for #1777 in
  `drift.md` and leave the code alone.
- Re-adopting `aspire` at `mode: 'complete'` in `check-exports-drift.ts` — the natural follow-up, but
  its own slice with its own verification. **Do not touch `AUTHORITATIVE_MAPPING`.**
- `logger`, `database`, `cli` — separate #1777 slices.

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
- **S2** — the four derived assets only. Keep S2 isolated; `main` moves fast and this branch may need
  re-integration before merge.

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

`docs:exports-drift` must stay green — `aspire` is adopted at `entrypoints-only`, so documenting
symbols cannot break it, but confirm rather than assume. `docs:readme:check` exits 1 on
`packages/bench/README.md` — pre-existing baseline; reproduce on clean `origin/main` and report it as
such. `diagrams:check` — determine applicability from your diff.

`git status --porcelain` must show no drifted generated asset. Report it verbatim.

## PR — the body is part of the deliverable

Against `main`, not draft, **`Closes #1782`** on its own line, and reference **#1777 without a
closing keyword** (umbrella; must not close). Labels: `type:docs`, `area:docs`, `area:aspire`,
`priority:p2`, `ci:skip-e2e`, `ci:skip-scaffold`, exactly one `status:` — `status:impl`. Milestone
**0.0.7**.

`gh pr edit` fails on this token (`read:org`); use
`gh api -X POST repos/rickylabs/netscript/issues/<PR>/labels -f 'labels[]=...'`.

Body must contain `## Summary`, `## Scope`, a **table of the four symbols with their source file and
reachable entrypoint**, `## Validation` with the gate table and real exit codes (baseline red called
out as such), `## Definition of Done` with checkable boxes each true when ticked, and a fenced
` ```acceptance-evidence ` block with `issue: 1782` and one `box-index:` → `evidence:` entry per
acceptance box citing the pushed head SHA.

`PLAN-EVAL: N/A` **only if you believe it** — this slice corrects a false published claim, so if you
think it warrants a plan review, say so.

**Do not** set `status:ready-merge`, tick issue checkboxes, or dispatch your own evaluator. Tier-A
and a supervisor-dispatched IMPL-EVAL follow.

## Definition of done

- [ ] The `/public` description is true of `src/public/mod.ts` on `main`
- [ ] All four symbols documented with accurate source and entrypoint
- [ ] Zero `packages/aspire` source changes; `AUTHORITATIVE_MAPPING` untouched
- [ ] Derived chain regenerated; `provenance.json` `sourceCommit` == the S1 prose commit
- [ ] Every gate run with a real exit code; `deno.lock` unchanged
- [ ] PR open with `Closes #1782`, `#1777` referenced without a keyword, full body and evidence block

Report the pushed head SHA and the PR number.
