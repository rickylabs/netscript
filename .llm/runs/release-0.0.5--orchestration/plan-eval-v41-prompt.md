use harness

You are the **PLAN-EVAL re-evaluation** for the NetScript 0.0.5 stable-cut wave plan, cycle 2. You
are a separate session from the generator (Claude · Opus 5 · high) and the canonical opposite-family
route for it. Cycle 1 returned `FAIL_PLAN`; this is the repair pass. Two `FAIL_PLAN` cycles trigger
escalation, so be exact — but do not soften a real finding to avoid that, and do not manufacture one
to look rigorous.

## SKILL

`netscript-harness` (read `.llm/harness/evaluator/plan-protocol.md`, `gates/plan-gate.md`,
`evaluator/verdict-definitions.md`), `agent-milestone-orchestrator`,
`.llm/harness/workflow/milestone-run.md`, `.llm/harness/workflow/canary-cadence.md`,
`.llm/harness/workflow/lane-policy.md`, `netscript-release`, `netscript-pr`.

## Working rules

Worktree `/home/codex/repos/ns005-planeval-v4`, at commit `4cfe69480`. Read-only: do not commit,
push, or mutate. **Do not enter** `/home/codex/repos/ns005-w2a`, `ns005-w2b`, or `ns005-w2c` — live
Codex implementation sessions own those.

## Your subject

Your own cycle-1 verdict is preserved at `.llm/runs/release-0.0.5--orchestration/plan-eval-v4.md`.
The repair is:

- `plan.md` § **`# Wave plan v4.1 — repair after FAIL_PLAN (2026-08-09)`** — the governing section.
  v4 above it is deliberately left intact as the record of what was wrong; do not re-litigate v4
  except where v4.1 fails to supersede it.
- `cut-trace.md` § _W1 and the canary.15 / canary.16 boundary_
- `worklog.md` (the corrected re-baseline line)
- `drift.md` C-D34..C-D38
- `expensive-gate-log.md`
- issue comment on **#1373** (the #1374 adjudication) — read it live with
  `gh issue view 1373 --comments`

## The only question

**For each cycle-1 finding, is it actually fixed — verified against live state, not against the
plan's description of itself?** Take them in order: BLOCKER 1 (false re-baseline, unmaintained
cut-trace), BLOCKER 2 (W3-B clustering), BLOCKER 3 (closure manifest, #1126), HIGH 4 (sweep
dispositions), HIGH 5 (briefs and slice tables), HIGH 6 (silently-doing-nothing gates), MEDIUM 7
(dependencies, canary rationale).

For each: `FIXED`, `PARTIAL`, or `NOT FIXED`, with the evidence you gathered. Specifically check:

1. **Is the corrected re-baseline now true?** Re-query `origin/main`, the first-parent merges behind
   canary.16, which of them touch `packages/**`, and the live issue/PR inventory. `main` may have
   moved again since `a6b2e4c31` — if it has, say whether the plan's staleness is a defect or a race
   a running milestone cannot avoid, and what the plan should do about re-baselining as a practice
   rather than as a one-off.
2. **Does the cut-trace now match live first-parent history**, end to end, with no gap?
3. **Does the closure manifest cover every retained issue exactly once**, and does each row name a
   real event, real evidence, a real authority, and a real non-occurrence result? Is #1126's move
   correct, and is any _other_ retained issue in the same unclosable position and still missing?
4. **Are the three re-adjudications sound?** #1343 pulled in (is #1342 really an ancestor of
   canary.16's source, and is the observation really not already proven by the canary.16 pinned
   E2E?), #1379 pulled in (is it really bounded?), and #1373 kept without #1374 (**read the twelve
   acceptance boxes yourself** — is every one needle-provable, or does any of them require a
   compiler? If even one does, this is `NOT FIXED`).
5. **HIGH 6, expensive gate.** The orchestrator started building a lease tool and the owner ordered
   it removed as out-of-scope harness tooling; the answer is now a recorded ledger. Judge the ledger
   on its own terms: with one holder, orchestrator-only grants, a grant row that must precede the
   run, and an ungranted result declared inadmissible — is an ungranted or contended run now
   _distinguishable_ in the record? A ledger is weaker than a lock; say plainly whether it is
   sufficient for a three-lane wave, and if not, what the minimum sufficient recorded practice is.
   Do **not** recommend building tooling; that decision is made.
6. **HIGH 6, milestone-move receipt.** Is the W3 dispatch predicate real — would a skipped move be
   visible?
7. **MEDIUM 7.** Is the locked module name a legitimate way to convert a merge dependency into a
   decision dependency? Is W5-C's GLM disposition adequate under `lane-policy.md`? Is four canary
   boundaries now consistent with `canary-cadence.md`?
8. **Anything v4.1 newly broke.** Scope moved to 26 issues with one leaving. Is the milestone now
   too wide to cut, and is W4's four-group/three-lane sequencing coherent?

## Output

Write to `.llm/runs/release-0.0.5--orchestration/plan-eval-v41.md` and print it. Structure: one-line
verdict; a per-finding disposition table; then any surviving or new findings by severity with
evidence and the concrete change required; then the plan-gate checklist.

Verdict is exactly `PASS` or `FAIL_PLAN`. No hedging, no praise, no adjectives about quality — a
finding is a checkable claim with evidence or it is nothing. If it passes, say `PASS` and name what
you verified.
