# Brief — #1112 merge `main` and re-run the derivative cascade

Canonical author, thread `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, worktree
`/home/codex/repos/netscript-007-leaf-prisma-mysql`, head
`067193acff68254b4bd4c6e5d7824f80a9db2b26`.

**IMPL-EVAL cycle 2 returned `PASS_IMPL`** at your exact head — artifact
`f5fd84254e20758d5e697156e67dabed8ad824ba` on `eval/impl-eval-1711-cycle-2`, no blocking findings.
All CI checks are green (`pr-checks PASS`, 0 current failures) and all five issue #1112 acceptance
boxes are mirrored and checked. The work is accepted.

## The blocker

`main` has advanced from the audit base `cf648f1ff` to `21d516224fe35e92957f0998ee848bbf2024eda0`,
and GitHub now reports `mergeable=CONFLICTING` / `mergeStateStatus=DIRTY`.

`git merge-tree` shows the conflicts are **entirely in generated derivatives** — no authored product
path conflicts at all:

- `.llm/assets/agent-docs/prose.json.gz`
- `.llm/assets/agent-docs/provenance.json`
- `packages/cli/src/kernel/assets/agent-docs.generated.ts`
- `packages/mcp/src/publish-assets.generated.ts`

These are repo-wide generated files, so any PR merging to `main` invalidates them for every open
branch. The resolution is therefore **deterministic, not a judgment call**: take the merge, then
regenerate.

## What to do

1. Merge `origin/main` into the branch (do **not** rebase — rebasing rewrites the evaluated commits
   and destroys the correspondence with the cycle-2 artifact).
2. For each conflicted generated file, do **not** hand-resolve the hunks. Resolve by regeneration —
   take either side to clear the conflict, then run the cascade in order so the output is derived
   from the merged tree:

```
deno task gen:agent-docs-prose
deno task gen:assets-barrel
deno task gen:mcp-export-corpus
deno task gen:publish-assets
```

3. Prove all four gates exit 0 on the merged tree and report each exit code:

```
deno task check:agent-docs-prose
deno task check:assets-barrel
deno task check:mcp-export-corpus
deno task check:publish-assets
```

4. Re-run the package gates: structured `check`, `lint`, `fmt`, and tests on
   `packages/prisma-adapter-mysql`. Expect 12 selected / 0 diagnostics and 51 tests passing.

## Boundaries — tight

- **The seven authored product paths must not change by a single byte.** After the merge, verify it
  yourself: `git diff 067193acf HEAD -- packages/prisma-adapter-mysql docs/site` must show **nothing**
  beyond what `main` itself brought in. If a merge hunk lands inside an authored path, stop and
  report — do not resolve it.
- Resolve conflicts by regeneration only. Never hand-edit a `.generated.ts` file or the prose bundle.
- No `deno.lock` change of your own; if the merge brings one from `main`, keep `main`'s version and
  say so.
- No merge of the PR, no readiness flip, no label change, no PR state change.
- No self-certification.

## Why this is urgent rather than merely queued

The generated corpus is repo-wide, so every merge into `main` re-dirties this branch. The longer this
sits, the more often it must be redone. Work briskly and report as soon as the four gates are green.

## Finish

Commit the merge and the regenerated derivatives, **explicitly push** with a full refspec, and report
the exact head SHA, the four `check:` exit codes, the package-gate results, and confirmation that the
authored paths are byte-unchanged. Then stop — the supervisor runs a fresh exact-head Tier-A,
confirms the delta is merge-plus-generated only, and reports to the coordinator for merge.
