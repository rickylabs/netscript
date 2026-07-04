# Topic A — open questions (owner + cross-topic coordination)

> Items that need the owner or another Stage-D agent (esp. Opus-B telemetry). Ordered by
> blocking-ness. Nothing here is self-decided; each is surfaced for ratification.

## Cross-topic — Opus-B (telemetry-revamp) — the data-contract handshake

**OQ-1 — `TelemetryQueryPort` producer side (HIGH, co-design now).**
The dashboard defines `TelemetryQueryPort` (proposal §4.2) as its stable seam and ships an
`aspire-otlp-http` adapter for beta.6. Topic-B's query/export surface must produce a shape the same
port can adapt onto without touching panels. Asks to Opus-B:
1. A **get-trace-tree-by-id** returning normalized `TraceTree` (or the OTLP-JSON `resourceSpans` we
   already parse) — highest-value single call.
2. Filter grammar: service-name, time-range (epoch ms), status, **cross-service / grouped-run** flag.
3. Streaming: NDJSON/SSE `follow` for logs + live spans.
4. Auth/config resolution reusing `@netscript/aspire` `DASHBOARD_ENV_VARS` +
   `.netscript/e2e/aspire-start.json`.
Need from Opus-B: confirmation these are in the telemetry query/export scope, and the concrete
response schema so DDX-3's port types are final.

**OQ-2 — Flagship trace (Flow B) co-land gate (HIGH, scheduling).**
DDX-8 (Flow/Trace Waterfall, the flagship panel) renders the Flow-B grouped trace (eischat enqueue →
workers-api → workers → oRPC callback → streams fan-out). That renders as ONE trace **only if**
telemetry-revamp lands (a) **span-links for the streams fan-in** and (b) the **triggers
W3C-parenting bugfix** at beta.6. If either slips, the flagship trace renders **severed**. This is a
hard co-land gate, not soft convergence. Owner + Opus-B: confirm both are beta.6-scoped and
scheduled to co-land with DDX-8.

**OQ-3 — Aspire `/api/telemetry/*` stability posture (MEDIUM).**
The API is documented since Aspire 13.2 and NetScript already queries it, but Aspire's docs do not
declare it stable-for-external-integration vs dashboard-internal (contrast Jaeger's explicit
"undocumented"). Before treating it as a long-term contract (vs a beta.6 bridge behind the port),
confirm posture. Mitigation already in design: the `TelemetryQueryPort` isolates the risk — a break
only touches the one adapter. Opus-B may have primary-source clarity here.

## Owner-facing — milestone/label prerequisites

**OQ-4 — Create `0.0.1-beta.6` milestone (HIGH, blocks issue-filing).**
The netscript-pr taxonomy only defines `0.0.1-beta.1`/`0.0.1-stable`/`Backlog / Triage`, but the
roadmap train puts dev-dashboard at beta.6. All DDX issues need `0.0.1-beta.6`. Owner must create it
(and beta.7 for Topics C/D/E) at ratification. (Stage-C owner fork 1.)

**OQ-5 — Add `epic:dev-dashboard` label (HIGH, blocks issue-filing).**
Add to `.github/labels.yml` first (never delete-live). Also confirm `area:` coverage is sufficient:
the epic spans `area:plugins`, `area:aspire`, `area:fresh-ui`, `area:telemetry`, `area:cli`,
`area:fresh` — all exist in the taxonomy.

## Owner-facing — design ratifications (Opus-A resolved provisionally; confirm)

**OQ-6 — Aspire seam extension is a HARD beta.6 requirement (confirm).**
Proposal §2.2/§8: the `command` kind extension to `@netscript/aspire` is non-optional for beta.6
because "control the full stack" and the dogfood thesis have no other honest seam. The `app` kind is
preferred-with-Seam-B-fallback. This adds a `@netscript/aspire` framework slice (DDX-1) to the beta.6
critical path. Confirm the owner accepts that scope, or accept a reduced "read-only dashboard at
beta.6, control at stable" descope (not recommended — it guts the killer-feature framing).

**OQ-7 — D-NSONE block shortlist + MCP-OUT (confirm).**
Proposal §5.1: promote 7 L3 blocks (breadcrumbs, context-rail, plugin-gated-view, activity-feed,
connector, entity-rail←member-rail, tree-nav←channel-tree); do NOT promote `data-grid` (collides
with fresh-ui's real `DataGrid<T>` export); **MCP components OUT** of the general registry for beta.6
(revisit at stable only if a live-MCP-tool panel is added). Confirm the shortlist and the MCP-out
call, since Stage-C left MCP scope to Opus-A.

**OQ-8 — Claude design-sync lane boundary (confirm).**
Proposal §7: the `.design-sync/` artifact + Fresh prototype run on the **Claude** lane (design/
prototype, no `packages/`/`plugins/` source), while the actual `plugins/dashboard/src/ui` framework
wiring is WSL Codex (DDX-5). Confirm this split respects the supervisor-does-not-write-framework-code
boundary as intended by the owner's "MANDATORY Claude design-sync" instruction.

## Lower-priority / track-only

**OQ-9 — fresh-ui pre-existing internal debt (track, independent of dashboard).**
The missing L3 layer and the `markdown` build-path split are fresh-ui's own debt, surfaced by
D-NSONE but not caused by it. DDX-0 fixes them as the dashboard precursor; if DDX-0 is descoped, file
them separately against `@netscript/fresh-ui` (flag to netscript-doctrine).

**OQ-10 — dashboard prefs persistence (defer to stable).**
beta.6 keeps the dashboard stateless (`defaultRequiresDb/Kv:false`; prefs client-side). Saved views /
server-side prefs are a stable-tier item (would flip `defaultRequiresKv:true`). Confirm client-side
is acceptable for beta.6.
