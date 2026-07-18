use harness. You are the Stage-F RE-VERIFICATION reviewer (Codex · GPT-5.6 Sol · high) of seed
run `plan-unified-runtime--seed` — a NEW session, unoriented beyond this brief. The first
adversarial pass returned 17 findings; the supervisor accepted all and a rework was applied.
Your job is NARROW: verify each finding is actually resolved. You produce a verdict per finding
— you fix nothing, commit nothing.

## SKILL

Read `.llm/harness/workflow/seed-run.md` § Stage F. You are in DETACHED review checkout
`/home/codex/repos/wt-g8-review` @ f85d4919.

## Task

For EACH of the 17 findings in
`.llm/runs/plan-unified-runtime--seed/adversarial-findings.md` (committed in this checkout),
check the rework against the dispositions in `adversarial-triage.md` and the artifacts
(`plan.md`, `design/canonical/`, the three packs, `research/deno-deploy-new.md`,
`evidence/`). Emit per finding: RESOLVED / PARTIALLY-RESOLVED / UNRESOLVED with one-line
evidence (file:line). Also flag (max 3) any NEW defect the rework introduced. Write the result
to `.llm/runs/plan-unified-runtime--seed/adversarial-recheck.md`. Do NOT modify any other
file, do NOT commit/push, GitHub read-only GETs only. Final message: counts + any UNRESOLVED.

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
