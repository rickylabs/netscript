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

Bootstrap + plan done. Draft PR **#548** open (`chore/beta6-nondash-supervisor-run`, c9ba36a5).
PLAN-EVAL **dispatched** (minimax-M3, PR #548 comment 4895235162) — HARD STOP: no implementation
slice before PASS. On PASS: launch wave 1 (TEL-T3, TEL-T4, AI-494 on Codex; AI-257, PROG-306 on
Opus; PM-0 next slot; PROG-389 Tier-A bookkeeping). On FAIL_PLAN: fix plan, single re-dispatch,
two failures → escalate to owner.
