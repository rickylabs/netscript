# Plan — Upgrade NetScript to Aspire `17.0.0` (`#2278`)

- **Run ID:** `epic-aspire-17-upgrade--2278`
- **Branch:** `epic/aspire-17-upgrade`
- **Integrated Main Baseline:** `origin/main` `6d7f10338` (merged at `9c899ea10`)
- **Workload Tier:** `feature` (owner-capped standard tier; PLAN-EVAL max 2 cycles, IMPL-EVAL max 5 cycles; owner review-chain override recorded in `supervisor.md` & `worklog.md`)
- **Primary Archetype:** Archetype 6 — CLI / Tooling (`packages/cli`: Doctrine §10 **6 / Keep**)
- **Secondary Archetype:** Archetype 2 — Integration / Adapter Package (`packages/aspire`: **2 / Keep**, `packages/mcp`: **2 / Keep**)
- **Overlays:** `SCOPE-docs`, `SCOPE-service`

---

## 1. Scope & Non-Scope

### In Scope
1. **Atomic Aspire `17.0.0` pin upgrade, dead-pin cleanup, scoped parity gate, `aspire:bump` & CI caching (S1):**
   - Bump `Aspire.Cli`, `Aspire.Hosting.AppHost`, `Aspire.Hosting.PostgreSQL`, `Aspire.Hosting.MySql`, `Aspire.Hosting.SqlServer`, and add `Aspire.Hosting.JavaScript` (`JAVASCRIPT`) to **`17.0.0`**.
   - Bump `Aspire.Hosting.Browsers` to **`17.0.0-preview.1.26567.5`** (preview-only; update `arch-debt.md` row `aspire-browsers-preview-1713`).
   - Drop unused `REDIS`, `GARNET`, `DENO_KV` from `SCAFFOLD_ASPIRE_INTEGRATIONS` and `generate-aspire-config.ts`, and remove dead `ASPIRE_HOSTING_DENO`, `ASPIRE_HOSTING_SQLITE`, `SCALAR_ASPIRE` from `SCAFFOLD_VERSIONS` and `check-scaffold-versions.ts:27-29`.
   - Update `.llm/tools/docs/check-accuracy-and-discoverability.ts:40` (replace `REDIS` with `JAVASCRIPT`, forbid `13.4.6` & `13.5.3`) and the two checked site pages (`docs/site/explanation/aspire.md`, `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`) so `deno task docs:accuracy` passes in S1.
   - Refactor `check-aspire-version-parity.ts` to scope parity by Aspire context/key (never misclassifying `DOTNET_SDK: 10.0.0`, `APPHOST_PG: 8.23.1`, `GARNET_TOOL: 2.2.14`) and fix Phase 2 `compat-fixture` to reject mixed `13`/`17` files.
   - Add `.llm/tools/deps/aspire-bump.ts` (`deno task aspire:bump`), classify it in `aspire-surface-manifest.ts`, and add offline dry-run/apply/idempotency tests.
   - Add per-job NuGet + versioned Aspire CLI (with miss-only install, unconditional PATH export, and exact `17.0.0|17.0.0+*` preflight) + Deno cache in `e2e-cli.yml`, `e2e-cli-prod.yml`, `e2e-cli-prod-local.yml`, and upgrade `.github/scripts/aspire-nuget-cache-policy.test.ts` to assert each job's steps individually.
2. **SDK `17.0.0` compile fixture, native Deno AppHost (`#319`), D-7 retirement & F-1 split (S2):**
   - Capture & land `aspire-sdk-17.0.0.json.gz` (deleting `aspire-sdk-13.5.3.json.gz`) and update `installation-secret-sdk-compile_test.ts` FIRST so all S2/S3 generated helpers compile against real `17.0.0` SDK types.
   - Emit `aspire/deno.json` (zero `package.json`, zero `tsconfig.apphost.json`, zero `aspire/node_modules/`) across all 3 scaffold import modes (local workspace members, external local source, JSR), add `"./aspire"` to generated root `deno.json` `workspace` and `"sloppy-imports"` to root `unstable` when `!noAspire`.
   - Update `quality-runner.ts` to typecheck native Deno AppHosts via `deno check --unstable-kv --config aspire/deno.json ...appHostFiles` (retaining `--skip-apphost` and read-only legacy `tsc` fallback).
   - Update `packages/cli/e2e/fixtures/kv-only/scaffold.ts:122` to read `aspire/deno.json` instead of `aspire/package.json`.
   - Enforce a fail-closed pre-write migration guard in `regenerateAspireHelpers` and `regenerateAspireConfig` whenever legacy `aspire/package.json` exists (alone or alongside `aspire/deno.json`).
   - Retire all D-7 duplicated `@netscript/aspire` code from `_aspire-compat.ts.template`, split it cleanly into `<350`-LOC `_apphost-readiness.ts.template` + `<350`-LOC `_aspire-compat.ts.template`, add explicit `import process from 'node:process';` in `configure-dashboard.ts.template`, wire concrete `ProjectConfigSchema` adapter in `generate-config-schema.ts`, and inline `DB_CLI_MODE_EXCLUDE_FROM_MCP = true` in `generate-db-cli-mode-1.ts.template`.
   - Rebuild `embedded.generated.ts` (`deno task gen:assets-barrel`) within S2 before running S2 tests.
3. **First-party `addDenoApp` (`#320`), `BrowserOrigins`, `.withRepl()`, MSSQL password (`#2184`), `#2174` all-7 empty helpers & `#2202` AppHost+CLI diagnostics (S3):**
   - Migrate `register-services`, `register-plugins`, `register-background`, and `register-apps` to `builder.addDenoApp(...)` with non-empty app-relative `scriptPath` (`'main.ts'` for task-mode apps + `.withDenoTask(taskName)` + `.withDenoScriptArgs(['--backend', 'cef'])` for desktop), `applyDenoPermissions`, explicit `render-http-endpoint.ts`, locked OTEL policy preserving `service.instance.id` + `service.version` + disabled-background opt-out, and `EndpointProperty.BrowserOrigins` for `NETSCRIPT_CORS_ORIGINS`.
   - Decompose `generate-register-infrastructure.ts` (extract `register-infrastructure-cache.ts` so both stay <500 LOC), add `.withRepl()` on container `Postgres`/`Mysql`/`Mssql` server builders before `.addDatabase(...)`, and replace hardcoded `MSSQL_SA_PASSWORD` with `ensureDatabasePassword(appHostDir, name, { requireComplexity: true })` + secret `ParameterResource` (updating import predicate at line 107 and tests at line 645).
   - Fix all 7 empty-section helper contracts (`#2174`) and expand `empty-registration_test.ts` to test every helper's real contract (empty section in populated project + fully empty graph).
   - Implement `#2202` foreign Docker daemon loopback diagnostic directly on the generated AppHost health path (`_apphost-readiness.ts.template`, container-backed + loopback + concrete elapsed threshold) plus secondary CLI timeout enrichment in `DbOperationRunner.waitForDatabase` (`DenoProcess` + `DockerCliTopologyInspector`).
   - Rebuild `embedded.generated.ts` within S3 before running S3 tests + live local `netscript init --db sqlite` smoke.
