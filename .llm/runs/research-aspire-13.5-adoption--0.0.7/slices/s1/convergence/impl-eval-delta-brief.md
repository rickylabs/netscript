use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`,
  `verdict-definitions.md`); you are the **independent delta IMPL-EVAL**; never continue
  implementation, never self-certify.
- netscript-tools — scoped wrappers, raw git verification. netscript-pr — close-gate (#387),
  labels, closing keywords. aspire — CLI facts; **no AppHost start, no containers, no touching any
  `relay-*` container or `loopback-relay.ts` process** (another slice holds the host lease).

## Context

**S1 convergence delta IMPL-EVAL** for #1713 / PR #1727 / epic #1712. Phase-A IMPL-EVAL PASSED at
`ee379457e` on base `3b32d1628` (`slices/s1/evaluate.md`, medium finding: `scaffold.runtime` not
green on both tiers because of the #1734 baseline; low: cold+warm restore timing missing). Main
`52a881c58842` now ships #1736/#1734. The supervisor rebased S1's four commits onto exact main →
**frozen head `e0d70e40407458bebcf02cc408bea6b49107f42b` (= the earlier freeze `38c3e9e181bf` + the adjudicated `fix(e2e): accept stable 13.5 persistent allocation; prove live second endpoint` commit; delta Tier-A: tests 29/0, e2e-root check 170/0)** (`git range-diff 3b32d1628..ee379457e origin/main..e0d70e40407458bebcf02cc408bea6b49107f42b`
= all four identical), Tier-A `slices/s1/convergence/review-tier-a-convergence.md`.
Route: Claude · Anthropic · Fable 5 · medium. Your worktree:
`/home/agent/projects/netscript/worktrees/007-aspire-s1-eval` detached @ `e0d70e40407458bebcf02cc408bea6b49107f42b`
(read-only for product files; write only your evaluate file below).

## Verify (delta only, reproduced yourself)

1. Identity: reproduce the range-diff; confirm PR #1727 head = `38c3e9e18`, base `main`, no file
   outside the four commits' scope changed; `.github/workflows` identical to `ee379457e`.
2. Hosted runtime tiers at the exact head: `e2e-cli.yml` run **33330714604** — read the job
   conclusions and, for any failure, the decisive gate/error from the logs. Acceptance
   "`scaffold.runtime` green on both CI tiers" is met only if both runtime jobs succeeded at
   `e0d70e40407458bebcf02cc408bea6b49107f42b`.
3. Restore timing acceptance: cold 4385 ms / warm 2477 ms at the frozen head (Tier-A file) — check
   the PR comment/body carries both numbers with host/CLI/SDK/date; if absent, that is a
   bounded FAIL_FIX item (comment text only).
4. Close-gate (#387) for `Closes #1713`: run the repo's close-gate check for the PR body against
   #1713's acceptance boxes; report the exact pass/fail and any unchecked box. Do not tick boxes.
5. Static regression at the head: `run-deno-check.ts --root packages/cli`, S1-scope tests,
   `arch:check`, `quality:scan` — record exits.

Verdicts: `PASS` (ready for `ready`+close-gate handover), `FAIL_FIX` (bounded, name each fix), or
`FAIL_PLAN`. Write `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s1/convergence/evaluate-delta.md`
and post the same verdict on PR #1727 headed `[PHASE: IMPL-EVAL] [VERDICT: …] — convergence delta at 38c3e9e1`.
Do not modify the branch or PR metadata.
