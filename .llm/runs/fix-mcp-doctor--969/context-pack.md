# fix-mcp-doctor--969

## Issue in scope

- #969 — fix(mcp): doctor reports false positives and disagrees with the running AppHost

## Shared-cause hypothesis

Standalone slice. The MCP `doctor` tool reports results that contradict the running system:

- a telemetry HTTP 404 is scored as a passing check (pass/fail semantics of individual
  checks are not asserted anywhere),
- the NetScript AppHost marker check reports "not found" while an AppHost is running
  (the detection input is not the same thing the AppHost actually publishes),
- `list_commands` omits the workers command tree (MCP command metadata is a parallel,
  hand-maintained list rather than a projection of the CLI command registry).

Working hypothesis: all three are the same defect class — MCP surfaces derive their truth
from a second source rather than from the live/registry source, and no contract test pins
the pass/fail semantics. The fix should be at that seam, plus a regression guard.

## Assessment

MECHANICAL — no plan document. Straight to implementation.