4. **Aspire `17.0.0` agent init, 15-tool MCP baseline + fixture, `#2259` whole-snapshot scan & exit-16 recovery (S4):**
   - Retire obsolete 13.5 `aspire agent init` automatic call & 4 retired workflow skills (`init-agent.ts`, `aspire-agent-initializer.ts`, `deno-aspire-agent-initializer.ts`, `guidance.md.template:38`, `.llm/tools/maint/dogfood-skills.ts`), retaining `RETIRED_ASPIRE_WORKFLOW_SKILLS` for legacy `.claude/skills/` mirror cleanup.
   - Land fresh `aspire-17.0.0-mcp-recorded.json` (deleting `aspire-13.5.3-mcp-recorded.json`) TOGETHER with `aspire-mcp/tools.ts` (15 tools + `wait_for_resources`) and tests.
   - Restore whole-snapshot secret scan in `verify-credential-rejection.ts:59` (before JSON parse / field selection / receipt write) and `assertCredentialResourceNotHealthy`, and reverse `credential-readiness_test.ts:224` (`#2259`).
   - Implement exact single-retry exit-16 recovery state machine in `refresh-generated-client-consumers.ts` (scoped to DCP transient stop failure on same resource/AppHost under original signal/deadline).
   - Rebuild `embedded.generated.ts` within S4 before running S4 tests + `scaffold.{service,contracts,plugins}` static E2E.
5. **`17.0.0`-only recorded fixtures (`e2e`, `mcp`, `teardown`) & compat cleanup (S5a):**
   - Replace the remaining 17 tracked old-version fixture paths with `17.0.0` captures, update the 5 compat-fixture test consumers + `check-compat-fixtures_test.ts`, preserve 1 generic leading-banner parser test, nullable/transition cases, and redaction assertions.
6. **Skills, docs (`0.0.9 → 0.0.10` upgrade guide), `arch-debt.md` & canonical carrier regeneration (S5b):**
   - Update `skills/aspire/SKILL.md`, `.agents/skills/aspire/SKILL.md`, `.agents/skills/aspire-upgrade/SKILL.md`, `docs/site/` Aspire pages, `docs/site/reference/ai/skills.md`, add `0.0.9 → 0.0.10` Aspire upgrade guide (including Node AppHost migration, persisted MSSQL volume note, and post-publish consumer verification handoff).
   - Update `.llm/harness/debt/arch-debt.md` (CommunityToolkit Deno/SQLite supersession, close `scaffold-aspire-npm-island-no-lock`, close D-7, update `aspire-browsers-preview-1713` to `17.0.0-preview.1.26567.5`).
   - Run exact canonical regeneration chain from `.llm/tools/docs/generated-carriers.md`:
     1. `deno task gen:agent-docs-prose`
     2. `deno task gen:mcp-export-corpus`
     3. `deno task gen:assets-barrel`
     4. `deno task gen:publish-assets`
     5. `deno run --allow-read --allow-write --allow-run=git .llm/tools/validation/aspire-surface-manifest.ts`
     6. `deno task maint:dogfood-skills`
7. **Full local gates, non-skipped hosted dual-tier `e2e-cli` proof & independent IMPL-EVAL (S6):**
   - Run complete A2/A6 gate matrix including scoped CLI wrappers (`packages/cli` excluded from root `lint`/`fmt:check`).
   - Run hosted `e2e-cli` (`e2e-cli-gate`) and record exact checked-out SHA, non-skipped execution (`RUN=true`), raw exit codes, and report/step evidence for `scaffold-static`, `scaffold-runtime` (`scaffold.runtime --cleanup`), and `scaffold-runtime-sqlite` (`scaffold.runtime.sqlite --cleanup`).
   - Dispatch independent IMPL-EVAL (`codex` / `gpt-6.2-astra` / `xhigh`), which independently authors `evaluate.md` and issues its verdict.

### Explicit Non-Scope
- `features.appHostServerV2: true` (empirically refuted in S0 — `17.0.0` rejects managed integration assemblies).
- JSR canary/stable publication (`netscript-release` runs post-merge).
- Changing `packages/aspire/src/application/resolve-paths.ts` 2-level path contract or adding new public exports to `@netscript/aspire`.
- Adding live MySQL/MSSQL CI container jobs (`#2184` full live proof stays tracked on `#2184`).
- Destructive `deno.lock` mutations or `deno cache --reload`.

---

## 2. Architecture, Doctrine & Anti-Pattern Alignment

- **Doctrine Verdicts (§10):** `packages/cli` (**6 / Keep**), `packages/aspire` (**2 / Keep**), `packages/mcp` (**2 / Keep**).
- **F-1 File-Size Discipline:**
  - `_aspire-compat.ts.template` (baseline 1,104 LOC) → split into `_apphost-readiness.ts.template` (<350 LOC) and `_aspire-compat.ts.template` (<350 LOC).
  - `generate-register-infrastructure.ts` (baseline 670 LOC) → extract cache builders into sibling `packages/cli/src/kernel/templates/aspire/helpers/register/register-infrastructure-cache.ts` (<260 LOC), bringing `generate-register-infrastructure.ts` under 450 LOC.
