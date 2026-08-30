use harness

# Slice brief — docs-1778 adopt the six clean packages (`Closes #1778`)

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-tools`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-doctrine` if a public-surface question arises. Read `AGENTS.md` first.

## Worktree and push rule

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1778`
- Branch `docs/exports-drift-clean-six`, based on `origin/main` `de57fab0` (**no upstream** by design)
- Issue **#1778** — read it and its umbrella **#1777** in full first. Milestone 0.0.7, `status:impl`.
- Run dir to create: `.llm/runs/docs-exports-drift-clean-six--1778/`
- Push only by explicit refspec: `git push origin HEAD:refs/heads/docs/exports-drift-clean-six`
- Do **not** merge, relabel/close issues, touch other PRs, or run `git stash`. `deno.lock` must not
  change.

## The task

`.llm/tools/docs/check-exports-drift.ts` holds `AUTHORITATIVE_MAPPING`, which policies **8 of 30**
packages. Add these **six**, which already pass:

`aspire`, `cli`, `cron`, `database`, `kv`, `logger`

Measured on `de57fab0`: with all six added under `mode: 'entrypoints-only'`, the checker reports
**zero** findings for them. **Re-derive that yourself** — do not trust this brief's numbers.

## This is a judgement slice, not a table edit

`PackageMapping.symbolCoverage` is a **policy declaration**, not boilerplate. Each entry needs a
`mode` and a `reason` the gate then enforces. Read the eight existing entries to learn the vocabulary
— note they genuinely differ (`complete` vs `entrypoints-only`) and each `reason` is specific to that
page.

For each of the six, decide from the page and the package's export map:

- Does the reference page guarantee **every published symbol** (`complete`) or only that every
  **entrypoint** is documented (`entrypoints-only`)?
- Write a `reason` that is **true of that page**. Six copies of one sentence is a failure of this
  slice even if the gate passes — the reason is what a future maintainer relies on when the gate
  fires.

**Do not weaken a policy to make a package pass.** If a package looks like it should be `complete`
but fails under it, **drop that package from this slice** and record why in `drift.md` and the PR
body. Shipping five honestly is better than six by lowering the bar. That judgement is the substance
here.

## Hard boundary

**No `docs/site/**` file may change.** This slice adopts pages that are already correct. If you find
yourself needing to edit a reference page, that package belongs to a later #1777 slice, not this one
— drop it and say so.

## Gates — real exit codes, never report one you did not run

```
deno task docs:exports-drift
deno task docs:accuracy
deno task docs:links
deno task check:publish-assets
deno task check:assets-barrel
deno task check:agent-docs-prose
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/docs --ext ts
git diff --exit-code -- deno.lock
```

`.llm/tools/**` is very likely **not** an agent-docs corpus input, so no asset regeneration should be
needed — **verify that from the generators** (`.llm/tools/docs/build-agent-docs-bundle.ts`,
`.llm/tools/generate-publish-assets.ts`) and state the evidence, rather than assuming it. Run the two
freshness gates either way. If it turns out assets *do* move, split them into their own commit so
`provenance.json` `sourceCommit` is the preceding code commit.

`docs:readme:check` exits 1 on `packages/bench/README.md` — pre-existing baseline; reproduce it on a
clean `origin/main` checkout and report it as such, not as your failure.

Report `git status --porcelain` verbatim at the end.

## PR

Against `main`, not draft, **`Closes #1778`** on its own line, and reference **#1777 without a
closing keyword** (it is the umbrella and must not close). Labels: `type:docs`, `area:docs`,
`area:tooling`, `priority:p2`, `ci:skip-e2e`, `ci:skip-scaffold`, exactly one `status:` —
`status:impl`. Milestone **0.0.7**.

`gh pr edit` fails on this token (`read:org`); use
`gh api -X POST repos/rickylabs/netscript/issues/<PR>/labels -f 'labels[]=...'`.

**The PR body is part of the deliverable — it has been skipped on three previous slices in this lane
and each time the supervisor had to write it. Do not skip it.** It must contain:

- `## Summary`, and `## Scope` naming exactly the files touched
- **A per-package table**: package → chosen `mode` → the reason, and *why that mode* — this is the
  reviewable content of the slice
- Any package **dropped** from the six, with its reason
- `## Validation` — the gate table with real exit codes, the baseline red called out as such, and the
  corpus-input determination with the generator evidence
- `## Definition of Done` — checkable boxes, each true when ticked; do not tick one whose claim is
  not yet established
- A fenced ` ```acceptance-evidence ` block with `issue: 1778` and one `box-index:` → `evidence:`
  entry per acceptance box, each citing the pushed head SHA
- `PLAN-EVAL: N/A` **only if you believe it** — this slice carries six editorial decisions, so if you
  think it warrants a plan review, say so instead of defaulting

**Do not** set `status:ready-merge`, tick issue checkboxes, or dispatch your own evaluator. Tier-A and
a supervisor-dispatched IMPL-EVAL follow.

## Definition of done

- [ ] Six (or fewer, with reasons) packages added with per-package `symbolCoverage` mode + true reason
- [ ] `deno task docs:exports-drift` exits 0
- [ ] **Zero** `docs/site/**` files changed
- [ ] `deno.lock` unchanged; corpus-input question answered from the generators with evidence
- [ ] Every gate run with a real exit code
- [ ] PR open with `Closes #1778`, `#1777` referenced without a keyword, correct labels/milestone,
      full body including the per-package table and evidence block

Report the pushed head SHA and the PR number.
