# Worklog

## Design

Public: ServeOptions/DefineServiceOptions optional hostname. Builder chain remains createService(...).serve(options); preset forwards to that seam. Domain and ports: existing listener types and Deno.serve. Constants: native platform defaults, no new vocabulary. Slices: evidence bootstrap, independent review. Contributor path: service types, listener, preset, corresponding real-listener tests. No new implementation or test planned.

## Phases

1 Bootstrap: fetched clean existing clone and selected published branch.
2 Research: re-baselined against main; MCP and focused source inspected.
3 Plan & Design: carried-in contract verified.
4 Plan-Gate: N/A, mechanical validation with existing issue requirements and gates.
5 Implement: evidence-only bootstrap.
6 Gate: scoped refresh pending.
7 Evaluate: mandatory separate-family evaluation pending.
8 Release: N/A.
9 Close: pending; do not mark ready while mandatory review/CI are blocked.

Owner directive from HARNESS.md: opencode run -m opencode-go/glm-5.3-flash --variant max --auto; fallback agy --model gemini-3.8-flash-high. This explicit route overrides matrix defaults without waiving vendor/session independence.