- **F-16 Folder-Cardinality Discipline (`cli-showcase-cardinality-2571`):** Add **zero** new immediate children directly under `packages/cli/src/kernel/adapters/` or `packages/cli/e2e/src/application/gates/scaffold/`.
- **Anti-Patterns Explicitly Avoided (verified against `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`):**
  - **AP-1 (Monolithic file):** Both edited monoliths decomposed below 500 LOC.
  - **AP-10 (Defensive `try/catch` inside handlers):** Fail loudly on `#2202`, unrelated exit-16 errors, and legacy Node regeneration.
  - **AP-11 & AP-25 (Hidden globals / side effects in non-edge files):** Explicit `import process from 'node:process'`; Docker/process/fs IO isolated strictly to `_apphost-readiness.mts`, `_aspire-compat.mts`, and adapter modules.
  - **AP-18 (Test snapshots of giant generated strings):** Use behavioral tests, real `aspire-sdk-17.0.0.json.gz` typecheck tests, and live `deno lint` + invocation tests.
  - **AP-19 (Permissions assumed silently):** Explicit `withDenoAllowAll({ enabled: false })` + structured `applyDenoPermissions` grants for every script resource; `aspire:bump` is dry-run by default and writes only with `--apply`.
  - **AP-26 (Downstream/private consumer references in framework artifacts):** All fixtures, templates, and docs remain framework-generic.
- **Debt Registry Updates (`.llm/harness/debt/arch-debt.md`):**
  1. Line 208 (`CommunityToolkit Deno/SQLite TypeScript AppHost re-enable deferred`): record first-party `Aspire.Hosting.JavaScript@17.0.0` supersession and actual file-backed SQLite parameter behavior; mark closed upon S6 hosted proof.
  2. Line ~1805 (`scaffold-aspire-npm-island-no-lock`): mark closed in S5b/S6 — `aspire/package.json` npm island removed by native `aspire/deno.json` workspace member.
  3. D-7 (`_aspire-compat.mts` duplication, originating from `.llm/runs/chore-aspire-13-5-s4-generator-revalidation--impl/plan.md` D-4 / `_aspire-compat.ts.template` header): close in S5b/S6 after `@netscript/aspire` direct imports pass hosted runtime E2E.
  4. Line ~2515 (`aspire-browsers-preview-1713`): retain open `DEBT_ACCEPTED` with updated pin `17.0.0-preview.1.26567.5` and exit criterion `"Drop when a stable 17.x Aspire.Hosting.Browsers package exists"`.

---

## 3. Locked Design Decisions (Open-Decision Sweep: 0 Unresolved)

