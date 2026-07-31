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

## 2026-07-31 — TypeScript AppHosts do not receive Aspire's isolation signal

- **What:** The resolved plan assumes `aspire start --isolated` exposes
  `DcpPublisher__RandomizePorts=true` to the generated TypeScript AppHost.
- **Source:** Aspire 13.4.6 `GuestAppHostProject.cs` plus live generated-workspace reproduction.
- **Expected:** Generated AppHost code can read the signal without a NetScript start wrapper.
- **Actual:** Only the .NET AppHost path sets the key; a raw TypeScript isolated start retained
  persistent lifetime. The generated `aspire:start` task now bridges the upstream key when passed
  `--isolated`, without changing non-isolated starts or resource names.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `research.md` finding 8 and live `aspire describe` evidence.

## 2026-07-31 — Prisma Studio exit is environmental, not a missing task

- **What:** The resolution requires reproducing the reported exit 1 before choosing validation or
  observability.
- **Source:** Generated workspace direct task and Aspire-managed runs.
- **Expected:** The generated task itself is absent or invalid.
- **Actual:** Direct execution exits because `DATABASE_URL` is absent; Aspire supplies that value
  and Studio runs. The slice therefore implements only the authorised observability half.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `research.md` finding 9 and live forced-failure resource-state proof.

## 2026-07-31 — A Deno subprocess wrapper changes detached-start ownership

- **What:** The first generated timeout/isolation task wrapped `aspire start` in `Deno.Command` so
  it could default one environment value and inspect `--isolated`.
- **Source:** Live generated-workspace detached starts.
- **Expected:** The wrapper would preserve the CLI's detached AppHost lifetime.
- **Actual:** The AppHost remained coupled to the wrapper's terminal/process ancestry. The final
  design emits direct cross-platform Deno task-shell commands: ordinary and isolated variants,
  each with the 300-second default; only the isolated task exports the upstream isolation key.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** generated `aspire:start` / `aspire:start:isolated` contracts and focused tests.
