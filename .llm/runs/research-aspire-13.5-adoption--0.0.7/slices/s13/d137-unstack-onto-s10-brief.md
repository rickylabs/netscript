use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt;
  `git ls-remote` immediately before any `--force-with-lease`.

## D-137 — S13 (#1779) un-stack onto the corrected S10

S10 has been reconstructed onto the reconstructed S8 and pushed; its new head is
**`c9e3fcbe8`**. This branch (`chore/aspire-13-5-s13-stale-surface-cleanup`) is still stacked on the **old** S10 lineage. Its branch
point is S10 commit **`a46ea16d0`**, and it carries **9 commits of its own** above that point.

**Un-stack by replaying only this branch's own 9 commits:**

```
git fetch origin chore/aspire-13-5-s13-stale-surface-cleanup
git fetch origin test/aspire-13-5-s10-e2e-gate-upgrades
git rebase --onto c9e3fcbe8 a46ea16d0
```

## Ancestry assertion — STACKED slice

This is a **stacked** slice. Assert:

```
git merge-base HEAD c9e3fcbe8 == c9e3fcbe8
```

**Do NOT** assert against `origin/main`, do **not** rebase onto `main`, and do not chase main's
tip — this branch stays stacked on S10 until S10 itself merges.

## Conflict rules (as ruled for S8/S9/S10)

1. **Generated files** (`*.generated.ts`, generated `*.template` snapshots): take the upstream
   side, never hand-merge; the barrel is regenerated once at the end.
2. **Gate-registration lists** (`scaffold-capability-gates.ts`, `capability-suites.ts`): resolve as
   an **additive union** — keep **both** sides' entries, preserve ordering, add nothing else.
3. **Anything that would delete or rewrite main's shipped D-101 listener contract**
   (`verify-listener-readiness.ts`, `ListenerHealthReport`, `readListenerHealthReport()`, or its
   test) resolves in **main's** favour — that module is load-bearing for the shipped fixture.
4. **Any other non-generated source conflict: abort and report** with exact file/commit/hunks. Do not
   force-resolve.

## After a completed rebase

One `deno task gen:assets-barrel`, then `check:assets-barrel` diff-clean. Verify the stacked
ancestry assertion above; range-diff commit mapping; stale S5/S6/S8/S10 lineage absent; scoped
check/lint/fmt on changed files; **repo-wide `deno task check`** expecting `failedBatches: 0`;
focused tests for the touched areas; `check:aspire-version-parity` `fail=0`.

**No runtime** — no Aspire, Docker, AppHost, or `e2e:cli` runtime suites (a runtime lease is held
elsewhere). **No PLAN-EVAL, no evaluator rerun.** Do not retarget the PR base.

Push with `--force-with-lease` against a freshly-read `git ls-remote` SHA. Report old/new head,
each conflict and its resolution class, verification exit codes, and confirm the worktree is clean.