| ID | Decision | Exact Contract & Verification |
| --- | --- | --- |
| **L1** | **Native Deno AppHost (`aspire/deno.json`) across all 3 scaffold modes** | Root `deno.json` adds `"./aspire"` to `workspace` and `"sloppy-imports"` to `unstable` (`['raw-imports', 'kv', 'sloppy-imports']`) when `!options.noAspire` (omitted when `--no-aspire`). `aspire/deno.json` emits `"imports"` only (no `"unstable"`, zero `aspire/node_modules/` — root owns `nodeModulesDir: 'auto'`). Subpath resolution for `@netscript/aspire` + `/config`, `/constants`, `/types`, `/application`: **(1) Local workspace members (`packagesAsWorkspaceMembers: true`):** resolved automatically via `./packages/aspire` member; `aspire/deno.json` has `{ "vscode-jsonrpc": "npm:vscode-jsonrpc@8.2.0", "zod": "catalog:", ...(hasPostgres ? { "pg": "npm:pg@8.23.1" } : {}) }`. **(2) External local source (`packagesAsWorkspaceMembers: false`):** `aspire/deno.json` adds explicit mappings for all 5 `@netscript/aspire*` specifiers relative to `../${localBase}` (`packages/aspire/{mod,config,constants,types,src/application/mod}.ts`). **(3) JSR (`importMode: 'jsr'`):** `aspire/deno.json` adds `"@netscript/aspire": JSR_SPECIFIERS.aspire` (JSR resolves all 5 declared `exports`). All 3 modes × `{postgres, sqlite}` + `--no-aspire` unit-tested. |
| **L2** | **Legacy `0.0.9` Node AppHost fail-closed pre-write guard** | Before writing any file in `regenerateAspireHelpers` (`adapters/service/workspace-mutator.ts`) or `regenerateAspireConfig` (`adapters/database/workspace-mutator.ts`): if `aspire/package.json` exists without `aspire/deno.json` OR both `aspire/package.json` and `aspire/deno.json` coexist, throw `ScaffoldValidationError` before any write with exact migration steps (referencing the `0.0.9 → 0.0.10` upgrade guide) — zero files modified, credentials in `.data/aspire-secrets/` untouched. `reconcileAppHostPackageDependencies` reconciles `aspire/deno.json` (`imports.pg` when Postgres present; preserves all user entries; supports `dryRun`; idempotent). `quality-runner.ts` runs `deno check --unstable-kv --config aspire/deno.json ...appHostFiles` when `aspire/deno.json` exists, retaining read-only `tsc` fallback only when `aspire/package.json` exists alone. `kv-only/scaffold.ts:122` reads `aspire/deno.json`. |
| **L3** | **D-7 retirement, F-1 split, `ProjectConfigSchema`, & `DbCliModeExcludeFromMcp`** | Split `_aspire-compat.ts.template` into `_apphost-readiness.ts.template` (<350 LOC) + `_aspire-compat.ts.template` (<350 LOC). Generated helpers import `NetScriptConfig`, `*Entry`, `OTEL_*`, `DASHBOARD_ENV_VARS`, `RESOURCE_DEFAULTS`, `parseAppSettings`, `buildViteEnvVarName`, `resolvePermissions`, `extract*References` from `@netscript/aspire/*`. Keep 1-level `resolveWorkspacePath(projectRoot, rel)` in `_aspire-compat.mts` (leaving `@netscript/aspire/application`'s 2-level path helper untouched). `configure-dashboard.ts.template` adds `import process from 'node:process';`. `generate-config-schema.ts` imports `NetScriptConfigSchema` + populated `*EntrySchema` + `AspireSchema` from `@netscript/aspire/config` & types from `@netscript/aspire/types`, wraps via `asZodSchema<T>`, validates root + narrows literal sections with `.pipe(z.looseObject(...))` and explicit `export type ProjectConfig = Omit<NetScriptConfig, ...> & { ... }` (compiled & tested for literal key/value inference, required `Name`, defaults, malformed input, and empty sections). Inline `const DB_CLI_MODE_EXCLUDE_FROM_MCP = true;` directly in `generate-db-cli-mode-1.ts.template` (no `@netscript/aspire` public API churn). |
| **L4** | **First-party `addDenoApp` (`#320`), non-empty `scriptPath` for task mode, & `applyDenoPermissions`** | Script-based Deno resources (`services`, `plugins`, `background`) register via `builder.addDenoApp(name, workdir, entrypoint)` (entrypoint relative to workdir) + `applyDenoPermissions(resource, perms)` + `.withDenoNodeModulesDir({ mode: DenoNodeModulesDirMode.None })` + `.withDenoRuntimeArgs(['--minimum-dependency-age=0'])` (plus `.withDenoConfig('deno.json')` & `.withDenoUnstable(['no-legacy-abort'])` for plugins, `.withDenoUnstable(['worker-options'])` for background). `applyDenoPermissions` emits `.withDenoAllowAll({ enabled: true })` ONLY when `-A`/`--allow-all` is present, otherwise `.withDenoAllowAll({ enabled: false })` + merged `.withDenoAllow(kind, values)` / `.withDenoDeny(kind, values)` / `.withDenoWatch({ hmr })` / `.withDenoUnstable([...])` / `.withDenoRuntimeArgs([...])` with zero duplicate managed flags. Task-based apps (`app`, `tauri`, `task`, `desktop` build & run) pass non-empty `'main.ts'` as `scriptPath` (`builder.addDenoApp(name, workdir, 'main.ts').withDenoTask(taskName)`, plus `.withDenoScriptArgs(['--backend', 'cef'])` for desktop run) and omit script permissions (task owns permissions). Retain explicit `render-http-endpoint.ts` (`app` always gets HTTP endpoint + `withBrowserLogs()` + `withHttpHealthCheck()`; `tauri`/`task` opt in via host port; `desktop` build/run get none). Tools (`register-tools.ts`) retain `addExecutable` for `run-tool.mts`. |
| **L5** | **Locked OTEL policy preserving `service.instance.id` + `service.version`** | Every telemetry-enabled `addDenoApp` resource relies on Aspire's `WithDenoDefaults()` + `await resource.withOtlpExporter({ protocol: OtlpProtocol.HttpProtobuf })`, explicitly sets `OTEL_DENO='true'` and `OTEL_SERVICE_NAME=name`, and uses `await resource.withEnvironmentCallback(async (ctx) => ...)` to append `service.version=${config.Version}` to any existing `OTEL_RESOURCE_ATTRIBUTES` (preserving Aspire's `service.instance.id`!). Telemetry-disabled background processors explicitly override `OTEL_DENO='false'` and `OTEL_TRACES_SAMPLER='always_off'`. Verified live with real HTTP request span attributes, dashboard-free startup, and disabled-background opt-out. Remaining `buildOtelEnvVars(..., 'executable')` helper stays intact in `@netscript/aspire/application` for external callers. |
| **L6** | **CORS via `EndpointProperty.BrowserOrigins` & all 7 `#2174` empty helpers** | `generate-register-apps.ts` uses `await (await app_N.getEndpoint('http')).property(EndpointProperty.BrowserOrigins)` for enabled web `app` entries only (joining multiple via `ReferenceExpression.create`, merging with declared extra `NETSCRIPT_CORS_ORIGINS`, skipping disabled/tauri/task/desktop apps). All 7 empty-section helpers are `deno lint --no-config` clean AND preserve exact behavioral contracts: `registerPlugins` → empty `Map`, `registerBackgroundProcessors` → empty `Map`, `registerTools` → `void`, `registerServices` → empty `Map` (+ `wireServiceReferences` no-op), `registerApps` → empty `Map` AND still applies declared `NETSCRIPT_CORS_ORIGINS` to populated services/plugins, `registerInfrastructure` → empty `InfrastructureContext` (`null` primaries), `tryHandleDbCliMode` → `Promise<false>`. Tested in both populated-sibling and all-empty graphs. |
| **L7** | **Container DB `.withRepl()` & complexity-safe MSSQL `ensureDatabasePassword` (`#2184`)** | Chain `.withRepl()` on container `Postgres`, `Mysql`, and `Mssql` server builders BEFORE `.addDatabase(...)` (SQLite & External untouched; compile-verified against `aspire-sdk-17.0.0.json.gz`). Extend `ensureDatabasePassword(appHostDir, resourceName, { requireComplexity?: boolean })`: existing non-empty password files are ALWAYS reused verbatim (preserving persisted Postgres/MySQL/MSSQL volumes across restarts); empty files throw; concurrent first writes resolve safely via `wx` + `EEXIST` re-read; new MSSQL files generate 32-char passwords containing uppercase, lowercase, digit, and SQL-safe symbol (`!@#%`). Update `generate-register-infrastructure.ts:107` import predicate to include `'Mssql'`, pass secret `ParameterResource` to `addSqlServer` and `SA_PASSWORD`/`MSSQL_SA_PASSWORD`, and update `generate-register-infrastructure_test.ts:645`. Document persisted pre-0.0.10 MSSQL volume migration in the upgrade guide. |
| **L8** | **`appHostServerV2` stays OFF** | Refuted empirically in S0 (`17.0.0` rejects managed integration assemblies). |
| **L9** | **`#2259` full raw-snapshot secret scan** | In `verify-credential-rejection.ts:59`, run `assertNoSecretBytes('aspire describe', rawSnapshot, secrets)` on the raw stdout string BEFORE `JSON.parse`, field selection, diagnostics, or receipts; also scan `JSON.stringify(update.resource)` in `assertCredentialResourceNotHealthy`; update receipt `scannedSurfaces` to include `'full aspire describe snapshot'`. Reverse `credential-readiness_test.ts:224` so leaks of either fixture password in `environment`, container, consumer, or unrelated nested fields fail without echoing the secret. Closure of `#2259` requires hosted Postgres `scaffold-runtime` proving consumer + DB init/generate/seed/migrate + Studio/dashboard masking + zero secret bytes in receipts. |
| **L10** | **Locked `aspire agent init` (`17.0.0`) contract — NetScript owns all project wiring** | NetScript's `initAgent` already writes `.agents/skills/aspire/SKILL.md`, `.mcp.json`/`.vscode/mcp.json`/`.zed/settings.json`/`opencode.json` (`aspire agent mcp`), `.claude/skills/repo-skills/SKILL.md`, `AGENTS.md`, and `CLAUDE.md`. Because Aspire `17.0.0` removed `--skill-locations` and the 4 old workflow skill IDs (and `--skills aspire` mutates global `~/.claude/settings.json`), `initAgent` no longer calls upstream `aspire agent init` automatically! Rename `ASPIRE_WORKFLOW_SKILLS` → `RETIRED_ASPIRE_WORKFLOW_SKILLS` used ONLY by `cleanClaudeSkillMirrors` to clean legacy `.claude/skills/aspire-*` mirrors on upgrade. Update `guidance.md.template:38`, `docs/site/reference/ai/skills.md:196`, `.llm/tools/maint/dogfood-skills.ts` (assert `.agents/skills/aspire/SKILL.md` + `.mcp.json` `aspire agent mcp` instead of 4 retired dirs), and update `aspireAgentInitArgs` to valid `17.0.0` flags (`--workspace-root`, `--agents claude`, `--scope project`, `--skills aspire`, `--mcp=false`) if invoked directly via adapter tests. Test fresh project, preconfigured project, rerun idempotency, mirror cleanup, and non-Claude hosts. |
| **L11** | **`#2202` foreign Docker daemon diagnostic on AppHost health path (+ CLI)** | Inside `_apphost-readiness.mts`, container-backed readiness checks (`Postgres`/`Mysql`/`Mssql` containers + `Redis`/`Garnet` containers — NEVER SQLite, External, or Garnet Executable) pass `containerBacked: true`. When consecutive failures against a loopback target (`localhost`/`127.0.0.1`/`::1`) exceed `FOREIGN_DOCKER_DIAGNOSTIC_THRESHOLD_MS` (`10_000 ms`, injectable for tests), run one bounded (`3_000 ms`), cached, cancellable Docker locality probe (`DOCKER_CONTEXT` → `docker context inspect`, else `DOCKER_HOST`, else `docker context inspect`). If locality is `'remote'` (non-loopback `daemonHost`), return `HealthStatus.Unhealthy` with `code: 'FOREIGN_DOCKER_LOOPBACK'` and actionable `description` naming `daemonHost`, explaining loopback mismatch, and directing to `netscript plugin doctor` or a local Docker daemon. Local or inconclusive probes preserve the original listener failure without false positives. Secondary CLI consumer: `DbOperationRunner.waitForDatabase` (using `DenoProcess` + `DockerCliTopologyInspector`) enriches container-DB wait timeouts (`17`/`18`) with the same diagnostic when remote. |
| **L12** | **Bounded single-retry exit-16 recovery in `refresh-generated-client-consumers.ts`** | Trigger ONLY when `aspire resource <name> restart` returns `code === 16` AND stderr/stdout matches `/failed to stop resource/i`. Any other exit code or exit `16` with unrelated diagnostic fails immediately. Max 1 recovery attempt per resource under original `options.signal`: (1) `describe --format Json` on same `--apphost`, require unique exact `displayName` match (missing/ambiguous throws immediately without mutating siblings); (2) if `state` is `'Running'` or `'Stopping'`, run `aspire resource <name> stop` + abort-aware settle wait (`1_000 ms`, injectable) + `aspire resource <name> start`; if already `'Finished'`/`'Exited'`/`'FailedToStop'`/`'NotStarted'`/`null`, run `aspire resource <name> start`; (3) require `start` exit 0 (else throw with original exit-16 + recovery diagnostic + manual remedy); (4) proceed to existing `wait <name> --status healthy`. Retain `displayName` + `resourceType === 'Executable'` + `state === 'Running'` selection for `DenoAppResource`. |
| **L13** | **`17.0.0`-only fixtures + scoped parity gate (A4)** | Replace all 19 old-version fixture paths (S2 SDK gzip, S4 MCP transcript, S5a 17 remaining fixtures); keep 1 generic leading-banner stdout parser test, nullable/transition cases, and redaction coverage; update `check-compat-fixtures_test.ts` to require `17.0.0` and forbid `13.*`. |

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `addDenoApp` + `.withDenoTask('dev')` OTEL or `PORT` behavior on Vite/Fresh | Medium | High | `task-327` already proved `appArgs: ["task","dev"]`, `OTEL_DENO: true`, `PORT`; S3 live smoke verifies real HTTP request + span attributes (`service.name`, `service.version`, `service.instance.id`) |
| Legacy `0.0.9` workspace with `aspire/package.json` runs `netscript service generate` or `db add` | Medium | High | L2 pre-write guard refuses before touching any file and prints concrete migration steps |
| Generated template changes run tests against stale `EMBEDDED_TEMPLATE_CONTENT` | High | Medium | B7 rule: run `deno task gen:assets-barrel` IN S2, S3, and S4 BEFORE running each slice's tests |
| Hosted `e2e-cli` job passes via policy skip (`RUN=false`) instead of executing | Medium | High | S6 records exact checked-out SHA, `RUN=true` / non-skipped evidence, raw exit codes, and report step counts for both `scaffold-runtime` and `scaffold-runtime-sqlite` |
| Hosted real Postgres container leaks a password on an unexpected field in `aspire describe` | Low | High | `verify-credential-rejection.ts:59` scans raw stdout before parsing; if any leak occurs on hosted CI, `#2259` stays open (remove `Closes #2259`) and file upstream issue |
| `aspire-17.0.0-describe-postgres*.json` fixture needs real running Postgres container shape | Medium | Medium | Capture initial `17.0.0` Postgres + Deno shape from S0 live output in S5a, then verify/reconcile against hosted `scaffold-runtime` `describe` artifact in S6 if any field differs |
| `git push` modifying `.github/workflows/e2e-cli*.yml` fails if credential lacks `workflow` scope | Low | High | Verified on S1's very first push so any scope block surfaces immediately |

