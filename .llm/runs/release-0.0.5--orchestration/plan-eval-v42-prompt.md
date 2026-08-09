use harness

You are the **PLAN-EVAL, cycle 3** for the NetScript 0.0.5 stable-cut milestone plan. Same session
as cycles 1 and 2; the generator is still Claude · Opus 5 · high and is not you.

## Scope of this evaluation — owner-ratified, not open for a finding

Cycle 2's ninth finding required ordered slice tables for all twelve W3–W5 groups inside the
milestone plan. That question was escalated to the owner at the harness eval-loop limit and
**resolved on 2026-08-09: the Plan-Gate subject in a milestone run is split.**

- **In scope for you:** the milestone plan's clusters, wave sequence, dependency order, declared
  canary points, dispatch preconditions, scope/sweep dispositions, and the closure manifest.
- **Out of scope for you:** per-group slice tables, touched-file lists and per-slice proving gates.
  Those live in each group's brief, and **each brief takes its own separate-session PLAN-EVAL before
  its group implements** — the practice W2 already ran, with recorded Fable 5 `PASS` verdicts on
  #1394 and #1395. Do not re-raise this as a finding; if you believe the split is unsafe, say so in
  one clearly-labelled advisory paragraph at the end and do not let it affect the verdict.

Everything else you have found in cycles 1 and 2 remains fair game, and new findings are welcome.

Read `escalations/plan-gate-scope.md` for the full resolution and `drift.md` C-D42.

## SKILL

`netscript-harness` (`evaluator/plan-protocol.md`, `gates/plan-gate.md`,
`evaluator/verdict-definitions.md`), `agent-milestone-orchestrator`,
`.llm/harness/workflow/milestone-run.md`, `canary-cadence.md`, `lane-policy.md`,
`netscript-release`, `netscript-pr`.

## Working rules

Worktree `/home/codex/repos/ns005-planeval-v4`, read-only — do not commit, push or mutate. **Do not
enter** `/home/codex/repos/ns005-w2a`, `ns005-w2b` or `ns005-w2c`; live Codex sessions own those.
`git fetch` first: `main` may have moved.

## Your subject

`plan.md` § **`# v4.2 — the cycle-2 repair (2026-08-09)`**, read together with § `# Wave plan v4.1`
and § `## The #1202 correction`. v4 above them is the preserved record of what was wrong; do not
re-litigate it except where v4.2 fails to supersede it.

Supporting: `phase-registry.md` (rewritten), `cut-trace.md` (§ Evaluated-through marker),
`research.md` (§ Re-baseline), `drift.md` C-D34..C-D42, `expensive-gate-log.md`,
`escalations/plan-gate-scope.md`, and the live #1202 and #1373 issue comments.

## What to verify

Take your cycle-2 findings in order and give each `FIXED` / `PARTIAL` / `NOT FIXED` with evidence:

1. **Scope arithmetic and enumeration.** v4.2 claims 26 retained with the count and the enumeration
   agreeing. Recount from the group table plus the closure manifest. Do #1126 and #1169 both leave,
   and does anything else need to?
2. **#1169's move.** Is a release cut genuinely the event its DoD names, and is #1175 open in 0.0.6?
3. **#1004's corrected rule.** Can it now be closed only by a demonstrated recovery?
4. **The authority column.** Does every non-PR closure row name a real adjudicator?
5. **#1379's lock policy.** Option (b), frozen private lock, is selected with rationale. Is (b)
   actually workable against the issue's ten acceptance rows, or does any of them force (a)?
6. **`phase-registry.md`.** Does it match v4.1/v4.2 — split W3, four canaries, W4-D, corrected F —
   and is the milestone-move receipt a real W3 predicate that reads `NOT_RUN` today?
7. **`cut-trace.md` and `research.md`.** Are the timestamps now exact, is the evaluated-through
   marker correct against live `origin/main`, and is the re-query-before-dispatch rule stated as a
   recurring check?
8. **W3's dispatch sub-order.** Is A/B2/B3-then-B1-then-C coherent given the declared dependencies?
9. **Anything new**, including anything the #1202 correction or the four-canary decision breaks.

## Output

Write to `.llm/runs/release-0.0.5--orchestration/plan-eval-v42.md` and print it. One-line verdict, a
per-finding disposition table, surviving/new findings by severity with evidence and the concrete
change required, then the plan-gate checklist **as scoped above**.

Verdict is exactly `PASS` or `FAIL_PLAN`. No hedging, no praise, no adjectives about quality — a
finding is a checkable claim with evidence or it is nothing.
