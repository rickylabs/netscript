# T5 — Data plane: how DevTools panels get data (charter Q6)

Stage-D deep-dive pack, run `plan-devtools-contribution--seed`, baseline `main` @ `2256a67bf`.
Planning-only; nothing outside this run dir was written. Citations: `path:line` are baseline repo
paths; `rfc:NNN` = RFC-A text at `14b5c858c` (per corpus `p3`); `RFC:NNN` = RFC-0001 at `6cb79675c`
(per corpus `p2`); corpus files are `research/<id>.md`. Claims verified in this session are marked
**verified-here** with the command; everything else cites the corpus file that carries the
`path:line` evidence. `inference` and `unverified` are marked inline.

## Recommendation

**The DevTools host is the single data edge.** Panels never hold a service URL, a fetch capability,
or a client factory; they receive a **host-assembled, typed context object** at mount — the seam
RFC-A itself licenses ("UI contributions and SDK request contributions are separate named extension
axes, not one universal envelope", rfc:1179-1187 via `p3` F14) — and every read flows through a
**host-owned, enumerated devtools contract** served same-origin by the DevTools server. The server
side of that contract *delegates* to surfaces that already exist: `TelemetryQueryPort`
(`@netscript/telemetry/query`, `r5` F10-11), the MCP `ToolFlow`s composed **in-process** (not over a
new HTTP/SSE MCP transport), the pure `@netscript/mcp/openapi-projection` (`r5` F21), the
identity-bound `ServiceEndpointDirectoryPort` (`r5` F19-20), and — staged behind their own landing
slices — #1446's four contracts (`p2` F2). Live updates are a **one-directional SSE event feed**
built on the SSE primitives already sitting in `packages/fresh/src/runtime/server/sse.ts`
(**verified-here**, below); mutations never ride the feed. Credential-bearing typed clients are
**hard-blocked on the RFC-A implementation chain** (#1350 → unfiled metadata child → #1351 → #1349 →
#1352, all `0.0.7`, `p3` F13), so the v1 panel set is deliberately the principal-less set:
telemetry, framework state, plugin-declared read procedures.

Three sentences of it: (1) Panels receive capabilities, never addresses — a typed context assembled
by the host from the panel's manifest-declared needs. (2) The transport is same-origin HTTP (oRPC)
plus SSE from the DevTools server, with MCP flows called in-process and read-kind-only by default.
(3) Anything needing an authenticated principal (management/audit/history/convergence reads,
protected plugin routes) is a named later stage gated on RFC-A's #1352 — stated as a sequencing
dependency with a shipping-now mitigation, not designed around.

### How a plugin panel gets data without arbitrary service URLs — the explicit statement

A plugin's DevTools contribution may name **only**:

1. **Host-provided procedures** from the closed devtools vocabulary (telemetry queries, framework
   state, journey assembly, deep-link builders); and
2. **Its own service's procedures**, declared in the plugin manifest as a *static reference*
   (`DevtoolsProcedureReference`, below — the same module+export reference discipline as RFC-A's
   `SdkClientContributionReference`, rfc:1136-1159 via `p3` F7: a reference "does not contain a
   serialized function and does not automatically activate it").

The generated DevTools server registry statically imports the referenced contract export and
constructs the typed client **server-side** with `createServiceClient`, resolving the plugin's
`serviceName` to an origin exclusively through the `ServiceEndpointDirectoryPort` (four sources,
fixed precedence, identity-bound run manifest — `packages/mcp/src/application/service-endpoint-directory.ts:53-58`,
`r5` F19-20). The browser panel only ever sees the same-origin devtools route. There is no
procedure that accepts a URL, an origin, or a path as input — which is what removes the
confused-deputy shape: a deputy is confused when the caller chooses the target and the server
supplies the authority; here the target set is closed at generation time and the caller chooses
only a name from it. The cautionary precedent this forecloses is TanStack's `install-devtools`
event, where the panel chooses the action and "dev server only" is the entire gate (`m2` F10,
research.md F25).

## Host→panel context contract

Working home `@netscript/devtools-core` (ARCHETYPE-1, contracts only; the name and archetype are
T2/T8's to lock — do not hardcode, per the same rule `p2` OQ5 applies to automation naming). The
vocabulary deliberately mirrors RFC-A's ratified-in-FCP idiom — `{family, major}` protocol,
namespaced ids, duplicate rejection, static module reference + explicit selection — which RFC-A
itself declares shared with #928 (rfc:1179-1187, `p3` F13 mitigation: depending on the
*vocabulary* carries shape risk ≈ 0; depending on the *symbol* carries availability risk).

```ts
/** Protocol handshake — RFC-A vocabulary only (rfc:405-408, rfc:1179-1187). */
export interface DevtoolsDataProtocol {
  readonly family: 'netscript.devtools-data';
  readonly major: 1;
}

/** `<pluginId>/<panel>/v<major>` — version-suffixed ids; Grafana's whole compatibility story (m2 F16). */
export type DevtoolsPanelId = `${string}/${string}/v${number}`;

/** `<namespace>:<kebab-name>` — closed, host-enumerated at generation time. Never a URL. */
export type DevtoolsProcedureId = `${string}:${string}`;

/** Discriminated result mirroring MCP's ToolSuccess|ToolFailure with stable codes
 *  (packages/mcp/src/domain/tool-types.ts:34-58, r5 F18). */
export type DevtoolsProcedureResult<TOut> =
  | { readonly ok: true; readonly value: TOut }
  | { readonly ok: false; readonly error: { readonly code: DevtoolsErrorCode; readonly message: string } };

/** SERVER context — what a route handler / server-rendered panel section receives.
 *  Host-owned ports, handed narrow (Medusa's host-fetches-props-flow-down, generalized: m3 M-7). */
export interface DevtoolsServerPanelContext {
  readonly protocol: DevtoolsDataProtocol;
  readonly panelId: DevtoolsPanelId;
  /** The existing typed telemetry read model — consumed, not rebuilt (packages/telemetry/src/ports/telemetry-query-port.ts:15-79). */
  readonly telemetry: TelemetryQueryPort;
  /** In-process invoker over read-classified MCP flows (ToolKind 'read' only by default; tool-types.ts:32). */
  readonly tools: DevtoolsToolInvoker;
  /** Identity-bound endpoint directory — names, sources, conflicts; never used by panels to build URLs. */
  readonly endpoints: Pick<ServiceEndpointDirectoryPort, 'list'>;
  /** Typed Aspire/Scalar deep-link builders over the m4-verified URL grammars. */
  readonly links: DevtoolsDeepLinks;
  /** The journey join key, as data (packages/telemetry/src/domain/telemetry-convention.ts:54-56). */
  readonly correlation: { readonly attribute: 'netscript.correlation.id' };
  readonly signal: AbortSignal;
}

/** CLIENT context — what an island panel receives. No ports, no env, no window reads at module
 *  scope (RFC-A's environment-neutral construction rule, rfc:321-324). */
export interface DevtoolsClientPanelContext {
  readonly protocol: DevtoolsDataProtocol;
  readonly panelId: DevtoolsPanelId;
  /** Same-origin, typed, closed-vocabulary query invoker (HTTP to the devtools contract). */
  readonly query: DevtoolsQueryInvoker;
  /** SSE-backed one-directional event feed (see Live updates). */
  readonly events: DevtoolsEventFeed;
  readonly links: DevtoolsDeepLinks;
}

export interface DevtoolsToolInvoker {
  invoke<N extends DevtoolsReadToolName>(
    name: N,
    input: ToolInputOf<N>,
    options?: { readonly signal?: AbortSignal },
  ): Promise<ToolExecutionResult>;
}

export interface DevtoolsQueryInvoker {
  invoke<TOut = unknown>(
    procedure: DevtoolsProcedureId,
    input: unknown,
    options?: { readonly signal?: AbortSignal },
  ): Promise<DevtoolsProcedureResult<TOut>>;
  /** TanStack Query bridge: stable keys ['devtools', procedure, input] — see Caching. */
  queryOptions<TOut = unknown>(procedure: DevtoolsProcedureId, input: unknown): DevtoolsQueryOptions<TOut>;
}

/** Plugin manifest reference — the ONLY way a plugin extends the procedure vocabulary.
 *  Mirrors SdkClientContributionReference (rfc:1136-1156): static, declarative, never activating. */
export interface DevtoolsProcedureReference {
  readonly protocol: DevtoolsDataProtocol;
  readonly id: DevtoolsProcedureId;          // must be prefixed `<pluginId>:` — enforced, not advisory (Grafana m2 F13)
  readonly module: string;                   // plugin-package module specifier
  readonly export: string;                   // named export of an oRPC contract procedure binding
  readonly kind: 'read';                     // v1 is read-only; 'mutate' is a staged owner decision (OQ-2)
}
```

Contract laws (each carried into the RFC as normative text):

- **Duplicate ids are rejected at generation time**, never last-wins — the silent-collapse defect
  class is already shipped three times over (`r2` F11 via research.md F19; duplicate plugin
  identity, `r3` via SYNTHESIS S-1/S-17 discussion) and RFC-A's construction law is the fix pattern
  (rfc:830-846, `p3` F5).
- **The host assembles context per panel from declared needs**; a panel that declared nothing gets
  the base context only. No ambient/global client, no locator, no `useDevtoolsClient()` — the exact
  shapes RFC-A rejects for the SDK (rfc:1501-1506, `p3` F14) stay rejected here for the same
  reasons.
- **Redaction law is inherited verbatim**: procedure results and events must never carry header
  values, request input echoes, contribution context, or credentials — RFC-A forbids recording
  these *even in debug mode* (rfc:1091-1110, `p3` F6). The one thing explicitly visible is cache
  partition values, which RFC-A declares "intentionally visible in query keys and developer tools"
  (rfc:1117-1119, `p3` F9) — that sentence is the quotable green light for a cache-inspector panel
  and the boundary of it.
- **Per-panel error boundary + empty-list degradation**: a failing procedure returns the
  discriminated failure; a failing panel renders a boundary, loud in dev (`m2` F23 polarity
  inverted for a dev audience, research.md F24); the host degrades, it never crashes (`m2` F18).

## Transport decision

**Panel ↔ DevTools host: same-origin HTTP (oRPC contract on the host's route group) + SSE for
push. MCP: in-process composition, no new transport. No WebSocket. No MessagePort.**

| Leg | Decision | Rationale |
| --- | --- | --- |
| Panel → data | Same-origin HTTP to the host-owned devtools oRPC contract | HTTP-only aligns with RFC-A's normative transport posture (MessagePort rejected, rfc:983-998, `p3` F11); same-origin is also what the framework's own SSE consumer documents as the sanctioned pattern for auth-constrained EventSource (**verified-here**: `deno doc packages/fresh/src/runtime/streams/create-stream-event-source.ts` — "Native `EventSource` cannot attach arbitrary authorization headers. Use a same-origin route/proxy…") |
| Host → MCP capability | **In-process**: compose the exported flow factories directly | **verified-here**: `deno doc packages/mcp/mod.ts` exports `createDoctorFlow`, `createServiceEndpointDirectory`, `createToolRegistry`, `createListApiServicesFlow`, `createGetOperationSchemaFlow`, `createExportSurfaceFlows`, … — the flows are public, composable API; no HTTP transport is needed to reach them. This settles research.md open question 4 in favour of in-process. |
| MCP over HTTP/SSE | **Rejected** | (a) Aspire's own 13.3 trajectory: dashboard = fixed human viewer, MCP = external agent surface (`m4` F15, research.md F26); (b) an HTTP-exposed tool registry would carry `execute_command` and `record_drift` — the mutate/meta tools — into browser reach; in-process composition lets the host bind **read-kind flows only**, using the existing `ToolKind = 'read'\|'mutate'\|'meta'` classification (`packages/mcp/src/domain/tool-types.ts:32`, `r5` F18) as the allowlist axis; (c) stdio stays the single agent transport — no second protocol surface to version (`r5` F23). |
| Push channel | SSE (one-directional), not WebSocket | One-directionality is a structural property, not a policy: a panel physically cannot send an action down the feed, which forecloses the TanStack `install-devtools` failure class (`m2` F10) instead of gating it. Mutations must be named POST procedures — enumerable, deny-by-default, auditable. TanStack's triple stack (browser `EventTarget` + WS on 4206 + SSE/fetch fallback) is the anti-pattern the corpus already flags as "pick one transport" (`m2` adapt table). SSE also needs no new port under Aspire. |
| Typed both ways | oRPC contract + MCP input/output schemas | The 22 MCP tools already declare JSON input **and** output schemas keyed by `ToolName` (`packages/mcp/src/domain/tool-contracts.ts:353,361`, `r5` F18) — the devtools contract re-exposes selected read flows with those schemas, so panel-side typing is free. |

What the transport is **not**: it is not the #934 deny-by-default procedure gateway. #1446 scopes
that gateway's sufficiency claim to Surface 1 "for this surface only" (RFC:503-508, `p2` F6) and is
deliberately silent for DevTools. Recommendation: DevTools does **not** ride the #934 gateway —
sharing a production, RBAC-principaled data edge with a dev-only, absent-from-production surface
couples the two postures RFC-0001's decision sentence separates (RFC:491-493, `p2` F3) — but the
devtools contract **copies its shape discipline**: deny-by-default, enumerated procedures, no
bespoke Fresh seam, no direct service URLs. This is a recommendation, not a settled fact; it is
owner fork OQ-1 because two generated data planes is the duplication defect SYNTHESIS owner-fork 6
warns about.

## Live updates & streaming

No admin console surveyed models a push contract to contributed UI — Medusa's typed-prop flow is
request/response only (`m3` separation table, data-freshness row; research.md finding "the
streaming contract is net-new design", S-21). So this section is designed, not borrowed — but the
*primitives* are not new:

- **Server half exists and is unexported.** `packages/fresh/src/runtime/server/sse.ts` ships
  `createSSEStream(handler, options): Response`, `createKvWatchSSE`, `createKvPrefixWatchSSE`,
  `SSEController`, keepalive, and cleanup (**verified-here**: `deno doc` on that file) — but no
  barrel exports it and its only importer is its own test (**verified-here**:
  `rtk grep -rln "createSSEStream|createKvWatchSSE" packages/ plugins/` → `sse.ts`, `sse_test.ts`
  only; `packages/fresh/deno.json` exports list has no sse path). Promoting it to the public
  surface is a **named framework-source slice** (WSL Codex lane per CLAUDE.md), not new design.
- **Client half has a shipped precedent.** `createNetScriptStreamEventSourceV1`
  (`packages/fresh/src/runtime/streams/create-stream-event-source.ts:48`) is a named-event,
  schema-validated SSE consumer with opaque replay offsets and a reconnect-cursor seam — the
  devtools feed client copies this shape.

The net-new contract:

```ts
/** `<pluginId>:<topic>` or `netscript:<topic>` — TanStack's namespacing law (m2 F8), enforced. */
export type DevtoolsTopic = `${string}:${string}`;

export interface DevtoolsEvent<TPayload = unknown> {
  readonly topic: DevtoolsTopic;
  /** Opaque resume cursor, carried as SSE id → Last-Event-ID on reconnect (streams-offset idiom). */
  readonly cursor: string;
  readonly at: string; // ISO-8601
  /** Present when the producing span carried netscript.correlation.id. */
  readonly correlationId?: string;
  /** Query-key prefixes this event invalidates (see Caching). */
  readonly invalidates?: readonly (readonly unknown[])[];
  readonly payload: TPayload;
}

export interface DevtoolsEventFeed {
  subscribe(topics: readonly DevtoolsTopic[], onEvent: (e: DevtoolsEvent) => void): () => void;
  /** queue-until-connected, bounded retry, then latch silent-off — TanStack's genuinely
   *  load-bearing connection semantics (m2 F8), adopted; the transport triple-stack is not. */
  readonly state: 'connecting' | 'live' | 'reconnecting' | 'latched-off';
}
```

Feed laws: heartbeat keepalive (the `sse.ts` primitive already owns this); per-topic volume caps
(`limitPerPlugin`-shaped, ~8 lines, `m2` F15); events are facts about the runtime, never commands;
a plugin produces events only under its own `pluginId:` prefix. Producer side: framework topics are
emitted by the DevTools server itself (KV-watch over runtime registries via `createKvPrefixWatchSSE`;
telemetry-derived topics by bounded server-side polling of `TelemetryQueryPort` — polling interval
is a host config, since Aspire exposes no push API in this repo's surface, `r5` F10-11,
`inference`: no push endpoint appears in the adapter surface at
`packages/telemetry/src/adapters/aspire-query/aspire-telemetry-query.ts:48,143-154`). The #1446
SSE change feed (C1/C5: `{epoch, snapshotHash}`) is bridged server-to-server into
`netscript:automation-*` topics **once its slices land and auth permits** (see next section).

### Caching and invalidation

- Client caching rides TanStack Query through the existing `@netscript/fresh/query` subpath
  (`packages/fresh/deno.json` exports, **verified-here**) — no second cache. Keys are
  `['devtools', procedureId, input]`; stable, enumerable, and — per RFC-A — allowed to be visible:
  partitions are the one deliberately-inspectable value class (rfc:1117-1119).
- Invalidation is **event-driven**: `DevtoolsEvent.invalidates` maps topics to key prefixes; the
  feed client calls the query cache's prefix invalidation. Polling fallback per panel with a
  visible staleness indicator.
- **Every panel renders its data provenance**: `resolveTelemetryEndpoint` already reports its
  resolution `source` (`explicit`/`netscript_env`/`aspire_port`/`default`,
  `packages/mcp/src/domain/telemetry-endpoint.ts:22-39`, `r5` F22) — surfacing it is exactly the
  "where is my data coming from" affordance, and it fixes by construction the shipped drift where
  the scaffolded telemetry template hand-rolls a *second, disagreeing* endpoint policy
  (`r5` drift 1-2 — the "reimplement rather than consume" trap this design exists to end).

### OTel correlation

- **Join keys, both consumed**: `netscript.correlation.id` for cross-primitive journeys
  (`packages/telemetry/src/domain/telemetry-convention.ts:54-56`, `r5` F13) and — staged — the
  automation execution id, which RFC-0001 guarantees is shared between spans and history records
  (RFC:461-464, `p2` F9/C6).
- The devtools contract's journey procedure takes a `correlationId`, fans out server-side over
  `querySpans`/`queryLogs` filtered on the attribute, and returns a primitive-grouped causal
  chain — honoring #400's flow ≠ waterfall acceptance line (`b1` F3 via research.md F8): no span
  bars, no gantt. For waterfalls the panel **deep-links out** using the verified Aspire grammar
  (`/traces/detail/{traceId}?spanId=`, `/structuredlogs/resource/{n}?traceId=&spanId=&logLevel=`,
  `m4` F6-11 via research.md F6), built from `Dashboard:Frontend:PublicUrl`, never hardcoded
  localhost (`m4` F17-18). The typed deep-link helper is the corpus's named "obvious, small,
  high-value first slice" (SYNTHESIS S-19) — it is `DevtoolsDeepLinks` in the context above.
- The DevTools surface's **own** outbound queries default to *not* emitting spans into the same
  dashboard they render (observer effect); `propagateTraceContext` exists on the baseline client
  options (`packages/sdk/src/ports/service-client.ts:203-222`, `p3` F3) if the owner prefers
  tagged-and-visible instead — recorded as OQ-5.

## Auth propagation and its blocking dependency

**The hard fact:** `createServiceClient` cannot send `Authorization` or `x-api-key` today —
`CreateServiceClientOptions` is a closed nine-field record and `ServiceClientContext` a closed
transport-knob interface (`packages/sdk/src/ports/service-client.ts:129-155,203-222`, `p3` F3;
`b2` F10 via research.md F15). Auth propagation is therefore blocked on the RFC-A chain: FCP close
(earliest 2026-08-15) → #1350 → **an unfiled metadata child** (FCP disposition 6) → #1351 stable
oRPC v1.15.0 family move → #1349 client seam → #1352 auth dogfood — all milestone `0.0.7`
(`p3` F12-F13). Bypassing the SDK to hand-roll headers is exactly the duplication the charter
forbids and would be the second SDK extension mechanism RFC-A's boundary sentence exists to
prevent.

**Design response — stage by principal requirement, not by feature:**

| Stage | Panels | Principal needed | Gate |
| --- | --- | --- | --- |
| v1 (ships with the DevTools RFC's first implementation wave) | Telemetry (traces/logs/metrics/resources), framework state (doctor, runs, endpoint directory, export surfaces, OpenAPI explorer via projection), plugin read procedures on **unprotected** dev routes, KV-watch live registries | None. Server-side Aspire API key, if any, is held by the host (`AspireTelemetryQueryOptions` accepts it, `r5` F11) and never reaches the browser | Dev-only host posture (T6's boundary); same-origin |
| v2 (credentialed) | Plugin read procedures on protected routes; any panel whose context declares `auth` | Yes — RFC-A bearer contribution with caller-supplied token getter (rfc:178-206, `p3` F4) | **#1352** lands (`0.0.7`), plus the unfiled metadata child being filed |
| v3 (automation) | Audit, execution history, convergence status, journey↔execution joins | Yes — management API requires an authenticated principal; RBAC is role-per-action enforced in the lifecycle engine (RFC:424-428, `p2` F10/C8) | #1446 slices A2b + A3b + A2d land (P-6's own entry criterion, RFC:638) **and** the v2 gate |

Propagation model once unblocked: the **DevTools server is the caller** in RFC-A's sense — the
route handler resolves the dev principal (auth plugin session) server-side and supplies the
composed context per call (rfc:276-296, `p3` F8); panels never see a token, a token getter, or a
context object with credentials. DevTools reads use the `viewer` role; it cannot invent a
diagnostics-only bypass because enforcement is server-side (`inference` in `p2` F10, adopted here
as a constraint). Cache partitions for principal-scoped queries follow RFC-A's law: non-secret
epoch identifiers, never tokens/emails (rfc:201-206), and they are the visible-by-design value in
the cache inspector (rfc:1117-1119). Whether "dev management affordances" ever means *mutations*
through DevTools is not a T5 decision — it is OQ-2, inheriting `p2` OQ9.

## What we consume vs build

| Surface | Consume / Build | Evidence |
| --- | --- | --- |
| `TelemetryQueryPort` (7 methods) + `createTelemetryQuery` | **Consume** as the telemetry read model, server-side | `packages/telemetry/src/ports/telemetry-query-port.ts:15-79`; `packages/telemetry/query.ts:53` (`r5` F10) |
| MCP `ToolFlow`s + `ToolKind` + input/output schemas | **Consume in-process**, read-kind allowlist | **verified-here** `deno doc packages/mcp/mod.ts`; `tool-types.ts:32`; `tool-contracts.ts:353,361` (`r5` F17-18) |
| `@netscript/mcp/openapi-projection` (pure, IO-free) | **Consume** for the API-explorer panel — no MCP process needed | `packages/mcp/openapi-projection.ts:1-38` (`r5` F21) |
| `resolveTelemetryEndpoint` four-arm policy | **Consume**, server-side only; surface its `source` | `packages/mcp/src/domain/telemetry-endpoint.ts:22-39` (`r5` F22) |
| `ServiceEndpointDirectoryPort` (identity-bound run manifest) | **Consume** as the only serviceName→origin resolver | `service-endpoint-directory.ts:53-58`; run-manifest identity gate (`r5` F19-20) |
| `createSSEStream` / `createKvWatchSSE` / `createKvPrefixWatchSSE` | **Consume — after a promotion slice**: exists, unexported, zero importers outside its test | **verified-here** `deno doc` + grep; `packages/fresh/deno.json` exports |
| `createNetScriptStreamEventSourceV1` shape (named events, opaque offsets, reconnect cursor) | **Consume the shape** for the feed client | `create-stream-event-source.ts:16-48` (**verified-here**) |
| RFC-A vocabulary: `{family, major}`, namespaced ids, duplicate rejection, static references | **Consume the vocabulary**, never the unmerged symbols | rfc:1179-1187 (`p3` F13) |
| #1446 contracts: management oRPC, audit, history, convergence SSE feed, OTel names | **Consume, staged** (v3 table above); bridge the change feed server-to-server | RFC:479-487, 283-285, 465-474, 300-379 (`p2` C1-C6) |
| Aspire/Scalar deep-link URL grammars | **Consume grammar; build the typed helper** (first slice) | `m4` F6-11, F17-18; absence: `r5` F8-9 |
| TanStack Query via `@netscript/fresh/query` | **Consume** as the only client cache | `packages/fresh/deno.json` exports (**verified-here**) |
| Devtools oRPC contract (enumerated procedures, error codes) | **Build** (net-new) | this pack |
| `DevtoolsServerPanelContext` / `DevtoolsClientPanelContext` | **Build** (net-new — the seam RFC-A licenses but does not define, `p3` F8/F14) | this pack |
| `DevtoolsEventFeed` + topic/cursor/invalidation contract | **Build** (net-new — no market precedent exists, `m3` data-freshness row) | this pack |
| `DevtoolsProcedureReference` manifest axis + generated static registry | **Build**, mirroring rfc:1136-1176 discipline; generic reference collection stays #1093's (`p3` F7) | this pack |

## Rejected, with reasons

1. **Exposing MCP over HTTP/SSE.** Puts `execute_command`/`record_drift` a CORS mistake away from
   the browser; contradicts the Aspire 13.3 human-UI/agent-API split (`m4` F15); creates a second
   MCP transport to version forever. In-process composition delivers the same flows with a
   host-controlled read-only allowlist (**verified-here**: flows are public API).
2. **A generic proxy procedure ("fetch this service path for me").** The definitional confused
   deputy: caller-chosen target + server-held authority (Aspire API key, future principal). The
   closed procedure vocabulary is the entire mitigation; one URL-shaped input reopens it.
3. **Riding the #934 gateway as the DevTools data edge.** Sufficiency is scoped to Surface 1 "for
   this surface only" (RFC:503-508); coupling a production RBAC edge to an
   absent-from-production surface merges what RFC-0001's decision sentence separates. Held as a
   *recommendation* pending OQ-1, because the counter-argument (two generated data planes ≈
   duplication) is real.
4. **WebSocket / bidirectional event channel.** The panel-to-server direction is precisely where
   TanStack's channel became privileged (`install-devtools`, `m2` F10). SSE + named POST
   procedures gives the same capability with the dangerous direction structurally absent.
5. **MessagePort / in-process browser transport.** Normatively rejected by RFC-A for the SDK
   (rfc:983-998); a MessagePort seam needs its own RFC (#451 territory, `p3` F11). Desktop DevTools
   inherits this as a later, separate question.
6. **A network-inspector panel on the SDK seam.** RFC-A has no response hook
   (`SdkClientRequestPatch` is headers-only, rfc:436-438) and forbids recording header
   values/input/context even in debug (rfc:1091-1110). A request-level inspector needs a different,
   future seam — deferred explicitly rather than smuggled in.
7. **Hand-rolled auth headers / SDK bypass.** The charter's duplication ban plus RFC-A's boundary;
   also strictly worse than waiting: #1352 delivers the dogfooded bearer path (`p3` F12).
8. **A second telemetry-endpoint policy or hand-rolled OTLP parsing in panels.** Already shipped
   once as drift (`r5` drift 1-2); the port and the four-arm resolver are the law.
9. **Panel-visible endpoint origins.** `endpoints` in the server context is names/sources/conflicts
   for *display*; origin strings never cross into client context — removing them removes the
   temptation the arbitrary-URL rule exists to police.

## Open questions for the owner

- **OQ-1 — #934 gateway for v3 automation reads?** T5 recommends a separate dev-only data edge
  (shape-copied, not shared). If the owner weighs the two-data-planes duplication more heavily,
  the v3 stage would consume the gateway instead; nothing in v1/v2 changes. (RFC:503-508;
  SYNTHESIS owner-fork 6.)
- **OQ-2 — Do "dev management affordances" include mutations through DevTools, and under which
  RBAC role?** T5 v1 is read-only by construction (`kind: 'read'` on references; read-kind MCP
  allowlist). Inherits `p2` OQ9 unresolved.
- **OQ-3 — Ratify the staging**: principal-less v1 now; credentialed v2 blocked on #1352 (`0.0.7`)
  plus the *unfiled* metadata child (FCP disposition 6 — a load-bearing dependency with no issue
  number, `p3` drift 4); automation v3 additionally blocked on A2b/A3b/A2d. If the owner wants
  credentialed panels sooner, the only honest lever is accelerating #1348's children, not a
  DevTools-side workaround.
- **OQ-4 — SSE primitive promotion**: export `sse.ts` from `@netscript/fresh/server` (framework
  source → WSL Codex slice) vs. vendoring into the DevTools host package (duplication). T5
  recommends promotion.
- **OQ-5 — Observer effect**: suppress DevTools' own outbound-query telemetry (default proposed)
  or emit tagged spans for meta-debugging.
- **OQ-6 — Mutate-tool opt-in grammar**: if any mutate-kind flow is ever bound (e.g. a future
  "record drift from DevTools"), what is the per-contribution opt-in + audit shape? Not needed for
  v1; naming it prevents it arriving ungoverned.

## Sources

Corpus (this run, `research/`): `p3-rfc-1390-sdk.md` (F3-F14, drift 4), `r5-observability-boundary.md`
(F8-F25, drift 1-2, C-table), `p2-rfc-1446-runtime-automation.md` (F2-F11, C1-C9, OQ2/OQ9),
`m1-nuxt-vite.md` (F5-F9, D3-D4, applicability verdict), `m2-tanstack-grafana.md` (F6-F23,
adopt/adapt/decline tables), `m3-admin-consoles.md` (M-7, separation table data-freshness row),
`research.md` (F4, F5, F15, F23-F25; resolved decisions R3-R5), `research/SYNTHESIS-NOTES.md`
(S-5, S-13, S-14, S-19, S-21, S-22; owner forks 6, 13, 14, 24).

Commands run in this session (baseline worktree, read-only):

- `NO_COLOR=1 deno doc packages/mcp/mod.ts` — public flow factories (in-process MCP verdict).
- `NO_COLOR=1 deno doc packages/fresh/src/runtime/server/sse.ts` — `createSSEStream`,
  `createKvWatchSSE`, `createKvPrefixWatchSSE`, `SSEController`, keepalive/cleanup docs.
- `NO_COLOR=1 deno doc packages/fresh/src/runtime/streams/create-stream-event-source.ts` —
  `createNetScriptStreamEventSourceV1` + the same-origin auth-header note.
- `rtk grep -rln "createSSEStream|createKvWatchSSE" packages/ plugins/` → only `sse.ts` +
  `sse_test.ts` (unexported/unconsumed proof).
- `sed -n 1,24p packages/fresh/deno.json` — export map (no sse path; `./query`, `./streams`
  present).

Key baseline paths cited: `packages/sdk/src/ports/service-client.ts:129-155,203-222`;
`packages/telemetry/src/ports/telemetry-query-port.ts:15-79`;
`packages/telemetry/src/domain/telemetry-convention.ts:54-56`;
`packages/mcp/src/domain/tool-types.ts:3-58`; `packages/mcp/src/domain/tool-contracts.ts:353,361`;
`packages/mcp/src/domain/telemetry-endpoint.ts:22-39`;
`packages/mcp/src/application/service-endpoint-directory.ts:53-58`;
`packages/mcp/openapi-projection.ts:1-38`; `packages/fresh/src/runtime/server/sse.ts`;
`packages/fresh/src/runtime/streams/create-stream-event-source.ts:16-48`;
`packages/fresh/deno.json`.
