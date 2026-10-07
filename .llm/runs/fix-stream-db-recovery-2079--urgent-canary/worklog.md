# Worklog

## Design

State/lifecycle, identity, transport and clock ports, cancellation, concurrency and checkpoint delivery are locked in plan.md. Preserve existing collection identity; supervisor reopens public read sessions, not databases. Contributor adds recovery classification in adapter and proves behavior at owned handle boundary.

1 Activate: owner harness/PR/doctrine skills loaded.
2 Research: current-main upstream seams and MCP consulted.
3 Plan: contracts, three slices, failure/resume rules locked.
4 PLAN-EVAL: mandatory, pending; implementation has not started.
5 Implement: pending PASS.
6 Gates: pending.
7 IMPL-EVAL: mandatory pending.
8 Review: pending.
9 Close: no merge; truthful issue acceptance and CI required.
