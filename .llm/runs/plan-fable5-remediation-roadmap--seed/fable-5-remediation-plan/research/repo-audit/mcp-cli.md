# Repo audit — MCP server + CLI generation surface

Baseline: branch `plan/fable5-remediation-roadmap`, worktree `/home/codex/repos/netscript-fable5-remediation-plan`,
== `origin/main` `fac9e339042c` (2026-08-08). All paths repo-relative unless noted.
Gap classes used: **docs/discovery**, **scaffold/generation**, **API/type-system seam**,
**runtime correctness**, **plugin-composition**, **product-expectation-outside-scope**.

---

## 1. MCP server — what exists

### 1.1 Location and composition root

- Package: `packages/mcp/` (`deno.json:3` → `"version": "0.0.4"`). Exports `.` (`mod.ts`),
  `./cli` (`cli.ts`), `./openapi-projection` (`openapi-projection.ts`).
- Tool name list: `packages/mcp/src/domain/tool-types.ts:4-26` (`TOOL_NAMES`, 21 entries).
- Registry builder: `packages/mcp/src/application/tool-registry.ts:64-79` — freezes a
  `ToolDefinition[]` from `TOOL_NAMES` × `kinds` (`:11-33`) × `summaries` (`:34-61`) ×
  `TOOL_INPUT_SCHEMAS`/`TOOL_OUTPUT_SCHEMAS` (`packages/mcp/src/domain/tool-contracts.ts`).
  Any tool without an injected flow falls back to `createPlannedFlow(name)`
  (`tool-registry.ts:76`, `src/application/flows/planned-flow.ts`).
- Protocol runner: `packages/mcp/src/application/runner/mcp-server.ts` —
  `MCP_PROTOCOL_VERSION = '2025-11-25'` (`:22`), server version = `MCP_PACKAGE_VERSION` (`:18`),
  fixed host instructions `MCP_AGENT_INSTRUCTIONS` (`:24`).
- Transport: newline-delimited JSON-RPC over stdio, `src/infrastructure/stdio-transport.ts`
  (`runNewlineStdio`, invoked at `cli.ts:104`). No npm MCP SDK.
- Batteries-included composition: `packages/mcp/cli.ts:108-234` (`createMcpCliServer`) — this is
  the only place where every real flow is bound. `cli.ts:266` runs it when `import.meta.main`.
- CLI-hosted composition: `packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts:22-50`
  (`createAgentMcpOptions`) injects the live CLI command catalog, spawn executor, plugin doctor,
  and one extra embedded doc.

### 1.2 The 21 tools (name → kind → flow factory)

Kinds from `tool-registry.ts:11-33`; flow bindings from `packages/mcp/cli.ts:136-232`.

| Tool | Kind | Flow factory (source) |
| --- | --- | --- |
| `get_app_status` | read | `flows/get-app-status-flow.ts` (telemetry query) |
| `list_runs` | read | `flows/list-runs-flow.ts` |
| `get_run` | read | `flows/get-run-flow.ts` |
| `get_recent_errors` | read | `flows/get-recent-errors-flow.ts` |
| `get_last_job_result` | read | `flows/get-last-job-result-flow.ts` |
| `analyze_service_performance` | read | `flows/analyze-service-performance-flow.ts` |
| `analyze_db_bottlenecks` | read | `flows/analyze-db-bottlenecks-flow.ts` |
| `doctor` | meta | `flows/doctor-flow.ts` over `AspireDoctorFamily`, `ProjectWiringDoctorFamily`, `PluginDoctorFamily` (`cli.ts:202-208`) |
| `search_docs` | read | `flows/docs-flows.ts:32-43` |
| `list_docs` | read | `flows/docs-flows.ts:19-31` |
| `get_doc` | read | `flows/docs-flows.ts:44-97` |
| `find_export` | read | `application/export-surfaces/export-surface-flows.ts` |
| `list_package_exports` | read | idem |
| `get_export` | read | idem |
| `search_exports` | read | idem |
| `list_commands` | meta | `flows/list-commands-flow.ts` over `CommandCatalogPort` |
| `execute_command` | mutate | `flows/execute-command-flow.ts` + `domain/command-policy.ts` |
| `record_drift` | mutate | `flows/record-drift-flow.ts` (evidence-gated) |
| `list_api_services` | read | `flows/list-api-services-flow.ts` |
| `list_service_operations` | read | `flows/list-service-operations-flow.ts` |
| `get_operation_schema` | read | `flows/get-operation-schema-flow.ts` |

