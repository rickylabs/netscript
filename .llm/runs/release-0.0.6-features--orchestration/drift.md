# Drift — 0.0.6 runtime / public-surface lane

Append-only. Severity: `minor` | `significant` | `architectural`.

## D-1 — research/plan sub-agent lane overridden to Opus (minor)

**Date** 2026-08-12. **Canonical route** `deep_analysis` = Claude · Fable 5 · medium. **Used**
Claude · Opus 5 medium/high. **Reason** the owner brief for this lane explicitly directs
"Delegate plan/research to Claude Opus medium/high sub-agents when useful". Owner instruction is
more specific than the default lane binding. Invariants preserved: generator ≠ evaluator, no lane
self-certifies, no paid escalation. Fable 5 · low remains the `review_codex` reviewer for the
#1398 slice, so opposite-family review of Codex work is untouched.

## D-2 — evaluator transport falls back to local fresh sessions (minor)

**Date** 2026-08-12. The brief routes PLAN-EVAL/IMPL-EVAL through OpenHands *after #1524
passes/lands*. Observed: PR #1524 is **OPEN**, `mergedAt: null`, with unticked DoD boxes for the
bounded live DeepSeek smoke and the repository default variable. Per the brief's own condition, this
run uses fresh local Claude/OpenCode OpenRouter evaluator sessions through the toolchain. Re-checked
before each dispatch; state recorded at the point of use.

## D-3 — IMPL-EVAL not required for small deterministic taxonomy fixes (significant)

**Date** 2026-08-12. **Owner ruling.** For the #1405 class — small, deterministic, fully specified
fixes with exact negative tests — a separate formal IMPL-EVAL is **not** to be dispatched. The
sufficient evidence set is: focused negative tests, CI, close-gate, and the orchestrator's own
independent diff review.

**My error.** The lane brief said an IMPL-EVAL owner waiver was "acceptable" for #1405 with exact
negative tests. I read that as a fallback to use only if the evaluator transport was blocked, and
recorded that reading in `supervisor.md`. The owner's intent was that the waiver is the **default**
for this class. One evaluator dispatch (DeepSeek V4 Flash 0731 max, 642,836 ms) was spent that should
not have been.

**Timing, stated plainly.** The ruling arrived after #1405 had already been evaluated **and merged**
(`8ff1bcb8f`, 2026-08-12T08:20:29Z). It therefore does not retract that merge or its evidence — the
IMPL-EVAL returned PASS and its per-fix revert isolation is real evidence that remains in the record.
The ruling governs this class going forward.

**Not weakened for #1398.** Formal PLAN-EVAL and IMPL-EVAL remain **mandatory** for #1398: it changes
public runtime behaviour, publishes a new record to a durable stream, and requires live evidence.
Its PLAN-EVAL has already run (PASS, MiniMax M3) and its IMPL-EVAL is still required before merge.

**Cleanup.** The detached #1405 evaluator worktree `/home/codex/repos/ns006-1405-impleval` was
verified clean (empty `git status --porcelain`) and removed. The #1398 PLAN-EVAL worktree
`/home/codex/repos/ns006-1398-planeval` is retained pending that issue's IMPL-EVAL. Pre-existing
global stashes belonging to other lanes' branches were left untouched.
