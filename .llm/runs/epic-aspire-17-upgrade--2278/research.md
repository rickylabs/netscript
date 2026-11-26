# Research — Aspire `13.5.3` → `17.0.0` Adoption (`#2278`)

**Baseline:** `origin/main` at `36a464c23` (verified 2026-11-26/27).  
**Target:** Aspire `17.0.0` stable train for NetScript `0.0.10` canary.

---

## 1. Live NuGet & Upstream Aspire `13.5.3` → `13.6.x` → `17.0.0` Delta

### 1.1 Verified NuGet Package Matrix (live NuGet v3 index)

| Package ID | Old Pin (`0.0.9` / `canary.6`) | Verified `17.0.0` Pin | Disposition |
| --- | --- | --- | --- |
| `Aspire.Cli` | `13.5.3` | **`17.0.0`** (`17.0.0+2d325b13...`) | Update `.github/toolchain.env`, `e2e-cli*.yml`, consumer CI |
| `Aspire.Hosting.AppHost` (SDK) | `13.5.3` | **`17.0.0`** | Update `SCAFFOLD_VERSIONS.ASPIRE_SDK` |
| `Aspire.Hosting.JavaScript` | *(absent)* | **`17.0.0`** | **Add** — ships first-party `AddDenoApp` / `DenoAppResource` (`microsoft/aspire#18628`) |
| `Aspire.Hosting.PostgreSQL` | `13.5.3` | **`17.0.0`** | Update pin + adopt `.withRepl()` |
| `Aspire.Hosting.MySql` | `13.5.3` | **`17.0.0`** | Update pin + adopt `.withRepl()` |
| `Aspire.Hosting.SqlServer` | `13.5.3` | **`17.0.0`** | Update pin + adopt `.withRepl()` |
| `Aspire.Hosting.Browsers` | `13.5.3-preview.1.26425.3` | **`17.0.0-preview.1.26567.5`** | Update preview pin; update `arch-debt.md` row `aspire-browsers-preview-1713` |
| `Aspire.Hosting.Redis` | `13.5.3` | *(unused)* | **Remove** from `aspire.config.json` & `scaffold-aspire.ts` — caches use `builder.addContainer()` directly |
| `Aspire.Hosting.Garnet` | `13.5.3` | *(unused)* | **Remove** from `aspire.config.json` & `scaffold-aspire.ts` — Garnet uses `builder.addContainer()` / `addExecutable()` |
| `CommunityToolkit.Aspire.Hosting.Deno` | `13.5.0` | *(superseded)* | **Remove** dead `ASPIRE_HOSTING_DENO` / `DENO_KV` constants — superseded by `Aspire.Hosting.JavaScript@17.0.0` |
| `CommunityToolkit.Aspire.Hosting.Sqlite` | `13.5.0` | *(unused)* | **Remove** dead `ASPIRE_HOSTING_SQLITE` constant — SQLite uses `builder.addParameter()` + file URL |
| `Scalar.Aspire` | `0.10.3` | *(unused)* | **Remove** dead `SCALAR_ASPIRE` constant (zero callers in TS AppHost) |

### 1.2 Breaking Changes & Behavioral Deltas Verified in `17.0.0` Source + Live CLI

