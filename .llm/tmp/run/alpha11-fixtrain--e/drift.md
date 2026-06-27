# Drift Log: alpha.11 fix-train Slice E

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-06-27 — Run artifact directory created by implementation slice

- **What:** `.llm/tmp/run/alpha11-fixtrain--e/` did not exist at preflight.
- **Source:** `rtk ls .llm/tmp/run/alpha11-fixtrain--e`
- **Expected:** Slice prompt required appending run artifacts in that directory.
- **Actual:** Directory was absent, so this slice created scoped `worklog.md`, `drift.md`, and `commits.md`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Newly added run artifacts under `.llm/tmp/run/alpha11-fixtrain--e/`.

## 2026-06-27 — F-14 verify-first disposition pending runtime evidence

- **What:** Current service package code already wires plain health endpoints.
- **Source:** `packages/service/src/presets/define-service.ts`, `packages/service/src/builder/service-builder-impl.ts`, `packages/service/src/auth/auth-middleware.ts`
- **Expected:** F-14 only changes scaffolded health routes if plain `/health` is genuinely not served.
- **Actual:** Static code review indicates `defineService()` calls `builder.withHealth().serve()`, `withHealth()` registers `GET /health`, `GET /health/live`, and `GET /health/ready`, and `/health` is anonymous by default.
- **Severity:** minor
- **Action:** defer
- **Evidence:** New `behavior.service-health` gate will decide no-op vs fix during full `scaffold.runtime`.

## 2026-06-27 — F-14 closed as no-op

- **What:** The new service health probe passed in the full runtime scaffold smoke.
- **Source:** `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
- **Expected:** If `behavior.service-health` was green, F-14 needed no scaffold health route rewrite.
- **Actual:** `behavior.service-health: Users service health` passed on Linux/WSL after endpoint discovery through `aspire describe --format Json`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Full e2e summary `passed=48 failed=0`; `behavior.service-health` passed.

## 2026-06-27 — F-13 diagnostic conclusion

- **What:** Linux/WSL `aspire start --isolated` served the generated `users` service health endpoint.
- **Source:** Full `scaffold.runtime` e2e with the new `behavior.service-health` gate.
- **Expected:** Green on Linux/`aspire start` means the prior F-13 failure mode is Windows/`aspire run` specific.
- **Actual:** The service health probe was green and cleanup stopped the generated AppHost.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `behavior.service-health` passed; full e2e summary `passed=48 failed=0`.
