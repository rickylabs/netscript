# Research — Aspire `13.5.3` → `17.0.0` Adoption (`#2278`)

**Integrated Baseline:** `origin/main` at `6d7f10338` (merged into `epic/aspire-17-upgrade` at `9c899ea10`).  
**Delta from initial `36a464c23`:** Commit `6d7f10338` (RFC 0009 S2, `#2692`) modified `packages/service`, `packages/plugin-streams-core`, `docs/site/reference/{service,plugin-streams-core}/index.md`, and regenerated shared carriers `packages/mcp/src/infrastructure/docs/agent-docs-prose.generated.ts`, `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, and `packages/mcp/src/publish-assets.generated.ts`. All carrier regeneration in this run executes against the integrated `6d7f10338` tree.

**Target:** Aspire `17.0.0` stable train for NetScript `0.0.10` canary.

---

## 1. Live NuGet & Upstream Aspire `13.5.3` → `13.6.x` → `17.0.0` Delta

### 1.1 Verified NuGet Package Matrix (live NuGet v3 index)

| Package ID | Old Pin (`0.0.9` / `canary.6`) | Verified `17.0.0` Pin | Disposition & Callers Verified |
| --- | --- | --- | --- |
| `Aspire.Cli` | `13.5.3` | **`17.0.0`** (`17.0.0+2d325b13...`) | Update `.github/toolchain.env`, `.github/workflows/e2e-cli*.yml`, `.github/scripts/aspire-nuget-cache-policy.test.ts`. Note `packages/cli/src/kernel/assets/workspace/github/workflows/deploy-compose-ghcr.yml.template` already consumes `{{ASPIRE_SDK}}` dynamically. |
| `Aspire.Hosting.AppHost` (SDK) | `13.5.3` | **`17.0.0`** | Update `SCAFFOLD_VERSIONS.ASPIRE_SDK` |
| `Aspire.Hosting.JavaScript` | *(absent)* | **`17.0.0`** | **Add** as `SCAFFOLD_ASPIRE_INTEGRATIONS.JAVASCRIPT` — ships first-party `AddDenoApp` / `DenoAppResource` (`microsoft/aspire#18628`). Replaces `REDIS` in `.llm/tools/docs/check-accuracy-and-discoverability.ts:40` and public scaffold samples. |
| `Aspire.Hosting.PostgreSQL` | `13.5.3` | **`17.0.0`** | Update pin + adopt `.withRepl()` on server builder |
| `Aspire.Hosting.MySql` | `13.5.3` | **`17.0.0`** | Update pin + adopt `.withRepl()` on server builder |
| `Aspire.Hosting.SqlServer` | `13.5.3` | **`17.0.0`** | Update pin + adopt `.withRepl()` on server builder |
| `Aspire.Hosting.Browsers` | `13.5.3-preview.1.26425.3` | **`17.0.0-preview.1.26567.5`** | Update preview pin; retain/update `arch-debt.md` row `aspire-browsers-preview-1713` |
| `Aspire.Hosting.Redis` | `13.5.3` | *(unused)* | **Remove** from `scaffold-aspire.ts`, `generate-aspire-config.ts`, and `.llm/tools/docs/check-accuracy-and-discoverability.ts:40` (caches use `builder.addContainer()` directly) |
| `Aspire.Hosting.Garnet` | `13.5.3` | *(unused)* | **Remove** from `scaffold-aspire.ts` and `generate-aspire-config.ts` (Garnet uses `builder.addContainer()` / `addExecutable()`) |
| `CommunityToolkit.Aspire.Hosting.Deno` | `13.5.0` | *(superseded)* | **Remove** dead `ASPIRE_HOSTING_DENO` / `DENO_KV` constants and remove from `check-scaffold-versions.ts:27` (note runtime `DENO_KV_*` env vars are unrelated and stay intact) |
| `CommunityToolkit.Aspire.Hosting.Sqlite` | `13.5.0` | *(unused)* | **Remove** dead `ASPIRE_HOSTING_SQLITE` constant and remove from `check-scaffold-versions.ts:28` (SQLite uses `builder.addParameter()` + file URL) |
| `Scalar.Aspire` | `0.10.3` | *(unused)* | **Remove** dead `SCALAR_ASPIRE` constant and remove from `check-scaffold-versions.ts:29` |