---

## 5. Ordered Commit Slices (Every Slice <30 Files, Self-Contained, Passing Gates)

### Slice S1 — Atomic `17.0.0` Pins, Dead-Pin Cleanup, Scoped Parity Gate, Docs Accuracy Pins, `aspire:bump` & CI Caching (19 files)
- **Files:**
  1. `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`
  2. `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts`
  3. `packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts`
  4. `packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts` (or exact test file path)
  5. `.llm/tools/validation/check-scaffold-versions.ts`
  6. `.llm/tools/docs/check-accuracy-and-discoverability.ts`
  7. `.llm/tools/docs/check-accuracy-and-discoverability_test.ts` (if present)
  8. `docs/site/explanation/aspire.md`
  9. `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`
  10. `.llm/tools/validation/check-aspire-version-parity.ts`
  11. `.llm/tools/validation/check-aspire-version-parity_test.ts`
  12. `.llm/tools/deps/aspire-bump.ts` (new)
  13. `.llm/tools/deps/aspire-bump_test.ts` (new)
  14. `deno.json` (`aspire:bump` task)
  15. `.github/toolchain.env`
  16. `.github/workflows/e2e-cli.yml`
  17. `.github/workflows/e2e-cli-prod.yml`
  18. `.github/workflows/e2e-cli-prod-local.yml`
  19. `.github/scripts/aspire-nuget-cache-policy.test.ts`
  20. `.llm/tools/validation/aspire-surface-manifest.ts` & `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv` (classify `aspire-bump.ts` & regenerate so Phase 1 manifest freshness passes!)
  *(21 files total, <30)*
