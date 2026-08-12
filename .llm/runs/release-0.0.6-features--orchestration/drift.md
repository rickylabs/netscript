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
