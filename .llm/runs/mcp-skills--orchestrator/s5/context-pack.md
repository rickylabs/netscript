# Context Pack — `@netscript/mcp` S5

Status: implementation and requested gates complete; separate-session IMPL-EVAL pending.

Baseline is supervisor-corrected `dd89ced9` on `feat/netscript-mcp-skills-s5-doctor`. Scope is doctor aggregation only. Locked dependency decision: MCP directly uses leaf `@netscript/aspire`, never imports or reimplements CLI plugin doctor, and instead exposes an injected `ProjectDoctorPort` with a clearly warned S7 stub. Four families are telemetry, Aspire, project wiring, and plugins. Existing doctor output remains compatible and gains bounded family attribution.

All 26 MCP tests and the scoped check/lint/fmt, architecture, doc-lint, package/workspace publish dry-run, direct doctrine, and consumer smoke gates pass. The only lock change is the reviewed workspace dependency edge from MCP to `@netscript/aspire`.