- **Proving Commands:**
  - `deno task check:scaffold-versions`
  - `deno test --allow-read .github/scripts/aspire-nuget-cache-policy.test.ts`
  - `deno test --allow-read --allow-write --allow-run .llm/tools/validation/check-aspire-version-parity_test.ts .llm/tools/deps/aspire-bump_test.ts`
  - `deno task check:aspire-version-parity` (Phase 1 `ok: true`, `manifestFresh: true`)
  - `deno task docs:accuracy`
  - `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts`

### Slice S2 — SDK `17.0.0` Compile Fixture, Native Deno AppHost (`#319`), D-7 Retirement & F-1 `_apphost-readiness.mts` Split (24 files)
- **Files:**
  1. `packages/cli/src/kernel/templates/aspire/helpers/tests/fixtures/aspire-sdk-17.0.0.json.gz` (add, captured from live `Aspire.Cli@17.0.0` `aspire restore` with JS + Postgres + MySQL + SQLServer + Browsers!) + delete `aspire-sdk-13.5.3.json.gz`
  2. `packages/cli/src/kernel/templates/aspire/helpers/tests/installation-secret-sdk-compile_test.ts`
  3. `packages/cli/src/kernel/constants/scaffold/scaffold-packages.ts` & `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts` (add `@netscript/aspire/{config,constants,types,application}` local/JSR entries)
  4. `packages/cli/src/kernel/templates/aspire/generate-apphost-deno-json.ts` (new) + `generate-apphost-deno-json_test.ts` (new — tests all 3 modes × Postgres/SQLite + reconciler)
  5. `packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts`
  6. `packages/cli/src/kernel/templates/workspace/deno-json.ts` + `deno-json_test.ts`
  7. `packages/cli/src/kernel/templates/workspace/quality-runner.ts` + `quality-runner_test.ts` (native Deno check + failure propagation + `--skip-apphost` + legacy `tsc` fallback)
  8. `packages/cli/src/kernel/adapters/aspire/apphost-package-dependencies.ts` + `_test.ts`
  9. `packages/cli/src/kernel/adapters/service/workspace-mutator.ts` & `packages/cli/src/kernel/adapters/database/workspace-mutator.ts` + tests (fail-closed pre-write guard for legacy `aspire/package.json` alone or coexisting with `aspire/deno.json`)
  10. `packages/cli/src/kernel/assets/aspire/helpers/_apphost-readiness.ts.template` (new, <350 LOC) + `_aspire-compat.ts.template` (<350 LOC, zero D-7 duplication) + `configure-dashboard.ts.template` (`import process from 'node:process'`)
  11. `packages/cli/src/kernel/assets/manifest.ts` & `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts` & `packages/cli/src/kernel/templates/aspire/helpers/helpers-generator-pipeline.ts` (wire `_apphost-readiness.mts`)
  12. `packages/cli/src/kernel/templates/aspire/helpers/generate-config-schema.ts` + `generate-index.ts` + `generate-db-cli-mode-1.ts.template` (`DB_CLI_MODE_EXCLUDE_FROM_MCP = true`)
  13. `packages/cli/e2e/fixtures/kv-only/scaffold.ts` (line 122: `aspire/deno.json`)
  14. `packages/cli/src/kernel/assets/embedded.generated.ts` (**regenerated via `deno task gen:assets-barrel` IN S2 before running tests!**)
  15. Updated CLI scaffold/helper tests (`generators-config-infra_test.ts`, `aspire-compat-*_test.ts`, `workspace-mutator_apphost-deps_test.ts`)
  *(~24 files, <30)*
- **Proving Commands:**
  - `deno task gen:assets-barrel`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src/kernel/templates/aspire --root packages/cli/src/kernel/adapters/aspire --root packages/aspire --ext ts,tsx`
  - `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/aspire/tests packages/cli/src/kernel/templates/aspire packages/cli/src/kernel/templates/workspace packages/cli/src/kernel/adapters/aspire packages/cli/src/kernel/adapters/database/workspace-mutator_apphost-deps_test.ts`
  - Live scratch `netscript init --db sqlite` → `aspire restore` → `deno task check` (zero warnings, zero `aspire/package.json`)!

### Slice S3 — First-Party `addDenoApp` (`#320`), `BrowserOrigins`, `.withRepl()`, MSSQL Password (`#2184`), `#2174` All-7 Empty Helpers & `#2202` Diagnostics (22 files)
- **Files:**
  1. `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts` + `generate-register-services-1.ts.template`
  2. `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts` + `generate-register-plugins-1.ts.template`
  3. `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts` + `generate-register-background-1.ts.template`
  4. `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` + `generate-register-apps-1.ts.template` (`addDenoApp` + `'main.ts'` + `withDenoTask` + `EndpointProperty.BrowserOrigins` + `#2174`)
  5. `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` (<450 LOC) + `register-infrastructure-cache.ts` (new, <260 LOC) + `generate-register-infrastructure-1.ts.template` (`.withRepl()`, MSSQL `ensureDatabasePassword`, `#2174`)
  6. `packages/cli/src/kernel/templates/aspire/helpers/generate-db-cli-mode.ts` + `generate-db-cli-mode-1.ts.template` (`#2174`)
  7. `packages/cli/src/kernel/templates/aspire/helpers/register/registration-preamble.ts`
  8. `packages/cli/src/kernel/assets/aspire/helpers/_apphost-readiness.ts.template` (`#2202` container-backed loopback threshold + cached Docker locality diagnostic) + `_aspire-compat.ts.template` (complexity-safe `ensureDatabasePassword` + `applyDenoPermissions`)
  9. `packages/cli/src/kernel/adapters/database/operations/operation-runner.ts` + `_test.ts` (secondary CLI timeout enrichment via `DenoProcess` + `DockerCliTopologyInspector`)
  10. `packages/cli/src/kernel/templates/aspire/helpers/tests/empty-registration_test.ts` (all 7 real helper contracts, populated + empty graphs)
  11. `packages/cli/src/kernel/templates/aspire/helpers/tests/{generate-register-infrastructure_test.ts,aspire-compat-health-checks_test.ts,generators-*_test.ts}` (including compiling all 3 DB engines `.withRepl()` and `addDenoApp` output against `aspire-sdk-17.0.0.json.gz`!)
  12. `packages/cli/src/kernel/assets/embedded.generated.ts` (**regenerated via `deno task gen:assets-barrel` IN S3 before running tests!**)
  *(~22 files, <30)*
