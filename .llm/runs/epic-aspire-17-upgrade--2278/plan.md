# Plan — Upgrade NetScript to Aspire `17.0.0` (`#2278`)

- **Run ID:** `epic-aspire-17-upgrade--2278`
- **Branch:** `epic/aspire-17-upgrade`
- **Base Commit:** `origin/main` `36a464c23`
- **Target Release:** Next `0.0.10` canary (following `v0.0.10-canary.6`)
- **Primary Archetype:** Archetype 6 — CLI / Tooling (`packages/cli`, `.llm/tools/*`, `.github/workflows/*`)
- **Secondary Archetype:** Archetype 2 — Integration / Adapter Package (`packages/aspire`, `packages/mcp`)
- **Overlays:** `SCOPE-docs`, `SCOPE-service`

---

## 1. Scope & Non-Scope

### In Scope (Owner-Approved A1–A4 + S0 Verified)
1. **Atomic Aspire `17.0.0` pin upgrade & dead-pin cleanup:**
   - Bump `Aspire.Cli`, `Aspire.Hosting.AppHost`, `Aspire.Hosting.PostgreSQL`, `Aspire.Hosting.MySql`, `Aspire.Hosting.SqlServer`, and add `Aspire.Hosting.JavaScript` all to **`17.0.0`**.
   - Bump `Aspire.Hosting.Browsers` to **`17.0.0-preview.1.26567.5`** (preview-only; update `arch-debt.md` row `aspire-browsers-preview-1713`).
   - Drop unused `Aspire.Hosting.Redis` & `Aspire.Hosting.Garnet` from `aspire.config.json` / `SCAFFOLD_ASPIRE_INTEGRATIONS` (caches use `builder.addContainer()` / `addExecutable()`).
   - Remove dead constants `ASPIRE_HOSTING_DENO`, `ASPIRE_HOSTING_SQLITE`, `SCALAR_ASPIRE`, and `DENO_KV` (`CommunityToolkit.Aspire.Hosting.Deno`).
   - Generalize `.llm/tools/validation/check-aspire-version-parity.ts` beyond `13\.` to enforce `17.0.0` (and flag `13.*` as stale in both phases).
   - Add `deno task aspire:bump` under `.llm/tools/deps/`.
   - Improve CI cold start in `e2e-cli.yml`, `e2e-cli-prod.yml`, `e2e-cli-prod-local.yml` (add `DENO_DIR` + `$HOME/.aspire/bin` caching alongside `~/.nuget/packages`, bump NuGet cache key to `17.0.0-v1`, update `aspire-nuget-cache-policy.test.ts`).
