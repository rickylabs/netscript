use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; `check:aspire-version-parity`;
  scoped check/lint/fmt; `git ls-remote` immediately before any `--force-with-lease`.

## D-149 — coordinator ruling: resume and complete the S13 un-stack

Your D-137 abort at commit 3/9 (`5fac7818d`) was **correct and accepted**. Both conflicts are now
ruled:

### 1. `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` — deletion AUTHORIZED

**Keep S13's deletion of `SCAFFOLD_COMMUNITY_TOOLKIT`.** A zero-consumer check was performed and
proven before authorizing it:

- `git grep SCAFFOLD_COMMUNITY_TOOLKIT origin/main` returns **only its own declaration** — no
  consumers anywhere in the tree.
- Its content is **already duplicated by the live map**: `SCAFFOLD_ASPIRE_INTEGRATIONS.DENO_KV`
  carries the identical `PACKAGE_ID: 'CommunityToolkit.Aspire.Hosting.Deno'` and
  `VERSION: '13.5.0'`, alongside `POSTGRES`/`GARNET`/`BROWSERS` in the same file.

So it is a dead duplicate and removing it is exactly this slice's purpose. **Retain
`SCAFFOLD_ASPIRE_INTEGRATIONS.DENO_KV` unchanged** — do not prune or alter it.

Note the contrast with the S10 ruling, which *refused* a deletion: there, main's shipped D-101 fixture
actively imported the deleted exports. The deciding test is consumer evidence, not the presence of a
deletion.

### 2. `aspire-surface-manifest.tsv` — generated artifact

Resolve by **taking upstream**, then regenerate at the end. After the rebase completes run
`deno task check:aspire-version-parity` and repair only the manifest rows the tree actually requires
— expect `fail=0`. The manifest must reflect the **post-deletion** tree (the D-114 mechanism).

### Everything else unchanged

Gate-registration lists → additive union (keep both sides' gates). Generated files → upstream side.
Anything touching main's shipped D-101 listener contract → main wins. **Any other non-generated
source conflict still aborts and reports.**

### Ancestry — STACKED slice

Assert `git merge-base HEAD c9e3fcbe8 == c9e3fcbe8` (S10's corrected head). **Do not** assert against
`origin/main` and do not rebase onto main.

### After a completed rebase

One `deno task gen:assets-barrel`, then `check:assets-barrel` diff-clean; stacked ancestry assertion;
range-diff mapping of S13's 9 own commits; stale lineage absent; scoped check/lint/fmt; **repo-wide
`deno task check`** expecting `failedBatches: 0`; focused tests; `check:aspire-version-parity`
`fail=0`. **Explicitly confirm `SCAFFOLD_ASPIRE_INTEGRATIONS.DENO_KV` still exists.**

**No runtime** — runtime is parked host-wide; do not start Aspire or Docker. **No PLAN-EVAL, no
evaluator rerun.** Do not retarget the PR base.

Push with `--force-with-lease` against a freshly-read `git ls-remote` SHA. Report old/new head, both
resolutions, verification exit codes, and confirm the worktree is clean.