All read/analytics/doctor/service flows are wrapped in `withReceipt(...)`
(`packages/mcp/cli.ts:236-264`) which writes a diagnostic receipt via
`FilesystemDiagnosticEvidence(projectRoot)`; `record_drift` refuses without a fresh receipt.
`list_commands` and `execute_command` are **not** receipt-wrapped (`cli.ts:194-200`).

Results are bounded server-side by `runner/truncation.ts` (`DEFAULT_TRUNCATION_POLICY`,
`ResultByteLimitError`), applied in `mcp-server.ts`.

### 1.3 `search_docs` corpus — what it actually indexes

Two corpus adapters implement `DocsCorpusPort` (`src/domain/docs-corpus-port.ts`):

- `FilesystemDocsCorpus` (`src/infrastructure/filesystem-docs-corpus.ts`) — used **only** when a
  docs root is configured.
- `EmbeddedDocsCorpus` (`src/infrastructure/embedded-docs-corpus.ts:33-78`) — in-memory,
  lexical `tokenize`/`rankDocument`, slug aliasing with `redirectedFrom`.

Selection logic, `packages/mcp/cli.ts:115-121`:

```ts
const configuredDocsRoot = options.docsRoot ??
  resolveDocsRoot([], Deno.env.get('NETSCRIPT_DOCS_ROOT'), projectRoot);
const docsCorpus = configuredDocsRoot
  ? new FilesystemDocsCorpus({ root: configuredDocsRoot })
  : new EmbeddedDocsCorpus({
    documents: [{ slug: 'mcp', source: MCP_PACKAGE_README }, ...(options.embeddedDocs ?? [])],
  });
```

`resolveDocsRoot` (`cli.ts:83-92`) only reads the `--docs-root` flag and `NETSCRIPT_DOCS_ROOT`;
**it never probes the project for a docs directory**.

So the default corpus is:

- standalone (`deno x jsr:@netscript/mcp/cli`): **1 document** — the MCP package README, embedded as
  a single string constant `MCP_PACKAGE_README` in `packages/mcp/src/publish-assets.generated.ts:8`
  (9-line generated file, produced by `.llm/tools/generate-publish-assets.ts:115`).
- via `netscript agent mcp`: **2 documents** — README + `help.md`, from
  `run-agent-mcp.ts:48`: `embeddedDocs: [{ slug: "help", source: EMBEDDED_SKILL_FILES["help.md"] }]`
  (`packages/cli/src/kernel/assets/skills.generated.ts`).

The published docs site (`docs/site/**`, ~hundreds of Markdown files) is **never** indexed by
default.

### 1.4 Release matching

- `MCP_PACKAGE_VERSION` / `CLI_PACKAGE_VERSION` are both generated into
  `packages/mcp/src/publish-assets.generated.ts:5` and
  `packages/cli/src/kernel/assets/publish-assets.generated.ts:5` by
  `.llm/tools/generate-publish-assets.ts` (`deno task gen:publish-assets`). Both read `0.0.4` at
  this baseline, matching `packages/mcp/deno.json:3` and `packages/cli/deno.json:3`.
- Server `serverInfo.version` = `MCP_PACKAGE_VERSION` (`mcp-server.ts:18`).
- Export corpus is release-pinned: `EmbeddedExportSurfaceCorpus`
  (`src/infrastructure/export-surfaces/embedded-export-surface-corpus.ts:46,58-62`) defaults
  `expectedFrameworkVersion` to `MCP_PACKAGE_VERSION` and **throws** on
  `provenance.frameworkVersion !== expected`, plus schema-version and SHA-256 checks. Payload is
  gzip+base64 in `export-surface-corpus.generated.ts` (derived from `deno doc --json`).
- Agent-host config is version-pinned: `initAgent` writes `.mcp.json` / `.vscode/mcp.json` with
  `cliSpecifier = netscriptJsrSpecifier('cli')` →
  `jsr:@netscript/cli@${CLI_PACKAGE_VERSION}` (`packages/cli/src/kernel/constants/jsr-specifiers.ts:33-45`,
  used at `init-agent.ts:232,241-262`).
