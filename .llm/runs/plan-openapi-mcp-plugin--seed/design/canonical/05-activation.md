# Activation (canonical design, rev 1)

> Draft — design document only. Wave four's verdict: the docs MCP was called **zero times** in
> three runs (#1072); the Scalar docs went unopened *while debugging the exact envelope they
> document* (#1117). A tool nobody invokes is worth nothing, so this section is a design
> surface, not a rollout note.

## 1. The moment of need, located

The failure moment is precise: an agent has a failing or opaque HTTP interaction with its own
service and reaches for `curl` to probe it. Activation succeeds iff, *at that moment*, the
introspection tools are (a) already connected, (b) visibly relevant in the tool picker, and
(c) cheaper than the curl loop. (c) is delivered by 01/03 (one call → schemas + a ready
`curlExample`); this section delivers (a) and (b).

## 2. Surfaces, in order of proximity to the moment

| # | Surface | Mechanism | Lineage |
| --- | --- | --- | --- |
| A | **Already connected** | The tools join the `netscript agent mcp` server that `agent init` already writes into `.mcp.json`/`.vscode/mcp.json` (`init-agent.ts:127-172`). Zero install, zero new server entry. | the decisive property — the wave-four agents *had this server connected* while curling blind |
| B | **Tool-picker text** | The three summaries name the counterfactual act itself: "Call before probing any service endpoint", "Use instead of guessing endpoints with curl", "Use before hand-writing a request body" (01). An agent scanning tools while composing a curl command sees its own intent named. | #1071's lesson: state behaviours, not capabilities |
| C | **`initialize` instructions** | The server instructions string (`mcp-server.ts:13`) gains one sentence: *"When debugging or calling a service's HTTP API, use list_service_operations / get_operation_schema before hand-rolling requests."* Instructions load at session start in every MCP-aware host. | #1072's shipped pattern (`initialize` instructions naming the surface) |
| D | **App-scoped conventions** | The scaffolded `apps/<app>/AGENTS.md` (#1071's artifact) gains one line under its behaviours: *"Service API shapes: ask the MCP (`list_service_operations`), don't probe with curl."* Lands with the template, so every new scaffold carries it; `agent init` places the equivalent in the root guidance for existing apps. | #1071 |
| E | **Failure-path cross-reference** | Where existing tools already see endpoint-shaped trouble — `get_recent_errors` rows naming a service, `doctor` findings on service health — the bounded output appends the pointer to `get_operation_schema` for that service. The moment of need sometimes arrives through *our own* diagnostics; the exit sign hangs there too. | new, this design |
| F | **Evidence gate** (fork F4) | Introspection flows already write receipts via `withReceipt` (01 §registry), so the #1078 gate machinery can *accept* them as diagnostic evidence alongside doctor/otel immediately (F4a). The escalation — *requiring* an introspection receipt for endpoint-shape claims in drift entries (F4b) — is deferred one field wave, because gating on an unproven surface is the #1072 trap inverted. | #1072/#1078 |

## 3. What is deliberately not done

- No auto-invocation, no injected reminders mid-conversation, no hook that runs the tools for
  the agent — the harness doctrine is gate-not-suggest, not puppeteer.
- No separate "openapi MCP server" entry in `.mcp.json` — a second server is a second thing to
  fail to activate; extending the existing one is itself an activation decision (and the D1
  core-extension verdict makes it natural).
- No docs rewrite: `expose-openapi-scalar.md` gains a "for agents" cross-reference line, nothing
  more. The docs were never the gap.

## 4. Measurement

Acceptance that can be verified at merge: surfaces A–E exist (fixture tests: instructions string
contains the sentence; template contains the line; error output contains the pointer).
Acceptance that cannot: whether the next wave's agents actually call the tools — that is
observational, and per the #1072 close-gate lesson it is **routed to #1090** (the follow-up-run
observation issue), not ticked here. The wave-five signal to collect: count of
`list_service_operations`/`get_operation_schema` calls vs count of raw `curl` invocations
against scaffolded services, from run transcripts — the same counting that produced this RFC's
"zero docs-MCP calls" baseline.
