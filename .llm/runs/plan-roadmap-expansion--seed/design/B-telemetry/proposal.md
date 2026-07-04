# Topic B — Telemetry production-grade revamp: design proposal (Opus-B deep-dive)

**Epic:** NEW `telemetry-revamp` (enabler half of Spine-1) · **Milestones:** beta.5 (begin) → beta.6
(powers the dashboard) → stable (AI OTel adapter + rich views + cross-language Flow A) · **Kind:**
refactor + first-instrumentation + bugfix + new query surface.

This is the depth layer. It validates/sharpens the Stage-C working positions
(`analysis/FABLE-STAGE-C-SYNTHESIS.md`) with file-level evidence from the B corpus and read-only
source inspection of `packages/telemetry/**`, the plugin instrumentation, and the eis-chat reference.
Revamp, don't greenfield — the package is rich; every proposal maps to existing modules.

Evidence base (cited inline by short name): `surface` =
`analysis/B-telemetry/telemetry-package-surface.md`; `grading` =
`analysis/B-telemetry/plugin-instrumentation-grading.md`; `debt` =
`analysis/B-telemetry/arch-debt-and-doctrine-constraints.md`; `pipeline` =
`analysis/B-telemetry/eis-chat-real-pipeline-map.md`; `polyglot` =
`analysis/B-telemetry/native-polyglot-and-aspire-orchestration.md`; `semconv` =
`research/B-telemetry/otel-semconv-w3c-state-of-art.md`; `aspire-api` =
`research/B-telemetry/aspire-otlp-ingestion-and-query-api-landscape.md`; `oq` =
`context/B-telemetry/open-questions.md`; `seam-A` = `context/A-dashboard/01-telemetry-consumer-seam.md`.

---

## 0. Design headline (what is locked here)

1. **Convention** = TC-1..TC-14 conformance checklist below: dot-hierarchy span names, correct
   SpanKind, **two-tier attribute namespacing** (OTel semconv keys verbatim where a domain exists;
   everything proprietary under a single `netscript.*` root), mandatory W3C in/out, mandatory
   status+exception, per-domain metric instruments in the shared layer, redaction-by-default, and
   **consume the shared facade — never reimplement a private tracer**.
2. **Restructure** = doctrine ports/adapters split closing the tracked "Refactor" arch-debt: kill
   the forbidden `core/`, delete the orphan `src/public/mod.ts`, give `./registry` a real facade,
   and add the **dedicated `./otel` adapter subpath** + a new **`./query` subpath** (dashboard
   surface). Target module/export map in §2.
3. **Thin-vs-SDK fork RESOLVED → adapter-supports-both, default-thin, SDK opt-in on the fan-in
   subsystem.** The ports/adapters split (mandated anyway) hosts a default Deno-native provider
   adapter AND an opt-in `@opentelemetry/sdk-trace-*` (HTTP-OTLP) adapter. The SDK adapter is
   **beta.6-load-bearing for streams/sagas fan-in** because Deno-native links cannot carry
   attributes (`semconv` §5 collides with the fan-in link requirement `semconv` §3). Decouple
   `enabled` from `OTEL_DENO`. Justification in §3.
4. **Grouped-trace flow = two-tier, confirming Stage-C:** beta.6 flagship = **Flow B** (framework-
   native multi-process KB-ingestion pipeline); stable tail = **Flow A** (cross-language `duckdb.exe`
   hop). Sharpened in §6 with the open verifications closed and real (not mocked) e2e assertions.
5. **Query/export contract** offered to Opus-A in §7: a NetScript-owned typed reader over Aspire
   `/api/telemetry/*` (the `aspire otel` CLI path is broken per tracked debt `debt` §1) — the
   dashboard codes against `@netscript/telemetry/query`, never raw Aspire JSON.

---

## 1. Framework-wide telemetry convention (the conformance checklist)

The convention is a **fitness checklist** every telemetry-producing package/plugin must satisfy,
scored the way `grading` scores plugins today. `workers` is the reference that already passes; the
per-package plan (§4) is "bring everyone to TC-conformance," not "copy workers file-by-file."