- **Proving Commands:**
  - `deno task gen:assets-barrel`
  - `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests packages/cli/src/kernel/adapters/database/operations`
  - Live local `netscript init --db sqlite` → `aspire restore` → `deno task check` → `aspire start --isolated` → `aspire wait` → live HTTP request to web & service → verify `/api/telemetry/spans` carries `service.name`, `service.version`, AND `service.instance.id` → `aspire stop`!

### Slice S4 — Aspire `17.0.0` Agent Init, 15-Tool MCP Baseline + Fixture, `#2259` Whole-Snapshot Scan & Exit-16 Recovery (18 files)
- **Files:**
  1. `packages/cli/src/public/features/agent/init/aspire-agent-initializer.ts` (`RETIRED_ASPIRE_WORKFLOW_SKILLS`)
  2. `packages/cli/src/public/adapters/agent/deno-aspire-agent-initializer.ts` + `_test.ts`
  3. `packages/cli/src/public/features/agent/init/init-agent.ts` + `init-agent-claude_test.ts` + `init-agent_test.ts`
  4. `packages/cli/src/kernel/assets/agent/guidance.md.template` (line 38)
  5. `.llm/tools/maint/dogfood-skills.ts`
  6. `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/tools.ts` + MCP tests
  7. `packages/cli/e2e/tests/fixtures/aspire-17.0.0-mcp-recorded.json` (add, live capture) + delete `aspire-13.5.3-mcp-recorded.json`
  8. `packages/cli/e2e/src/application/gates/scaffold/runtime/verify-credential-rejection.ts` (line 59 raw-snapshot scan + `assertCredentialResourceNotHealthy`) + `credential-secret-surfaces.ts` + `packages/cli/e2e/tests/application/gates/credential-readiness_test.ts` (reverse line 224)
  9. `packages/cli/src/kernel/adapters/database/operations/refresh-generated-client-consumers.ts` + `_test.ts` (L12 exit-16 recovery state machine)
  10. Any `packages/cli/e2e` tests asserting `aspire/package.json` or `addExecutable` updated to `aspire/deno.json` / `addDenoApp`
  11. `packages/cli/src/kernel/assets/embedded.generated.ts` (**regenerated IN S4 before running tests!**)
  *(~18 files, <30)*
- **Proving Commands:**
  - `deno task gen:assets-barrel`
  - `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/public/features/agent packages/cli/src/public/adapters/agent packages/cli/src/kernel/adapters/database/operations/refresh-generated-client-consumers_test.ts packages/cli/e2e/tests/application/gates/credential-readiness_test.ts packages/cli/e2e/src/application/gates/scaffold/aspire-mcp`
  - `deno task e2e:cli run scaffold.service --format pretty`
  - `deno task e2e:cli run scaffold.contracts --format pretty`
  - `deno task e2e:cli run scaffold.plugins --format pretty`

### Slice S5a — `17.0.0`-Only Recorded Fixtures (`e2e`, `mcp`, `teardown`) & Compat Consumer Cleanup (26 files, <30)
- **Files (all 17 remaining old-version fixture paths + 6 test/doc files):**
  - E2E fixtures (6 replaced): `aspire-17.0.0-describe-postgres{,-password-first}.json`, `aspire-describe-follow-17.0.0{,-capture,-nullable-state}.ndjson`, `aspire-doctor-17.0.0.json` (deleting `13.5.3` files)
  - MCP telemetry fixtures (6 → 3): `aspire-17.0.0-{fixture.ts,resources.json,spans.json}` (deleting `13.4.6` & `13.5.3` files) + `packages/mcp/tests/{service-endpoint-source-fixtures.ts,telemetry-live-fixture_test.ts,fixtures/README.md,fixtures/telemetry/README.md}`
  - Teardown fixtures (5 → 4): `aspire-ps-17.0.0.json`, `docker-inspect-17.0.0.json`, `process-tree-17.0.0-{orphaned,phase-b-live}.json` (deleting `13.4.6` & `13.5.3` files) + `.llm/tools/maint/teardown/{probes_test.ts,__fixtures__/README.md}`
  - E2E compat consumers & validator: `service-env-evidence_test.ts`, `generated-app-endpoint_test.ts`, `.llm/tools/validation/check-compat-fixtures_test.ts` (generic leading-banner test preserved!)
  *(counting renames once: 17 fixture replacements/deletions + 9 consumer/test/README edits = 26 files < 30!)*
- **Proving Commands:**
  - `deno test --allow-read --allow-write --allow-run .llm/tools/validation/check-compat-fixtures_test.ts .llm/tools/maint/teardown/probes_test.ts`
  - `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/mcp/tests packages/cli/e2e/tests/application/gates packages/cli/e2e/src/application/gates/scaffold/service-env`

### Slice S5b — Skills, Docs (`0.0.9 → 0.0.10` Upgrade Guide), `arch-debt.md` & Canonical Carrier Regeneration (~22 files, <30)
- **Files:**
  - Skills: `skills/aspire/SKILL.md`, `.agents/skills/aspire/SKILL.md`, `.agents/skills/aspire-upgrade/SKILL.md`
  - Docs: `docs/site/reference/aspire/index.md`, `docs/site/quickstart/aspire.md` (if present), `docs/site/reference/ai/skills.md`, new `docs/site/orchestration-runtime/how-to/upgrade-aspire-17.md` (`0.0.9 → 0.0.10` migration guide covering `aspire/package.json` → `aspire/deno.json`, `Aspire.Cli@17.0.0`, `addDenoApp`, persisted MSSQL volumes, and post-publish consumer verification handoff), plus any sidebar/nav entry
  - Debt: `.llm/harness/debt/arch-debt.md` (4 explicit rows from §2)
  - Manifest & carriers (canonical chain order from `.llm/tools/docs/generated-carriers.md`):
    1. `deno task gen:agent-docs-prose` → `packages/mcp/src/infrastructure/docs/agent-docs-prose.generated.ts`
    2. `deno task gen:mcp-export-corpus` → `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`
    3. `deno task gen:assets-barrel` → `packages/cli/src/kernel/assets/{embedded,skills,agent-tools,agent-docs}.generated.ts`
    4. `deno task gen:publish-assets` → `packages/mcp/src/publish-assets.generated.ts`
    5. `deno run --allow-read --allow-write --allow-run=git .llm/tools/validation/aspire-surface-manifest.ts` → `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv` (after updating `aspire-surface-manifest.ts` rules!)
    6. `deno task maint:dogfood-skills` → `.agents/generated/consumer-skills/`