- `SpawnCommandExecutor.DEFAULT_CLI_COMMAND` =
  `['deno','run','-A', 'jsr:@netscript/cli@' + MCP_PACKAGE_VERSION]`
  (`packages/mcp/src/infrastructure/spawn-command-executor.ts:8-14`).

### 1.5 `execute_command` policy

`packages/mcp/src/domain/command-policy.ts:23-51`. Deny beats allow, unmatched = `default_deny`
(`:58-66`).

- allow: `db init|generate|migrate|seed|status|introspect`, `generate`, `contract`, `service list`,
  `plugin install|list|sync|doctor`, `ui:add|ui:init|ui:list|ui:update`.
- deny: `deploy`, `init`, `marketplace`, `db reset`, `plugin remove`, `ui:remove`.

Parity with the live CLI tree is asserted by
`packages/cli/src/public/features/agent/mcp/command-policy-parity_test.ts`.

### 1.6 MCP gaps

| # | Gap | Class | Evidence |
| --- | --- | --- | --- |
| M1 | Default `search_docs`/`list_docs`/`get_doc` corpus is 1–2 documents (MCP README + `help.md`). The framework's actual documentation is not reachable through MCP unless the operator manually sets `--docs-root`. | docs/discovery | `packages/mcp/cli.ts:115-121`; `run-agent-mcp.ts:48` |
| M2 | `netscript agent init --with-docs` installs an offline corpus at `.netscript/docs/` (`packages/cli/src/public/features/agent/init/init-agent.ts:94-104`) but `writeHostConfig` (`init-agent.ts:226-262`) emits MCP args `['run','--config',…,'-A',cliSpecifier,'agent','mcp','--project-root',projectRoot]` with **no `--docs-root`**. The corpus the user just paid several MB for is invisible to `search_docs`. | scaffold/generation | `init-agent.ts:94-104` vs `:241-262`; `resolveDocsRoot` at `packages/mcp/cli.ts:83-92` does no auto-detection |
| M3 | `execute_command` from the CLI-hosted server spawns a *downloaded JSR CLI pinned to the MCP package version* rather than re-entering the running CLI: `run-agent-mcp.ts:44` passes `new SpawnCommandExecutor()` with no `cliCommand` override, so `DEFAULT_CLI_COMMAND` (`spawn-command-executor.ts:8-14`) applies. A locally-built or workspace CLI silently executes a different binary. | runtime correctness | `run-agent-mcp.ts:44`; `spawn-command-executor.ts:8-14` |
| M4 | No MCP tool exposes the generation surface as *contracts* — there is no `list_generators` / `describe_generator` / `plan_generation`. Agents can only shell `execute_command` and read a bounded output tail (`DEFAULT_OUTPUT_TAIL_BYTES = 4_096`, `spawn-command-executor.ts:18`), so a scaffold's file plan is not machine-readable through MCP even though `--dry-run --json` exists on `init`. | docs/discovery | `tool-types.ts:4-26`; `packages/cli/src/public/features/init/init-command.ts:94-95` |
| M5 | `list_commands` and `execute_command` are not receipt-wrapped, so a successful `plugin doctor` run *through MCP* does not produce the receipt that `record_drift` requires. | runtime correctness | `packages/mcp/cli.ts:194-200` vs `:201-213` |

---

## 2. Full CLI command tree (from source)

Two binaries. Public tree: `packages/cli/src/public/features/root/public-command-tree.ts:48-112`
(`createPublicCommandRegistry`) → program `netscript`, version `CLI_PACKAGE_VERSION` (`:121`).
Maintainer tree: `packages/cli/src/maintainer/features/root/maintainer-command-tree.ts:27-47` →
program `netscript-dev`, hard-coded version `'1.0.0'` (`:32`).

### 2.1 `netscript` (public)