### 1.2 Breaking Changes & Behavioral Deltas Verified in `17.0.0` Source + Live CLI

1. **First-party Deno hosting (`Aspire.Hosting.JavaScript@17.0.0`, `#18627`/`#18628`):**
   - `builder.addDenoApp(name: string, appDirectory: string, scriptPath: string): DenoAppResourcePromise`
   - **Critical Argument Guard (`JavaScriptHostingExtensions.cs:813-825` + live `task-327`):** `AddDenoApp` calls `ArgumentException.ThrowIfNullOrEmpty(scriptPath)` and validates path containment inside `appDirectory` BEFORE returning the builder! Passing `''` throws `INVALID_ARGUMENT`. When using `.withDenoTask(taskName)`, passing a non-empty app-relative path such as `'main.ts'` succeeds, and `.withDenoTask('dev')` emits exact `resource.appArgs: ["task", "dev"]` (verified live in `task-327`).
   - **Task Mode & Endpoints (`DenoHostingExtensions.cs:491-575`):** Task mode emits `task <taskName>` + script args and omits script permission flags (permissions belong to the task definition in `deno.json`). Task mode supplies NO automatic `PORT`, so explicit `render-http-endpoint.ts` (`withHttpEndpoint({ env: 'PORT' })` / opt-in host pin) stays authoritative.
   - **OTEL Defaults (`JavaScriptHostingExtensions.cs:1067-1085` + live S0):** `WithDenoDefaults()` enables `OTEL_DENO=true` conditionally when an HTTP OTLP endpoint is present, sets `OTEL_EXPORTER_OTLP_*`, `OTEL_SERVICE_NAME=<name>`, `OTEL_RESOURCE_ATTRIBUTES=service.instance.id=<suffix>`, `DENO_CERT`, and sampler/delays. Writing `OTEL_RESOURCE_ATTRIBUTES` directly via `withEnvironment` would overwrite `service.instance.id`; appending `,service.version=<ver>` via `withEnvironmentCallback` preserves `service.instance.id` alongside `service.version`.
   - `DenoAppResource` inherits `JavaScriptAppResource` → `ExecutableResource`. Live `aspire describe --format Json` reports `"resourceType": "Executable"` and `"resourceTypeDisplayName": "Deno"`.
   - Exact ATS-projected TypeScript signatures verified from generated `.aspire/modules/aspire.mts`:
     - `.withDenoAllowAll(options?: { enabled?: boolean })`
     - `.withDenoAllow(kind: DenoPermissionKind, values: string[])`
     - `.withDenoDeny(kind: DenoPermissionKind, values: string[])`
     - `.withDenoConfig(configFile: string)`
     - `.withDenoNodeModulesDir(options?: { mode?: DenoNodeModulesDirMode | null })`
     - `.withDenoUnstable(features: string[])`
     - `.withDenoWatch(options?: { hmr?: boolean })`
     - `.withDenoTask(taskName: string)`
     - `.withDenoRuntimeArgs(args: string[])`
     - `.withDenoScriptArgs(args: string[])`
     - `.withBrowserLogs(options?: WithBrowserLogsOptions)` is exported directly on `DenoAppResourcePromise`.
2. **Native Deno TypeScript AppHost toolchain (`TypeScriptAppHostToolchainResolver.cs`, `#16218`):**
   - Selects `deno` when `aspire/deno.json` exists and `aspire/package.json` is absent. Canonical `aspire.config.json` `appHost.language` stays `"typescript/nodejs"`; `aspire doctor` reports `environment/typescript-apphost-tools: pass` (`toolchain: "deno"`).
   - **Verified Zero-Warning Workspace Resolution:** Adding `"./aspire"` to generated root `deno.json` `workspace` and `"sloppy-imports"` to root `deno.json` `unstable` (`['raw-imports', 'kv', 'sloppy-imports']`) when `!options.noAspire` lets `aspire/deno.json` omit `"unstable"`, inherit root `catalog: { zod }` and `nodeModulesDir: 'auto'`, and resolve `@netscript/aspire/*` with zero warnings and zero `aspire/node_modules/` npm island.
