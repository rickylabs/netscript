use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` is framework code; this is a re-base, not a re-design.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt wrappers;
  `git ls-remote` immediately before any `--force-with-lease`.

## D-128 — S9 (#1759) un-stack onto the reconstructed S8

S6 and S5 merged to `main` as squashes, and **S8 has now been reconstructed onto current main** and
pushed: its new head is **`bc838a0b3`** (branch `feat/aspire-13-5-s8-typed-resource-commands`,
0 behind main). PR #1754 is retargeted to `main`.

This branch (`fix/aspire-13-5-s9-skills-mcp-alignment`) is still stacked on the **old** S8 lineage. Its branch point is S8 commit
**`f23954658`**, and it carries **10 commits of its own** above that point. Everything below
`f23954658` is stale S5/S6/S8 history whose content is already in `main` or in the reconstructed S8.

**Un-stack by replaying only this branch's own 10 commits:**

```
git fetch origin main
git fetch origin feat/aspire-13-5-s8-typed-resource-commands
git rebase --onto bc838a0b3 f23954658
```

Note this branch does **not** currently contain S8's last three commits; replaying onto the
reconstructed S8 head supplies the complete S8 automatically.

## Conflict rules (identical to the ones S8 just used successfully)

1. **Generated files** — `*.generated.ts` and generated `*.template` snapshots under
   `packages/cli/src/kernel/assets/generated/`: take the **upstream/`--ours`** side during the
   rebase, `git add`, continue. **Never hand-merge generated content** — the barrel is regenerated
   deterministically at the end.
2. **Any non-generated source conflict** — **stop, `git rebase --abort`, and report** the exact
   file, commit, and hunks. Do **not** force-resolve. Expect possible collisions against the
   reconstructed S6/S8 listener architecture (`listenerFaultExpectations`,
   `parseListenerFaultDatabase`, test-only health-check keys, `createTypedDbPhaseBGate`) — those
   need a coordinator ruling, not an improvised merge.

## After a completed rebase

- Run **`deno task gen:assets-barrel` once**, then **`deno task check:assets-barrel`**; confirm
  diff-clean. Commit any regeneration delta as one clearly-scoped commit.
- Verify: `git merge-base HEAD origin/main == origin/main`;
  `git range-diff f23954658..<old-head> bc838a0b3..HEAD` with commit mapping reported; explicit
  confirmation the stale S5/S6/S8 lineage is **absent**; scoped structured check on `packages/cli`
  and `packages/cli/e2e`; scoped lint/fmt on the files this branch changes; focused tests for the
  touched areas; `deno task check:aspire-version-parity` `fail=0` (repair only affected manifest
  path rows if file moves broke any).
- **No runtime**: no Aspire, Docker, AppHost, or `e2e:cli` runtime suites.
- **No PLAN-EVAL, no evaluator rerun** — existing qualifying verdicts stay valid at their recorded
  heads.
- Do **not** retarget the PR base on GitHub; the supervisor owns PR metadata.

## Push

`git ls-remote origin refs/heads/fix/aspire-13-5-s9-skills-mcp-alignment` immediately before pushing, then
`--force-with-lease=<that exact SHA>`.

## Report back

Old head, new head, per-conflict resolution taken, range-diff mapping, confirmation the stale lineage
is absent, every verification command's exit code, whether the barrel regeneration produced a delta,
and confirmation the worktree is clean and the push landed.
