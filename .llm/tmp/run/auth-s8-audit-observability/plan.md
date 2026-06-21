# AS8 — Auth Audit Observability — plan.md

> Run artifact (Plan & Design phase). Reads with `research.md`. **No implementation before
> PLAN-EVAL `PASS`** (OpenHands minimax-M3, separate session).
> Slice: `auth-audit-observability`. Branch: `feat/prime-time/auth-s8-audit-observability`.
> Base: **`main`** (re-baselined 2026-06-21 — the auth umbrella `feat/prime-time/auth` merged to
> `main` via PR #73 @ `6f1c40f0`, so S6+S7+AS7 are all satisfied there; all 16 plan references
> re-verified present on `origin/main`). Leaf PR base = `main`.

## 1. Archetype & scope

- **Primary archetype:** ARCHETYPE-5 (plugin) — `plugins/auth`.
- **Supporting:** ARCHETYPE-2/3 packages — additive surface in `packages/plugin-auth-core`
  (typed telemetry constants + ports), reuse-only of `@netscript/telemetry` and `@netscript/logger`.
- **Scope overlay:** `SCOPE-service.md`.
- **Net-new, additive.** No behavior change to auth flows; observability is a cross-cutting wrap.

## 2. Locked decisions (resolving research.md §8 open questions)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Instrument at the service + injected-tracer seam, NOT inside the pure backends.** A `createAuthTelemetry()` instrumentation object is injected into the auth service runtime (sagas-parity, `plugins/sagas/services/src/main.ts:93`). `better-auth`/`workos` stay pure, dependency-light adapters. | Keeps pure backends free of telemetry deps; matches sagas DI seam; avoids per-adapter duplication. |
| D2 | **`auth.subject_hash` = stable, salted, one-way HMAC-SHA-256(subject, deployment_salt).** Salt sourced from deployment config (env/appsettings topic), never derived from the subject. Same subject → same hash within a deployment (audit correlation), not reversible, not cross-deployment-linkable. | Audit needs correlation without storing raw subject (PII). Stable keyed hash is the standard audit-safe identifier. |
| D3 | **Redaction is mandatory and tested.** Extend `SENSITIVE_FIELD_FRAGMENTS` with `['sessionid','accesstoken','refreshtoken','jwttoken']`; add `redactAuthPrincipal()` that hashes `subject` and strips token-bearing claims before any span attribute / log field. | Closes research.md §5 gap; enforces "never raw token/PII in trace or log." |
| D4 | **Per-operation child spans** `auth.signin\|callback\|signout\|session\|me`, parented via `getParentContextFromHeaders(ctx.traceHeaders)` (workers pattern, `job-dispatcher.ts:27-28`). | Connects auth spans to the inbound request trace e2e. |
| D5 | **Durable-event propagation:** inject `traceparent`/`tracestate` into emitted `auth.*` stream events (AS4) via `injectContext()` and persist them on the event record (mirror workers execution-state durability, `job-dispatcher.ts:58-66`). | Makes API→backend→durable-event one connected trace — the workers e2e bar applied to auth. |
| D6 | **Typed error taxonomy** replaces opaque string reasons: `AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`, `AUTH_PROVIDER_ERROR`, `AUTH_CALLBACK_INVALID`; mapped via `ErrorHandlingPlugin` classification. Backend string reasons map → codes at the service seam (backends unchanged externally). | Machine-readable audit outcomes; no behavior change to backend adapters. |
| D7 | **Middleware seam (`packages/service/src/auth/auth-middleware.ts`) is OUT of scope for AS8**, recorded as a follow-up only if AS7 fitness flags it. | Keep slice bounded to the auth plugin's owned surface; avoid cross-package creep. |

## 3. Deliverables (contract → impl → tests)

