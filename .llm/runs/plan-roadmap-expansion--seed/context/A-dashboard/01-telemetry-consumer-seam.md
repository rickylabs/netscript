# Telemetry consumer seam — what the dashboard would consume first from Aspire (task 6, light note)

Scope: Topic A §5 ("Telemetry query/export surface (Topic B) — the dashboard's live data. Co-land at
beta.6") — this is the Aspire-side half only; the `@netscript/telemetry` package inventory itself is
owned by the parallel "Topic B telemetry" research lane, not this fork.

## What Aspire exposes today, ranked by how reachable it is for a NetScript dashboard plugin

1. **OTLP (structured logs, traces, metrics) — the easy, standards-based part.**
   `docs/site/explanation/aspire.md` and the generated `register-apps.mts` confirm every registered
   resource is wired with `withOtlpExporter({ protocol: OtlpProtocol.HttpProtobuf })`, sending to
   Aspire's own OTLP collector (`http://localhost:4318` per the doc). This is a documented, open
   protocol — the dashboard's backend could ingest it directly (a second OTLP receiver) with no
   dependency on Aspire's internal APIs at all. **This is the natural first thing to consume**: it
   requires no reverse-engineering of Aspire internals, and it's the same data Topic B's
   `@netscript/telemetry` package instruments today.

2. **Resource graph + console logs — gated behind an undocumented internal gRPC protocol, not a
   public REST API.** Per `aspire.dev` slug `aspire-dashboard-configuration-reference` (§Resources,
   fetched via `mcp__aspire__get_doc`): *"The dashboard connects to a resource service to load and
   display resource information."* Config keys are `Dashboard:ResourceServiceClient:Url` (a **gRPC
   endpoint**), `:AuthMode` (`ApiKey|Certificate|Unsecured`), plus API-key/cert fields. This confirms
   the resource list and console-log stream are **not** exposed as a documented, stable public REST/
   JSON API — they ride Aspire's own dashboard-to-AppHost gRPC channel. A NetScript dashboard plugin
   wanting "list of running resources + their live console output" would need to either speak that
   gRPC protocol itself (undocumented shape, C#-Aspire-internal, no confirmed TS client found in this
   fork's research) or avoid it entirely by using the surface in point 3 below.

3. **The `aspire` MCP server — the closest thing to a documented, ready-made query surface, and it is
   already live in this very session.** The tools available right now
   (`mcp__aspire__list_resources`, `list_console_logs`, `list_structured_logs`, `list_traces`,
   `list_trace_structured_logs`, `execute_resource_command`, `list_apphosts`, `select_apphost`,
   `list_integrations`, `doctor`) are exactly the resource-graph + logs + traces + command-execution
   surface a dashboard would want, shaped as a stable tool-call API rather than raw gRPC. This is
   strong (if indirect) evidence that Aspire's own MCP integration is the sanctioned "query this
   programmatically" path today, ahead of a public REST resource-service API. Whether NetScript's
   dashboard backend should shell out to / embed this same MCP server (vs. reimplementing against the
   gRPC protocol directly) is a design question for the downstream Opus deep-dive agent — flagging it
   here as the most concrete lead, not deciding it.

## Recommended "what to consume first" framing for beta.6

Given the above, the light, non-binding sequencing this fork would flag for the design proposal:

1. **First**: OTLP-sourced structured logs + traces — zero dependency on Aspire internals, directly
   overlaps with whatever Topic B's `@netscript/telemetry` query/export surface produces, and is the
   most standards-stable long-term integration point.
2. **Second**: resource list + status (name, kind, health, endpoints) — needed for any "what's
   running" panel, but requires picking one of: (a) the gRPC resource-service client, (b) proxying
   through the `aspire` MCP server's `list_resources`/`doctor` tools, or (c) reading NetScript's own
   already-typed `AspireResource[]` graph at compose time (`packages/aspire/src/domain/
  aspire-resource.ts`, `composeAppHost()`) for the subset of resources NetScript itself registers —
   option (c) is cheapest for NetScript-native resources but blind to non-NetScript resources Aspire
   also tracks (e.g. containers added outside `@netscript/aspire`).
3. **Third, once Seam A is extended (see research file 02)**: `withCommand`-driven actions
   surfaced in the dashboard UI — this is additive once the plugin-contribution seam supports a
   command kind, not a beta.6 blocker in itself.

## Sources

- `aspire.dev` slug `aspire-dashboard-configuration-reference`, §Resources (via `mcp__aspire__get_doc`).
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\docs\site\explanation\aspire.md`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\aspire\src\domain\aspire-resource.ts`
- `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\packages\aspire\src\application\compose-apphost.ts`
- Live `mcp__aspire__*` tool list observed in this session (`list_resources`, `list_console_logs`,
  `list_structured_logs`, `list_traces`, `list_trace_structured_logs`, `execute_resource_command`,
  `list_apphosts`, `select_apphost`, `list_integrations`, `doctor`).