3. **`aspire agent init` Breaking CLI Flag & Side-Effect Change (`AgentInitCommand.cs:503-512` + live `task-327`):**
   - `--skill-locations` and the 4 old skill IDs (`aspire-init`, `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment`) were **REMOVED**.
   - Live `task-327` proved `--skills aspire --mcp=false` writes `.claude/settings.json` (`aspire@aspire-skills` remote Git plugin marketplace) AND mutates user-level `~/.claude/settings.json` telemetry hooks, while leaving `.agents/skills/aspire/SKILL.md` untouched. `--skills none --mcp=false` prints `"No agent configuration selected. Existing configuration was left unchanged."` (exit 0), though upstream code can still refresh hooks for pre-existing setups.
   - All source callers of the 4 retired skill names were inventoried: `aspire-agent-initializer.ts`, `deno-aspire-agent-initializer_test.ts`, `init-agent-claude_test.ts`, `packages/cli/src/kernel/assets/agent/guidance.md.template:38`, `docs/site/reference/ai/skills.md:196`, and `.llm/tools/maint/dogfood-skills.ts:6-10 & 104-108`.
4. **Aspire MCP 15th Tool (`wait_for_resources`) & Deprecated `aspire mcp start`:**
   - Live `aspire agent mcp` `tools/list` returns 15 tools (`serverInfo.version: "17.0.0"`), adding `wait_for_resources`.
   - `packages/cli/e2e/tests/fixtures/aspire-13.5.3-mcp-recorded.json` and `aspire-mcp/tools.ts` currently assert 14 tools and must land together on `17.0.0`.
5. **`EndpointProperty.BrowserOrigins` & Container DB `.withRepl()`:**
   - `EndpointReference.property(EndpointProperty.BrowserOrigins)` returns a deferred comma-separated browser-origins expression (`EndpointReference.cs:55-71`).
   - `PostgresServerResource`, `MySqlServerResource`, and `SqlServerServerResource` all export `.withRepl()` on the server builder (before `.addDatabase(...)`).
6. **Dashboard Telemetry API:**
   - Live `17.0.0` verified `POST /api/telemetry/validateToken` → `X-API-Key` and anonymous mode (`ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true`): `resources`, `spans`, `traces`, and `logs` all return HTTP `200` with exact OTLP JSON envelopes matching `packages/mcp` (`validateDashboardEnvelope`) and `packages/cli/e2e` (`aspire-dashboard-api.ts`).

---

## 2. S0 Live Empirical Spike Receipts (`Aspire.Cli@17.0.0+2d325b13`)

Executed locally on `deno 2.9.8` + `dotnet 10.0.400` in scratch `.llm/tmp/aspire-17-spike/` (zero `package.json`, zero `aspire/node_modules/`):

