# Topic B (telemetry) — context (B4)

Supporting context for the supervisor's downstream design decision: diagrams of both candidate flows, and
the open-question/spec-drift list to carry forward.

| File | Covers |
|---|---|
| `eis-chat-pipeline-diagram.md` | ASCII diagrams for Flow A (browser → dashboard BFF → GenAI middleware → legacy-archeo-mcp → `duckdb.exe`, with the one confirmed-dark non-Deno/TS hop marked ★) and Flow B (eischat → workers-api → workers → `channelClient` callback → streams fan-out), with a legend distinguishing confirmed-dark from unverified/unconfirmed hops. |
| `open-questions.md` | 7 open questions (MCP HTTP-transport propagation; channelClient oRPC tracing — now largely resolved, see `analysis/B-telemetry/telemetry-package-surface.md`; streams real consumer — now compounded by a confirmed telemetry-dark finding, see `analysis/B-telemetry/plugin-instrumentation-grading.md`; "grouped E2E trace" operational meaning; Aspire API stability posture; GenAI semconv attribute verification; Deno links-without-attributes limitation) plus 3 spec-drift/contradiction candidates flagged for the supervisor. |

## Note on question resolution since authoring

Two of the seven open questions in `open-questions.md` gained material evidence from the later-completing
`analysis/B-telemetry/` files (package-surface inventory and plugin-instrumentation grading) — see the
"Cross-file reconciliation notes" section of `analysis/B-telemetry/INDEX.md`. The `open-questions.md` file
itself is left as originally written (a point-in-time research artifact); this INDEX is where the
resolution pointers live.
