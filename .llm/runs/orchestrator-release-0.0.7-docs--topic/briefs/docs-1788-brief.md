use harness

# Slice brief — docs-1788 cli + plugin sub-path surfaces (`Closes #1788`)

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-tools`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-doctrine`. Read `AGENTS.md` first. **docs** archetype (`SCOPE-docs.md`): no
hand-written `packages/`/`plugins/` source — the only `packages/` files you may change are generator
outputs, and only by running their generators.

## Worktree and push rule

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1788`
- Branch `docs/cli-plugin-subpath-surface`, based on `origin/main` `74e3d451` (**no upstream**)
- Issue **#1788** — read it and umbrella **#1777** in full first. Milestone 0.0.7, `status:impl`.
- Run dir to create: `.llm/runs/docs-cli-plugin-subpath-surface--1788/`
- Push only by explicit refspec: `git push origin HEAD:refs/heads/docs/cli-plugin-subpath-surface`
- Do **not** merge, relabel/close issues, touch other PRs, or run `git stash`. `deno.lock` must not
  change.
- **Do not start Aspire or Docker.** The sole host runtime lease is held by another supervisor;
  everything this slice needs is static.

## The defect — same class as #1785's `logger` fix, on two more pages

`docs/site/reference/cli/index.md`:

> The following entrypoints are published alongside the root export. **Their reference surface is
> generated separately from their own `deno doc` output.**

`docs/site/reference/plugin/index.md`:

> The following entrypoints are published alongside the root export. **Their public surfaces are
> generated separately from their own `deno doc` output and summarized below.**

**No separately generated page exists for either** — confirmed on `main`:
`git ls-tree -r --name-only origin/main | grep -c 'docs/site/reference/cli-scaffold'` → 0, and the
equivalent checks for `cli/scaffold`, `plugin-testing`, `plugin/testing` all → 0.

**`plugin`'s claim differs subtly — "and summarized below".** It may already partially cover its
sub-paths. **Re-derive from source and from the page itself which entrypoints are genuinely
undocumented versus already summarized**; do not assume `cli` and `plugin` are in identical states
just because the sentence is nearly identical. This is the judgement call in this slice.

**Re-derive everything from source before writing. If your reading of the page or the export map
disagrees with this brief, stop and report** rather than writing prose to match it.

## What to write

1. **For `cli`**: enumerate every export of every sub-path entrypoint the page lists. Use
   `deno doc --json` per entrypoint, not a line-based regex — a multi-line `export { … }` block
   undercounts under naive parsing, which happened mid-session on this umbrella already. Document
   each symbol on the existing page.
2. **For `plugin`**: first determine what "summarized below" already delivers versus what is still
   missing. Only add what is genuinely undocumented; do not re-document what the page already covers
   accurately.
3. **Remove or correct the "generated separately" sentence on both pages** so neither points at pages
   that do not exist.
4. **Re-exports**: if a symbol re-exports a root type, say so rather than duplicating its description.
5. **Be exact about completeness claims.** If you write "every" or "all", it must be true. This lane
   has shipped an unconditional claim that didn't hold three times this session and had it caught
   externally each time — including once on this exact umbrella (`aspire`'s `/public` claim, and
   `logger`'s "correlated" claim). Prefer a provable claim over a tidy-sounding one.

Keep it proportionate: corrected sentences and symbol tables, not a restructuring of either page.

## Sizing — split if warranted

If `cli` and `plugin` together are large enough that one PR would be unreviewable, **split into two
PRs**, each closing a sub-issue you create against #1788's scope, or record in `drift.md` exactly why
one PR is the right size. Say which you chose and why in the PR body — do not silently pick one.

## Explicitly out of scope

- **Any `packages/cli` or `packages/plugin` source change.** The exports are correct; the pages are
  wrong.
- **Creating new separate reference pages.** Consolidate onto the existing pages, per the pattern
  #1785 established for `logger`.
- **`AUTHORITATIVE_MAPPING` — do not touch it.** Re-adopting either package at `mode: 'complete'` is a
  later slice.
- `database` — the remaining #1777 ledger entry, a separate slice.
- **If you find a source-level correctness defect while verifying** (as happened on #1785 — see
  #1786), **file it separately** with the correct `area:` label from `.github/labels.yml` (check the
  file — `area:logger` does not exist and silently failed a `gh issue create` earlier this session)
  and do not fix it here.

## Derived work

Your edit changes `docs/site/**`, a **generator input**. Read
`.llm/tools/docs/build-agent-docs-bundle.ts`, `.llm/tools/generate-cli-assets-barrel.ts` and
`.llm/tools/generate-publish-assets.ts` and confirm the chain yourself. `check:publish-assets` and
`check:assets-barrel` are **unconditional**.

## Commit shape

Per page (or per PR, if you split): prose + run artifacts, then the four derived assets alone, so
`provenance.json` `sourceCommit` is the prose commit immediately preceding the regeneration.

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

Against `main`, not draft, **`Closes #1788`** on its own line (or split closing keywords if you file
sub-issues), and reference **#1777 without a closing keyword** (umbrella; check commit messages too).
Labels: `type:docs`, `area:docs`, `priority:p2`, `ci:skip-e2e`, `ci:skip-scaffold`, exactly one
`status:` — `status:impl`. Milestone **0.0.7**.

`gh pr edit` fails on this token (`read:org`); use
`gh api -X POST repos/rickylabs/netscript/issues/<PR>/labels -f 'labels[]=...'`.

Body must contain `## Summary`, `## Scope` (state the split decision if you split), symbol tables per
sub-path with source file, `## Validation` with real exit codes (baseline red called out as such),
`## Definition of Done` with checkable boxes each true when ticked, and a fenced
` ```acceptance-evidence ` block with `issue: 1788` and one `box-index:` → `evidence:` entry per
acceptance box citing the pushed head SHA.

`PLAN-EVAL: N/A` **only if you believe it** — this slice has a real judgement call (`cli` vs `plugin`
completeness state), so if you think it warrants a plan review, say so.

**Do not** set `status:ready-merge`, tick issue checkboxes, or dispatch your own evaluator. Tier-A and
a supervisor-dispatched IMPL-EVAL follow — note the primary evaluator route may be capacity-limited;
that is the supervisor's problem to route, not yours.

## Definition of done

- [ ] Neither page claims a separately generated reference page that does not exist
- [ ] Every sub-path symbol documented, verified from source
- [ ] `plugin`'s pre-existing "summarized below" coverage assessed and not duplicated
- [ ] Zero `packages/cli` or `packages/plugin` source changes; `AUTHORITATIVE_MAPPING` untouched
- [ ] Derived chain regenerated; `provenance.json` `sourceCommit` == the preceding prose commit
- [ ] Every gate run with a real exit code; `deno.lock` unchanged
- [ ] PR open with `Closes #1788`, `#1777` referenced without a keyword, full body and evidence block

Report the pushed head SHA(s) and PR number(s).