```
netscript
├── init [name]                       init/init-command.ts:69-96
├── agent                             agent/agent-group.ts:22-52
│   ├── mcp
│   ├── init
│   └── drift record
├── config                            config/config-group.ts:13-29
│   ├── inspect | list | get | set
│   ├── override …
│   └── runtime publish | rollback
├── contract                          contracts/contracts-group.ts:17-28
│   ├── add | version | remove | add-route | inspect | list
├── db                                db/db-group.ts:26-51
│   ├── add | list | remove | init | generate | migrate | seed | status
│   ├── studio | introspect | reset | deploy | validate | resolve
├── deploy                            deploy/deploy-group.ts:25-97
│   ├── list | desktop | build | deno-deploy | package-cli | copy
│   ├── install | start | stop | status | logs | uninstall | upgrade
│   └── docker | compose | kubernetes | azure-aca | azure-app-service | azure-aks | cloud-run
├── generate                          generate/generate-group.ts:13-31
│   ├── aspire | runtime-schemas | plugins
├── marketplace search | publish      marketplace/marketplace-group.ts
├── plugin                            plugins/plugins-group.ts:33-151
│   ├── list | new | scaffold | install | ai | sync | info | update | remove
│   ├── doctor | item-add | auth
│   └── enable | disable | setup      (generated from FRAMEWORK_VERBS minus CONCRETE_VERBS, :127-149)
├── service                           services/services-group.ts:17-59
│   ├── add | list | ref | set | remove | add-handler | generate
├── ui:add <kind> [name]              ui/add/add-ui-command.ts:24-82
├── ui:init | ui:list | ui:update | ui:remove   public-command-tree.ts:99-109
```

`FRAMEWORK_VERBS` = `install, remove, enable, disable, sync, setup, update, doctor, info`
(`plugins/dispatch/dispatch-plugin-verb.ts:15-25`); `CONCRETE_VERBS` (handled by first-party
commands) = `install, sync, info, update, remove, doctor` (`plugins-group.ts:20-27`), so
`enable`, `disable`, `setup` are pure pass-through dispatchers to the plugin's own CLI.

### 2.2 `netscript-dev` (maintainer)

```
netscript-dev
├── init                              maintainer/features/init/init-command.ts
├── sync packages | plugin | templates    sync/sync-group.ts:21-42
├── probe monorepo                    probe/probe-group.ts:19
├── test scaffold                     test-scaffold/test-group.ts:19
└── release eject                     release/release-group.ts:19
```

---

## 3. Generation verbs — inputs, emissions, idempotency

`resolveProjectRoot` for every public command is
`packages/cli/src/public/features/root/public-command-dependencies.ts:195-197` →
`findDeployProjectRoot` = `findProjectRoot` (`packages/cli/src/kernel/adapters/config/deploy-config.ts:59-84`),
which walks up until it finds `netscript.config.ts`, `dotnet/AppHost/appsettings.json`, **or a
`deno.json` with a `workspace` array**. It therefore always returns the **workspace root**, never
`apps/<appName>/`. This is load-bearing for §3.5 and §4.