1. **First-party Deno hosting (`Aspire.Hosting.JavaScript@17.0.0`, `#18627`/`#18628`):**
   - `builder.addDenoApp(name: string, appDirectory: string, scriptPath: string): DenoAppResourcePromise`
   - `DenoAppResource` inherits `JavaScriptAppResource` → `ExecutableResource`. Live `aspire describe --format Json` reports `"resourceType": "Executable"` and new `"resourceTypeDisplayName": "Deno"`.
   - `WithDenoDefaults()` automatically configures:
     - `OTEL_DENO=true`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL` (`http/protobuf` when `ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL` is configured), `OTEL_EXPORTER_OTLP_CERTIFICATE`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_TRACES_SAMPLER=always_on`, `OTEL_BSP_SCHEDULE_DELAY=1000`, `OTEL_BLRP_SCHEDULE_DELAY=1000`, `OTEL_METRIC_EXPORT_INTERVAL=1000`, `OTEL_METRICS_EXEMPLAR_FILTER=trace_based`, `DENO_CERT`, `SSL_CERT_DIR`.
     - Default `--allow-all` UNLESS `.withDenoAllowAll({ enabled: false })` is called.
   - Exact ATS-projected TypeScript signatures verified from generated `.aspire/modules/aspire.mts`:
     - `.withDenoAllowAll(options?: { enabled?: boolean })`
     - `.withDenoAllow(kind: DenoPermissionKind, values: string[])`
     - `.withDenoDeny(kind: DenoPermissionKind, values: string[])`
     - `.withDenoConfig(configFile: string)`
     - `.withDenoNodeModulesDir(options?: { mode?: DenoNodeModulesDirMode | null })`
     - `.withDenoUnstable(features: string[])` (accepts short names e.g. `'worker-options'`, `'no-legacy-abort'` or full `'--unstable-*'`)
     - `.withDenoWatch(options?: { hmr?: boolean })`
     - `.withDenoTask(taskName: string)` (runs `deno task <taskName>`; permissions owned by task, not emitted)
     - `.withDenoRuntimeArgs(args: string[])` (injected before entrypoint/task)
     - `.withDenoScriptArgs(args: string[])` (injected after entrypoint/task)
     - `.withBrowserLogs(options?: WithBrowserLogsOptions)` is directly exported on `DenoAppResourcePromise`.
2. **Native Deno TypeScript AppHost toolchain (`TypeScriptAppHostToolchainResolver.cs`, `#16218`):**
   - Aspire `17.0.0` automatically selects `deno` when `aspire/deno.json` (or `deno.jsonc`) exists and `aspire/package.json` is absent.
   - Canonical `aspire.config.json` `appHost.language` stays `"typescript/nodejs"`; `aspire doctor --format Json` reports `environment/typescript-apphost-tools: pass` with `metadata: { language: "typescript/nodejs", toolchain: "deno" }`.
   - Generated SDK modules remain at `aspire/.aspire/modules/aspire.mts` (importing `./transport.mjs` and `./base.mjs`, requiring Deno `unstable: ["sloppy-imports"]`, plus `vscode-jsonrpc/node.js`).
   - **Deno Workspace Finding (verified live):**
     - `packages/aspire/deno.json` uses `"zod": "catalog:"`. If `aspire/deno.json` is NOT a workspace member of the generated project root, Deno prints a warning (`not a member of the workspace ... Ignoring the parent workspace config`) AND fails with `Package 'zod' not found in catalog` in local-source mode.
     - Additionally, Deno warns if `"unstable"` is placed in a workspace member `deno.json` instead of the workspace root.
     - **Verified Zero-Warning Configuration:** Add `"./aspire"` to generated root `deno.json` `workspace` and include `"sloppy-imports"` in root `deno.json` `unstable` (`["raw-imports", "kv", "sloppy-imports"]`) when `!options.noAspire`. `aspire/deno.json` then declares ONLY `"imports"` (`vscode-jsonrpc`, `zod: "catalog:"`, `@netscript/aspire` in JSR mode / non-workspace local mode, and `pg` when Postgres is configured), yielding zero warnings and native `deno check` / `deno run` resolution in both local and JSR modes!