2. **Native Deno TypeScript AppHost (`#319`) & D-7 `_aspire-compat.mts` Retirement:**
   - Fresh scaffolds emit `aspire/deno.json` (zero `aspire/package.json`, zero `aspire/tsconfig.apphost.json`, zero `node_modules`/`tsx`).
   - Root `deno.json` adds `"./aspire"` to `workspace` and `"sloppy-imports"` to `unstable` when `!options.noAspire` (verified zero-warning resolution for local `@netscript/aspire`, root `catalog: zod`, and Aspire's `.mjs`→`.mts` generated modules).
   - Generated `quality-runner.ts` typechecks native Deno AppHosts via `deno check --config aspire/deno.json` (retaining legacy `tsc` fallback only when `aspire/package.json` exists without `aspire/deno.json`).
   - Update `reconcileAppHostPackageDependencies` (`apphost-package-dependencies.ts`) to reconcile `aspire/deno.json` (`pg` import when Postgres is configured) AND continue reconciling legacy `aspire/package.json` for existing `0.0.9` projects (with migration guidance).
   - Retire all duplicated `@netscript/aspire` types, constants, permission/OTEL/Vite/reference helpers, and `parseAppSettings` from `_aspire-compat.ts.template` (importing directly from `@netscript/aspire/config`, `@netscript/aspire/constants`, `@netscript/aspire/types`, `@netscript/aspire/application`), leaving only the lean AppHost-local runtime readiness & host-IO module (~500 LOC less duplication; closes D-7).
   - Add `import process from 'node:process';` in `configure-dashboard.ts.template` so it passes strict `deno check`.
3. **First-Party `addDenoApp` (`#320`/`#295`), `EndpointProperty.BrowserOrigins`, `.withRepl()`, `#2174`, `#2184` MSSQL Password, `#2202`:**
   - Migrate generated `register-services.mts`, `register-plugins.mts`, `register-background.mts`, and `register-apps.mts` from `builder.addExecutable(..., 'deno', ...)` to `builder.addDenoApp(...)` with exact `17.0.0` fluent `withDeno*` methods (`withDenoAllowAll({ enabled: false })`, `withDenoAllow`, `withDenoDeny`, `withDenoNodeModulesDir({ mode: DenoNodeModulesDirMode.None })`, `withDenoUnstable`, `withDenoWatch`, `withDenoConfig`, `withDenoTask`, `withDenoRuntimeArgs`, `withDenoScriptArgs`) via a single clean `applyDenoPermissions` helper.
   - Simplify OTEL wiring for `addDenoApp` resources: rely on `WithDenoDefaults()` (which injects `OTEL_DENO=true`, `OTEL_EXPORTER_OTLP_*`, `DENO_CERT`, sampler/delays) and set only `OTEL_SERVICE_NAME` + `service.version` via `buildOtelEnvVars(..., 'denoApp')` (and keep explicit `OTEL_DENO='false'` / `OTEL_TRACES_SAMPLER='always_off'` opt-out for `Telemetry: false` background processors).
   - Adopt `EndpointProperty.BrowserOrigins` (`await app_N.getEndpoint('http').then((ep) => ep.property(EndpointProperty.BrowserOrigins))`) for `NETSCRIPT_CORS_ORIGINS` in `generate-register-apps.ts`.
   - Adopt `.withRepl()` on container `Postgres`, `Mysql`, and `Mssql` server resources in `generate-register-infrastructure.ts`.
   - Replace hardcoded `MSSQL_SA_PASSWORD` (`generate-register-infrastructure.ts:28`) with `ensureDatabasePassword` (ensuring SQL Server complexity requirements: uppercase, lowercase, digit, symbol, ≥16 chars) — `#2184` prereq.
   - Fix `#2174`: make all 7 generated helpers `deno lint --no-config`-clean when empty (`registerApps`, `registerServices`, `registerInfrastructure`, `dbCliMode` added alongside existing `registerPlugins`, `registerBackgroundProcessors`, `registerTools`) and expand `empty-registration_test.ts` to cover all 7.
   - Fix `#2202`: wire `DockerCliTopologyInspector` + `assessDockerTopology` into `DbOperationRunner.waitForDatabase` (and health-wait failure/timeout diagnostics) so a health wait targeting a foreign/remote Docker daemon's loopback fails loudly with an actionable diagnostic naming the remote daemon host and pointing to `netscript plugin doctor` / local Docker setup, covered by stubbed remote & local daemon tests.
4. **Aspire `17.0.0` CLI, Agent Init, MCP Smoke, `#2259` Whole-Snapshot Scan & Exit-16 Hardening:**
   - Update `aspire-agent-initializer.ts`, `deno-aspire-agent-initializer.ts`, and `init-agent.ts` for Aspire `17.0.0` `aspire agent init` flags (dropping removed `--skill-locations` and dead 4 skill IDs).
   - Update `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/tools.ts` for the 15-tool `17.0.0` surface (`wait_for_resources`).
   - Restore whole-snapshot secret scanning in `credential-secret-surfaces.ts` (replacing the `#2259` environment exemption after live S0 proof that Aspire `17.0.0` redacts `DATABASE_URL`, `ConnectionStrings__*`, `APPDB_URI`, and `APPDB_PASSWORD` to `null`) — verified on hosted Postgres `scaffold-runtime` to close `#2259`.
   - Harden `refresh-generated-client-consumers.ts` against intermittent `Aspire exit 16` (`Failed to stop resource '*-web-*'`) via bounded stop-settle / single retry recovery on exit 16 with explicit diagnostics and unit tests; verify `DenoAppResource` compatibility (`resourceType === 'Executable'`).
5. **`17.0.0`-Only Fixtures, Skills, Docs (`0.0.9 → 0.0.10` Migration Guide) & Carrier Regeneration:**
   - Re-record all 5 fixture families on `17.0.0`; retire `13.4.6` & `13.5.3` compat fixtures (keeping 1 generic leading-banner parser unit test); update `check-compat-fixtures_test.ts` and `aspire-surface-manifest.ts`.
   - Update `skills/aspire/SKILL.md`, `.agents/skills/aspire/SKILL.md`, `.agents/skills/aspire-upgrade/SKILL.md`, `docs/site/` Aspire pages, add `0.0.9 → 0.0.10` Aspire upgrade guide, and update `.llm/harness/debt/arch-debt.md`.
   - Regenerate carriers in exact order (`aspire-surface-manifest.ts` → `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets` → `maint:dogfood-skills`).

### Explicit Non-Scope
- Enabling `features.appHostServerV2: true` (empirically refuted in S0: `17.0.0` rejects managed integration assemblies).
- Publishing canary/stable JSR releases (`netscript-release` runs after merge).
- Changing `packages/aspire/src/application/resolve-paths.ts` 2-level path contract or refactoring unrelated pre-existing `packages/aspire/config.ts` / `packages/cli` F-16 cardinality debt.
- Adding new live MySQL/MSSQL CI container jobs (`#2184` full live proof remains tracked on `#2184`; only the hardcoded password removal + `.withRepl()` rides here).
- Modifying `deno.lock` destructively or running `deno cache --reload`.

---

## 2. Architecture & Doctrine Alignment

- **Doctrine Verdicts (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`):**
  - `packages/cli` (Archetype 6): public/maintainer boundary strictly enforced (`arch:check`). All template & generator changes live in `src/kernel/templates/aspire/` and `src/kernel/assets/`; adapters live in `src/kernel/adapters/{aspire,database}/` and `src/public/adapters/agent/`.
  - `packages/aspire` (Archetype 2): pure domain/schema/constants/application; no host-side CLI execution or Aspire SDK coupling.
  - `packages/mcp` (Archetype 2): fixture updates only; preserve existing OTLP envelope validation (`dashboard-telemetry-api.ts`).
- **Cardinality Discipline (F-16 / `cli-showcase-cardinality-2571`):**
  - Add **zero** new top-level files or subdirectories directly under `packages/cli/src/kernel/adapters/` or `packages/cli/e2e/src/application/gates/scaffold/`. All new modules belong inside existing subdirectories (e.g., `packages/cli/src/kernel/templates/aspire/`, `packages/cli/src/kernel/adapters/aspire/`, `.llm/tools/deps/`).
- **Contract-First & Single Source of Truth:**
  - `SCAFFOLD_VERSIONS` & `SCAFFOLD_ASPIRE_INTEGRATIONS` own every scaffold pin.
  - `@netscript/aspire` owns `NetScriptConfig`, `OTEL_ENV_VARS`, `OTEL_DEFAULTS`, `DASHBOARD_ENV_VARS`, `DEFAULT_PERMISSIONS`, `RESOURCE_DEFAULTS`, `buildOtelEnvVars`, `buildViteEnvVarName`, `resolvePermissions`, `extract*References`, `parseAppSettings` — eliminating D-7 duplication.
  - `applyDenoPermissions` owns the single mapping from NetScript permission flags (`--allow-*`, `--deny-*`, `--watch*`, `--unstable-*`, custom runtime args) to Aspire `17.0.0` `DenoAppResource` fluent methods.
- **Anti-Patterns Explicitly Avoided:**
  - **AP-1 (God files):** Keep all new/edited modules well below 500 LOC (slimming `_aspire-compat.ts.template` from 1,104 LOC to ~600 LOC, or splitting health-check/host-IO helpers cleanly if needed to stay <500 LOC — in fact, splitting `_aspire-compat.mts` into `_apphost-readiness.mts` + `_apphost-runtime.mts` or keeping generated template <500 LOC eliminates any F-1 pressure!).
  - **AP-12 / AP-15 (Silent fallbacks / swallowed errors):** `#2202` fails loudly with remote daemon hostname & remediation; exit-16 retry is strictly bounded (max 1 stop-settle retry on exit 16 only, surfacing full Aspire diagnostic if still failing); `aspire agent init` failures remain explicitly reported.
  - **AP-19 (Hand-editing generated carriers):** Always regenerate `*.generated.ts` via repo tasks.

---

## 3. Locked Design Decisions & Open-Decision Sweep

All design decisions are **LOCKED** (zero unresolved rework-forcing decisions):

| ID | Decision | Rationale / Verification |
| --- | --- | --- |
| **L1** | **Native Deno AppHost (`aspire/deno.json`) as workspace member** | Root `deno.json` adds `"./aspire"` to `workspace` and `"sloppy-imports"` to `unstable` when `!noAspire`; `aspire/deno.json` has `"imports"` only (`vscode-jsonrpc@8.2.0`, `zod: "catalog:"`, `@netscript/aspire` when not a workspace member, `pg@8.23.1` when Postgres configured). Verified zero warnings in S0. |
| **L2** | **`aspire.config.json` keeps `"language": "typescript/nodejs"`** | Canonical Aspire `17.0.0` language ID; `TypeScriptAppHostToolchainResolver` automatically selects `"toolchain": "deno"` when `deno.json` is present and `package.json` is absent. Verified in S0 `aspire doctor`. |
| **L3** | **Retire D-7 duplication in `_aspire-compat.mts`** | Generated helpers import `NetScriptConfig`, `OTEL_*`, `DASHBOARD_ENV_VARS`, `RESOURCE_DEFAULTS`, `parseAppSettings`, `buildOtelEnvVars`, `buildViteEnvVarName`, `resolvePermissions`, `extract*References` from `@netscript/aspire/*`. `_aspire-compat.mts` retains ONLY AppHost-local SDK-coupled readiness checks (`createEndpointListenerReadinessCheck`, `createRespPingCheck`, `createPostgresCredentialReadinessCheck`), host-IO edge (`ensureDatabasePassword`, `ensureContainerDataPath`, `ensureGarnetToolManifest`, `isDockerAvailable`, `shouldUseContainerCache`, `resolveContainerBindMountRuntimeArgs`, `generateAccessToken`, `withCacheReference`), `buildDatabase*` / `buildSqliteDatabaseUrl`, and `applyDenoPermissions` + 1-line `resolveWorkspacePath`/`resolveDataPath` (keeping `resolveWorkspacePath(projectRoot, rel)` distinct from `@netscript/aspire/application`'s legacy 2-level path helper). `generate-config-schema.ts` uses `z.looseObject` directly so `ProjectConfigSchema` stays decoupled from `AspireSchema` wrapper. |
| **L4** | **First-party `addDenoApp` mapping (`#320`)** | Services (`addDenoApp(name, workdir, entrypoint)`), Plugins (`addDenoApp` + `.withDenoConfig('deno.json')` + `.withDenoUnstable(['no-legacy-abort'])`), Background (`addDenoApp` + `.withDenoUnstable(['worker-options'])`), and Apps (`app`/`tauri`/`task`: `addDenoApp(name, workdir, '').withDenoTask(taskName)`, `desktop`: `addDenoApp` build + `addDenoApp` run with `.withDenoTask(...)` + `.withDenoScriptArgs(['--backend', 'cef'])`). All script-based Deno resources call `applyDenoPermissions(resource, perms)` which calls `.withDenoAllowAll({ enabled: false })` unless `--allow-all`/`-A` is granted, maps `--allow-*`/`--deny-*`/`--watch*`/`--unstable-*` to typed `withDeno*` methods, and forwards unknown flags via `withDenoRuntimeArgs`. All script-based resources also set `.withDenoNodeModulesDir({ mode: DenoNodeModulesDirMode.None })` and `.withDenoRuntimeArgs(['--minimum-dependency-age=0'])`. Tools (`register-tools.ts`) keep `addExecutable('deno', ..., run-tool.mts)` because `run-tool.mts` is an internal failure-capture wrapper, not a user Deno app. |
| **L5** | **OTEL under `addDenoApp`** | `WithDenoDefaults()` already sets `OTEL_DENO=true`, `OTEL_EXPORTER_OTLP_*`, `DENO_CERT`, and sampler/delay defaults. Services, plugins, and telemetry-enabled background processors apply only `buildOtelEnvVars(name, config.Version, 'denoApp')` (which sets `OTEL_DENO`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES=service.version=...`). Wait: note `WithDenoDefaults()` sets `OTEL_RESOURCE_ATTRIBUTES=service.instance.id=<suffix>` — `withEnvironment('OTEL_RESOURCE_ATTRIBUTES', 'service.version=...')` matches our existing tested convention (and verify `service.name` still reports correctly in telemetry!). Telemetry-disabled background processors explicitly override `OTEL_DENO='false'` and `OTEL_TRACES_SAMPLER='always_off'`. `app`/`tauri`/`desktop`/`task` using `.withDenoTask(...)` ALSO get `WithDenoDefaults()` from `addDenoApp` (verified: `AddDenoApp` attaches `WithDenoDefaults` before `WithDenoTask`!). We will verify live that a task-based Fresh app emits OTEL spans cleanly. |
| **L6** | **CORS via `EndpointProperty.BrowserOrigins`** | In `generate-register-apps.ts`, replace `await app_N.getEndpoint('http')` with `await (await app_N.getEndpoint('http')).property(EndpointProperty.BrowserOrigins)` (combining multiple web apps via `ReferenceExpression.create`). Verified in S0 live spike! |
| **L7** | **Container DB `.withRepl()` & MSSQL Password (`#2184` prereq)** | Chain `.withRepl()` on container `Postgres`, `Mysql`, and `Mssql` server builders. Replace literal `MSSQL_SA_PASSWORD` with `ensureDatabasePassword(appHostDir, name)` where `ensureDatabasePassword` generates a 32-char password guaranteed to satisfy SQL Server complexity (`A-Z`, `a-z`, `0-9`, `!@#`, no shell-breaking chars), passing `db_N_password` (`ParameterResource`) to `addSqlServer` and `SA_PASSWORD` / `MSSQL_SA_PASSWORD` (no literal secret ever emitted into generated `.helpers/`). |
| **L8** | **`appHostServerV2` stays OFF** | Refuted empirically in S0 (`17.0.0` rejects managed integration assemblies). |
| **L9** | **`#2259` whole-snapshot secret scan restored** | S0 live spike proved Aspire `17.0.0` redacts `DATABASE_URL`, `ConnectionStrings__appdb`, `APPDB_URI`, and `APPDB_PASSWORD` to `null`. Update `credential-secret-surfaces.ts` to scan the full `aspire describe` snapshot (not only `healthReports`). Final closure of `#2259` requires hosted Postgres `scaffold-runtime` green. |
| **L10** | **`aspire agent init` (`17.0.0`)** | Aspire `17.0.0` removed `--skill-locations` and the 4 old skill IDs (`aspire-init`, `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment`), leaving only `--skills aspire|playwright-cli|dotnet-inspect|all|none`, `--agents <copilot,claude,opencode|all|none>`, `--scope project|global`, `--mcp=false`. Since NetScript installs its own canonical `.agents/skills/aspire/SKILL.md` AND writes `.mcp.json` directly (and `aspire` skill ID collides with `.agents/skills/aspire`), `aspire agent init` in `17.0.0` no longer supplies distinct non-colliding workflow skills! Decision: update `ASPIRE_WORKFLOW_SKILLS` / `DenoAspireAgentInitializer` to run `aspire agent init --non-interactive --nologo --workspace-root <root> --agents claude --scope project --skills none --mcp=false` (or keep `aspire` wiring cleanly opted-out of colliding skill copies while verifying live in S4 what `aspire agent init` writes so `agent.aspire-mcp-smoke` and `init-agent_test.ts` pass deterministically with zero destructive overwrites of `.agents/skills/aspire` or `.mcp.json`). Let's verify exact live exit code & file side effects of `aspire agent init` with `17.0.0` at the start of S4 before editing! |
| **L11** | **`#2202` foreign Docker daemon diagnostic** | Inject optional `DockerTopologyInspector` into `DbOperationRunner` (defaulting to `new DockerCliTopologyInspector(new DenoProcessAdapter())`). When `waitForDatabase` exits with `WAIT_TIMEOUT_EXIT_CODES` (`17`/`18`), inspect Docker endpoint locality via `inspectEndpoint()` (bounded timeout); if `endpoint.locality === 'remote'`, throw an explicit, loud error explaining that the Docker daemon is remote (`endpoint.host` / `endpoint.daemonHost`), Aspire container ports are published on the remote host instead of local loopback, and direct the operator to `netscript plugin doctor` or a local Docker daemon. Also add a fast pre-wait check (or wait-timeout enrichment) so operators are never left guessing why container health timed out — verify with stubbed remote-daemon and local-daemon unit tests. |
| **L12** | **Exit-16 consumer-refresh hardening** | In `refresh-generated-client-consumers.ts`, when `aspire resource <name> restart` fails with exit `16` (DCP transient `Failed to stop resource`), perform ONE bounded recovery sequence: inspect resource state via `describe`; if still `Running`/`Stopping`, issue explicit `aspire resource <name> stop` + short settle wait + `aspire resource <name> start` (or single bounded retry of `restart`), then proceed to `wait --status healthy`. If recovery still fails, surface the full diagnostic + manual remedy. Unit-tested with injected `AspireCommandExecutor` (transient exit-16 recovery + persistent exit-16 failure + non-16 immediate fail). |
| **L13** | **`17.0.0`-only fixtures (A4)** | Retire `13.4.6` & `13.5.3` compat fixtures across all 5 fixture families; capture fresh `17.0.0` fixtures; preserve 1 generic leading-banner stdout parser unit test; update `check-compat-fixtures_test.ts` to assert `17.0.0` fixture presence and zero `13.*` residue. |

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `addDenoApp` + `.withDenoTask('dev')` behaves differently for Vite/Fresh app OTEL or `PORT` injection | Medium | High | Test live with scratch `Aspire.Cli@17.0.0` on a real scaffolded project (`netscript init --db sqlite`) during S3 before pushing |
| Removing `aspire/package.json` breaks a static E2E assertion or CLI test checking for `package.json` / `tsconfig.apphost.json` | High | Medium | Grep all `package.json` / `tsconfig.apphost.json` / `addExecutable` references across `packages/cli` and `packages/cli/e2e` during S2/S3 and update every test & gate cleanly |
| `OTEL_RESOURCE_ATTRIBUTES` override in `buildOtelEnvVars(..., 'denoApp')` drops Aspire's `service.instance.id` | Medium | Medium | Verify live `/api/telemetry/resources` and `/api/telemetry/spans` in S3 with `buildOtelEnvVars(..., 'denoApp')` to ensure `instanceId` / `service.name` / spans stay intact |
| Hosted `scaffold-runtime` Postgres container exposes a password on a non-`environment` field in `aspire describe` | Low | High | Run hosted `e2e-cli` (`scaffold-runtime` + `scaffold-runtime-sqlite`) in S6; if any new surface leaks on real Postgres container, diagnose immediately before closing `#2259` |
| `aspire agent init` `17.0.0` behaves unexpectedly with `--skills none --mcp=false` or touches `.claude/` unexpectedly | Medium | Medium | Run live `aspire agent init` against a temp dir with `Aspire.Cli@17.0.0` at start of S4 before editing `init-agent.ts` |
| Generated carrier drift (`embedded.generated.ts`, `skills.generated.ts`, `agent-docs-prose.generated.ts`, `aspire-surface-manifest.tsv`) | Medium | Medium | Run full canonical carrier chain in S5 and assert all `check:*` tasks exit 0 |
| `e2e-cli.yml` workflow push rejected if git credential lacks `workflow` scope | Low | High | Check git push on S1 commit early (which touches `.github/workflows/e2e-cli*.yml`) so any token scope issue surfaces immediately |

---

## 5. Ordered Implementation Slices

Each slice is **1 focused commit** (pushed to the Draft PR with a structured update in `worklog.md` and `context-pack.md`).

### Slice S1 — Atomic `17.0.0` Pins, Dead-Pin Cleanup, Generalized Parity Gate, `aspire:bump` & CI Caching
- **Files (~14):**
  - `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` (bump `ASPIRE_SDK` → `'17.0.0'`; remove dead `ASPIRE_HOSTING_DENO`, `ASPIRE_HOSTING_SQLITE`, `SCALAR_ASPIRE`)
  - `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` (bump `POSTGRES`, `MYSQL`, `MSSQL` → `'17.0.0'`; add `JAVASCRIPT: { PACKAGE_ID: 'Aspire.Hosting.JavaScript', VERSION: '17.0.0' }`; bump `BROWSERS` → `'17.0.0-preview.1.26567.5'`; remove `REDIS`, `GARNET`, `DENO_KV`)
  - `packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts` & its tests (add `Aspire.Hosting.JavaScript@17.0.0`, stop emitting unused `Aspire.Hosting.Redis` / `Aspire.Hosting.Garnet`)
  - `.github/toolchain.env`, `.github/workflows/e2e-cli.yml`, `.github/workflows/e2e-cli-prod.yml`, `.github/workflows/e2e-cli-prod-local.yml` (bump `17.0.0`, NuGet cache key `17.0.0-v1`, add `DENO_DIR` + `$HOME/.aspire/bin` caching)
  - `.github/scripts/aspire-nuget-cache-policy.test.ts` (update to `17.0.0` & validate new caching policy)
  - `packages/cli/src/kernel/assets/workspace/github/deploy-compose-ghcr.yml.template` (update Aspire CLI pin if present)
  - `.llm/tools/validation/check-scaffold-versions.ts` (remove deleted keys from `ASPIRE_KEYS`)
  - `.llm/tools/validation/check-aspire-version-parity.ts` & `check-aspire-version-parity_test.ts` (generalize regex beyond `13\.`, flag `13.*` as stale, enforce `17.0.0` + `17.0.0-preview.1.26567.5`)
  - `.llm/tools/deps/aspire-bump.ts` + `deno.json` task `"aspire:bump"` (dry-run by default, checks NuGet v3 stable channel for `Aspire.Cli` + hosting integrations + Browsers preview)
- **Verification:** `check-scaffold-versions.ts`, `aspire-nuget-cache-policy.test.ts`, `check-aspire-version-parity_test.ts`, `generate-aspire-config` tests, `check:aspire-version-parity` Phase 1.

### Slice S2 — Native Deno AppHost (`#319`) & D-7 `_aspire-compat.mts` Retirement
- **Files (~18):**
  - `packages/cli/src/kernel/templates/aspire/generate-apphost-deno-json.ts` + `_test.ts` (new generator & reconciler for `aspire/deno.json` — zero `package.json` / `tsconfig.apphost.json`)
  - `packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts` (emit `aspire/deno.json` instead of `package.json` + `tsconfig.apphost.json`, passing `importMode`, `localBase`, `packagesAsWorkspaceMembers`, `dbEngines`)
  - `packages/cli/src/kernel/templates/workspace/deno-json.ts` + `_test.ts` (add `"./aspire"` to `workspace` and `"sloppy-imports"` to `unstable` when `!options.noAspire`)
  - `packages/cli/src/kernel/templates/workspace/quality-runner.ts` + `_test.ts` (native `deno check --config aspire/deno.json` for Deno AppHosts + legacy `tsc` fallback)
  - `packages/cli/src/kernel/adapters/aspire/apphost-package-dependencies.ts` + `_test.ts` (reconcile `aspire/deno.json` `pg` import + legacy `aspire/package.json` fallback)
  - `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template` (retire duplicated `@netscript/aspire` types/schemas/constants/env/perms/refs/parser; keep lean AppHost-local runtime readiness + host-IO helpers; add `applyDenoPermissions` + SQL Server complexity-safe `ensureDatabasePassword`)
  - `packages/cli/src/kernel/assets/aspire/helpers/configure-dashboard.ts.template` (import `process` from `'node:process'`, import `DASHBOARD_ENV_VARS`/`NetScriptConfig` from `@netscript/aspire/*`)
  - `packages/cli/src/kernel/templates/aspire/helpers/generate-config-schema.ts` & `generate-index.ts` & templates (import `@netscript/aspire/config`, `@netscript/aspire/constants`, `@netscript/aspire/types`, `@netscript/aspire/application`; update `generate-config-schema.ts` to extend `z.looseObject` directly)
  - `packages/aspire/constants.ts` (export `DbCliModeExcludeFromMcp` if needed — verify `deno doc --lint` & `publish:dry-run`)
  - Affected CLI scaffold & helper unit tests
- **Verification:** Scoped `deno check --unstable-kv`, `deno test` across `packages/aspire` and `packages/cli/src/kernel/templates/aspire` + `workspace` + `adapters/aspire`, live `netscript init` → `aspire restore` → `deno check` on generated Deno AppHost!

### Slice S3 — First-Party `addDenoApp` (`#320`), `BrowserOrigins`, `.withRepl()`, `#2174`, `#2184` MSSQL Password & `#2202`
- **Files (~18):**
  - `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts` & template (switch to `builder.addDenoApp` + `applyDenoPermissions` + `withDenoNodeModulesDir` + `withDenoRuntimeArgs(['--minimum-dependency-age=0'])` + `denoApp` OTEL; fix empty-section lint `#2174`)
  - `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts` & template (switch to `builder.addDenoApp` + `withDenoConfig('deno.json')` + `withDenoUnstable(['no-legacy-abort'])` + `applyDenoPermissions` + `denoApp` OTEL)
  - `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts` & template (switch to `builder.addDenoApp` + `withDenoUnstable(['worker-options'])` + `applyDenoPermissions` + `denoApp` OTEL / explicit opt-out)
  - `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` & template (switch to `builder.addDenoApp` + `withDenoTask(...)` + `EndpointProperty.BrowserOrigins` for `NETSCRIPT_CORS_ORIGINS`; fix empty-section lint `#2174`)
  - `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` & template (add `.withRepl()` on Postgres/MySQL/MSSQL containers; replace literal `MSSQL_SA_PASSWORD` with `ensureDatabasePassword` + secret parameter `#2184`; fix empty-section lint `#2174`)
  - `packages/cli/src/kernel/templates/aspire/helpers/generate-db-cli-mode.ts` & template (fix empty-section lint `#2174`)
  - `packages/cli/src/kernel/templates/aspire/helpers/register/registration-preamble.ts` (update imports for `DenoNodeModulesDirMode` / `applyDenoPermissions` / `@netscript/aspire/*`)
  - `packages/cli/src/kernel/templates/aspire/helpers/tests/empty-registration_test.ts` (expand to lint & invoke all 7 helpers when empty — `#2174` regression lock!)
  - `packages/cli/src/kernel/adapters/database/operations/operation-runner.ts` & tests (implement `#2202` foreign Docker daemon loopback loud diagnostic via `DockerTopologyInspector` + remote/local daemon tests)
  - Affected helper generator unit tests
- **Verification:** `empty-registration_test.ts` (all 7 helpers lint clean), all `packages/cli/src/kernel/templates/aspire/helpers/tests/*`, `operation-runner_test.ts`, plus live local `netscript init --db sqlite` → `aspire restore` → `deno task check` → `aspire start --isolated` → `aspire wait` → `/health` → `/api/telemetry/{resources,spans,logs}` → `aspire stop`!

### Slice S4 — Aspire `17.0.0` Agent Init, MCP Smoke (15 Tools), `#2259` Whole-Snapshot Scan & Exit-16 Hardening
- **Files (~12):**
  - `packages/cli/src/public/features/agent/init/aspire-agent-initializer.ts`, `packages/cli/src/public/adapters/agent/deno-aspire-agent-initializer.ts` + `_test.ts`, `packages/cli/src/public/features/agent/init/init-agent.ts` + tests (update for Aspire `17.0.0` `aspire agent init` CLI contract after live verification in scratch dir)
  - `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/tools.ts` + MCP smoke tests (add `wait_for_resources`, 15 tools)
  - `packages/cli/e2e/src/application/gates/scaffold/runtime/credential-secret-surfaces.ts` + tests (restore whole-snapshot secret scan on `aspire describe` for `#2259`)
  - `packages/cli/src/kernel/adapters/database/operations/refresh-generated-client-consumers.ts` + `_test.ts` (bounded exit-16 stop-settle recovery + unit tests for transient recovery, persistent failure, and `DenoAppResource` compatibility)
  - `packages/cli/e2e` any assertions checking `aspire/package.json` / `tsconfig.apphost.json` / `addExecutable` updated to `aspire/deno.json` / `addDenoApp`
- **Verification:** `deno-aspire-agent-initializer_test.ts`, `init-agent_test.ts`, `refresh-generated-client-consumers_test.ts`, `aspire-mcp` tests, `credential-secret-surfaces` tests, `scaffold.service` / `scaffold.contracts` / `scaffold.plugins` E2E static suites!

### Slice S5 — `17.0.0`-Only Fixtures, Skills, Docs (`0.0.9 → 0.0.10` Upgrade Guide), `arch-debt.md` & Carrier Regeneration
- **Files (~25):**
  - Re-record `17.0.0` fixtures across all 5 families (`aspire-doctor-17.0.0.json`, `describe`/`describe-follow`, `aspire-17.0.0-mcp-recorded.json`, `packages/mcp` telemetry fixture, `teardown` `aspire-ps`/`process-tree`), remove `13.4.6` & `13.5.3` legacy fixtures, keep 1 generic leading-banner parser test, update `check-compat-fixtures_test.ts`.
  - Update `skills/aspire/SKILL.md`, `.agents/skills/aspire/SKILL.md`, `.agents/skills/aspire-upgrade/SKILL.md`.
  - Update `docs/site/` Aspire pages + add `0.0.9 → 0.0.10` Aspire upgrade guide (covering `aspire/package.json` → `aspire/deno.json`, `Aspire.Cli@17.0.0`, `Aspire.Hosting.JavaScript@17.0.0`, `addDenoApp`, `aspire agent init`).
  - Update `.llm/harness/debt/arch-debt.md` (close D-7 & CommunityToolkit Deno deferral; update `aspire-browsers-preview-1713` to `17.0.0-preview.1.26567.5`).
  - Update `.llm/tools/validation/aspire-surface-manifest.ts` & regenerate all carriers in order:
    1. `aspire-surface-manifest.ts`
    2. `deno task gen:agent-docs-prose`
    3. `deno task gen:assets-barrel`
    4. `deno task gen:publish-assets`
    5. `deno task maint:dogfood-skills`
- **Verification:** `check:agent-docs-prose`, `check:assets-barrel`, `check:mcp-export-corpus`, `check:publish-assets`, `maint:dogfood-skills:check`, `check:aspire-version-parity` (Phase 1 & Phase 2), `check-compat-fixtures_test.ts`, `deno task doc:lint`!

### Slice S6 — Full Local Gates, Hosted Dual-Tier `e2e-cli`, `#2259` Proof & Independent `IMPL-EVAL`
- Run full wrapper-sourced local gates:
  - `deno task check`, `deno task test`, `deno task lint`, `deno task fmt:check` (scoped via wrappers), `deno task quality:gate`, `deno task arch:check`, `deno task doc:lint`, `deno task publish:dry-run`, `deno task check:scaffold-versions`, `deno task check:aspire-version-parity` (Phase 1 & Phase 2), `deno task check:aspire-host-ports`, `aspire-nuget-cache-policy.test.ts`.
  - Run local SQLite runtime smoke (`scaffold.runtime.sqlite` or focused Aspire `17.0.0` Deno AppHost + SQLite + Garnet executable runtime smoke using scratch `Aspire.Cli@17.0.0`).
- Remove `.llm/tmp/aspire-17-spike/` scratch directory.
- Mark PR ready & apply `e2e-cli-gate` to prove hosted GitHub Actions `ci` + `e2e-cli` (`scaffold-static`, `scaffold-runtime` Postgres, `scaffold-runtime-sqlite`) all green at the exact candidate SHA.
- Confirm `#2259` whole-snapshot scan passed on real hosted Postgres; update `#2259` & `#2278` comments.
- Run independent **IMPL-EVAL** via `delegate_task` (`codex` / `gpt-6.2-astra` / `xhigh`), write `evaluate.md`, post `[PHASE: IMPL-EVAL] [VERDICT: PASS]`, and mirror verified `acceptance-evidence` YAML blocks in the PR body.

---

## 6. Fitness Gates & Merge Criteria

| Gate | Command / Source | Required Result |
| --- | --- | --- |
| Typecheck | `.llm/tools/run-deno-check.ts` / `deno task check` | exit 0 |
| Unit & Integration Tests | `.llm/tools/run-deno-test.ts` / `deno task test` | exit 0 |
| Lint | `.llm/tools/run-deno-lint.ts --ext ts,tsx,mts` | exit 0 |
| Format Check | `.llm/tools/run-deno-fmt.ts --ext ts,tsx,mts` | exit 0 |
| Doctrine & Architecture | `deno task arch:check` & `deno task quality:gate` | exit 0 |
| JSR Doc Lint & Publish | `deno task doc:lint` & `deno task publish:dry-run` | exit 0 |
| Aspire Version Parity (P1 & P2) | `deno task check:aspire-version-parity` & `--phase 2` | `ok: true`, 0 failures |
| Scaffold Stability (E-12) | `deno task check:scaffold-versions` | exit 0 (0 prereleases in `SCAFFOLD_VERSIONS`) |
| Aspire Host Ports | `deno task check:aspire-host-ports` | exit 0 |
| CI Cache Policy | `deno test --allow-read .github/scripts/aspire-nuget-cache-policy.test.ts` | exit 0 |
| Generated Carriers | `check:agent-docs-prose`, `check:assets-barrel`, `check:mcp-export-corpus`, `check:publish-assets`, `maint:dogfood-skills:check` | all exit 0 |
| Static E2E | `deno task e2e:cli run scaffold.{service,contracts,plugins}` | all exit 0 |
| Hosted Full Runtime E2E | GitHub Actions `e2e-cli` (`scaffold-static`, `scaffold-runtime`, `scaffold-runtime-sqlite`) | all green at exact candidate SHA |
| Independent Evaluators | PLAN-EVAL (`PASS`) + IMPL-EVAL (`PASS`) via `codex` / `gpt-6.2-astra` (`xhigh`) | both `PASS` |