| Verb | Inputs | Emits | Idempotency / drift |
| --- | --- | --- | --- |
| `init [name]` | `--app-name --db --service[-name] --model-name --cache --editor --no-aspire --no-git --force --ci --dry-run --json --from <preset> --path` (`init/init-command.ts:71-96`) | Whole workspace: `apps/<appName>/` (routes, `.generated/manifest.ts` + `routes.ts` seeds, `router.ts`, `utils.ts`, `lib/example-service.ts`, `components/ui/`, design + examples routes), `contracts/`, `services/<name>/`, `aspire/`, `.github/workflows`, editor config — see `kernel/application/scaffold/writers/write-app-files.ts` and `write-init.ts`, `kernel/domain/scaffold/scaffold-plan.ts:56` | All-or-nothing: `--force` overwrites the target directory; `--dry-run --json` previews the plan. No merge into an existing workspace. |
| `contract add <name>` | `--force`, project root (`contracts/add/add-contract.ts:12-17`) | `contracts/versions/v1/<name>.contract.ts` + regenerated version aggregate (`kernel/adapters/contracts/contract-scaffolder.ts`, templates `templates/generate-v1-mod.ts`) | `--force` gate; project name inferred from `contracts/deno.json` `@<project>/contracts` (`add-contract.ts:33-49`) |
| `contract add-route` | `--contract --procedure --method --path --input --output --version` (`contracts/add-route/add-contract-route.ts:14-23`) | **In-place text append** into the existing `<contract>.contract.ts` via `appendContractRoute` (`kernel/adapters/contracts/contract-source.ts`) | Source-mutating append; validates method against `CONTRACT_HTTP_METHODS`; fails if contract file absent (`:42-47`). No dedupe/dry-run flag. |
| `contract inspect` | contract + version | read-only procedure list (`inspectContractSource`) | n/a |
| `service add <name>` | `--port`, refs, project root (`services/add/plan-service-add.ts:24-54`) | `services/<name>/` from `kernel/assets/service/*.template` (`main.ts`, `contract.ts`, `router.ts`, `routers/v1.ts`, `routers/health.ts`), port allocation, `appsettings.json` entry | **Refuses** if the name is taken (`validateUniqueName`) or already in `appsettings.json` (`:35-40`). Not re-runnable. |
| `service add-handler` | `--service --procedure --version` (`services/add-handler/add-service-handler.ts:10-16`) | in-place append into `services/<svc>/src/routers/<version>.ts` via `appendServiceHandler` (`kernel/adapters/service/router-source.ts`) | Verifies the procedure exists in the contract first (`:48-53`); fails if router missing. Append-only. |
| `service generate` | `--project-root` (`services/generate/generate-service-command.ts:26-41`) | Aspire helper files only — it is a thin alias of `generate aspire` (`generate/aspire/generate-aspire.ts`) | Full regeneration from `appsettings.json`; content-addressed rewrite. |
| `generate aspire` | `--project-root` (`generate/aspire/generate-aspire-command.ts:15-34`) | `aspire/helpers/*` regenerated, then `formatGeneratedFiles` runs `deno fmt` on them | Idempotent regeneration from config. |
| `generate runtime-schemas` | `--dry-run --force --verbose --project-root` (`generate/runtime-schemas/generate-runtime-schemas-command.ts:41-45`) | JSON Schema file per runtime-config topic, at plugin-declared paths | **Explicit content-compare**: result splits `written` vs `skipped` (unchanged); `--force` rewrites regardless; `--dry-run` previews (`generate-runtime-schemas.ts:44-77`) |
| `generate plugins` | `--dry-run --verbose --project-root` (`generate/plugins/generate-plugin-registries-command.ts:51-53`) | installed-plugin runtime registries, "authoritative" (`generate-installed-plugin-registries.ts`, `installed-runtime-registry-generator.ts`) | Full regeneration from installed plugin runtime manifests; `--dry-run` previews. |
| `plugin install <kind>` | `--name --port --service-refs --plugin-refs --db/--no-db --saga-store-backend --samples/--no-samples --mcp --jsr-url --local-path --no-copy-source --dry-run --force --ci` (`plugins/install/install-plugin-command.ts:30-55`) | plugin workspace + Aspire registration + DB wiring; dispatches to the plugin's own scaffold entrypoint | `--force` overwrites generated files; `--dry-run` previews plugin-owned changes. |
| `plugin sync` | delegating command: "Delegate registry synchronization to `netscript generate plugins`" (`plugins/host/host-plugin-command.ts:34`) | same as `generate plugins` | idem |
| `plugin doctor` | `--resource <name>` etc. (`plugins/doctor/doctor-plugin-command.ts:55`) | read-only health verdict + MCP-consumable receipt under `.netscript/agent/diagnostics/` | read-only |
| `db generate` | `db-operation-command.ts` shell (`db/generate/generate-db-command.ts:15`) | Prisma client + Zod schemas (delegated to Prisma) | delegated |
| `db init` / `migrate` / `seed` / `introspect` / `reset` / `studio` / `status` | idem | Prisma migrations & artifacts | delegated |
| `ui:init` | `--project-root --registry-root --theme --force` | copies `DEFAULT_UI_INIT_ITEMS = ['foundation','floating-styles','control-props']` (`kernel/application/ui/registry.ts:73-77`) into `<root>/components/ui/`, `islands/ui/`, `assets/`, `lib/`, writes styles aggregator, merges `deno.json` imports | `--force` overwrite |
| `ui:add <item\|collection>` | same flags (`ui/add/add-ui-command.ts:37-52`) | registry item files by `TARGET_PREFIXES` (`registry.ts:66-72`: `@ui/`→`components/ui/`, `@islands/`→`islands/ui/`, `@assets/`→`assets/`, `@lib/`→`lib/`, `~/`→root) + styles + `deno.json` import merge | `--force` overwrite; drift is *detected* only by `ui:update` |
| `ui:update [name]` | `--project-root` (`ui/update/update-ui-command.ts:9-16`) | rewrites unmodified registry files only | **Real drift model**: files whose content differs from the registry are reported as `drifted` and left alone (`registry.ts:145-165`) |
| `ui:add page <path>` | `--route <id> --island` (`add-ui-command.ts:42-47,58-63`) | see §3.5 | **Hard refuse on any existing file** (`kernel/application/ui/web-scaffold.ts:60`) |
| `ui:add island <Name>` | `--query` (`:48-52,64-69`) | `<root>/islands/<Name>.tsx` — signals stub, or a bare `<QueryIsland>` wrapper with `--query` (`web-scaffold.ts:45-56`) | same hard refuse |

