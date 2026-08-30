# Drift Log: Aspire 13.5 listener-readiness health checks

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-30 — Deno KV carried-in health-check assumption is absent

- **What:** The current `denokvContainerSetup` emits an HTTP endpoint but no
  `withHttpHealthCheck` call.
- **Source:** `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts`.
- **Expected:** #1718 says the existing Deno KV HTTP health check remains unchanged.
- **Actual:** No existing Deno KV health check is present on stacked S5 head `0bd8ba832`.
- **Severity:** significant.
- **Action:** defer; preserve the owner's explicit “Deno KV unchanged” S6 boundary and surface the
  mismatch to the supervisor.
- **Evidence:** `rg 'withHttpHealthCheck' packages/cli/src/kernel/templates/aspire` returns only
  unrelated generated service/app registrations, not Deno KV infrastructure.

## 2026-08-30 — E2E registry debt stop condition still applies

- **What:** The new listener gate encounters the explicit “next gate” stop condition in
  `scaffold-runtime-a8-f16-1333`.
- **Source:** `.llm/harness/debt/arch-debt.md` and current filesystem measurement.
- **Expected:** A new gate may be added only after the owed role-named runtime registry split.
- **Actual:** `runtime-gates.ts` is 812 lines and the scaffold gate folder has 48 direct files.
- **Severity:** significant.
- **Action:** fix within S6 before registering the new readiness gate; extract behavior/runtime
  script modules and group readiness probes without increasing the direct-child count.
- **Evidence:** `wc -l packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`; direct
  `find ... -maxdepth 1 -type f | wc -l`.
