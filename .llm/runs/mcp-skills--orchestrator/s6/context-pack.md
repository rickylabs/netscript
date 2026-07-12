# Context Pack — mcp-skills--orchestrator/s6

S6 is at Plan-Gate on branch `feat/netscript-mcp-skills-s6-clitrigger`, baseline `0b8ed075`. Preflight passed. The locked design adds MCP-owned command catalog/executor ports, immutable deny-wins/default-deny policy, list/execute flows, static catalog stub, and subprocess executor without importing `@netscript/cli`. Product implementation must not begin until separate opposite-family `plan-eval.md` says `PASS`.

The package remains Archetype 6 under accepted `MCP-A6-V2-SHAPE`. Default executor prefix is `deno run -A jsr:@netscript/cli` because generated apps do not define a `netscript` task. S7 owns the live registry-backed catalog and real outer wiring; record that in drift.