### 3.5 `ui:add page` — exact emission

`packages/cli/src/kernel/application/ui/web-scaffold.ts:15-42`. For `ui:add page admin/status --island`
it writes exactly three files (asserted by `web-scaffold_test.ts:4-12`):

1. `<root>/routes/admin/status/index.tsx` — `createRouteReference('/admin/status', {id, kind:'page'})`
   declared **inline**, `definePage().withRoute(route).withMeta(...).withLayer(...).withLayout(...).build()`.
2. `<root>/routes/admin/status/(_islands)/StatusIsland.tsx` — a `useSignal` counter button
   (`signalIslandTemplate`, `:66-68`).
3. `<root>/routes/admin/status/(_shared)/query-loaders.ts` — literally
   `export const queryLoaders = {} as const;` (`:37`).

Not emitted: `.route.ts` sidecar, `withResource`, `withPolicy`, `withTelemetry`, any loader,
any `appRoutes` registration, any partial, any form, any state extension.

---

## 4. Missing generation seams

The reference implementation of the "good" shape already exists — but **only as one-shot `init`
templates for the single scaffolded example service**, not as a re-runnable verb.

### 4.1 Contract-derived SDK / query / invalidation module — **MISSING**

Exists as a template: `packages/cli/src/kernel/assets/app/lib/example-service.ts.template` binds
`createServiceClient` + `createQueryFactories` + `bridgeInvalidation` for the one service `init`
scaffolds. The runtime primitives are published:

- `@netscript/sdk/client` `createServiceClient`, `@netscript/sdk/query` `createQueryFactory` /
  `createQueryFactories` (`deno doc packages/sdk/src/query/mod.ts` →
  `packages/sdk/src/query/query-factory.ts:40,191`), `@netscript/sdk/query-client`
  `bridgeInvalidation`, plus a `defineServices()` root preset (documented in the `@netscript/sdk/query`
  module doc).

Gap: **no CLI verb emits `apps/<app>/lib/<service>.ts` for a second service.** `contract add` stops
at `contracts/versions/v1/*.contract.ts`; `service add` stops at `services/<name>/`; nothing crosses
into the app workspace. A user who runs `netscript service add orders` gets a working backend and
zero frontend wiring, and must hand-transcribe `example-service.ts`.
**Class: scaffold/generation failure.**

Sub-gap: `bridgeInvalidation(routerName, action)` is a hand-written string pair in the template
(`example-service.ts.template:9-12`) — there is no generated invalidation map keyed off the contract,
so a renamed procedure fails at runtime, not at type-check. **Class: API/type-system seam.**

### 4.2 Resource / route-slice generator — **MISSING**

The target slice, as demonstrated by the `init` example route
(`kernel/assets/app/routes/examples/service/index.tsx.template`,
`(_shared)/service-showcase.ts.template`, `(_islands)/ServiceShowcaseLab.tsx.template`,
`routes/partials/examples/service-summary.tsx.template`):