| Check | Observed Result | Decision Impact |
| --- | --- | --- |
| `aspire restore --non-interactive` (v1, JS + Postgres + Browsers) | **4,602 ms** (exit 0) | Native Deno restore proven |
| `aspire start --isolated` (v1, Deno AppHost + `addDenoApp` + Postgres + Browsers) | **6,219 ms** (exit 0); `api` healthy in **0.0s** | Cold start significantly faster than Node/tsx |
| `aspire stop --apphost apphost.mts` | **2,335 ms** (exit 0) | Clean stop |
| `features.appHostServerV2: true` (`aspire restore`) | **FAILED (exit 6):** `"AppHost Server v2 requires protocol-v2 provider packages. Managed integration assemblies cannot be loaded into this server."` | **L8 NO-GO:** retain default v1 AppHost server |
| `addDenoApp(name, workdir, '').withDenoTask('dev')` (`task-327`) | **FAILED (exit 2):** `INVALID_ARGUMENT: The value cannot be an empty string. (Parameter 'scriptPath')` | **L4:** always pass non-empty `'main.ts'` `scriptPath` |
| `addDenoApp(name, workdir, 'main.ts').withDenoTask('dev')` (`task-327`) | **PASS (exit 0):** `appArgs: ["task","dev"]`, `OTEL_DENO: true`, `PORT: 18080`, healthy in 0.0s | Confirms task-mode registration & explicit `PORT` |
| `#2259` local redaction probe (`addPostgres` secret password + `withEnvironment('DATABASE_URL', db)` + `withReference(db)`) | Inside `api` process: `hasDbUrlSecretInProcess: true`, `hasConnStrSecretInProcess: true`. In `aspire describe --format Json` & table: `DATABASE_URL: null`, `ConnectionStrings__appdb: null`, `APPDB_URI: null`, `APPDB_PASSWORD: null`, 0 secret bytes anywhere in snapshot | Justifies restoring whole-snapshot scan (`verify-credential-rejection.ts:59`); **not** a hosted Postgres verdict — closure remains gated on hosted `scaffold-runtime` |
| `aspire agent init --skills aspire --mcp=false` vs `--skills none --mcp=false` (`task-327`) | `--skills aspire` writes `.claude/settings.json` + mutates user-level `~/.claude/settings.json` telemetry hooks while preserving `.agents/skills/aspire/SKILL.md`; `--skills none --mcp=false` exits 0 without touching project files | **L10:** NetScript owns all project agent wiring natively; retire automatic upstream `aspire agent init` call |
| `aspire doctor --format Json` | 10 checks incl. `environment/typescript-apphost-tools: pass` (`toolchain: "deno"`) & `environment/aspire-skill-sources: warning` | Update doctor fixture & expectations |
| `aspire agent mcp` `tools/list` | 15 tools (`wait_for_resources` added), `serverInfo.version: "17.0.0"` | Update `tools.ts` + recorded fixture together in S4 |
| Deno workspace + `./aspire` member + root `unstable: ["raw-imports", "kv", "sloppy-imports"]` | Zero warnings, `deno check` & `deno run` exit 0 resolving local `@netscript/aspire/*` (`zod: "catalog:"`) | Locks L1 workspace integration |

---

## 3. Complete Inventory of Old-Version Tracked Fixtures (19 Paths)

Verified via `git ls-files '*13.4.6*' '*13.5.3*' | grep -v '^\.llm/runs/'`:
1. **SDK compile fixture (1 path — lands in S2 before S2/S3 compile tests):**
   - `packages/cli/src/kernel/templates/aspire/helpers/tests/fixtures/aspire-sdk-13.5.3.json.gz` → replace with `aspire-sdk-17.0.0.json.gz`
2. **MCP recorded transcript (1 path — lands in S4 together with 15-tool baseline):**
   - `packages/cli/e2e/tests/fixtures/aspire-13.5.3-mcp-recorded.json` → replace with `aspire-17.0.0-mcp-recorded.json`
3. **E2E describe / describe-follow / doctor fixtures (6 paths — S5a):**
   - `packages/cli/e2e/tests/application/gates/fixtures/aspire-13.5.3-describe-postgres-password-first.json`
   - `packages/cli/e2e/tests/application/gates/fixtures/aspire-13.5.3-describe-postgres.json`
   - `packages/cli/e2e/tests/application/gates/fixtures/aspire-describe-follow-13.5.3-capture.ndjson`
   - `packages/cli/e2e/tests/application/gates/fixtures/aspire-describe-follow-13.5.3-nullable-state.ndjson`
   - `packages/cli/e2e/tests/application/gates/fixtures/aspire-describe-follow-13.5.3.ndjson`
   - `packages/cli/e2e/tests/application/gates/fixtures/aspire-doctor-13.5.3.json`
4. **MCP telemetry fixtures (6 paths — S5a):**
   - `packages/mcp/tests/fixtures/telemetry/aspire-13.4.6-{fixture.ts,resources.json,spans.json}` (delete)
   - `packages/mcp/tests/fixtures/telemetry/aspire-13.5.3-{fixture.ts,resources.json,spans.json}` → replace with `aspire-17.0.0-*`
5. **Teardown fixtures (5 paths — S5a):**
   - `.llm/tools/maint/teardown/__fixtures__/aspire-ps-13.4.6.json`, `docker-inspect-13.4.6.json` (delete `aspire-ps-13.4.6.json`; rename/replace `docker-inspect` to version-neutral or `17.0.0`)
   - `.llm/tools/maint/teardown/__fixtures__/aspire-ps-13.5.3.json`, `process-tree-13.5.3-orphaned.json`, `process-tree-13.5.3-phase-b-live.json` → replace with `17.0.0` captures

