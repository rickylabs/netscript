# Context Pack — harness-seed-run-profile--codify

**Goal**: codify the `plan-roadmap-expansion--seed` pipeline as a reusable Harness v3 run shape.

**State (2026-07-05)**: S1–S3 authored. Deliverables in place:

- `.llm/harness/workflow/seed-run.md` — the profile (stages A–I, invariants, ratification
  boundary, filing discipline, scale-to-fit, landmine pointers, dogfood acceptance).
- `.llm/harness/templates/supervisor.md` — template for the mandatory identity file (gap fix).
- Wiring: `workflow/activation.md` (step 10 + supervisor.md in Mandatory Artifacts), harness
  `README.md`, `netscript-harness` SKILL (+ regenerated `.claude/skills/` mirror).
- Run artifacts: `supervisor.md`, `research.md`, `plan.md` (LD-1..LD-8), `worklog.md`, `drift.md`.

**Next**: OWNER RATIFICATION of PR #471 — the only remaining step. Ratify = un-draft + merge +
accept drift #3 (PLAN-EVAL skipped, owner-directed). Run is otherwise COMPLETE: S1–S5 pushed,
Codex adversarial 0-blockers/8-fixed (`adversarial-triage.md`), OpenHands separate-session eval
**PASS** with "Recommend merge" (`evaluate.md`; verdict transcribed from summary comment —
commit-back step failed, branch verified churn-free). Two non-blocking evaluator observations
deferred to OD-1. The run does NOT self-certify or merge.

**Key decisions**: name = "seed run" (`--seed` suffix); home = `workflow/` (run shape, not
archetype); stage contracts over frozen template (n=1); lane bindings by reference to
lane-policy.md only; acceptance = next real seed run (dogfood).

**Gates so far**: `validate-claude-surface.ts` all-ok; internal refs resolve; harness md is
outside the repo fmt surface (29-file pre-existing raw-fmt drift = non-verdict, untouched).