1. **`packages/plugin-auth-core/src/telemetry/`** (additive, JSDoc + `@example`, JSR-clean):
   - `attributes.ts` — `AuthAttributes`, `AuthSpanNames`, `AuthSpanEvents`, `AuthOutcome`,
     `AuthErrorCode` (typed const objects, no `any`).
   - `redaction.ts` — `redactAuthPrincipal()`, `hashSubject(subject, salt)`.
   - `mod.ts` — public re-export; wire into `packages/plugin-auth-core` exports map.
2. **`createAuthTelemetry()`** — instrumentation factory (returns a typed object that wraps an auth
   operation with `withSpan`/`createSpan` + attributes + events). Injected into the auth service
   runtime; default no-op-safe when telemetry disabled (observability errors swallowed, never throw).
3. **Service wiring** in `plugins/auth/services/src/` — confirm `.withRPC({ traceContext: true })`;
   thread `ctx.traceHeaders` into `createAuthTelemetry()`; emit child span + audit-log event per
   handler; map backend reason → `AuthErrorCode`.
4. **Durable-event propagation** in the auth streams emit path (AS4) — `injectContext()` onto
   `auth.*` event payload/headers + persist on event record.
5. **Tests** (`deno task test`, scoped):
   - attribute assertions per operation (provider/backend/method/outcome present; subject **hashed**).
   - redaction assertions: **no raw subject/token** appears in any emitted span attribute or log
     field (negative assertions over the serialized output).
   - propagation continuity: API-entry span trace id == durable `auth.*` event span trace id.

## 4. Gates (archetype-gate-matrix + SCOPE-service)

- `deno task check` (+ `--unstable-kv` on KV-touching checks).
- Scoped wrappers: `run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts` on
  `packages/plugin-auth-core` + `plugins/auth` (`--ext ts,tsx`).
- `deno task test` (auth + plugin-auth-core).
- `jsr-audit` (A1 doc-lint full export set) on `packages/plugin-auth-core` — additive surface must
  stay slow-types-clean and JSR-scored.
- **NOT** scaffold.runtime per-loop (expensive) — run only at umbrella merge-readiness / AS7 pass.

## 5. Zero-cast / doctrine compliance

- No new `any` / `as unknown as` in handler, business-logic, or contract code. Neither sanctioned
  exemplar (contract `implement(...) as unknown as`, top-level router `any`) is in scope here.
- Telemetry reuses `@netscript/telemetry` primitives only — no hand-rolled `any`-typed span hacks.
- Additive-only public surface; `packages/plugin-auth-core` stays JSR-clean.

## 6. Debt implications

- If durable-event propagation (D5) cannot reach the AS4 emit seam without a typed change there,
  record a scoped follow-up in `arch-debt.md` rather than casting — do **not** smuggle an external
  cast in to force it.

## 7. Sequencing & dispatch

1. ~~Land S6 → S7 → AS7 PASS~~ — **DONE**; all merged to `main` via PR #73 (`6f1c40f0`).
2. PLAN-EVAL (OpenHands minimax-M3, separate session) on this re-baselined `plan.md` + `research.md`.
   Hard stop. (A prior PLAN-EVAL PASS was witnessed against the umbrella-tip base; this re-confirms
   the `main`-rebased plan with a persisted `plan-eval.md`.)
3. On PASS: WSL Codex generator (daemon-attached, mobile-visible), branch
   `feat/prime-time/auth-s8-audit-observability` off `origin/main`, push explicit refspec.
4. Supervisor-verify gates → leaf PR (base `main`) → IMPL-EVAL (qwen3.7-max).
5. On PASS: squash-merge into `main`.

## 8. Design checkpoint (to record in worklog.md before PLAN-EVAL)

- Contract-first: `AuthAttributes`/`AuthSpanNames`/`AuthErrorCode` typed constants defined first,
  then `createAuthTelemetry()`, then service wiring, then tests.
- Sagas-parity DI seam confirmed as the injection mechanism; workers W3C inject/extract confirmed as
  the propagation mechanism. Both are reuse, not reinvention.