Plus the 5 compat-fixture test consumers (`probes_test.ts`, `service-env-evidence_test.ts`, `generated-app-endpoint_test.ts`, `service-endpoint-source-fixtures.ts`, `telemetry-live-fixture_test.ts`) and `.llm/tools/validation/check-compat-fixtures_test.ts`.

---

## 4. JSR Public-Surface Audit (Before Slicing)

Audited every affected published package (`deno.json` exports, `isolatedDeclarations`, slow types, consumer subpath resolution):

1. **`@netscript/aspire` (`packages/aspire` — Doctrine §10: Archetype 2 / Keep):**
   - **Zero public API changes required!**
   - `RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp` is NOT added to `@netscript/aspire/constants`; it is a single template-local constant (`const DB_CLI_MODE_EXCLUDE_FROM_MCP = true;`) owned by `generate-db-cli-mode-1.ts.template`.
   - `packages/aspire/src/application/resolve-paths.ts` (2-level `..`/`..`) is untouched; generated helpers keep their own 1-level `resolve(projectRoot, rel)` wrapper.
   - `packages/aspire/config.ts` (934 LOC, pre-existing debt) is untouched; `generate-config-schema.ts` adapts the existing structural `AspireSchema<T>` exports (`NetScriptConfigSchema`, `*EntrySchema`) via a generated `asZodSchema<T>` wrapper + `.pipe(z.looseObject(...))` and explicit `Omit<NetScriptConfig, ...> & { ... }` type so literal keys, value types, root field defaults, and malformed-input validation all work without exposing Zod internals on `@netscript/aspire`.
   - **Consumer subpath resolution (all 3 scaffold modes):**
     - Local workspace members (`packagesAsWorkspaceMembers: true`): `./packages/aspire` is a workspace member; Deno resolves `@netscript/aspire` and `/config`, `/constants`, `/types`, `/application` automatically from `packages/aspire/deno.json` `exports`.
     - External local source (`packagesAsWorkspaceMembers: false`): `aspire/deno.json` maps all 5 specifiers (`@netscript/aspire`, `/config`, `/constants`, `/types`, `/application`) to `<localBaseFromAspire>/packages/aspire/{mod,config,constants,types,src/application/mod}.ts`.
     - JSR mode (`importMode: 'jsr'`): `aspire/deno.json` maps `"@netscript/aspire": JSR_SPECIFIERS.aspire` (JSR resolves all declared `exports` subpaths automatically).
   - Gate: `deno doc --lint` + `deno publish --dry-run` on `packages/aspire` (unchanged surface must remain 100% green).
2. **`@netscript/cli` (`packages/cli` — Doctrine §10: Archetype 6 / Keep):**
   - Public/maintainer split strictly preserved (`deno task arch:check` + `deno task quality:cli`).
   - Open F-16 cardinality debt (`cli-showcase-cardinality-2571`): **zero** new immediate children under `packages/cli/src/kernel/adapters/` or `packages/cli/e2e/src/application/gates/scaffold/`.
   - **F-1 File-Size Remediation:** Split `_aspire-compat.ts.template` (1,104 LOC) into `_apphost-readiness.ts.template` (<350 LOC) and `_aspire-compat.ts.template` (<350 LOC), and decompose `generate-register-infrastructure.ts` (670 LOC) by extracting cache-setup builders into sibling `register-infrastructure-cache.ts` so both stay <500 LOC.
   - Gate: scoped `run-deno-{check,lint,fmt}.ts --root packages/cli --ext ts,tsx`, `deno task quality:cli`, `deno task doc:lint`, `deno task publish:dry-run`.
3. **`@netscript/mcp` (`packages/mcp` — Doctrine §10: Archetype 2 / Keep):**
   - Zero runtime/export changes; only test fixtures (`packages/mcp/tests/fixtures/telemetry/` & `service-endpoint-source-fixtures.ts`) and shared generated docs carriers updated.
   - Gate: `deno task check`, `deno task test`, `deno task doc:lint`, `deno task publish:dry-run`.
