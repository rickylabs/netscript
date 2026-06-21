# AS8 — Auth Audit Observability — plan-eval.md

> PLAN-EVAL artifact (Plan-Gate hard stop). Session: `openhands/minimax-M3`, separate session.
> Branch: `feat/prime-time/auth-s8-audit-observability` @ `3b9c75b1`.
> Base: `main` @ `6f1c40f0` (auth umbrella + framework-prime-time both merged there via #73).
> Inputs: `.llm/tmp/run/auth-s8-audit-observability/{research.md,plan.md}`.
> Verdict: **PASS**.

## 1. Inputs and branch state

- `research.md` and `plan.md` both present and committed on `feat/prime-time/auth-s8-audit-observability` @ `3b9c75b1` (re-baseline commit, `docs(harness): AS8 auth-audit-observability plan-of-record (re-baselined to main)`).
- Working tree clean (only untracked `.llm/tmp/run/openhands/pr-103/`). No tracked file modifications.
- Plan-of-record section §1 confirms umbrella re-base to `main`; commit log shows the re-baseline.

## 2. Archetype + scope selection (plan-gate §1)

| Item | Plan claim | Evidence on `main` | OK |
|------|------------|---------------------|----|
| Primary archetype ARCHETYPE-5 (plugin) | `plugins/auth` exists at top level; ARCHETYPE-5 doctrine file lists `plugins/auth` as the canonical example | `plugins/auth/{mod.ts,contracts.ts,verify-plugin.ts,streams/,services/,tests/}` layout matches | ✅ |
| Supporting ARCHETYPE-2/3 — `packages/plugin-auth-core` | Package layout is `src/{config,contracts,domain,ports,presets,public,streams,testing}` — consistent with archetype-3 doctrine | `packages/plugin-auth-core/src/` matches | ✅ |
| Reuse `@netscript/telemetry` + `@netscript/logger` | Both packages present | `packages/telemetry/`, `packages/logger/` exist | ✅ |
| Scope overlay `SCOPE-service.md` | Plan §1 references overlay; deliverables are service + plugin wiring (withRPC, instrumentation factory), not CLI/browser/runtime expansion | `plugins/auth/services/src/main.ts:74` `.withRPC({ traceContext: true })` confirms service scope | ✅ |

Archetype and scope selection are correct.

## 3. Contract-first ordering (plan-gate §1)

- §3 deliverables order: `AuthAttributes`/`AuthSpanNames`/`AuthErrorCode` typed constants → `createAuthTelemetry()` factory → service wiring → tests. Contract-first. ✅
- §8 design checkpoint re-states the same contract-first order and sagas-parity DI seam. ✅
- Mirrors `plugins/sagas/src/telemetry/otel-saga-tracer.ts` + `plugins/sagas/services/src/main.ts:93` `createSagaTelemetry()` injection, verified on `main`. ✅

## 4. Zero-cast compliance (plan-gate §2)

- §5 and research.md §7 both enumerate the rule: **no new `any` / `as unknown as`** in handler / business-logic / contract code. Neither sanctioned exemplar (Class A router-composition, Class B external-boundary) is in scope here.
- Auth service is not a router of the Class A shape (the Class A exemplar is `plugins/sagas/services/src/router.ts:39-44,71-75` per `arch-debt.md:889`, not auth). AS8 touches `services/src/router.ts` only for telemetry propagation, not router composition.
- No SDK adapters are touched (backends stay pure), so Class B is not in scope either.
- All telemetry reuses `@netscript/telemetry` primitives — no hand-rolled span `any` hacks.

Zero-cast compliance is satisfied.

## 5. Gate set adequacy (plan-gate §3)

| Gate | Plan coverage | Verdict |
|------|---------------|---------|
| `deno task check` (+ `--unstable-kv` on KV-touching checks) | §4 | ✅ |
| `run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts` scoped to `packages/plugin-auth-core` + `plugins/auth` (`--ext ts,tsx`) | §4 | ✅ |
| `deno task test` (auth + plugin-auth-core) | §4 | ✅ |
| `jsr-audit` A1 doc-lint full export set on `packages/plugin-auth-core` | §4 | ✅ |
| `scaffold.runtime` deferred to umbrella merge-readiness (per AGENTS.md trigger template, not per-loop) | §4 | ✅ |
| `arch:check` (doctrine) | Implicit in `deno task` chain; covered by `jsr-audit` A1 export-set check | ✅ |

Gate set is adequate for a plan-of-record; no scope gaps.

## 6. Anchor resolution (plan-gate §4)

All file:line anchors in `research.md` and `plan.md` resolve on `main` @ `6f1c40f0`:

| Anchor | Resolves? | Note |
|--------|-----------|------|
| `packages/auth-better-auth/src/better-auth.ts:136-162` | ✅ | `authenticate()` with bare `better_auth_session_lookup_failed` reason confirmed. |
| `packages/auth-workos/src/workos-authenticator.ts:147-187` | ✅ | `authenticate()` with bare `workos_session_cookie_missing` / `workos_authentication_failed` reasons confirmed. |
| `packages/service/src/builder/service-builder-impl.ts:244-267` (ctx.traceHeaders) | ✅ | File 510 LOC. |
| `packages/service/src/primitives/handlers.ts:72-114` | ✅ | File 221 LOC. |
| `packages/logger/constants.ts:11-19` (`SENSITIVE_FIELD_FRAGMENTS`) | ✅ | Verified list: `password`, `token`, `secret`, `key`, `auth`, `credential`, `apikey`. |
| `packages/logger/orpc-plugin.ts:376-394` (`redactSensitiveFields`) | ✅ | Verified at 376-394. |
| `packages/telemetry/deno.json:6-14` (exports map) | ✅ | Verified exports `./`, `./config`, `./tracer`, `./context`, `./attributes`, `./instrumentation`, `./registry`, `./orpc`. |
| `packages/telemetry/src/context/mod.ts:13-14` (re-export of `extractContext`) | ✅ | File 16 LOC. |
| `packages/telemetry/src/context/payload-context.ts:8-22` (`createJobTraceEnv`) | ✅ | File 48 LOC. |
| `packages/telemetry/src/context/w3c.ts:74-92` (`injectContext`) + `:120-149` (`extractContext`) | ✅ | File 162 LOC. |
| `packages/telemetry/src/instrumentation/worker.ts:202-287` (`traceJobExecution`) | ✅ | File 570 LOC. |
| `packages/telemetry/src/public/mod.ts:9-27` | ✅ | File 27 LOC. |
| `plugins/sagas/services/src/main.ts:93` (createSagaTelemetry injection) | ✅ | `import { createSagaTelemetry } from '../../src/telemetry/otel-saga-tracer.ts'` at line 33; `.withInstrumentation({ instrumentation: createSagaTelemetry(), … })` at line 93. |
| `plugins/sagas/src/telemetry/otel-saga-tracer.ts:22-44` | ✅ | File 102 LOC. |
| `plugins/workers/services/src/main.ts:62` (`withRPC({ traceContext: true })`) | ✅ | `.withRPC({ traceContext: true })` confirmed on workers `main.ts` (auth's `.withRPC` lives at `plugins/auth/services/src/main.ts:74`). |
| `plugins/workers/services/src/routers/jobs.ts:93-119` | ✅ | File 122 LOC. |
| `plugins/workers/worker/job-dispatcher.ts:27-28` + `:58-66` (extract + persist traceparent) | ✅ | File 297 LOC. |
| `plugins/auth/services/src/main.ts:74` (`.withRPC({ traceContext: true })` on auth) | ✅ | Confirmed. |

All 18 anchors resolve. No drift.

## 7. Net-new telemetry surface (plan-gate §5)

- `packages/plugin-auth-core/src/` currently contains: `config/`, `contracts/`, `domain/`, `ports/`, `presets/`, `public/`, `streams/`, `testing/`. **No `telemetry/` directory exists.** ✅
- Plan §3 introduces `packages/plugin-auth-core/src/telemetry/` (additive, no conflicts). ✅

Surface is genuinely net-new — no duplication or migration risk.

## 8. Decision soundness

### D2 — salted HMAC subject-hash

- `HMAC-SHA-256(subject, deployment_salt)`. Salt from deployment config (env/appsettings), **never derived from subject**. Same subject → same hash within a deployment → audit correlation. Not reversible. Not cross-deployment-linkable. ✅
- Sound, well-motivated design. Uses Web Crypto `crypto.subtle.sign('HMAC', …)` (no hand-rolled hashing).

### D3 — mandatory tested redaction

- `SENSITIVE_FIELD_FRAGMENTS` extension adds `['sessionid','accesstoken','refreshtoken','jwttoken']`. These are app-specific fragments, distinct from existing 7. ✅
- `redactAuthPrincipal()` hashes `subject` and strips token-bearing claims before any span attribute / log field. ✅
- §3 negative assertions over serialized output guarantee "no raw subject/token" in span attributes or log fields. ✅
- Sound — closes research.md §5 baseline gap.

### D4 — per-operation child spans

- `auth.signin|callback|signout|session|me`, parented via `getParentContextFromHeaders(ctx.traceHeaders)` — exactly the workers `job-dispatcher.ts:27-28` pattern, and `withRPC({ traceContext: true })` already in place at `plugins/auth/services/src/main.ts:74`. ✅
- Connection to inbound request trace is established by existing service-builder plumbing, not new cast-worthy code. Sound.

### D5 — durable-event traceparent propagation against AS4 emit seam

- Auth durable events emit through `plugins/auth/streams/producer.ts` (verified `upsert`/`delete` via `DurableStreamProducer` from `@netscript/plugin-streams-core`); producer interface has `upsert`/`delete`/`flush`/`close`.
- Plan calls for `injectContext()` onto event payload/headers + persist `traceparent`/`tracestate` on the event record, mirroring `plugins/workers/worker/job-dispatcher.ts:58-66` execution-state persistence. ✅
- **Contingency noted in plan §6:** if the AS4 emit seam cannot carry `traceparent` without a typed change, the plan **explicitly requires** a scoped `arch-debt.md` entry rather than smuggling a cast. ✅
- Sound; the contingency is the right call — it preserves zero-cast compliance and keeps debt visible.

### D6 — typed error taxonomy via ErrorHandlingPlugin

- `ErrorHandlingPlugin` lives at `packages/telemetry/src/orpc/error-plugin.ts` (referenced from `plugins/auth/tests/services/auth-service_test.ts` and `packages/service/src/primitives/handlers.ts`). ✅
- Typed codes `AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`, `AUTH_PROVIDER_ERROR`, `AUTH_CALLBACK_INVALID` map from backend string reasons at the service seam; backends stay unchanged externally. ✅
- Sound, machine-readable audit outcomes.

### D7 — middleware seam out of scope

- `packages/service/src/auth/auth-middleware.ts` excluded with explicit follow-up trigger (only if AS7 fitness flags it). ✅
- Good slice discipline; keeps AS8 bounded to the auth plugin's owned surface.

## 9. Doctrine and debt

- Contract-first ✅ (Section 3)
- No reinvention ✅ (reuses `@netscript/telemetry` + `@netscript/logger`)
- Additive-only public surface ✅ (Section 3, Section 5)
- No new debt entries required for AS8. §6 is a forward-looking contingency for D5, not a current obligation. ✅
- Plan does **not** introduce a doctrine violation.

## 10. Drift check

- No drift detected between `plan.md` / `research.md` and the repo state on `main` @ `6f1c40f0`. All anchors resolve; surface is net-new; gate set is scoped correctly; out-of-scope middleware is explicitly bounded; umbrellas (auth #73 + framework-prime-time #86) are already merged at base.

## 11. Verdict

**PASS.**

The plan is contract-first, zero-cast compliant, archetype/scope-correct, anchor-verified, net-new surface, with an adequate scoped gate set and a sound contingency path for the durable-event propagation. The generator may proceed on `feat/prime-time/auth-s8-audit-observability` (base `origin/main` @ `6f1c40f0`) without further planning cycles.

## 12. Implementation constraints (carried forward to IMPL-EVAL)

- No source modifications during PLAN-EVAL (this session). ✅ (no commits to source; only `plan-eval.md` written).
- No `deno.lock` churn.
- No junk files.
- All gate evidence must be persisted at `.llm/tmp/run/auth-s8-audit-observability/gates/`.
- If D5 hits the AS4 typed-change contingency, file a scoped `arch-debt.md` entry **before** the cast is smuggled in.
