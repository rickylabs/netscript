# Context Pack — harness-seed-run-profile--codify

**Goal**: codify the `plan-roadmap-expansion--seed` pipeline as a reusable Harness v3 run shape.

**State (2026-07-05)**: S1–S3 authored. Deliverables in place:

- `.llm/harness/workflow/seed-run.md` — the profile (stages A–I, invariants, ratification
  boundary, filing discipline, scale-to-fit, landmine pointers, dogfood acceptance).
- `.llm/harness/templates/supervisor.md` — template for the mandatory identity file (gap fix).
- Wiring: `workflow/activation.md` (step 10 + supervisor.md in Mandatory Artifacts), harness
  `README.md`, `netscript-harness` SKILL (+ regenerated `.claude/skills/` mirror).
- Run artifacts: `supervisor.md`, `research.md`, `plan.md` (LD-1..LD-8), `worklog.md`, `drift.md`.

**Next**: OpenHands separate-session eval on draft PR #471 → transcribe verdict to `evaluate.md`
→ surface to owner for ratification (incl. drift #3 PLAN-EVAL exception). The run does NOT
self-certify or merge. DONE already: S1–S3 committed+pushed, PR #471 open with slice trail, Codex
adversarial complete (0 blockers / 6 major / 2 minor — all accepted+fixed in S5, see
`adversarial-triage.md`).

**Key decisions**: name = "seed run" (`--seed` suffix); home = `workflow/` (run shape, not
archetype); stage contracts over frozen template (n=1); lane bindings by reference to
lane-policy.md only; acceptance = next real seed run (dogfood).

**Gates so far**: `validate-claude-surface.ts` all-ok; internal refs resolve; harness md is
outside the repo fmt surface (29-file pre-existing raw-fmt drift = non-verdict, untouched).
