# Drift Log: aspire lifecycle (#958, #970)

Drift is append-only.

## 2026-07-31 — Aspire 13.4.6 already exposes timeout configuration

- **What:** The binding plan treats timeout configurability as a missing contract.
- **Source:** Upstream Aspire `v13.4.6` `AppHostStartupTimeout.cs` and `CliConfigNames.cs`.
- **Expected:** Add configurability as part of this NetScript fix.
- **Actual:** `ASPIRE_CLI_START_TIMEOUT` already configures the 120-second detached-start budget.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `research.md` findings 3–4.

## 2026-07-31 — Prisma Studio task exists

- **What:** The binding plan proposes failing generation when `db:studio` is absent.
- **Source:** `packages/cli/src/kernel/templates/database/generate-db-deno-json.ts`.
- **Expected:** The generated executable exits because the referenced task is missing.
- **Actual:** Each generated database workspace defines `db:studio`; the failure cause must be
  reproduced from process output instead of inferred from task presence.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `research.md` findings 5–6.

## 2026-07-31 — Detached-start phase reporting is upstream-owned

- **What:** The plan requires current phase and elapsed time during `aspire start`.
- **Source:** Upstream Aspire `v13.4.6` `StartCommand.cs` and `AppHostLauncher.cs`.
- **Expected:** Implement the observable start contract in NetScript.
- **Actual:** NetScript generates the AppHost but does not implement the `aspire start` detached
  launcher or its dynamic status output.
- **Severity:** architectural
- **Action:** rescope
- **Evidence:** `research.md` findings 3–4.

## 2026-07-31 — Isolated lifetime workaround is reachable

- **What:** The plan was unsure whether isolation identity is reachable from generated AppHost
  code.
- **Source:** Upstream Aspire `v13.4.6` `DotNetAppHostProject.cs` and `RunCommandTests.cs`.
- **Expected:** Namespace, override, or reject based on an unknown SDK surface.
- **Actual:** The AppHost receives `DcpPublisher__RandomizePorts=true`, allowing a generated
  conditional that keeps ordinary persistent behavior and chooses session lifetime when isolated.
- **Severity:** minor
- **Action:** propose-update
- **Evidence:** `research.md` findings 1–2.