Grounding: OTel semantic conventions registry v1.42.0 (`semconv` §1), W3C Trace Context Rec-tier
(`semconv` §2), the messaging links model (`semconv` §3), and the `workers` reference implementation
(`grading` §workers). It also **fixes the three real convention violations the corpus found**: the
`TriggerAttributes`-only namespacing (`surface` §3, finding #7), the tracestate-dropped W3C bug
(`surface` §4), and the private-tracer drift in sagas/triggers (`grading` cross-cutting #2).

### Span identity & shape

- **TC-1 — Span name = `<domain>.<operation>` dot hierarchy**, drawn from a single central
  `SpanNames` map (extend the existing `src/attributes/spans.ts` — it already defines
  `queue.enqueue`, `job.execute`, `saga.handle`, `trigger.detect/process`). Two documented
  exceptions follow upstream semconv: **RPC** span name = `{rpc.method}` (`semconv` §1 RPC), **GenAI**
  span name = `chat <model>` / `execute_tool <name>` (`semconv` §1 GenAI). No ad-hoc string literals
  at call sites — this is what makes the dashboard's trace-tree labels stable.
- **TC-2 — SpanKind is explicit and correct:** `SERVER` on every ingress (inbound HTTP/webhook),
  `CLIENT` on every outbound call (RPC client, fetch, subprocess spawn), `PRODUCER`/`CONSUMER` on
  every messaging enqueue/dequeue/publish/subscribe, `INTERNAL` for pure compute. (Today
  `services/oRPC` creates no span at all and `triggers` ingress creates no SERVER span — both TC-2
  failures, §4.)
- **TC-3 — Status is always set:** `SpanStatusCode.OK` on success, `ERROR` on failure, and
  `recordException(err)` before `end()` on any caught error. The shared `withSpan` already does this
  (`surface` §2 `src/core/span.ts`); the rule is that every span goes through it. This closes the
  Deno-native gap "HTTP server spans not auto-errored" (`semconv` §5) at the application layer instead
  of relying on the runtime.
- **TC-4 — Lifecycle events:** emit `started` / `completed` / `failed` span events; state machines
  additionally emit `state.before` / `state.after` (the sagas pattern, `grading` §sagas). Events, not
  new spans, for sub-steps that do not cross a process/async boundary.

### Attributes — the two-tier namespacing law (kills finding #7)

- **TC-5 — Where an OTel semantic-convention domain exists, use its keys verbatim**, and gate
  emission behind the stability opt-in the domain requires:
  `OTEL_SEMCONV_STABILITY_OPT_IN=messaging,rpc,gen_ai_latest_experimental` (`semconv` §1). Concretely:
  `messaging.system` / `messaging.destination.name` / `messaging.operation.type`
  (`create|send|receive|process|settle`) / `messaging.batch.message_count` / `messaging.message.id`
  for queue/streams; `rpc.system` / `rpc.service` / `rpc.method` for oRPC; `gen_ai.provider.name` /
  `gen_ai.operation.name` / `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens` for AI (note
  the GenAI renames in `semconv` §1 — `gen_ai.system`→`provider.name`, `prompt_tokens`→`input_tokens`;
  read `semantic-conventions-genai/docs/gen-ai-spans.md` directly before locking names — `oq` #6);
  `db.*` for database; `http.*`/`server.*`/`error.type` for HTTP.
- **TC-6 — Everything proprietary lives under a single `netscript.*` root** with domain sub-spaces:
  `netscript.job.*`, `netscript.execution.*`, `netscript.saga.*`, `netscript.trigger.*`,
  `netscript.worker.*`, `netscript.correlation.id`, `netscript.durability.tier`,
  `netscript.idempotency.key`. This **replaces** today's inconsistency where only `TriggerAttributes`
  is prefixed (`netscript.trigger.*`) and every sibling family (`worker.*`, `job.*`, `scheduler.*`) is
  bare (`surface` §3). Migration: keep the bare keys as deprecated aliases for one beta, emit both
  under a `dup` window, then drop — mirrors OTel's own `messaging/dup` migration mechanism.
- **TC-7 — Required attribute floor per span:** a stable **identity** key (`*.id`), the
  `netscript.correlation.id`, an **outcome** (status + `error.type` on failure), and **attempt/retry**
  where the operation is retriable. Duration is span-implicit. Build attributes through the
  `createXAttributes` builder functions (extend the 3 that exist — `createJobAttributes`,
  `createMessagingAttributes`, `createTriggerAttributes` — to cover saga/execution/genai) so keys are
  never hand-typed.
- **TC-8 — Redaction by default:** no prompt text, PII, secrets, tokens, or raw subjects on spans.
  `captureContent=false` for GenAI (the eis-chat dashboard middleware already does this, `pipeline`
  §2a). Sensitive identifiers are hashed (the auth `hashSubject` HMAC-SHA-256 pattern, `grading`
  §auth) — promote `hashSubject`/`redactAuthPrincipal` into the shared layer as the canonical
  redaction helper.

### Propagation, metrics, enablement, facade

- **TC-9 — W3C in on ingress, W3C out on egress, always.** Extract `traceparent`+`tracestate` from
  inbound headers/env and parent the span; inject both on every outbound hop. **Never start a fresh
  trace when a parent context is present** — this is exactly the triggers bug (`grading` §triggers,
  §4). `tracestate` must never be dropped (fixes `surface` §4 fallback-path bug).
- **TC-10 — Subprocess propagation via the env-carrier convention:** on any `Deno.Command` spawn,
  set `TRACEPARENT`/`TRACESTATE` (+ `CORRELATION_ID`) env with OTel-Beta key normalization —
  uppercase, `^[A-Z_][A-Z0-9_]*$` (`semconv` §4). The framework already does this across 7 runtimes
  (`polyglot` §1, `createJobTraceEnv`); the convention makes it mandatory and standardizes the keys.
- **TC-11 — Per-domain metric instruments live in the shared layer.** Every domain facade exposes a
  duration histogram, an active gauge, and outcome counters. Today metrics are **inverted** from spans
  — sagas/triggers cores define 7 + 4 meter instruments that workers lacks, but they are unwired
  (`grading` cross-cutting #6). Lift them into the shared `application` layer so every consumer
  (including workers) gets metrics uniformly.
- **TC-12 — Enablement is decoupled from `OTEL_DENO`.** Spans/metrics code always runs; when
  telemetry is disabled the facade returns a no-op tracer (never a branch at the call site). `enabled`
  = `OTEL_DENO || NETSCRIPT_TELEMETRY_ENABLED || providerRegistered` (§3). This lets manual spans run
  under the SDK adapter with Deno auto-instrumentation off, and vice-versa (`oq` #9).
- **TC-13 — Consume the shared instrumentation facade; do NOT reimplement a tracer.** Sagas
  (`otel-saga-tracer.ts`) and triggers (`getTracer('@netscript/triggers')`) each hand-roll their own
  tracer today (`grading` cross-cutting #2); only workers consumes the shared facade. Convergence onto
  `@netscript/telemetry/instrumentation` is a hard conformance rule.
- **TC-14 — Links, not parent-child, for fan-in.** Any span that aggregates ≥2 upstream messages/
  traces (batch consume, streams fan-out subscriber, saga cascade join) attaches **span links at
  creation time** with per-message attributes (`semconv` §3). Today real links exist in exactly one
  place — the database Prisma bridge (`grading` §database); the sagas "fan-in links" are test-mock
  no-ops (`grading` §sagas). This TC is unsatisfiable on Deno-native links (attribute-less) → drives
  the SDK-adapter decision in §3.

A package is **TC-conformant** when it passes TC-1..TC-14 for every span it emits. The parity plan in
§4 is expressed as "raise plugin X to TC-conformance"; the real-e2e assertions in §6 are the machine
check that the flagship trace actually meets TC-2/-3/-7/-9/-14.

---

## 2. Package restructure — ports/adapters split + module/export map

The tracked arch-debt `packages/telemetry — doctrine verdict Refactor` ("Confirm port/adapter split
and expose OTEL adapter as a subpath export"; gates F-3/F-5/F-6; `debt` §1) **is** the mandate. The
package is Archetype 2 (Integration — wraps an external system behind ports/adapters) with an
Archetype 1 contract core. Current layout violations (`surface` §1, `debt` §2): forbidden `core/`
role folder, orphan `src/public/mod.ts`, `./registry` pointing straight at `src/runtime/mod.ts` with
no facade, role-vocabulary drift.

### Target folder map (doctrine roles only — `docs/architecture/doctrine/05`)

```
packages/telemetry/
  domain/        ← was src/core/types.ts (Span/Tracer/SpanKind/SpanStatusCode structural mirrors),
                   src/attributes/* (the const vocab + SpanNames + builder fns), config types.
                   Imports NO package implementation. This is the vendor-neutral contract.
  ports/         ← TracerProviderPort, PropagatorPort, MeterPort, SpanLinkPort, TelemetryPort
                   (the seam @netscript/ai consumes). Imports domain only.
  application/   ← span lifecycle (withSpan/createSpan/withSpanSync — was src/core/span*.ts),
                   context threading (was src/context/*, incl. the W3C fix), the per-domain
                   instrumentation facades (queue/worker/scheduler/saga/trigger/streams/messaging —
                   was src/instrumentation/* + the new saga/trigger/streams facades), the
                   metric-instrument registry (TC-11), the instrumentation-registry lifecycle
                   (was src/runtime/*), and the query/export reader (new). Imports domain + ports.
  adapters/
    otel-deno/   ← default provider: binds @opentelemetry/api to Deno's auto-registered global
                   provider; zero SDK runtime dep. Implements TracerProviderPort/PropagatorPort/
                   MeterPort. THE dedicated OTEL adapter the arch-debt mandates.
    otel-sdk/    ← opt-in provider: @opentelemetry/sdk-trace-* + HTTP-OTLP exporter (NOT grpc —
                   @grpc/grpc-js Deno friction, semconv §5/§6). Adds attribute-bearing links,
                   async-metric flush-on-exit, explicit server-span error status. §3.
    aspire-query/← HTTP reader for Aspire /api/telemetry/* (query/export surface, §7).
    orpc/        ← the oRPC tracing + error plugins (was src/orpc/*), now creating a real span (§4).
  diagnostics/   ← inspectTelemetry (was src/diagnostics/*; implement the stubbed string branch).
  testing/       ← in-memory span recorder + NoopProvider for the REAL-e2e assertions (§6) and for
                   consumers' unit tests. New; load-bearing for "real e2e, not mocked."
  tests/, examples/
  mod.ts + one facade file per subpath (real files, not orphans).
```

`src/instrumentation/sse.ts` (447 ln, **zero consumers anywhere**, `surface` §10 #1) is dead —
delete it, or, if the dashboard's live log/event stream wants it, wire it to a real consumer. Decide
in the restructure slice; default = delete (revamp removes dead scaffolding).

### Target export map (`deno.json`)

| Subpath | Backing | Change |
|---|---|---|
| `.` | `mod.ts` | complete the curated barrel — today it omits `getTracer`/`withSpan`/W3C/attributes from root (`surface` §1); re-export the primary surface so `import { withSpan } from '@netscript/telemetry'` works |
| `./config` | `application` config | validate env with Standard Schema (currently bare coercion, `debt` §3.4) |
| `./attributes` | `domain` | vocab + builders |
| `./context` | `application` | W3C propagation (tracestate fix) |
| `./tracer` | `application` | keep subpath for compat; rename the dir concept away from `core` |
| `./instrumentation` | `application` | per-domain facades |
| `./registry` | **new `registry.ts` facade** | give it a real facade file (kill the direct `src/runtime/mod.ts` pointer) OR fold into `./instrumentation` and drop the duplicated subpath (`surface` §10 #8) |
| `./orpc` | `adapters/orpc` | span-creating plugin |
| **`./otel`** | **`adapters/otel-deno` + `adapters/otel-sdk`** | **NEW — the mandated dedicated OTEL-adapter subpath export; composition-root picks the provider** |
| **`./query`** | **`application/query` + `adapters/aspire-query`** | **NEW — dashboard query/export surface (§7), beta.6 deliverable** |

Also fix the scaffold rewrite-map gap: `workspace-mutator.ts:196-203` omits `/orpc` and `/registry`
from the JSR-specifier rewrite list (`surface` §8) — add all subpaths including the two new ones.

F-6 note (`debt` §2): `deno doc --lint` must be clean on the **full** export set, not just `mod.ts`
(memory: JSR doc-lint full export set) — every new subpath needs documented exports.

---

## 3. The `OTEL_DENO`-thin vs bring-an-SDK fork — RESOLVED

**Verdict: adapter-supports-both. Default = thin Deno-native provider; opt-in SDK provider composed
in at the composition root for the subsystems whose deliverables Deno's built-in cannot satisfy. The
SDK adapter is beta.6-load-bearing (not a stable nicety) because of the fan-in span-links
requirement.**

### The three documented Deno-native limits and where each bites (`semconv` §5)

1. **Span links carry no attributes.** Directly collides with TC-14 / the messaging fan-in model
   (`semconv` §3: per-message attributes belong on the per-message link). The **beta.6 streams
   fan-in** leg of Flow B (§6) needs attributed links to disambiguate which upstream message each
   link represents. **This is the load-bearing collision** — it cannot be waved off to stable.
2. **Async/observable meter callbacks not flushed on exit.** Bites the AI GenAI metrics (token-usage
   observable gauges) and any process that exits promptly after work (workers subprocess). Matters for
   the flagship-AI mandate (stable) and clean job-process shutdown.
3. **HTTP server spans not auto-errored on handler throw.** We already mitigate at the app layer via
   TC-3 (`withSpan` sets ERROR), so this one is not a blocker — noted for completeness.

### Why not pure-thin, why not pure-SDK

- **Pure-thin fails beta.6.** The streams/sagas fan-in span-links (a hard beta.6 deliverable, §6) are
  unsatisfiable with attribute-less links. Shipping attribute-less links + shoving per-message data
  into span *events* is a documented fallback but degrades the flagship trace and the dashboard's
  fan-in view — not flagship-bar.
- **Pure-SDK regresses DX and the publish surface.** It abandons Deno's zero-config auto-
  instrumentation (`Deno.serve` inbound, `fetch` outbound with W3C propagation, `Deno.cron`, console→
  logs — `semconv` §5) that the whole framework relies on "with no extra wiring" (`polyglot` §2), and
  it drags `@opentelemetry/sdk-trace-*` (+ the `@grpc/grpc-js` Deno friction if anyone picks grpc,
  `semconv` §5) into a JSR-published, currently zero-runtime-dep package.

### The resolution mechanics

The ports/adapters split (mandated regardless) makes this a **provider selection at the composition
root**, not a fork in library code:

- `ports/TracerProviderPort` + `ports/SpanLinkPort` + `ports/MeterPort` define the seam.
- `adapters/otel-deno` (default): binds `@opentelemetry/api`'s global (Deno auto-registers it — user
  code must NOT call `setGlobalTracerProvider`, `semconv` §5). Zero SDK dep. Links degrade to
  attribute-less; the port advertises `supportsLinkAttributes = false`.
- `adapters/otel-sdk` (opt-in): `@opentelemetry/sdk-trace-*` + HTTP-OTLP exporter (port 4318,
  `http/protobuf` — matches `OTEL_DEFAULTS`, `aspire-api` §2). `supportsLinkAttributes = true`;
  flushes observable meters on `SIGTERM`/exit.
- **Composition-root policy:** the Aspire resource registration selects the SDK adapter **only for the
  processes that produce fan-in links or AI metrics** — the `streams`, `workers`, and (at stable) `ai`
  processes — via an env flag (`NETSCRIPT_TELEMETRY_PROVIDER=sdk|deno`, default `deno`). Every other
  process stays thin. This keeps the blast radius tiny and the default DX unchanged.
- **Decouple `enabled`:** `getTelemetryConfig().enabled` becomes
  `OTEL_DENO === 'true' || NETSCRIPT_TELEMETRY_ENABLED === 'true' || aProviderIsRegistered` (today it
  is hard-gated on `OTEL_DENO` alone — `environment.ts:35,62`). Resolves `oq` #8/#9.

Net: default publish surface stays thin and zero-runtime-dep; the SDK cost is paid only by the two
subsystems that need it, and only when their process opts in. This is the honest, minimal answer to
the fork — and it makes the beta.6 fan-in trace actually correct.

---

## 4. Per-package parity leveling plan (to TC-conformance)

Grades from `grading`. "Reference" = already TC-conformant. Each entry: current state → concrete work
→ target milestone. Two structural convergences run across all of them: **converge sagas + triggers
off their private tracers onto the shared facade (TC-13)**, and **lift the saga/trigger metric
instruments into the shared layer (TC-11)**.

| Plugin | Now | Work to TC-conformance | Milestone |
|---|---|---|---|
| **workers** | A (ref) | Source of the shared facade. (i) Gain metrics via the lifted TC-11 instruments; (ii) close or explicitly-bound-and-test the `createJobTools` no-op (`debt` §1, arch-debt `workers-scaffold-job-tools-noop`); (iii) repoint imports onto the new `domain`/`application` map. | beta.5–6 |
| **database** | B+/A− | Keep the Prisma bridge (only real-links consumer, `grading` §database). (i) Register its provider through the shared `TracerProviderPort` (it needs a globally-registered provider today); (ii) promote its hand-rolled `addLinks`/`linkIds` walk into the shared `SpanLinkPort` reference impl; (iii) namespace alignment (TC-5/-6). | beta.6 |
| **sagas** | B+ | (i) Converge off `plugins/sagas/src/telemetry/otel-saga-tracer.ts` onto `application/instrumentation/saga` (TC-13); (ii) lift the 7 meter instruments into shared (TC-11); (iii) make the facade **real by default** — today NOOP unless a composition root injects `createSagaTelemetry` (`grading` §sagas) — wire it in the plugin setup; (iv) **implement REAL fan-in span-links for cascade** (today parent-child + PRODUCER only; "fan-in links" are test-mock no-ops) — TC-14, needs SDK adapter. | beta.6 |
| **auth** | B (diff axis) | Correct on a different dimension (redaction/compliance, not span density). (i) Converge `createAuthTelemetry` onto the shared span lifecycle (it already uses `withSpan`); (ii) keep opt-in salt gating; (iii) promote `hashSubject`/redaction into the shared layer as the TC-8 canonical helper. Do NOT score it on span density. | beta.6 |
| **triggers** | C+ (**bug**) | **FIX THE W3C-PARENTING BUG (TC-9, correctness):** `packages/plugin-triggers-core/src/runtime/create-trigger-ingress.ts` captures `event.traceparent`/`tracestate` (L156-157) but `#processAndRecord` (L171-189) calls `processor.process(...)` **without** passing it → DETECT/PROCESS start a fresh trace, severing ingress→process (`grading` §triggers). Fix: thread the captured context as parent. (ii) Add the SERVER `startIngressSpan` from the dormant core facade; (iii) wire the dormant `TriggerInstrumentation` core (metrics + outcome/error attrs); (iv) converge the runtime processor off `getTracer('@netscript/triggers')` onto the shared facade (TC-13). | beta.6 |
| **services / oRPC** | C+ (**silent no-op risk**) | `TracingPlugin` **enriches** the active span but **never creates one** (`surface` §5) — if `OTEL_DENO` HTTP auto-instr isn't active on a hop, it is silently inert. Fix: when no active span exists, create an INTERNAL/SERVER span (fallback) so the plugin is never a no-op; align `rpc.*` to semconv RC + shared `SpanNames` (TC-1/-5); add the missing **client-side CLIENT span** in `packages/sdk/src/client/service-client.ts` (today it only copies the `traceparent` header). **This is on the beta.6 critical path** — the Flow B `channelClient` callback is only traced once this lands. | beta.6 |
| **streams** | **F (from zero)** | First instrumentation, `plugin-streams-core` has zero telemetry (`grading` §streams). New `application/instrumentation/streams` facade: PRODUCER span + link injection on `DurableStreamProducer.publish`; CONSUMER span + **fan-in links** on subscribe (TC-14, SDK adapter). This is the fan-in leg that powers the beta.6 flagship trace. | beta.6 |
| **ai** | **F (seam never invoked — load-bearing)** | Two-phase. **beta.6 (kill the inertness):** the runtime never calls the injected `TelemetryPort` at all (`grading` §ai — `packages/ai/src/runtime/mod.ts` has zero `telemetry.`/`startSpan` calls); wire a minimal real span through the port so the seam is live (F→C). **stable (flagship):** the full OTel `TelemetryPort` adapter (the "slice E9" the port JSDoc reserves) with GenAI-semconv spans (`chat <model>`/`execute_tool`, `gen_ai.*`, token-usage metrics), gated behind `gen_ai_latest_experimental` (TC-5), + rich AI trace views. | beta.6 (invoke) → stable (OTel adapter) |

**Divergence from Stage-C / ratified milestones (flagged):** the ratified train puts "AI-adapter +
rich views at stable." I keep the full OTel adapter at stable, but I **pull the minimal port
*invocation* to beta.6** — because "seam exists but the runtime never calls it" is an inert-F that
undermines the flagship-AI mandate, and making the port live is cheap. Surfaced in `open-questions.md`.

Also fold in the shared-facade re-wrapping cleanup (`surface` §10 #6): auth-core, sagas, and **4
separate files in `packages/fresh`** each re-derive `createXTracer`/`withXSpan` boilerplate — the
convergence onto one facade removes that duplication as a side effect.

---

## 5. W3C + span-links + cross-language

### W3C propagation standard (TC-9/-10)

- **Fix the tracestate-drop bug** (`surface` §4): `application` `extractContext` fallback path builds
  `remoteSpanContext` from `parseTraceparent` only and never reads `headers['tracestate']` — add it,
  and add a test (today untested). Validate/reject unknown future version bytes beyond the length
  check. `traceparent` = `00-<32hex>-<16hex>-<2hex>`, `tracestate` ≤32 members, truncate >128-char
  entries first (`semconv` §2).
- **Standard:** extract on ingress (SERVER) → parent the span; inject `traceparent`+`tracestate` on
  every egress (CLIENT/PRODUCER). Deno auto-instruments `fetch` outbound (`semconv` §5) so intra-Deno
  HTTP hops propagate for free — but the convention still mandates explicit injection on non-`fetch`
  transports and on subprocess spawn (env-carrier, TC-10). Baggage (`semconv` §2, only Candidate-Rec)
  is out of scope for beta.6 — do not couple to it.

### Real span-links for fan-in

- Today real OTel links exist in **exactly one place** — the database Prisma bridge's
  `span.addLinks(...)` via a `linkIds` map (`grading` §database). Promote that into the shared
  `ports/SpanLinkPort` + an `application` helper `createFanInLinks(messages): Link[]` that attaches
  links **at span creation time** (head-sampling requirement, `semconv` §3) with per-message
  attributes (`messaging.message.id`, etc.).
- Wire it into: **streams consumer** (fan-out subscriber joining N producer spans) and **saga
  cascade** join (replace the parent-child-only cascade with links where ≥2 upstreams converge). The
  sagas "fan-in links" claim is currently false (test-mock no-ops, `grading` §sagas) — this makes it
  real.
- **Attribute-bearing links require the SDK adapter** (§3) — so the streams/sagas processes opt into
  `NETSCRIPT_TELEMETRY_PROVIDER=sdk`. This is the concrete reason the SDK adapter is beta.6-load-bearing.

### Cross-language env-carrier (the stable-tier shim)

- The env-var **injection** half is shipped and real across 7 runtimes (`polyglot` §1;
  `createJobTraceEnv` → `{JOB_TRACE_CONTEXT, TRACEPARENT, TRACESTATE?}`). The gap: **no non-Deno child
  is demonstrated extracting the context and emitting a stitched child span** (`polyglot` §1 gap; `oq`
  #19). Deno→Deno child works (`runTracedJob`); Python/duckdb child continuation does not.
- **Design (two honesty tiers):**
  - **beta-honest (Deno-side, ships as part of Flow A at stable):** always wrap the `Deno.Command`
    subprocess in a CLIENT/INTERNAL span on the Deno side with attributes (`netscript.runtime`,
    command, duration_ms, exit_code, and for duckdb: query hash, row_count) + inject
    `TRACEPARENT`/`TRACESTATE` normalized per the Beta carrier spec. The child stays dark but the hop's
    duration/outcome is a real span in the parent trace. This is the minimum that makes Flow A's
    duckdb hop not-dark.
  - **true continuation (the harder stable demo):** a tiny per-runtime trace shim — a `netscript-trace`
    helper per language (Python module, shell/pwsh wrapper) that reads the `TRACEPARENT` env at
    startup and emits a child span to the OTLP endpoint. `duckdb.exe` has no OTel SDK, so its true
    continuation is via a thin wrapper process, not the binary itself. Ship the shim as a
    documented capability at stable; the polyglot-tasks docs already promise this stitch
    (`polyglot` §1) so closing it also closes a doc-vs-reality gap.
- Env-key normalization is mandatory (case-insensitive on Windows, case-sensitive POSIX; `semconv`
  §4) — uppercase, `^[A-Z_][A-Z0-9_]*$`.

---

## 6. Grouped-trace showcase — finalized two-tier

I **validate Stage-C's two-tier resolution** and sharpen it with the corpus's open verifications
closed and the real (non-mocked) assertions defined.

### beta.6 flagship = Flow B (framework-native multi-process KB-ingestion pipeline)

`pipeline` §2b / `context/B-telemetry/eis-chat-pipeline-diagram.md` Flow B. Five real OS processes,
all already emitting OTEL env at the infra layer (`pipeline` §1):

```
eischat (enqueue, raw fetch → workers-api OpenAPI trigger route; #73 workaround)
  → workers-api (queue over shared Garnet/Redis KV; #371 split-brain fix)
  → workers runtime (separate process; embed-document/transcribe-image; compute-only)
  → channelClient oRPC callback → eischat (single-writer; tursodb exclusive lock, os error 33)
  → workers → streams DurableStreamProducer publish → /workers/executions  (fan-in leg)
  → dashboard trace/stream view (real consumer we wire — see below)
```

**Why this for beta.6 (validated):** every hop is a real, working, multi-process *production* path
(KV split-brain + single-writer bugs already fixed and documented) — it demonstrates "does telemetry
survive **our own** worker/queue/single-writer/streams architecture," which is squarely NetScript's
value proposition, and it is what powers the dashboard trace view. Same-language (cross-process, not
cross-language), which is fine — cross-language is the stable tail.

**beta.6 work = wiring already-emitting processes into one trace:** application-span instrumentation
per hop (TC-1..-9) + **span-links for the streams fan-in** (§5, SDK adapter) + the **triggers
W3C-parenting fix** (if a trigger fronts the enqueue) + **streams from zero** + **ai port invoked** +
**the oRPC-tracing fix so the `channelClient` callback is actually traced** (§4 services — on the
critical path).

**Open verifications CLOSED:**
- *"channelClient oRPC already traced?"* (`oq` #2, `surface` §Reconciliation) → **No, not reliably.**
  It rides `defineService` which installs `TracingPlugin`, but that plugin only *enriches* an existing
  Deno-HTTP span and is a **silent no-op if `OTEL_DENO` HTTP auto-instr isn't active on the workers
  process's outbound call** (`surface` §5, unconfirmed for that hop). Resolution: the §4 services fix
  (create-span fallback) makes this hop traced deterministically. **Do not assume it works today.**
- *"streams real UI consumer?"* (`oq` #3, `pipeline` §3) → **Inert in eis-chat** — `streams/*.ts`
  there is unmodified scaffold boilerplate; the fan-out is plumbed-but-unconsumed. Resolution: the
  **beta.6 flagship must wire its own real consumer** — naturally the dashboard's trace/stream view
  (Topic A). Do NOT rely on eis-chat's inert scaffold to prove the fan-in leg. This is a concrete
  producer↔consumer coordination item with Opus-A.
- MCP HTTP transport traceparent (`oq` #1) is a **Flow A** concern, not Flow B — deferred to stable.

### stable tail = Flow A (cross-language duckdb.exe hop)

`pipeline` §2a / diagram Flow A. browser → dashboard BFF (`parentFromRequest` resumes W3C — real,
working) → TanStack-AI GenAI-semconv spans → MCP tool call (HTTP, cross-process) → **`duckdb.exe` CLI
subprocess (the ONE genuine non-Deno/runtime boundary, currently dark)**.

**Why stable (validated):** the duckdb hop needs net-new work to be honest — wrap `Deno.Command` in a
span, inject `TRACEPARENT`, and a per-language shim to truly continue the trace (§5). It is a
showcase-completeness item, not a dashboard-enabler. **Open verification to close at stable:** does
the MCP Streamable-HTTP transport auto-propagate `traceparent`? (`oq` #1) — test whether the MCP TS
SDK client uses `fetch` under the hood (Deno auto-instruments `fetch`); if not, wire explicit
injection on that hop.

### Real e2e trace assertions (not mocked) — TC's machine check

There is already a working precedent to extend: `packages/cli/e2e/src/application/gates/scaffold/
otel-gates.ts` `GATE.BEHAVIOR_OTEL_TRACES` resolves the live Aspire dashboard base URL from
`.netscript/e2e/aspire-start.json`, fetches `/api/telemetry/traces`, groups by `traceId`, and
asserts a real cross-service parent/child edge (`triggers-api`→`workers` via `parentSpanId`)
(`aspire-api` §1). Generalize it into the Flow B assertion suite, run inside `deno task e2e:cli run
scaffold.runtime` against real processes and the real Aspire API (no span mocks):

1. **Single trace:** all N Flow-B process spans share one `traceId` end-to-end (the generalized
   grouping the template already does).
2. **Parent/child edges present:** enqueue PRODUCER → dequeue CONSUMER; `job.execute` child of
   dispatch; `channelClient` callback span child of `job.execute` (this fails today until §4 lands —
   it is the assertion that proves the fix).
3. **Fan-in link present:** the streams consumer span carries a link (with attributes under the SDK
   adapter) to the producer span (TC-14).
4. **No severed/fresh trace (regression guard for the triggers bug):** ingress span and process span
   share `traceId` — the exact assertion that would have caught `grading` §triggers.
5. **Attribute floor:** every span carries `netscript.correlation.id` + an outcome (TC-7).

These are the "real e2e telemetry (not mocked)" the owner brief demands (§1). The `testing/`
in-memory recorder (§2) covers the unit tier; the Aspire-API e2e covers the integration tier.

---

## 7. Dashboard query/export surface — the contract offered to Opus-A

This is the first-class beta.6 deliverable and the producer↔consumer handshake with Opus-A.

**Package:** new subpath `@netscript/telemetry/query` (`application/query` + `adapters/aspire-query`).
Grounded in real in-repo code: `packages/cli/.../telemetry/(_shared)/telemetry-trace.ts.template`
already ships `fetchDashboardTraces()` that calls `GET .../api/telemetry/traces`, parses OTLP-JSON
(`resourceSpans`→`scopeSpans`→`spans` with `parentSpanId`), reconstructs a trace tree, and computes a
cross-service flag (`aspire-api` §1). The revamp **generalizes** it (it's hardcoded to a
`triggers-api`/`workers` demo) and repoints it at Aspire's **documented** `/api/telemetry/*` API
(Aspire 13.2+, pin is 13.4.6 — available now, `aspire-api` §3).

**Why HTTP-API and not the CLI:** the tracked debt `runtime — aspire-otel-cli-discovery` (`debt` §1)
records that the Aspire **HTTP** telemetry API returns 200 for `/api/telemetry/{resources,logs,
traces}` while `aspire otel logs/traces` **CLI still fails** "Dashboard API is not available." The
final surface must consume the HTTP API directly and must not claim the CLI path works.

### The typed contract (what Opus-A codes against — never raw Aspire JSON)

```ts
// @netscript/telemetry/query — domain types
interface TelemetrySpan {
  spanId: string; parentSpanId?: string; traceId: string;
  name: string; kind: 'SERVER'|'CLIENT'|'PRODUCER'|'CONSUMER'|'INTERNAL';
  startTimeUnixNano: string; durationMs: number;
  attributes: Record<string, string|number|boolean>;
  events: { name: string; timeUnixNano: string; attributes: Record<string, unknown> }[];
  links: { traceId: string; spanId: string; attributes: Record<string, unknown> }[];
  status: { code: 'UNSET'|'OK'|'ERROR'; message?: string };
  resource: { serviceName: string; serviceInstanceId?: string; attributes: Record<string,string> };
}
interface TelemetryTrace {
  traceId: string; rootSpan: TelemetrySpan; spans: TelemetrySpan[];
  startTimeUnixNano: string; durationMs: number;
  services: string[]; crossService: boolean;
  status: 'ok'|'error'; spanCount: number;
}
interface TelemetryLog { /* OTLP ResourceLogs → flattened, severity, body, traceId?, spanId? */ }
interface TelemetryResource { name: string; kind: string; hasTelemetry: boolean }

// query API (thin typed reader over Aspire /api/telemetry/*)
queryTraces(f: { resource?: string[]; since?: number; limit?: number }): Promise<TelemetryTrace[]>;
getTrace(traceId: string): Promise<TelemetryTrace>;            // → /api/telemetry/traces/{traceId}
queryLogs(f: LogFilter, opts?: { follow?: boolean }): AsyncIterable<TelemetryLog>; // ?follow NDJSON
streamSpans(opts?: { follow?: boolean }): AsyncIterable<TelemetrySpan>;
queryResources(): Promise<TelemetryResource[]>;
exportTraces(f): Promise<OtlpJson>;                            // OTLP-JSON ResourceSpans, portable
```

### Contract guarantees I offer Opus-A

- **Insulation from Aspire churn.** Aspire does **not** declare `/api/telemetry/*` externally stable
  (`aspire-api` §3, the Jaeger-internal-JSON cautionary tale). By wrapping it behind these NetScript
  types, the dashboard depends on the NetScript contract; if Aspire's shape shifts, we absorb it in
  `adapters/aspire-query`, Opus-A's panels don't change.
- **Full trace tree by ID** via `getTrace()` → `/api/telemetry/traces/{traceId}` — the exact "grouped
  E2E trace" primitive the trace-view panel needs (`aspire-api` §4: Aspire's is the best-fit
  precedent for this).
- **Live tail** via `?follow=true` NDJSON on logs/spans (`aspire-api` §3) — for the live log/trace
  panels without a custom collector.
- **Robust endpoint discovery** (`oq` #18): resolve the ephemeral base URL (`localhost:0`, differs
  under `--isolated`) from `.netscript/e2e/aspire-start.json` / `ASPIRE_DASHBOARD_*` env / the URL
  `aspire start` prints; supply `x-api-key` (AppHost-integrated mode auto-enables the API;
  NetScript already sets `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS`, `aspire-api` §2). One resolver,
  shared with the e2e gate.
- **Graceful degradation under `--no-aspire`/production** (`oq` #16): no local Aspire API → the query
  surface reports "no local telemetry source; point your OTLP exporter at your backend" (the
  documented OTLP-endpoint-swap, `aspire-api` §3). Aspire retention is in-memory only (10k traces,
  `aspire-api` §3) — the dashboard shows live-dev data, not history; forwarding to a real backend
  (SigNoz per eis-chat precedent) is the app's OTLP-exporter choice, not ours to dual-write.

### Co-land sequencing with Opus-A (from `seam-A` + A-open-questions #7)

1. **beta.6, first:** Opus-A's dashboard consumes **OTLP/Aspire-sourced** traces+logs immediately —
   zero dependency on this package, using the raw Aspire API to unblock parallel work (`seam-A` #1).
2. **beta.6, converge:** as `@netscript/telemetry/query` lands, Opus-A **switches its data layer onto
   the typed contract** above — this is the co-land. The switch is the point of the surface: it stops
   the dashboard reading raw Aspire and gives it a stable NetScript contract.
3. **Resource list + status** (`seam-A` #2): the query surface covers telemetry; the "what's running"
   resource graph is Aspire-resource-graph territory (gRPC/MCP/NetScript's own `AspireResource[]`) —
   **out of scope for `@netscript/telemetry/query`**, owned by Opus-A's Aspire seam. I flag the
   boundary so we don't double-build it.

---

## 8. Cross-checks & doctrine

- Archetype 2 (Integration) drives the ports/adapters shape; A1 (public types first) → the `domain`
  contract; A12/A13 (`debt` §2) apply to the one stateful surface, the `InstrumentationRegistry`
  lifecycle (`setupAll`/`teardownAll`) — grade it against the lifecycle bar or delete it if it stays
  unwired (today **zero real registrants**, `surface` §6). Decision: **wire it as the real composition
  seam** (it's the natural place the composition root selects the provider adapter, §3) rather than
  delete — that turns dead best-tested scaffolding into the load-bearing seam its README already
  claims.
- F-3/F-5/F-6 are the closing gates on the arch-debt Refactor entry (`debt` §1); the restructure slice
  closes it.
- Every slice validates with the scoped wrappers (`.llm/tools/run-deno-check.ts --root
  packages/telemetry --ext ts,tsx`, `deno doc --lint` full export set) + the `scaffold.runtime` e2e
  for the real-trace assertions — never raw root CLI as the verdict (netscript-tools).
