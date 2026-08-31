use harness

## SKILL

- netscript-harness — run loop, commit-by-slice + push, run-dir artifacts; no self-certification.
- netscript-doctrine — `packages/cli` is framework code; this slice must not change product
  behavior, only re-base it.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel` are the canonical generated-barrel
  regeneration/verification tasks; scoped wrappers for check/lint/fmt; raw git verification
  (`git ls-remote` immediately before any `--force-with-lease`, never a guessed SHA).

## D-121 — S8 (#1754) post-S6-merge reconstruction onto current main

### Situation

S6 (#1743) merged to `main` as a **squash** (`e17c96ed8`), and S5 (#1740) merged earlier as a squash
(`2a1248d33`). The S8 branch `feat/aspire-13-5-s8-typed-resource-commands` is still stacked on the
**old, pre-reconstruction** S6 lineage. Its merge-base with the final S6 head is `3e5cbabfc`, and it
carries **33 commits** over that base, which decompose as:

- **17 stale S5 commits** (`755d84f1f` … `56bf42556`) — content already in `main` via S5's squash.
- **7 stale S6 commits** (`5d2bd8756` … `01f27d4d4`) — content already in `main` via S6's squash,
  **and materially different** from what merged: S6 was substantially reconstructed (D-101 synthetic
  listener architecture, D-102 exit-17 contract, D-107/110/111/112 CI corrections) after S8 branched.
- **9 commits that are S8's own work** (`83e474926` … `f06209d39`) — the typed db-cli-mode resource
  commands. These are the only commits that must survive.

The correct un-stack therefore replays **only S8's own 9 commits** onto `main`:

```
git rebase --onto origin/main 01f27d4d4
```

### Known conflict (already scouted — do not rediscover it the hard way)

The supervisor already attempted exactly that rebase on a throwaway branch and aborted rather than
force-resolving. It conflicts at commit **3 of 10**, `41a51c7a6 chore(cli): regenerate typed command
assets`, in:

```
packages/cli/src/kernel/assets/embedded.generated.ts
```

This is a **generated** asset barrel. S8 regenerated it from the **old** S6 form; `main` now holds it
regenerated from the **reconstructed** S6 form. A hand-merge of generated content is the wrong
resolution and is forbidden here.

### Required resolution strategy

1. Start from this worktree (`007-s8-recon`), already on
   `feat/aspire-13-5-s8-typed-resource-commands` at `f06209d39`, clean, upstream unset.
2. `git fetch origin main`, then `git rebase --onto origin/main 01f27d4d4`.
3. When the `embedded.generated.ts` conflict appears (and for **any** conflict confined to a
   generated file — `*.generated.ts`, generated `*.template` snapshots under
   `packages/cli/src/kernel/assets/generated/`): **do not hand-merge**. Resolve by taking `main`'s
   side for that path (`git checkout --ours -- <path>` during the rebase — during a rebase "ours" is
   the upstream/`main` side), `git add` it, and `git rebase --continue`. The barrel is regenerated
   deterministically at the end, so its intermediate content is irrelevant.
4. If a conflict appears in a **non-generated source file**, that is a genuine semantic collision:
   **stop, `git rebase --abort`, and report it** with the exact file, commit, and hunks. Do not
   force-resolve it. The supervisor will bring it back for a ruling.
5. After the rebase completes, run **`deno task gen:assets-barrel` once**, then
   **`deno task check:assets-barrel`** and confirm it is diff-clean (deterministic reproduction). If
   the regeneration produced a delta, commit it as a single clearly-scoped regeneration commit
   appended to the branch.

### Verification (all required before pushing)

- `git merge-base HEAD origin/main` **==** `origin/main` (full convergence).
- `git range-diff 01f27d4d4..f06209d39 origin/main..HEAD` — confirm S8's **9 own commits** are
  present and content-equivalent (`=`), and report any that show as `!` with an explanation. Note the
  final barrel-regeneration commit (if any) is expected to be *additional*, not a `!`.
- Confirm the **17 stale S5 and 7 stale S6 commits are absent** from the rebased branch (they must
  not be replayed — their content is already in `main`).
- Scoped structured type-check on the touched roots (`packages/cli`, `packages/cli/e2e`) via
  `.llm/tools/run-deno-check.ts --ext ts,tsx`.
- Scoped lint + fmt on the files this branch actually changes
  (`git diff --name-only origin/main..HEAD`, intersected with source `.ts`/`.tsx`).
- Focused tests for the touched areas (the S8 generator/operation-runner/e2e tests that this branch
  adds or modifies).
- `deno task check:aspire-version-parity` — expect `fail=0`. If the S8 file moves broke a manifest
  path (as happened for S6 in D-114), repair only the affected manifest path rows.
- **No runtime.** Do not start Aspire, Docker, or any AppHost. Do not run `e2e:cli` runtime suites.

### Push

`git ls-remote origin refs/heads/feat/aspire-13-5-s8-typed-resource-commands` immediately before
pushing, then `--force-with-lease=<that exact SHA>`. A safety tag
`aspire-13-5-s8-pre-reconstruction` already points at `f06209d39`; do not delete or move it.

### Out of scope

- No product/behavior change to S8's typed-command work — this is a re-base, not a re-design.
- No PLAN-EVAL. **No evaluator rerun of any kind** — every existing qualifying verdict stays valid
  at its recorded head per standing owner ruling.
- Do not touch S9/S10/S11/S13 branches, `.github/workflows/`, or any other slice.
- Do not retarget the PR base on GitHub; the supervisor handles PR metadata.

### Report back

Old head, new head, the resolution taken for each conflict (file + strategy), range-diff commit
mapping, every verification command's exit code/output summary, whether the barrel regeneration
produced a delta, and confirmation the worktree is clean and the push landed.
