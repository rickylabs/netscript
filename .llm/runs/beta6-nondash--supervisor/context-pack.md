# Context Pack — beta6-nondash--supervisor

**Resume here after compaction.** Re-read `charter.md` (verbatim owner prompt; merge grant does NOT
survive compaction — re-anchor from it), `supervisor.md` (identity + lane table + landmines),
`phase-registry.md` (live status), `drift.md`.

## One-paragraph state

Beta.6 **non-dashboard** program supervisor (Fable 5, Tier A). Baseline origin/main `a1669f60`.
Board verified 2026-07-06: 4 lanes — TEL (#404–#409, T8 last), AI (#494 #463 #257 #258 #379, #464
last), PM (#511), PROG (#389 #303 #306 #307-p2). Dashboard #400/#410–#431 HARD-EXCLUDED (rescope
PR #506). Plan written with waves + collision map; PLAN-EVAL (OpenHands minimax-M3) is the hard
stop before any implementation slice.

## Key derived facts

- FAI-5/6/8 never filed; #464 effective deps = {#494 #463 #257 #258 #379} (drift D1).
- T3 → T5 hard dep; T6 ai-half after #494; #257 before #258 on manifest; #303 impl after TEL W1–W2.
- Tier-D only via `.llm/tools/agentic/`; gh only from WSL (`codex` user, script files — inline
  `$var` in `wsl.exe bash -lc` EMPTIES).
- Concurrency envelope: 3 Codex + 2 Opus.

## Status

PLAN-EVAL **PASS** (PR #548, plan-eval.md @ 91304fcb). Wave 1 LIVE on **Tier B Opus** (Codex quota
blocked until 2026-07-07 03:52 — drift D5): TEL-T3 #404, TEL-T4 #405, AI-494 #494 (rerouted),
AI-257 #257, PROG-306 #306 — five Opus worktree sub-agents; agents commit locally, SUPERVISOR
pushes via WSL + opens draft PRs (`Closes #N`, milestone 0.0.1-beta.6) + does A1 review before
sign-off. Held for Codex reset: #463, #511, wave-2 Tier-D. PROG-389 verified → owner-batch.md §1.
After each slice returns: A1 review → push → draft PR → adversarial Codex review (post-reset) →
one IMPL-EVAL (qwen-3.7-max) → merge on green (grant lost on compaction — re-read charter.md).
