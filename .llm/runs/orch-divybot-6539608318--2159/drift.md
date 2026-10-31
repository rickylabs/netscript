# Drift

- Matrix evaluator routes are overridden by the owner's explicit Claude model/effort requirement.
- RTK is unavailable; use focused native commands and structured repo gate wrappers.
- Slice 2 uses the owner's permitted single follow-up path; effects acceptance remains unproven.
- A dedicated verification worktree isolates clean-baseline doc-lint and destructive negative
  controls. Only this run's copied source/test fixtures are changed there; no changes are shipped
  from that worktree. The git wrapper initially nested it; native git moved it to the project
  worktrees directory immediately.
- Full-export doc-lint reports the same seven inherited private-type references on baseline and
  implementation (six telemetry, one saga contract). Changed port/store/testing surfaces introduce
  none. JSR dry-run passes; its audit's slow-types warning is the known banner false positive.
- Public store/port additions make the generated MCP export corpus stale. Regenerate its exact
  checked-in artifact after the clean source commit and include it in the same PR. This extends
  the declared generated write surface only; MCP behavior is unchanged.
- Repeated runtime CI failure requires focused generated-entrypoint coverage and pre-cleanup
  diagnostic evidence in the E2E gate. The doctor verdict and readiness contract remain unchanged.
