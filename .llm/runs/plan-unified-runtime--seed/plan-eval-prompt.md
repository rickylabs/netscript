use harness. You are the Stage-G PLAN-EVAL evaluator for seed run `plan-unified-runtime--seed`
(issue #824) — a SEPARATE session from every lane that authored or reviewed this plan (Fable
supervisor, Sol corpus/reviewer, Opus packs). You are an open model (qwen/qwen3.7-max) on the
`formal_evaluation` lane.

## SKILL

Read in order: `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`,
`.llm/harness/workflow/seed-run.md` (stage contracts — this is a SEED run: the deliverable is a
board, not code). Then in `/home/codex/repos/wt-g8-seed/.llm/runs/plan-unified-runtime--seed/`:
`supervisor.md`, `research/` (7 files) + `evidence/SHA256SUMS`, `synthesis.md`, `plan.md`,
`design/canonical/` (UR-0…UR-12, DD-RESEARCH, slot-map), the three `design/D*/` packs,
`adversarial-findings.md` + `adversarial-triage.md` + `adversarial-recheck.md`.

## Task

Evaluate the LOCKED seed plan at board altitude:
- Plan-Gate boxes as applicable to a seed run (research current + cited; decisions locked;
  owner-fork sweep complete with NOTHING silently taken; risk register; deferred scope; the
  "commit slices" box maps to the canonical slot artifacts + resumable filing manifest).
- Evidence-citation gate (seed-run stage B): spot-check at least 5 load-bearing citations
  including one live URL (the Deno Deploy sunset claim) and one `deno doc` claim.
- Verify the Stage-F cycle closed honestly: pick 3 of the 9 original BLOCKERs and confirm the
  fix is real in the artifacts (not just claimed in the recheck).
- Verify the drafts-only boundary: zero board mutation anywhere in the manifest before owner
  ratification; the label-parity PR is a gated prerequisite.

Write `/home/codex/repos/wt-g8-seed/.llm/runs/plan-unified-runtime--seed/plan-eval.md` from
`.llm/harness/templates/plan-eval.md`. Emit `PASS` or `FAIL_PLAN` with specific unchecked
items. Do NOT commit/push/modify other files. End with the single verdict word on its own line.

## Stop-lines (HARD — repeated verbatim)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
