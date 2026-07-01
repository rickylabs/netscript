# AS8 — Auth Audit Observability — research.md

> Run artifact (Research phase). Slice: **auth-audit-observability** ("AS8").
> Program: framework-prime-time auth. Branch (planned): `feat/prime-time/auth-s8-audit-observability`.
> Umbrella: `feat/prime-time/auth` (PR #86). Archetype: ARCHETYPE-5 (plugin) + ARCHETYPE-2/3
> (supporting packages `@netscript/telemetry`, `@netscript/logger`, `packages/plugin-auth-core`).
> Scope overlay: `SCOPE-service.md`.
> **Depends on:** S6 (typed `logger`/context seam) + AS7 (doctrine-conformance fitness gates).

## 1. Problem statement / why this slice exists

User directive (2026-06-21): NetScript must hit the **enterprise audit bar** for auth. In a
compliance audit of an enterprise that deployed this framework, auth is the single highest-value
trace surface — every signin/callback/signout/session/me operation must be reconstructable from
traces + structured audit logs with rich, **audit-safe** context metadata, and traces must connect
**end-to-end** (API → backend → durable `auth.*` event), exactly as the `workers` plugin connects a
trace from the API through to a polyglot task.

Today auth is **observability-bare**. This slice closes that gap by mirroring two existing,
in-repo exemplars rather than inventing a new mechanism:

1. **sagas domain tracing** — runtime-injected tracer that emits typed child spans per operation.
2. **workers e2e propagation** — W3C `traceparent`/`tracestate` inject/extract across process and
   queue boundaries (incl. polyglot subprocess env carriers).

## 2. Ground truth — what the platform already provides (DO NOT reinvent)

Evidence from two read-only sweeps (telemetry/sagas/auth-baseline + workers-propagation).

### 2.1 `@netscript/telemetry` public surface
- `packages/telemetry/deno.json:6-14` — exports `.`, `./config`, `./tracer`, `./context`,
  `./attributes`, `./instrumentation`, `./orpc`.
- `packages/telemetry/src/public/mod.ts:9-27` — public symbols:
  - `TracingPlugin` — oRPC interceptor; enriches the **auto-created** HTTP span with `rpc.system`,
    `rpc.method`, `rpc.input_keys`, error codes. Does **not** create child spans.
  - `ErrorHandlingPlugin` — centralized error logging + `ORPCError` mapping + client/server/transient
    classification.
  - `createTraceContext()` → handler-level API: `addEvent()`, `setAttributes()`, `getTraceId()`,
    `getSpanId()`.
  - `setAttributes()`, `addEvent()`, `getTraceId()`, `getSpanId()` — direct span helpers.

### 2.2 Service builder observability chain (auth already inherits this)
- `packages/service/src/primitives/handlers.ts:72-114` — `createRPCPlugins()` always attaches
  `TracingPlugin` + `ErrorHandlingPlugin` + `LoggingPlugin` when `serviceName` is set.
- `packages/service/src/builder/service-builder-impl.ts:244-267` — when `withRPC({traceContext:true})`,
  the builder extracts inbound `traceparent`/`tracestate` headers into `ctx.traceHeaders`.
- `plugins/auth/services/src/main.ts` already mounts the builder chain; AS8 must confirm
  `.withRPC({ traceContext: true })` is enabled on the auth service (mirror
  `plugins/workers/services/src/main.ts:62`).

> **Conclusion:** auth gets the per-RPC HTTP span + request logging + error mapping + inbound
> trace-context extraction **for free**. The gap is **auth-domain child spans, audit attributes,
> audit-log events, redaction, and downstream propagation into `auth.*` events.**

### 2.3 Redaction primitives that already exist
- `packages/logger/constants.ts:11-19` — `SENSITIVE_FIELD_FRAGMENTS = ['password','token','secret',
  'key','auth','credential','apikey']`.
- `packages/logger/orpc-plugin.ts:376-394` — `redactSensitiveFields()` recursively replaces matching
  keys with `'[REDACTED]'`.

## 3. Exemplar A — sagas domain tracing (the child-span + attribute pattern)

- `plugins/sagas/services/src/main.ts:93` — `instrumentation: createSagaTelemetry()` injected into
  the saga runtime (DI seam, not hand-rolled in handlers).
- `plugins/sagas/src/telemetry/otel-saga-tracer.ts:22-44` — `createOtelSagaTracer()` builds child
  spans, extracting parent context from `traceparent`/`tracestate` via `extractFromTraceContext(...)`,
  then `createSpan(tracer, name, { kind, attributes, parentContext })`.
- `packages/plugin-sagas-core/src/telemetry/attributes.ts:12-69` — typed attribute + span-name +
  event constants:
  - **Span names:** `saga.handle`, `saga.cascade.send`, `saga.cascade.compensate`, …
  - **Attributes:** `saga.id`, `saga.instance.id`, `saga.event.type`, `saga.attempt`,
    `saga.durability_tier`, `saga.correlation_key`, `error_class`, `outcome`
    (`success|error|compensated|skipped`).
  - **Events:** `state.before`, `state.after`.
- Reference slice dir: `slices/sagas-telemetry-spans/` (prior art for this exact shape).

> **Mirror for AS8:** a runtime-injected `createAuthTelemetry()` tracer + a typed `AuthAttributes` /
> `AuthSpanNames` / `AuthSpanEvents` module in `packages/plugin-auth-core` (additive, JSDoc +
> `@example`).

## 4. Exemplar B — workers e2e propagation (the cross-boundary pattern)

- **Inbound extraction (free):** `service-builder-impl.ts:244-267` → `ctx.traceHeaders`.
- **Inject into a downstream message:** `plugins/workers/services/src/routers/jobs.ts:93-119` —
  reads `context.traceHeaders`, writes `traceparent`/`tracestate` onto the `JobMessage` **and** the
  queue `headers`.
- **Extract on the far side:** `plugins/workers/worker/job-dispatcher.ts:27-28,247-268` —
  `getTraceHeaders(message)` → `getParentContextFromHeaders(traceHeaders)` (alias of
  `extractContext`).
- **Span factory with parent:** `packages/telemetry/src/instrumentation/worker.ts:202-287` —
  `traceJobExecution({ parentContext, attributes }, fn)` wraps `withSpan(...)`.
- **W3C primitives:** `packages/telemetry/src/context/w3c.ts:74-92` `injectContext()` /
  `:120-149` `extractContext()` (standard `propagation.inject/extract` + manual traceparent fallback).
- **Reusable carrier helpers:** `packages/telemetry/src/context/mod.ts:13-14` re-exports
  `extractContext as getParentContextFromHeaders`; `packages/telemetry/src/context/payload-context.ts:8-22`
  `createJobTraceEnv()` / `extractJobTraceContext()` (env-var carrier for polyglot subprocesses).
- **Durability detail worth copying:** workers persists `traceparent`/`tracestate` in the **execution
  state record** (`job-dispatcher.ts:58-66`), so the trace survives async/durable replays.

> **Mirror for AS8:** when an auth operation emits a durable `auth.*` event (AS4 streams runtime),
> inject `traceparent`/`tracestate` onto the event payload/headers using `injectContext()`, and
> persist them on the event record — so the API→backend→durable-event chain is one connected trace,
> exactly like API→queue→worker→polyglot in workers.

## 5. Current auth observability baseline (the gap, with evidence)

- `packages/auth-better-auth/src/better-auth.ts:136-162` — `authenticate()` returns `Principal` or a
  bare string `reason` (`better_auth_session_lookup_failed`). **Zero** span/trace/logger usage.
- `packages/auth-workos/src/workos-authenticator.ts:147-187` — same: bare reasons
  (`workos_session_cookie_missing`, `workos_authentication_failed`), no instrumentation.
- No machine-readable error taxonomy, no subject hashing, no audit events, no provider attribution,
  no auth-specific redaction list.

## 6. Proposed scope (to be locked in plan.md, NOT here)

Net-new, additive, contract-first. Mirrors sagas (child spans + typed attributes) and workers
(propagation + durable persistence). Candidate deliverables:

1. **`AuthAttributes` / `AuthSpanNames` / `AuthSpanEvents`** in `packages/plugin-auth-core`
   (typed constants, JSDoc + `@example`):
   - span names: `auth.signin`, `auth.callback`, `auth.signout`, `auth.session`, `auth.me`.
   - attributes: `auth.provider`, `auth.backend`, `auth.method`, `auth.subject_hash`,
     `auth.session_id`, `auth.outcome` (`success|failed_bad_credentials|failed_session_expired|
     failed_provider_error`), `auth.error_code`, `auth.principal.scopes_count`,
     `auth.principal.roles_count`, optional `auth.provider.iss` (RFC 9207), `auth.mfa.state`.
   - events: `auth.principal.resolved`, `auth.session.issued`, `auth.session.revoked`.
2. **`createAuthTelemetry()`** runtime-injected tracer (DI seam, sagas-parity) that emits a child
   span per auth operation using `withSpan`/`createSpan` with `parentContext` from
   `getParentContextFromHeaders(ctx.traceHeaders)`.
3. **Audit-safe redaction:** `redactAuthPrincipal()` + a `hashSubject()` (one-way, salted) so a raw
   subject/token never enters a span attribute or log field; extend logger
   `SENSITIVE_FIELD_FRAGMENTS` with `['sessionid','accesstoken','refreshtoken','jwttoken']`.
4. **Auth error taxonomy:** typed codes (`AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`,
   `AUTH_PROVIDER_ERROR`) replacing opaque string reasons; wired through `ErrorHandlingPlugin`
   classification.
5. **Durable-event propagation:** inject `traceparent`/`tracestate` into emitted `auth.*` stream
   events (AS4) + persist on the event record, mirroring workers execution-state durability.
6. **Tests:** span-attribute assertions, redaction/hash assertions (no raw subject/token in output),
   propagation continuity (API span → durable-event span share one trace id).

## 7. Zero-cast / doctrine constraints (NON-NEGOTIABLE)

- NetScript is e2e fully typesafe. **No new `any`/`as unknown as` in handler / business-logic /
  contract code.** Only the two sanctioned exemplars are tolerated and neither is in scope here.
- Telemetry is **not hand-rolled**: reuse `@netscript/telemetry` primitives (`withSpan`,
  `createSpan`, `injectContext`, `extractContext`, `createTraceContext`). No `any`-typed span hacks.
- Additive only to `packages/plugin-auth-core` public surface (JSDoc + `@example`, JSR-clean).
- Redaction is mandatory and tested: **no raw token/PII/subject** in any span attribute or log field.

## 8. Open questions for plan.md / PLAN-EVAL

- Subject hashing: salt source (per-deployment config vs. derived) and whether `auth.subject_hash`
  must be stable across operations for the same subject (audit correlation) — likely yes, stable
  keyed hash.
- Whether AS8 also instruments the **middleware** seam (`packages/service/src/auth/auth-middleware.ts`)
  or only the plugin service handlers + backends. Leaning: instrument the plugin
  service/backends (owned surface); middleware is a follow-up if AS7 fitness flags it.
- Backend-level spans (`better-auth`/`workos`) vs. service-level only: backends are pure adapters —
  prefer a thin instrumentation seam injected by the service so the pure backends stay
  dependency-light. Confirm in plan.

## 9. References
- Sweeps: telemetry/sagas/auth-baseline + workers-propagation (this run, 2026-06-21).
- Exemplar slices: `slices/sagas-telemetry-spans/`, `plugins/workers/`.
- Skills: `netscript-harness`, `netscript-doctrine`, `netscript-deno-toolchain`, `jsr-audit`,
  `netscript-tools`, `netscript-pr`, `codex-wsl-remote`, `rtk`.
