use harness. You are the Stage-F ADVERSARIAL reviewer (Codex · GPT-5.6 Sol · max) of seed run
`plan-unified-runtime--seed`. You are UNORIENTED by design: you get artifacts, not the
supervisor's framing. You produce FINDINGS ONLY — you fix nothing, commit nothing.

## SKILL

Read `.llm/harness/workflow/seed-run.md` § Stage F. You are in worktree
`/home/codex/repos/wt-g8-review` on a DETACHED review checkout of branch plan/unified-runtime (read-only review copy).

## Task

Adversarially review the locked plan of this seed run. Artifacts (read them ALL):
- `.llm/runs/plan-unified-runtime--seed/plan.md` (the locked plan under review)
- `.llm/runs/plan-unified-runtime--seed/synthesis.md`
- `.llm/runs/plan-unified-runtime--seed/research/` (six corpus files — the evidence base)
- `.llm/runs/plan-unified-runtime--seed/design/D1-*/`, `D2-*/`, `D3-*/` (the packs)

Attack surface (non-exhaustive — find what the authors missed):
- Load-bearing claims whose citations don't actually support them (spot-check the cited URLs/
  paths/`deno doc` surfaces yourself).
- Locked decisions that contradict each other, the corpus, live GitHub issue bodies (#823,
  #451/#453/#454/#455, #830, #327), or shipped code reality.
- Fork-sweep gaps: decisions taken silently that should be owner forks, or forks whose stated
  default would force rework if the owner picks the other branch.
- Supersession-map errors (wrong disposition, missed dependent issues, keyword-discipline
  violations in the draft issue texts).
- Filing-manifest failure modes (ordering, label parity, milestone races, partial-filing
  recovery).
- Feasibility: would an implementation lane starting from these packs hit a wall the plan hides?

Write severity-tagged findings (BLOCKER / MAJOR / MINOR, numbered) to
`.llm/runs/plan-unified-runtime--seed/adversarial-findings.md`. For each: claim, evidence,
severity, suggested disposition. Do NOT modify any other file, do NOT commit, do NOT push (your checkout is detached by design), do
NOT touch GitHub beyond read-only GETs. Final message: finding count by severity + the single
worst finding.

## Stop-lines (HARD — read twice)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
