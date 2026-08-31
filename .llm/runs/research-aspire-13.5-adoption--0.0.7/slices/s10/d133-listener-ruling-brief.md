use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt; `git ls-remote`
  immediately before any `--force-with-lease`.

## D-133 — coordinator ruling: resume the S10 un-stack, preserving main's listener-readiness files

Your D-128 abort was **correct and accepted**, and it prevented a real regression. Supervisor
analysis of commit `4e270e940` found it **deletes 120 lines** from
`packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts` — removing the
`ListenerHealthReport` interface and `readListenerHealthReport()`. That was valid in the pre-D-101
architecture S10 was written against, but **main's shipped D-101 fixture depends on those exports**:
`listener-unreachable-fixture.ts:18-20` imports both and uses `ListenerHealthReport` in its receipt
types. Five files on `main` reference that module. Replaying the deletion would break the shipped,
CI-verified listener architecture.

**Ruling:**

1. **Preserve current `main`'s `verify-listener-readiness.ts` in full — DROP S10's deletion of it.**
   Do not remove `ListenerHealthReport` or `readListenerHealthReport()`, and do not partially prune
   them.
2. **Take `main`'s `packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts`** —
   S10's 3-line edit there targets the superseded contract. (Same decision D-122 already made for
   this exact file during S8's reconstruction.)
3. **Preserve all of S10's other work unchanged** — its gate registrations, receipt gates,
   `describe --follow` parser, DTO-completeness fixes, and run-dir docs.
4. If a conflict in these two files is *purely additive* (both sides adding distinct entries),
   union it; anything that would delete or rewrite main's D-101 exports resolves in **main's** favour.

Resume: `git fetch origin main && git fetch origin feat/aspire-13-5-s8-typed-resource-commands`,
then `git rebase --onto bc838a0b3 f23954658`.

**Unchanged rules:** generated files take the upstream side, never hand-merged. **Any other
non-generated source conflict still aborts and reports** — this ruling authorizes only the two files
named above. Gate-registration list conflicts resolve as an additive union (keep both sides' gates).

## After a completed rebase

One `deno task gen:assets-barrel`, then `check:assets-barrel` diff-clean. Verify
`git merge-base HEAD origin/main == origin/main`; range-diff commit mapping; stale S5/S6/S8 lineage
absent; scoped check/lint/fmt; **repo-wide `deno task check`** expecting `failedBatches: 0`; focused
tests including `runtime-gates_test.ts` and `listener-readiness-gates_test.ts`;
`check:aspire-version-parity` `fail=0`. **Explicitly confirm `readListenerHealthReport` still exists
and main's D-101 contract tests still pass.**
**No runtime. No PLAN-EVAL, no evaluator rerun.** Do not retarget the PR base.

Push with `--force-with-lease` against a freshly-read `git ls-remote` SHA. Report old/new head, the
resolution applied per file, verification exit codes, and the explicit D-101 contract confirmation.
