# `telemetry-revamp` — epic + sub-issue drafts (Opus-B)

> ## ⚠️ MILESTONE AUTHORITY — reconciled 2026-07-05 (post-ratification)
>
> **GitHub milestones are the single source of truth for this roadmap.** This doc was authored with
> topic-local milestone estimates *before* the owner-ratified **beta.3 / beta.4 re-forecast**
> (recorded in [`BETA34-FORECAST.md`](../../BETA34-FORECAST.md)). Since then:
>
> 1. **Every milestone now exists.** `0.0.1-beta.1`…`0.0.1-beta.8` + `0.0.1-stable` are all live.
>    beta.1 (2026-07-03) and beta.2 (2026-07-04) have **shipped**; **beta.3 is the next cut**, then
>    beta.4. Any "milestone does not exist yet / owner must create it" note below is **obsolete**.
> 2. **Live train (authoritative):** **beta.3** = deploy compose + deploy-e2e gate + issue-closure
>    guardrail + workers health-check fix (#393 / #394 / #387 / #376) · **beta.4** = AI flagship
>    parity + doctrine backstop (#388 / #459) · **beta.5** = telemetry T1/T2 + road-to-stable
>    S2/S4/S5/S6 + deploy S9–S12 + AI anchor #219 · **beta.6** = dashboard DDX + telemetry T3–T8 +
>    AI generative-UI/MCP · **beta.7** = AI depth seams + docs cut · **beta.8** = desktop ·
>    **stable** = deferred tail. (This topic's T1/T2 sit at **beta.5**, T3–T8 at **beta.6**, matching
>    the live train.)
>
> **Where a milestone tag in the body below differs from the issue's current GitHub milestone,
> GitHub wins.** Do not re-file or re-milestone from this doc without checking the live issue first.

Draft text only — no gh mutations. Owner files at ratification, after the two missing milestones
(`0.0.1-beta.5`? / `0.0.1-beta.6`) exist (Stage-C owner-fork #1). Labels per `netscript-pr`; milestone
mapped from `wave:`. Beta.5 = restructure/convention begin; beta.6 = dashboard-enabling parity; stable
= AI OTel adapter + cross-language Flow A + rich views.

---

## EPIC — `telemetry-revamp` (enabler half of Spine-1)

- **Type:** `type:umbrella` · **Labels:** `epic:telemetry-revamp`, `area:telemetry`, `priority:p1`,
  `status:plan` · **Milestone:** `0.0.1-beta.6` (the cut it lands in). **No closing keyword** (umbrella
  closes by hand when children done).
- **Parent:** Spine-1 (co-lands with the `dev-dashboard` epic, Opus-A). Ref the road-to-stable
  umbrella (#301) with `Part of #301`.
- **Problem.** Telemetry is a rich but internally-inconsistent package (forbidden `core/`, orphan
  module, no OTEL-adapter subpath), plugin instrumentation ranges A→F (workers ref; streams/ai from
  zero), a real W3C-parenting bug severs trigger traces, real span-links exist in exactly one place,
  and there is no typed query/export surface for the dashboard to consume. The dashboard (headline)
  cannot ship a trustworthy trace view until this enabler lands.
- **Outcome.** A framework-wide telemetry convention (TC-1..14), a doctrine-clean ports/adapters
  package with `./otel` + `./query` subpaths, every first-party plugin at TC-conformance, real fan-in
  span-links, the triggers bug fixed, a real (non-mocked) grouped-trace e2e assertion suite, and a
  NetScript-owned `@netscript/telemetry/query` contract the dashboard codes against.
- **Non-goals.** Baggage propagation (semconv Candidate only); dual-writing to an external backend
  (that's the app's OTLP-exporter choice); the Aspire resource-graph "what's running" surface (Opus-A/
  Aspire seam owns it).
- **Acceptance (epic-level).** All child issues closed; `scaffold.runtime` e2e green including the new
  `BEHAVIOR_OTEL_TRACES` Flow-B assertions; `deno doc --lint` clean on the full export set; the
  arch-debt Refactor entry for `packages/telemetry` closed with F-3/F-5/F-6 evidence; Opus-A's
  dashboard consuming `@netscript/telemetry/query`.

Design source: `design/B-telemetry/proposal.md`.

---

## Sub-issues

Each: scope · acceptance · labels · milestone · deps. IDs are draft handles (T1..T9), not GitHub #s.

### T1 — Framework-wide telemetry convention (TC-1..14) + attribute-namespacing law
- **Scope.** Author the TC-1..14 conformance checklist (proposal §1) as the doctrine/standards
  artifact plugins are graded against; land the central `SpanNames` extension + `createXAttributes`
  builders + the `netscript.*` single-root namespacing with a one-beta deprecated-alias `dup` window;
  wire `OTEL_SEMCONV_STABILITY_OPT_IN`. No behavior change to consumers yet — this is the contract.
- **Acceptance.** Checklist published; builders cover job/messaging/saga/trigger/execution/genai;
  namespacing law encoded in `domain`; alias window documented; convention referenced by every
  downstream parity issue's acceptance.
- **Labels.** `type:feat`, `area:telemetry`, `epic:telemetry-revamp`, `priority:p1`, `wave:v1`,
  `status:plan`. **Milestone** `0.0.1-beta.5`. **Deps:** none (foundational).

### T2 — Package ports/adapters restructure (close the arch-debt Refactor)
- **Scope.** Proposal §2: kill forbidden `core/` (→ `domain`/`application`), delete orphan
  `src/public/mod.ts`, give `./registry` a real facade (or fold + drop the dup subpath), complete the
  `mod.ts` barrel, add the dedicated **`./otel`** adapter subpath (housing `adapters/otel-deno` +
  `adapters/otel-sdk`) and the **`./query`** subpath scaffold, add a `testing/` in-memory recorder,
  fix `workspace-mutator.ts` JSR rewrite-map to include all subpaths, validate env config with
  Standard Schema, resolve the dead `instrumentation/sse.ts`.
- **Acceptance.** No forbidden role folders; layering imports clean (`application` never imports
  `adapters`); `deno doc --lint` clean on the FULL export set; `deno publish --dry-run` green; arch-
  debt Refactor entry closed with F-3/F-5/F-6 evidence; existing consumers still compile (subpath
  compat preserved).
- **Labels.** `type:refactor`, `area:telemetry`, `epic:telemetry-revamp`, `priority:p1`, `wave:v1`,
  `gate:jsr`, `status:plan`. **Milestone** `0.0.1-beta.5`. **Deps:** T1 (namespacing lands in
  `domain`). Fixes/Closes the tracked `packages/telemetry` Refactor arch-debt entry.

### T3 — Thin-vs-SDK provider adapters + decouple `enabled` from `OTEL_DENO`
- **Scope.** Proposal §3: implement `ports/TracerProviderPort|PropagatorPort|MeterPort|SpanLinkPort`;
  `adapters/otel-deno` (default, zero SDK dep) + `adapters/otel-sdk` (opt-in `@opentelemetry/sdk-
  trace-*` + HTTP-OTLP, `supportsLinkAttributes=true`, flush-on-exit); composition-root provider
  selection via `NETSCRIPT_TELEMETRY_PROVIDER`; `enabled = OTEL_DENO || NETSCRIPT_TELEMETRY_ENABLED ||
  providerRegistered`; wire the `InstrumentationRegistry` as the real composition seam.
- **Acceptance.** Default build stays zero-runtime-dep (SDK is opt-in, not in the default graph —
  `deps:prod-install` proves it); SDK adapter produces attribute-bearing links + flushes observable
  meters on exit; `enabled` no longer hard-gated on `OTEL_DENO` (unit-tested both ways).
- **Labels.** `type:feat`, `area:telemetry`, `epic:telemetry-revamp`, `priority:p1`, `wave:v1`,
  `status:plan`. **Milestone** `0.0.1-beta.6`. **Deps:** T2 (needs the adapters/ports skeleton).
  **Load-bearing for** T5/T6.

### T4 — W3C propagation hardening + triggers W3C-parenting bugfix
- **Scope.** Proposal §5 + §4-triggers. Fix the tracestate-drop in the `extractContext` fallback (+
  test); validate version byte; **fix `create-trigger-ingress.ts` `#processAndRecord` to thread the
  captured `event.traceparent`/`tracestate` as parent context** so ingress→detect→process share one
  trace; add the SERVER ingress span; wire the dormant `TriggerInstrumentation` core; converge the
  triggers runtime off its private `getTracer('@netscript/triggers')` onto the shared facade (TC-13).
- **Acceptance.** Regression test: trigger ingress span and process span share `traceId` (would have
  caught the bug); tracestate round-trips; triggers uses the shared facade; `plugin-triggers-core`
  telemetry passes TC-1..-9.
- **Labels.** `type:fix`, `area:telemetry`, `area:plugins`, `epic:telemetry-revamp`, `priority:p1`,
  `wave:v1`, `status:plan`. **Milestone** `0.0.1-beta.6`. **Deps:** T1, T2. **Correctness bug — on the
  Flow-B critical path.**

### T5 — Real span-links for fan-in (streams + sagas cascade)
- **Scope.** Proposal §4-streams/§4-sagas/§5. Promote the database Prisma `addLinks`/`linkIds` pattern
  into the shared `SpanLinkPort` + `application` `createFanInLinks(messages)`; **streams from zero**:
  PRODUCER span + link-injection on publish, CONSUMER span + fan-in links on subscribe; **sagas**:
  converge off the private tracer, lift the 7 meter instruments into shared (TC-11), make the facade
  real-by-default, replace the test-mock "fan-in links" with real attribute-bearing links.
- **Acceptance.** Streams emits PRODUCER/CONSUMER spans with real links (attributes present under the
  SDK adapter); sagas cascade join carries real links (not mock no-ops); `db` link helper reused, not
  re-hand-rolled; both pass TC-14.
- **Labels.** `type:feat`, `area:telemetry`, `area:plugins`, `epic:telemetry-revamp`, `priority:p1`,
  `wave:v1`, `status:plan`. **Milestone** `0.0.1-beta.6`. **Deps:** T1, T2, T3 (needs SDK adapter for
  link attributes).

### T6 — services/oRPC span-creation fix + AI port invocation (kill the two silent no-ops)
- **Scope.** Proposal §4-services/§4-ai (beta.6 half). **oRPC:** make `TracingPlugin` create an
  INTERNAL/SERVER span when none is active (no longer silently inert), align `rpc.*` to semconv RC +
  shared `SpanNames`, add the missing client-side CLIENT span in `packages/sdk` service-client.
  **AI:** invoke the injected `TelemetryPort` in `packages/ai/src/runtime/mod.ts` with a minimal real
  span so the seam is live (F→C). workers: lift metrics via TC-11, resolve the `createJobTools` no-op.
- **Acceptance.** oRPC hop produces a span even with Deno HTTP auto-instr off (unit + Flow-B e2e);
  `channelClient` callback appears in the Flow-B trace; AI runtime emits at least one real span through
  the port; workers has metrics.
- **Labels.** `type:fix`, `area:telemetry`, `area:service`, `area:sdk`, `area:plugin-ai`,
  `epic:telemetry-revamp`, `priority:p1`, `wave:v1`, `status:plan`. **Milestone** `0.0.1-beta.6`.
  **Deps:** T1, T2. oRPC fix on the Flow-B critical path.

### T7 — Dashboard query/export surface (`@netscript/telemetry/query`)
- **Scope.** Proposal §7. Generalize the `telemetry-trace.ts.template` reader into `application/query`
  + `adapters/aspire-query` over Aspire `/api/telemetry/*` (traces/traces/{id}/logs/spans/resources,
  `?follow` NDJSON, `?resource` filter); the typed `TelemetryTrace`/`TelemetrySpan`/`TelemetryLog`/
  `TelemetryResource` contract; robust ephemeral-endpoint + api-key discovery (shared resolver);
  graceful `--no-aspire`/prod degradation; `exportTraces` → portable OTLP-JSON.
- **Acceptance.** `@netscript/telemetry/query` exports the typed reader; resolves the live Aspire base
  URL in the scaffold.runtime e2e; returns grouped `TelemetryTrace` by ID; degrades cleanly with no
  local Aspire; Opus-A's dashboard data layer can switch onto it (co-land handshake).
- **Labels.** `type:feat`, `area:telemetry`, `area:aspire`, `epic:telemetry-revamp`, `priority:p1`,
  `wave:v1`, `status:plan`. **Milestone** `0.0.1-beta.6`. **Deps:** T2 (subpath). **Co-lands with the
  dashboard epic (Opus-A).**

### T8 — Real (non-mocked) grouped-trace e2e assertions — Flow B
- **Scope.** Proposal §6. Generalize `otel-gates.ts` `BEHAVIOR_OTEL_TRACES` into the Flow-B assertion
  suite run under `scaffold.runtime`: single trace_id across all processes; parent/child edges
  (enqueue→dequeue, job.execute child of dispatch, callback child of job.execute); fan-in link present;
  no severed/fresh-trace (triggers regression guard); attribute floor (correlation.id + outcome). Wire
  a real streams consumer for the fan-in leg (do not rely on eis-chat's inert scaffold).
- **Acceptance.** The suite runs against real processes + the real Aspire API (no span mocks) and is
  green; each assertion maps to a TC; failure of the oRPC/triggers fixes would make a named assertion
  red (proving the guard bites).
- **Labels.** `type:test`, `area:telemetry`, `area:cli`, `epic:telemetry-revamp`, `priority:p1`,
  `wave:v1`, `gate:e2e`, `status:plan`. **Milestone** `0.0.1-beta.6`. **Deps:** T4, T5, T6, T7 (asserts
  their behavior). **Merge-gate for the epic.**

### T9 — AI OTel adapter (GenAI semconv) + rich AI trace views — STABLE
- **Scope.** Proposal §4-ai (stable half) + §6 Flow A. Full `TelemetryPort` OTel adapter: GenAI-semconv
  spans (`chat <model>`/`execute_tool`, `gen_ai.*`, token-usage observable metrics) gated behind
  `gen_ai_latest_experimental`; the cross-language Flow-A duckdb hop (Deno-side `Deno.Command` span +
  `TRACEPARENT` inject + the per-language trace shim, proposal §5); confirm/wire MCP HTTP-transport
  traceparent propagation; rich AI trace views coordinated with the dashboard.
- **Acceptance.** AI spans conform to GenAI semconv (names verified against the semantic-conventions
  repo); token metrics flush on exit (SDK adapter); duckdb hop is a real span in the parent trace; MCP
  hop propagates W3C (or explicit injection wired); AI views land in the dashboard.
- **Labels.** `type:feat`, `area:telemetry`, `area:plugin-ai`, `area:ai-core`, `epic:telemetry-revamp`,
  `priority:p2`, `wave:defer`, `status:plan`. **Milestone** `0.0.1-stable`. **Deps:** T3, T6.

---

## Dependency DAG

```
T1 (convention) ──┬─→ T2 (restructure) ──┬─→ T3 (adapters/enabled) ──┬─→ T5 (fan-in links) ─┐
                  │                       ├─→ T4 (W3C + triggers bug) ┤                      │
                  │                       ├─→ T6 (oRPC + AI-invoke)   ┤                      ├─→ T8 (real e2e) ──▶ EPIC merge-gate
                  │                       └─→ T7 (query/export) ──────┘                      │
                  └──────────────────────────────────────────────────────────────────────────┘
                                              T3, T6 ─────────────────────────────────────────▶ T9 (AI adapter + Flow A, STABLE)
```

Critical path to beta.6: **T1 → T2 → T3 → T5 → T8** (fan-in links need SDK adapter need restructure).
T4/T6/T7 parallelize after T2 (T5/T7 gate on T3 for the SDK adapter / subpath respectively). T8 is the
epic merge-gate; T9 is the stable tail.

## Milestone rollup
- **beta.5:** T1, T2 (convention + restructure land first; low behavioral risk).
- **beta.6:** T3, T4, T5, T6, T7, T8 (the parity + query + real-e2e that power the dashboard).
- **stable:** T9 (AI OTel adapter + cross-language Flow A + rich views).