| Slice element | Exists in framework | Exists in `init` example template | Generated by any verb |
| --- | --- | --- | --- |
| Typed route contract (`defineRouteContract` / `bindRoutePattern`, `<route>.route.ts` sidecar) | ✅ `packages/fresh/src/application/route/mod.ts:93` (`defineRouteContract`), `:68` (`bindRoutePattern`); sidecar convention `isRouteContractSidecar` = `*.route.ts|tsx` at `packages/fresh/src/application/route/manifest.ts:44-46,111-112` | ❌ | ❌ |
| `definePage()` chain | ✅ `packages/fresh/src/application/builders/define-page/builder/mod.tsx` | ✅ (`examples/service/index.tsx.template:14-41`) | partial — bare stub only (`web-scaffold.ts:29`) |
| Route-local groups `(_components)/(_islands)/(_shared)` | ✅ Fresh route groups; `isRouteHelperDirectoryName` at `manifest.ts:53-55` | ✅ | partial — `--island` creates `(_islands)` + an **empty** `(_shared)/query-loaders.ts` |
| Cache-first loader (`createNetScriptQueryClient` + `fetchQuery` + `dehydrateQueryClient`) | ✅ `@netscript/sdk/query-client`, `@netscript/fresh/query` | ✅ (`service-showcase.ts.template:63-77`) | ❌ |
| `withResource` / `withResources` | ✅ `packages/fresh/src/application/builders/define-page/builder/mod.tsx:206,221`, types at `page-compat/context-types.ts:142` | ❌ (example uses `withLayer` loaders only) | ❌ |
| Deferred/partial layer (`delivery:'defer'`, `partial:`, `staleTime`, `staleReloadMode`) | ✅ `@netscript/fresh/defer` (`DeferPage`, `DEFER_POLICY`, `resolveDeferPolicy`) | ✅ (`examples/service/index.tsx.template:31-38` + `routes/partials/examples/service-summary.tsx.template`) | ❌ |
| Form slice (`Form`, `FormRegion`, `createStandardSchemaAdapter`, CSRF helpers) | ✅ `packages/fresh/src/application/form/mod.ts` (full surface via `deno doc`) | ❌ — grep for `fresh/form`/`defineForm` across `packages/cli/src` returns **zero hits** | ❌ |
| Stream slice | ✅ `@netscript/fresh/streams` | ❌ — zero `fresh/streams` hits under `packages/cli/src/kernel/assets` | ❌ |
| App `State` stubs | `apps/<app>/utils.ts` is generated as `export type State = Record<string, never>` (`kernel/assets/app/utils.ts.template:4`) | n/a | ❌ — no verb extends `State` when a slice needs request-scoped state |
| Typed route registration in `router.ts` / `appRoutes` | `router.ts` merges `.generated/routes.ts` with hand-written entries (`kernel/assets/app/router.ts.template:12-47`); manifest regenerated by the **Vite plugin** (`packages/fresh/src/application/route/manifest.ts:280-292`, `@netscript/fresh/vite`), and the seed is written once by `init` (`kernel/application/scaffold/writers/app-route-seeds.ts:2-38`) | ✅ | ❌ — `ui:add page` writes an *inline* `createRouteReference` instead of registering in `router.ts`, contradicting the documented convention (`docs/site/web-layer/how-to/customize-fresh-ui.md:171-177`: "register it in `apps/dashboard/router.ts`") |

**Class: scaffold/generation failure** (primary), with an **API/type-system seam** component: the
generated page's route id is a hand-derived dotted string (`web-scaffold.ts:20`) with no link to
the generated manifest, so route ids can silently diverge from `routePatterns`.

### 4.3 Service command slice — **MISSING**

`service add` emits transport + router skeleton (`kernel/assets/service/*.template`) and
`service add-handler` appends one procedure stub, but there is no verb that emits a **command
slice**: input schema + handler + saga/worker binding + cache invalidation + a matching mutation on
the app side. `plugin item-add` (`plugins/item/add-plugin-item-command.ts:19`) is the closest
existing shape and is plugin-scoped only.
**Class: scaffold/generation failure.**

### 4.4 App-targeting seam (blocks all of the above) — **BROKEN TODAY**

`ui:add`, `ui:init`, `ui:list`, `ui:update`, `ui:remove` and `ui:add page|island` all resolve their
write root through `requireProjectRoot(dependencies.resolveProjectRoot, options.projectRoot)`
(`add-ui-command.ts:54-57`), which returns the **workspace root**
(`public-command-dependencies.ts:195-197` → `deploy-config.ts:59-84`, matches on `deno.json`
`workspace` array). But `init` writes the Fresh app to `apps/<appName>/`
(`kernel/domain/scaffold/scaffold-plan.ts:56`, `write-app-files.ts:91-105`) and installs the UI
registry there (`write-app-files.ts:182-185`: `installUiRegistryItems({ projectRoot: appDir, … })`),
with `@app/` aliased to `./` **inside the app** (`kernel/adapters/templates/app/generate-app-deno-json.ts:127`).

