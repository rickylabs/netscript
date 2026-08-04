# Drift — db ephemeral AppHost lifecycle (#1196)

## 2026-08-05 — prior fix is present but its ownership rule is inverted

- Severity: significant.
- Planned/expected: #1088 should stop the operation host it starts.
- Observed: current code explicitly preserves an exact-path operation host when already present,
  has no signal path, and does not prove `aspire ps` or filesystem absence.
- Action: re-baselined the slice around exclusive ephemeral ownership; no foreign resources mutated.

## 2026-08-05 — evaluator composition

- Severity: procedural.
- Owner directive invokes milestone-run D6 composed evaluation and waives local PLAN-EVAL.
- Plan-Gate row is recorded exactly as `composed per milestone-run.md (orchestrator waiver)`.