3. **`aspire agent init` Breaking CLI Flag & Skill ID Redesign (`AgentInitCommand.cs`):**
   - `--skill-locations` was **REMOVED**.
   - The four old skill IDs (`aspire-init`, `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment`) are **NO LONGER VALID**.
   - Live `aspire agent init --help` options:
     - `--workspace-root <dir>`
     - `--agents <copilot,claude,opencode|all|none>`
     - `--scope <project|global>` (default `project`)
     - `--skills <aspire,playwright-cli,dotnet-inspect|all|none>` (default `aspire`; `dotnet-inspect` requires C# AppHost)
     - `--mcp` / `--mcp=false`
     - `--remove-skill-copies`
   - Because NetScript ships its own canonical `.agents/skills/aspire/SKILL.md` and writes `.mcp.json` directly, `aspire agent init` MUST be updated so it does NOT fail with unknown `--skill-locations` or unknown skill IDs and does NOT overwrite NetScript's canonical `aspire` skill or `.mcp.json`.
   - Specifically: check what `aspire agent init --non-interactive --nologo --workspace-root <root> --agents claude --scope project --skills none --mcp=false` vs plugin-based skill wiring does, and align `init-agent.ts` + `deno-aspire-agent-initializer.ts` + `aspire-agent-initializer.ts` (details locked in `plan.md` §3).
4. **Aspire MCP 15th Tool (`wait_for_resources`) & Deprecated `aspire mcp start`:**
   - Live `aspire agent mcp` `tools/list` returns 15 tools (`serverInfo.version: "17.0.0"`):
     `list_resources`, **`wait_for_resources`**, `list_console_logs`, `execute_resource_command`, `list_structured_logs`, `list_traces`, `list_trace_structured_logs`, `select_apphost`, `list_apphosts`, `list_integrations`, `doctor`, `refresh_tools`, `list_docs`, `search_docs`, `get_doc`.
   - `aspire mcp start` is deprecated (emits warning; delegates to `aspire agent mcp`). NetScript already configures `aspire agent mcp`.
5. **`EndpointProperty.BrowserOrigins` & Container DB `.withRepl()`:**
   - Live `.aspire/modules/aspire.mts` exports `EndpointProperty.BrowserOrigins` (`endpoint.property(EndpointProperty.BrowserOrigins)`), resolving to browser-ready origins (e.g. `"http://localhost:33959"`).
   - `PostgresServerResource`, `MySqlServerResource`, and `SqlServerServerResource` all export `.withRepl()` in `17.0.0`.
6. **Dashboard Telemetry API (Native AOT + SQLite persistence):**
   - Live `17.0.0` verified `POST /api/telemetry/validateToken` → `X-API-Key` AND anonymous mode (`ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true`):
     - `GET /api/telemetry/resources` → HTTP `200`, `[{"name":"api","instanceId":"...","displayName":"api-...","hasLogs":true,"hasTraces":true,"hasMetrics":true}]`
     - `GET /api/telemetry/spans` → HTTP `200`, `{"data":{"resourceSpans":[...]}}`
     - `GET /api/telemetry/traces` → HTTP `200`, `{"data":{"resourceSpans":[...]}}`
     - `GET /api/telemetry/logs` → HTTP `200`, `{"data":{"resourceLogs":[...]}}`
   - Exact OTLP JSON contract expected by `packages/mcp` (`validateDashboardEnvelope`) and `packages/cli/e2e` (`aspire-dashboard-api.ts`) is 100% preserved.

---

## 2. S0 Live Empirical Spike Receipts (`Aspire.Cli@17.0.0+2d325b13`)

Executed locally on `deno 2.9.8` + `dotnet 10.0.400` in `.llm/tmp/aspire-17-spike/test-deno-apphost/` (zero `package.json`, zero `node_modules`):

| Check | Measured Result | Decision Impact |
| --- | --- | --- |
| `aspire restore --non-interactive` (v1, JS + Postgres + Browsers) | **4,602 ms** (exit 0), generates `.aspire/modules/{aspire,base,transport,integration-host}.mts` | Native Deno restore works cleanly without Node/npm |
| `aspire start --isolated --non-interactive` (v1, Deno AppHost + `addDenoApp` + Postgres + Browsers) | **6,219 ms** (exit 0); `api` healthy in **0.0s** | Cold start dramatically faster than Node/tsx |
| `aspire stop --apphost apphost.mts --non-interactive` | **2,335 ms** (exit 0) | Clean stop |
| `features.appHostServerV2: true` (`aspire restore`) | **FAILED (exit 6):** `"AppHost Server v2 requires protocol-v2 provider packages. Managed integration assemblies cannot be loaded into this server."` | **LOCKED NO-GO** on `appHostServerV2` in `17.0.0`; retain default v1 AppHost server |
| `#2259` Live Secret Redaction (`addPostgres` secret password + `withEnvironment('DATABASE_URL', db)` + `withReference(db)`) | Inside `api` process: `hasDbUrlSecretInProcess: true`, `hasConnStrSecretInProcess: true`. In `aspire describe --format Json` & table: `DATABASE_URL: null`, `ConnectionStrings__appdb: null`, `APPDB_URI: null`, `APPDB_PASSWORD: null`, `describe JSON contains secret?: false`, `describe TABLE contains secret?: false` | **HUGE FINDING:** Aspire `17.0.0` redacts composed connection-string secrets to `null`! Restore whole-snapshot scan in `credential-secret-surfaces.ts` and prove live on hosted Postgres `scaffold-runtime` to close `#2259` |
| `aspire doctor --format Json` | Emits 10 checks including `environment/typescript-apphost-tools` (`toolchain: "deno"`) and new `environment/aspire-skill-sources` warning | Update doctor fixture & expectations |
| `aspire agent mcp` `tools/list` | 15 tools (`wait_for_resources` added), `serverInfo.version: "17.0.0"` | Update `tools.ts` + recorded fixture + skills |
| Deno workspace + `aspire/deno.json` + local `@netscript/aspire/*` | Zero warnings, `deno check` + `deno run` exit 0 when `./aspire` is a workspace member and root `deno.json` declares `unstable: ["raw-imports", "kv", "sloppy-imports"]` | Locks clean D-7 retirement architecture |

---

## 3. Audit of All 9 Linked Issues & Architecture Debt

| Issue / Debt | Status & Finding | Disposition in This Run |
| --- | --- | --- |
| **#2278** (Epic) | Scoped to `13.6.5`; re-scoped to `17.0.0` per owner | Reference `Part of #2278` (never `Closes` on epic); post re-scope comment |
| **#319** (Layer A: Deno TS AppHost) | Aspire `17.0.0` ships `TypeScriptAppHostToolchainResolver` with native Deno support | **Resolve (`Closes #319`)** in S2 (`aspire/deno.json`, `quality-runner.ts` Deno check, reconciler) |
| **#320** (Layer B: `AddDenoApp`) | Aspire `17.0.0` ships `AddDenoApp` / `DenoAppResource` in `Aspire.Hosting.JavaScript@17.0.0` | **Resolve (`Closes #320`)** in S3 (`register-services`, `register-plugins`, `register-background`, `register-apps` migrated from `addExecutable` to `addDenoApp`) |
| **#295** (Dogfood proof) | Full framework dogfood on native Deno AppHost + `AddDenoApp` | **Resolve (`Closes #295`)** in S6 via hosted `scaffold-runtime` + `scaffold-runtime-sqlite` |
| **#2259** (P1 Security: `aspire describe` password exposure) | S0 live spike proved Aspire `17.0.0` redacts `DATABASE_URL`, `ConnectionStrings__appdb`, `APPDB_URI`, `APPDB_PASSWORD` to `null` while process receives real secret | **Restore whole-snapshot scan** in `credential-secret-surfaces.ts` (S4); prove on hosted Postgres `scaffold-runtime` (S6); **`Closes #2259`** once hosted gate passes (if Postgres container exposes anything else on hosted CI, keep scoped exemption + file upstream issue) |
| **#2174** (Empty-section helper lint) | `empty-registration_test.ts` covers only 3 of 7 helpers (`plugins`, `background`, `tools`); `registerApps`, `registerServices`, `registerInfrastructure`, `dbCliMode` still have unused imports/params/variables when empty | **Resolve (`Closes #2174`)** in S3; expand `empty-registration_test.ts` to lint & invoke all 7 empty helpers |
| **#2202** (Foreign Docker daemon loopback fail-loud) | `DockerCliTopologyInspector` + `assessDockerTopology` already exist for `plugin doctor`, but `DbOperationRunner.waitForDatabase` (and runtime waits) only print generic timeout when a health wait hangs against a remote Docker daemon's loopback | **Resolve (`Closes #2202`)** in S3 by diagnosing foreign/remote Docker daemon locality during health wait timeout (or fast preflight/threshold check) with actionable diagnostic pointing to `netscript doctor`, plus unit tests for remote vs local daemon |
| **#1726 / #2184** (DB credential readiness & hardcoded MSSQL password) | `generate-register-infrastructure.ts:28` hardcodes `MSSQL_SA_PASSWORD = 'NetscriptE2e!Sql2026'`; Aspire `17.0` `AddMySql`/`AddSqlServer` include built-in C# health checks | Replace hardcoded `MSSQL_SA_PASSWORD` with `ensureDatabasePassword` (using SQL Server complexity-safe generator!) in S3; partial reference `#1726`/`#2184` (do not close `#2184` until MySQL/MSSQL live container E2E lanes exist) |
| **Exit 16 Flake** (`Failed to stop resource '*-web-*'`) | `DcpPipelineBuilder.BuildDeleteRetryPipeline` unchanged in `17.0.0` (10 retries / ~15s); `refresh-generated-client-consumers.ts` fails immediately on transient exit 16 | Harden `refresh-generated-client-consumers.ts` in S4: verify `resourceType === 'Executable'` (still true for `DenoAppResource`), add bounded single retry / stop-settle recovery on transient exit 16 (and inspect Fresh/Vite dev server signal exit) with deterministic unit tests |
| **`arch-debt.md` D-7 & CommunityToolkit Deno deferral** | `_aspire-compat.mts` duplicates ~400 LOC of `@netscript/aspire` types/schemas/constants/env/perms/parser; `arch-debt.md:208` defers Deno hosting adoption | **Close D-7 & CommunityToolkit deferral** in S2/S5; keep only lean AppHost-local readiness & host-IO helpers; update `aspire-browsers-preview-1713` to `17.0.0-preview.1.26567.5` |

---

## 4. `jsr-audit` & Doctrine Surface Check

Checked affected published packages against `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` and `deno.json` exports:
- **`@netscript/aspire` (`packages/aspire`):**
  - Existing exports (`.`, `./config`, `./schema`, `./types`, `./constants`, `./application`, `./adapters`, `./testing`, `./public`) remain **100% backwards-compatible**.
  - `packages/aspire/config.ts` is 934 LOC (pre-existing debt); we will NOT bloat `config.ts`. Any new pure helper (e.g., `parseDenoPermissionFlags` if placed in `@netscript/aspire/application` or kept in `packages/cli` template) stays under 200 LOC with full JSDoc and explicit return types for `deno doc --lint` & `deno publish --dry-run` (zero slow types).
  - Note: `packages/aspire/src/application/resolve-paths.ts` `resolveWorkspacePath` navigates up 2 levels (`..`, `..` for historical `dotnet/AppHost`) — we MUST preserve its existing contract untouched so `@netscript/aspire/application` tests and callers never break.
  - Check `RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp` in `@netscript/aspire/constants`: if added (1 boolean constant with JSDoc), run `deno doc --lint` + `deno publish --dry-run` + `gen:mcp-export-corpus` check.
- **`@netscript/cli` (`packages/cli`):**
  - Archetype 6 public/maintainer split preserved (`arch:check` enforces zero maintainer leakage).
  - `packages/cli/src/kernel/adapters` and `packages/cli/e2e/src/application/gates/scaffold` have open F-16 cardinality debt (`cli-showcase-cardinality-2571`): **DO NOT add new immediate children to either directory** (place new helpers inside existing `adapters/aspire/`, `adapters/database/operations/`, `templates/aspire/`, etc.!).
- **`@netscript/mcp` (`packages/mcp`):**
  - No public API changes expected; telemetry fixtures updated to `17.0.0` (single-version `17.0.0` fixtures per owner decision A4).
