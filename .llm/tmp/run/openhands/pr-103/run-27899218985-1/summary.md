# AS8 — Auth Audit Observability — PLAN-EVAL summary

## Summary

PLAN-EVAL pass for slice `auth-audit-observability` on branch
`feat/prime-time/auth-s8-audit-observability` (HEAD `3b9c75b1`, base
`origin/main` @ `6f1c40f0`). Re-baseline already applied; both prior
umbrellas (`feat/prime-time/auth` #86 and `feat/prime-time` #73) are in
`main`, so S6 + S7 + AS7 dependencies are satisfied at base.

Verdict: **PASS**.

## Changes

- `.llm/tmp/run/auth-s8-audit-observability/plan-eval.md` — new file, the
  PLAN-EVAL verdict artifact with all anchors verified against `main`
  @ `6f1c40f0`, archetype/scope/zero-cast/gate-set/soundness checks
  recorded with concrete file:line evidence.
- No source modifications, no `deno.lock` churn, no junk files.

## Validation

Anchor resolution sweep (18 anchors) — all green:

- `packages/auth-better-auth/src/better-auth.ts:136-162` — bare
  `better_auth_session_lookup_failed` confirmed.
- `packages/auth-workos/src/workos-authenticator.ts:147-187` — bare
  `workos_session_cookie_missing` / `workos_authentication_failed`
  confirmed.
- `packages/service/src/builder/service-builder-impl.ts:244-267`,
  `packages/service/src/primitives/handlers.ts:72-114` — both resolve.
- `packages/logger/constants.ts:11-19` — `SENSITIVE_FIELD_FRAGMENTS`
  list verified; extension with `sessionid/accesstoken/refreshtoken/
  jwttoken` is additive, non-conflicting.
- `packages/logger/orpc-plugin.ts:376-394` — `redactSensitiveFields`
  confirmed.
- `packages/telemetry/{deno.json:6-14,
  src/context/{mod,payload-context,w3c}.ts,
  src/instrumentation/worker.ts, src/public/mod.ts}` — all resolve;
  `packages/telemetry` exports `.`, `.config`, `./tracer`, `./context`,
  `./attributes`, `./instrumentation`, `./registry`, `./orpc`.
- `plugins/sagas/services/src/main.ts:93` (`createSagaTelemetry()`
  injection), `plugins/sagas/src/telemetry/otel-saga-tracer.ts:22-44` —
  both resolve.
- `plugins/workers/{services/src/main.ts:62, services/src/routers/jobs.ts:93-119, worker/job-dispatcher.ts:27-28,58-66}` — all resolve.
- `plugins/auth/services/src/main.ts:74` — auth's `.withRPC({ traceContext: true })` confirmed (matches workers `main.ts:62` pattern).

Doctrine and gate-set checks — all green:

- Archetype selection: ARCHETYPE-5 (plugin) + supporting ARCHETYPE-2/3
  (`packages/plugin-auth-core`) + `SCOPE-service.md` overlay. Correct.
- Contract-first ordering: `AuthAttributes`/`AuthSpanNames`/`AuthErrorCode` typed constants → `createAuthTelemetry()` → service wiring → tests. Mirrors sagas DI seam (`plugins/sagas/services/src/main.ts:93`).
- Zero-cast compliance: no router-composition Class A (auth does not use
  that router shape) and no external-boundary Class B (backends stay
  pure). Confirmed against `arch-debt.md:875,889`.
- Gate set: `deno task check` + `--unstable-kv` on KV-touching paths;
  scoped `run-deno-{check,lint,fmt}.ts` on `packages/plugin-auth-core` +
  `plugins/auth` (`--ext ts,tsx`); `deno task test` for auth +
  plugin-auth-core; `jsr-audit` A1 full export set on
  `packages/plugin-auth-core`. `scaffold.runtime` deferred to
  umbrella merge-readiness (per AGENTS.md trigger template).
- Net-new surface: `packages/plugin-auth-core/src/telemetry/` does not
  exist today; no conflict.
- Decision soundness:
  - D2 salted HMAC `auth.subject_hash` (deployment-config salt,
    non-derived, stable, non-reversible, non-cross-deployment-linkable).
  - D3 mandatory tested redaction with `redactAuthPrincipal()` +
    `SENSITIVE_FIELD_FRAGMENTS` extension + negative assertions over
    serialized output.
  - D5 durable-event `traceparent` propagation against AS4 emit seam;
    contingency path is debt entry (not cast) if the typed seam
    blocks it — already declared in `plan.md` §6.
  - D6 typed error taxonomy (`AUTH_INVALID_CREDENTIALS`, etc.)
    classified via `ErrorHandlingPlugin`
    (`packages/telemetry/src/orpc/error-plugin.ts`).
  - D7 middleware seam (`packages/service/src/auth/auth-middleware.ts`)
    explicitly out of scope.

## Responses to review comments or issue comments

None. This is a Plan-Gate pass on a fresh plan-of-record branch; no
prior review comments to address. The trigger comment itself requested
this PLAN-EVAL pass; verdict artifact is the response and will be
posted by the workflow from `plan-eval.md`.

## Remaining risks

- `deno.lock` may move on first run; IMPL-EVAL must verify and only
  commit reviewed changes.
- D5 contingency: if `injectContext()` cannot fit on the AS4 emit
  payload without a typed change, the generator must file a scoped
  `arch-debt.md` entry rather than smuggle a cast. This is a Plan
  constraint, not a Plan-Gate failure.
- Middleware (`packages/service/src/auth/auth-middleware.ts`) remains
  un-instrumented by design; AS7 fitness flags could promote it to a
  follow-up slice if it surfaces as an observability gap.
- No new `arch-debt.md` entries are filed by this plan.
