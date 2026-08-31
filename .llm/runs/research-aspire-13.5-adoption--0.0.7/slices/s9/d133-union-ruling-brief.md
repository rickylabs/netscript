use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt; `git ls-remote`
  immediately before any `--force-with-lease`.

## D-133 — coordinator ruling: resume the S9 un-stack with an additive gate-list union

Your D-128 abort was **correct and accepted**. Supervisor analysis confirmed the conflict is
**additive-only**: your commit `eba896250` adds `GATE.SCAFFOLD_AGENT_INIT` and
`GATE.AGENT_ASPIRE_MCP_SMOKE` to the two gate-registration lists, while the reconstructed S8
independently added `GATE.RUNTIME_TYPED_DB_PHASE_B` to the same lists. Neither side modifies or
removes the other's entries.

**Ruling: resolve those conflicts as a UNION — preserve both sides' entries. Do not drop either
side's independently valid gate coverage.**

Applies to `packages/cli/e2e/src/application/gates/scaffold/scaffold-capability-gates.ts` and
`packages/cli/e2e/suites/scaffold/capability-suites.ts` (imports and list entries alike). Preserve
existing ordering/grouping conventions; add nothing beyond the two sides' own entries.

Resume: `git fetch origin main && git fetch origin feat/aspire-13-5-s8-typed-resource-commands`,
then `git rebase --onto bc838a0b3 f23954658` and apply the union at each such conflict.

**Unchanged rules:** generated files (`*.generated.ts`, generated `*.template` snapshots) take the
upstream side, never hand-merged. **Any non-generated conflict that is NOT a pure additive gate-list
union still aborts and reports** — this ruling authorizes only the additive union.

## After a completed rebase

One `deno task gen:assets-barrel`, then `check:assets-barrel` diff-clean. Verify
`git merge-base HEAD bc838a0b3 == bc838a0b3` (S8 head — S9 is a STACKED slice; do NOT rebase onto main); range-diff commit mapping; stale S5/S6/S8 lineage
absent; scoped check/lint/fmt on changed files; **repo-wide `deno task check`** expecting
`failedBatches: 0`; focused tests for the touched gate-registry/suite areas (they assert list
membership, so a mis-union fails loudly); `check:aspire-version-parity` `fail=0`.
**No runtime. No PLAN-EVAL, no evaluator rerun.** Do not retarget the PR base.

Push with `--force-with-lease` against a freshly-read `git ls-remote` SHA. Report old/new head,
each union applied, verification exit codes, and confirm both sides' gates are present.