Consequences, all verifiable from source:

- `netscript ui:add data-table` in a scaffolded project copies to `<workspaceRoot>/components/ui/`,
  not `apps/dashboard/components/ui/`, and does not touch the app's `components/ui/mod.ts` barrel.
  The repo's own E2E gate encodes this: `packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates.ts:21-28`
  passes `--project-root context.project.projectRoot` and then asserts
  `islands/ui/McpUiWidget.tsx`, `lib/ai/render-ui.tsx`, `assets/styles.css` relative to that root
  (`:94-101`) — i.e. the workspace root, not the app.
- `netscript ui:add page status` writes `<workspaceRoot>/routes/status/index.tsx` — outside any
  Fresh app; the Vite route generator (rooted at the app) never sees it.
- There is **no `--app` flag** on any `ui:*` command (`add-ui-command.ts:38-52`), yet
  `docs/site/web-layer/how-to/build-a-desktop-frontend.md:31` documents
  `netscript ui:add desktop --app dashboard`, and
  `docs/site/web-layer/how-to/customize-fresh-ui.md:256` claims "component files go to
  `apps/dashboard/components/ui/`".

**Class: runtime correctness + docs/discovery failure.** Any resource/route-slice generator must
first introduce an app-resolution seam (explicit `--app`, or workspace-member discovery) or it will
inherit the same wrong root.

### 4.5 Secondary discovery gaps

| # | Gap | Class | Evidence |
| --- | --- | --- | --- |
| C1 | `ui:add page` refuses on *any* pre-existing target file with no `--force` and no merge path (`web-scaffold.ts:60`), unlike every other generator, which has `--force`/`--dry-run`. Re-running after a partial failure is impossible. | scaffold/generation | `web-scaffold.ts:58-64` vs `install-plugin-command.ts:46-56` |
| C2 | The route manifest (`apps/<app>/.generated/{manifest,routes}.ts`) is only seeded by `init` and regenerated by the **Vite plugin**; there is no `netscript generate routes` verb, so CI/agent flows that never run Vite have a stale typed route surface. | scaffold/generation | `app-route-seeds.ts:2-38`; `packages/fresh/src/application/route/manifest.ts:280-292`; `generate-group.ts:19-30` lists only `aspire`, `runtime-schemas`, `plugins` |
| C3 | `netscript-dev` reports `version('1.0.0')` while the real release train is `CLI_PACKAGE_VERSION`. | docs/discovery | `maintainer-command-tree.ts:32` vs `public-command-tree.ts:121` |
| C4 | `run-agent-mcp.ts:29` passes `version: "current"` into the command-catalog program, so `list_commands` never reports the real CLI version to the agent. | docs/discovery | `run-agent-mcp.ts:27-38` |

---

## 5. Summary of the seam to build

To make "add a resource" a single verb, the following must be created (none exist today):

1. **App resolution seam** — `--app <name>` / workspace-member discovery shared by `ui:*` and any
   new resource verb (fixes §4.4 before anything is layered on it).
2. **`generate sdk` (or `contract sync`)** — contract map → `apps/<app>/lib/<resource>.ts` with
   `createServiceClient` + `createQueryFactories` + a *generated* invalidation map, content-compared
   like `generate runtime-schemas` (`written`/`skipped`/`--force`/`--dry-run`).
3. **`generate route-slice` / `netscript resource add`** — `<route>.route.ts` contract sidecar,
   `definePage` with `withResource` + a defer layer, `(_shared)` cache-first loader,
   `(_islands)` `QueryIsland` bound to the generated query factory, a `routes/partials/...`
   partial, an optional form region, and `router.ts`/`appRoutes` registration.
4. **`service command add`** — contract procedure + router handler + invalidation + app-side
   mutation, in one transaction.
5. **MCP exposure** — a `list_generators`/`plan_generation` tool pair so agents can read the file
   plan instead of parsing a 4 KB output tail (§1.6 M4), plus wiring `.netscript/docs` into
   `--docs-root` at `agent init` time (M2).