- **Proving Commands:**
  - `deno task check:agent-docs-prose`
  - `deno task check:mcp-export-corpus`
  - `deno task check:assets-barrel`
  - `deno task check:publish-assets`
  - `deno task maint:dogfood-skills:check`
  - `deno task docs:accuracy`
  - `deno task check:aspire-version-parity` (Phase 1)
  - `deno run --allow-read --allow-run=git .llm/tools/validation/check-aspire-version-parity.ts --phase 2` (Phase 2 `ok: true`, 0 failures, `manifestFresh: true`)

### Slice S6 — Full A2/A6 Local Gates, Non-Skipped Hosted Dual-Tier `e2e-cli` Execution & Independent `IMPL-EVAL`
- Clean scratch `.llm/tmp/aspire-17-spike/` before final push.
- Execute every A2/A6 fitness gate in §6 locally (recording raw exit codes & JSON summaries in `worklog.md`).
- Mark PR ready & apply `e2e-cli-gate`; verify hosted GitHub Actions `ci` + `e2e-cli` execute **non-skipped** (`RUN=true`) at the exact candidate SHA:
  - `scaffold-static` (`scaffold.service`, `scaffold.contracts`, `scaffold.plugins`, clean-clone README)
  - `scaffold-runtime` (one-pass `scaffold.runtime --cleanup` on Docker + Postgres, including `credential-rejection` whole-snapshot scan, DB init/generate/seed/migrate, consumer + Studio verification, readiness & cleanup)
  - `scaffold-runtime-sqlite` (one-pass `scaffold.runtime.sqlite --cleanup` + showcase)
- Record exact checked-out SHA, non-skipped execution evidence, raw exit codes, and report step summaries in `worklog.md` (and reconcile `aspire-17.0.0-describe-postgres*.json` if hosted Postgres snapshot surfaces any schema nuance).
- Update `#2259` & `#2278` (keeping `#2259` open and removing `Closes #2259` if hosted Postgres finds any leak!).
- Dispatch independent **IMPL-EVAL** (`codex` / `gpt-6.2-astra` / `xhigh`), which independently inspects all evidence, authors `.llm/runs/epic-aspire-17-upgrade--2278/evaluate.md`, and determines the actual verdict (PASS or FAIL_FIX).

---

## 6. Auditable A2 / A6 / `SCOPE-docs` / `SCOPE-service` Fitness Gate Matrix

| Gate Family | Exact Command / Evidence Source | Scope Covered |
| --- | --- | --- |
| Workspace typecheck (F-2) | `deno task check` | All workspace packages including `packages/aspire`, `packages/cli`, `packages/mcp` |
| Workspace tests | `deno task test` | Full unit/integration test suite |
| Non-CLI lint & fmt (root excludes `packages/cli`) | `deno task lint` & `deno task fmt:check` | `packages/aspire`, `packages/mcp`, `packages/*`, `plugins/*` |
| **Scoped CLI lint & fmt (F-CLI)** | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` & `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx --ignore-line-endings` | Every changed/existing file in `packages/cli` (explicitly compensating for root `lint`/`fmt:check` excluding `packages/cli`) |
| **CLI quality & boundary (F-CLI)** | `deno task quality:cli` | Public/maintainer boundary, CLI checks |
| Doctrine & dependency hygiene (F-1..F-19) | `deno task quality:gate` (`quality:scan` + `arch:check` + `deps:check`) | All doctrine roots, layering, npm catalog, zod/db alignment |
| JSR doc-lint & publishability (F-5, F-6, F-7) | `deno task doc:lint` & `deno task publish:dry-run` | `@netscript/aspire`, `@netscript/cli`, `@netscript/mcp` (zero slow types) |
| Consumer JSR specifiers & host ports | `deno task check:netscript-jsr-specifiers` & `deno task check:aspire-host-ports` | Consumer import specifiers & zero unpinned host-port regressions |
| Scaffold stability (E-12) | `deno task check:scaffold-versions` | Zero prereleases in `SCAFFOLD_VERSIONS` |
| Aspire version parity (Phase 1 & Phase 2) | `deno task check:aspire-version-parity` & `... --phase 2` | `ok: true`, `manifestFresh: true`, 0 failures, 0 stale `13.*` |
| CI cache policy | `deno test --allow-read .github/scripts/aspire-nuget-cache-policy.test.ts` | Per-job NuGet + CLI + Deno cache steps & exact `17.0.0` preflight |
| Docs accuracy, README & carriers (`SCOPE-docs`) | `deno task docs:accuracy`, `deno task docs:readme:check`, `deno task check:agent-docs-prose`, `deno task check:mcp-export-corpus`, `deno task check:assets-barrel`, `deno task check:publish-assets`, `deno task maint:dogfood-skills:check` | Docs pin accuracy, links/exports drift, all generated carriers |
| Generated runtime service trace/log review (`SCOPE-service`) | Local S3 live smoke (`netscript init --db sqlite` + `/api/telemetry/{resources,spans,logs}`) + hosted `e2e-cli` telemetry gates | `service.name`, `service.version`, `service.instance.id`, logs/spans, opt-out |
| Static CLI E2E | `deno task e2e:cli run scaffold.{service,contracts,plugins}` | Generated discovery, contracts, plugins, typecheck, lint |
| **Hosted dual-tier runtime E2E (non-skipped!)** | GitHub Actions `e2e-cli` (`scaffold-static`, `scaffold-runtime`, `scaffold-runtime-sqlite`) at exact candidate SHA | Verified checked-out SHA, `RUN=true` (not policy-skipped), raw exit codes, Postgres credential-rejection whole-snapshot scan (`#2259`), dogfood proof (`#295`), cleanup |
| Independent Evaluators | PLAN-EVAL & IMPL-EVAL via `codex` / `gpt-6.2-astra` (`xhigh`) | Independent verdicts authored in `plan-eval.md` and `evaluate.md` |
