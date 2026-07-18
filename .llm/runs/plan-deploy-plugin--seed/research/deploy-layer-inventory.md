# Current-state inventory — the shipped deploy layer

Source: Opus 4.8 research sub-agent of this run, 2026-07-18, direct file reads over
`packages/cli`, `packages/aspire`, `packages/config`, `packages/runtime-config`, scaffold
templates, and `docs/site`. Baseline `290c68ef` (origin/main). The shipped deploy story lives
almost entirely in **`packages/cli`** (verbs + target adapters), with **`packages/aspire`** as the
SDK-neutral AppHost-composition substrate and **`packages/config`** owning the `deploy.*` schema.
There is no `plugin-deploy`/`deploy-core` package — deploy is monolithic inside the CLI kernel.

## 1. CLI surface today

Public root registration: `deploy` group in
`packages/cli/src/public/features/root/public-command-tree.ts:59-62`; factory
`createDeployCommand` in `packages/cli/src/public/features/deploy/deploy-group.ts:22-98`. Group
description is stale ("Build and manage NetScript **Windows Service** deployments",
`deploy-group.ts:27`).

| Verb | Registered | Implementation entry | What it does |
|---|---|---|---|
| `list` | `deploy-group.ts:31` | `list/list-deploy-targets-command.ts` | Lists registered deploy targets. |
| `desktop` | `deploy-group.ts:33` | `target/desktop/desktop-group.ts` | Native desktop packaging subgroup. |
| `build` | `deploy-group.ts:41` | `build/build-deploy.ts` (`BuildDeployPipeline`) + `build/build-windows-strategy.ts` | Bare-metal build: `deno compile` service binaries into `.deploy/<target>`. |
| `deno-deploy` | `deploy-group.ts:57` | `deno-deploy/deno-deploy-command.ts:107-156` | Deno Deploy target subgroup (`plan/up/down/status/logs`). |
| `package-cli` | `deploy-group.ts:64` | `package-cli/package-cli-deploy-command.ts` | Compiles the NetScript CLI into the deploy bin dir. |
| `copy` | `deploy-group.ts:65` | `copy/copy-deploy-command.ts` | Copies deploy build output. |
| `install` | `deploy-group.ts:67` | `install/install-service-deploy.ts` | Installs OS service (Servy/systemd) from resolved manifest. |
| `start`/`stop`/`status`/`logs` | `deploy-group.ts:75-78` | `start|stop|status|logs/*-deploy-command.ts` | OS-service lifecycle over `osServices` port. |
| `uninstall` | `deploy-group.ts:80` | `uninstall/uninstall-service-deploy.ts` | Removes the OS service. |
| `upgrade` | `deploy-group.ts:88` | `upgrade/upgrade-deploy-command.ts` + `kernel/adapters/deploy/upgrade-steps.ts` | In-place service upgrade. |
| `docker`/`compose` | `deploy-group.ts:91-92` | `target/target-deploy-command.ts` → `AspireComposeDeployTarget` | Thin router → Aspire compose/docker adapter. |
| `kubernetes`/`azure-aca`/`azure-app-service`/`azure-aks`/`cloud-run` | `deploy-group.ts:93-97` | `target/target-deploy-command.ts` → `AspireCloudDeployTarget` | Thin router → Aspire AppHost / Cloud Run adapter. |

Generic target router (`target/target-deploy-command.ts:15-23`) derives verbs from each adapter's
advertised `operations`: `plan, up, down, status, logs, rollback, secrets` (+ `secrets` subcommand
`:60-61`). Dispatch: `target/run-target-operation.ts:22-54`; target config from
`deploy.targets.<key>` merged with `aspire.appHost` (`:56-72`). `secrets`/`rollback`
declared-unsupported on all shipped adapters (deferred to #341).

Adjacent groups: `netscript service` (`services-group.ts:18-49`) manages `appsettings.json`
deployable-unit declarations; `netscript generate aspire` regenerates AppHost `.helpers`;
`netscript db generate` / `generate plugins` are pre-bake steps (docs `deploy.md:169-173`).

Maintainer surface (`netscript-dev`, `packages/cli/bin/netscript-dev.ts`): local tree merges the
entire public tree (`src/local/composition/local-contributor-command-tree.ts:11-32`) + maintainer
features (`init`, `probe`, `release`, `sync`, `test-scaffold`) — framework-repo tooling; no
maintainer-only app-deploy verbs.

## 2. Aspire layer

`packages/aspire` (`@netscript/aspire`) is **SDK-neutral** — "no Aspire SDK type appears in any
public signature" (`packages/aspire/README.md:23-24`). Composition + diagnostics, NOT a deploy
executor. Public surface: root `mod.ts:22-27` = `inspectAspire` + types; subpaths `./config`
(`parseAppSettings`, `NetScriptConfigSchema`), `./application` (`composeAppHost`,
`ContributionRegistry`, deterministic port allocation, env/reference/permission resolvers),
`./adapters` (`AspireTypeScriptBuilder` — emits real AppHost resources; `resolveEnvSource`),
`./ports` (`AspireBuilderPort`, `AspireRuntimePort`), `./testing` (`MemoryAspireBuilder`),
`./types`, `./constants`.

Generated artifacts (emitted by the CLI template engine `packages/cli/src/kernel/templates/aspire/`
via `HelpersGeneratorPipeline`): `aspire/apphost.mts` (TypeScript/Node AppHost),
`aspire/.helpers/*.mts` (index, register-apps/services/plugins/infrastructure/background/tools,
db-cli-mode), `aspire/aspire.config.json`, `aspire/package.json` (vscode-jsonrpc, tsx,
typescript), `aspire/tsconfig.apphost.json`. Renderer
`kernel/application/scaffold/render-ts-apphost.ts:19-265`. SDK via CommunityToolkit
`CommunityToolkit.Aspire.Hosting.Deno@13.2.1-beta.532` + Aspire Hosting integrations 13.4.x
(Postgres/MySql/SqlServer/Redis/Garnet/Browsers/DenoKv) (`scaffold-aspire.ts:9-43`).

Run model: `cd aspire && aspire restore && aspire start`; dashboard `:18888`, OTLP `:4318`
(docs `deploy.md:236,252`; `port-ranges.ts:13-14`).

Cloud-deploy hooks (executor = CLI shelling the `aspire` binary):

- `kernel/adapters/aspire/aspire-compose-deploy-target.ts` (`compose|docker`): `plan`/`emit` shell
  `aspire publish --output-path <dir>` (`:168-181`); `compose up` self-hosts via
  `docker compose -f <dir>/docker-compose.yaml up -d` (`:105-121`); `docker up` delegates to
  `aspire deploy` (`:106-111`); `down/status/logs` shell docker compose (`:124-166`). `operations`
  omit rollback/secrets (`:64-71`).
- `kernel/adapters/aspire/aspire-cloud-deploy-target.ts` (`kubernetes|azure-aca|azure-app-service|
  azure-aks|cloud-run`, TARGETS `:37-83`): AppHost targets validate platform markers in AppHost
  source (`addKubernetesEnvironment`, `addAzureContainerAppEnvironment` — `:43,52-53,65,74`,
  enforced `:258-282`) then shell `aspire publish|deploy|destroy --apphost <path> --output-path
  <dir>` (`:183-239`). `cloud-run` is a Docker lane: `docker build/push` + `gcloud run deploy`
  (`:167-181`), delete (`:197-208`); requires `registry`+`imageName` (`:284-298`). No `azd`
  anywhere; Azure reached purely through `aspire publish/deploy`.

## 3. Scaffold deploy artifacts

Fresh `netscript init` project gets (generators `kernel/application/scaffold/`):

- `appsettings.json` — single source of truth for deployable units (ports, entrypoints,
  permissions, DB/KV requirements, references) (`templates/aspire/generate-appsettings.ts`;
  `render-ts-apphost.ts:123-235`).
- `netscript.config.ts` — ships **`deploy: {}` empty** (`netscript-config-1.ts.template:25`) +
  `aspire: { appHost: 'aspire/apphost.mts' }` (`:16-18`).
- Aspire bundle under `aspire/` (§2).
- `.github/workflows/` (`plan-init.ts:132-154`): `deploy-deno-deploy.yml` (checks →
  `netscript deploy deno-deploy up`, token/org/app secrets); `deploy-bare-metal.yml`
  (Linux+Windows matrix, `deno task check`, `netscript deploy build`, artifact upload);
  `deploy-compose-ghcr.yml` (Aspire projects only: `aspire restore` → `netscript deploy compose
  plan` → `docker compose build/push` → `netscript deploy docker up --clear-cache`). CLI
  specifier templated via `{{netscriptCliSpecifier}}` (`plan-init.ts:143-146`).

**NOT scaffolded**: no Dockerfile, no docker-compose.yml, no K8s manifest, no `.env`
(docs `deploy.md:38-41,371-381`) — container/K8s/Azure artifacts emitted at deploy time by
`aspire publish` from user-configured AppHost code. Scaffold E2E gates:
`packages/cli/e2e/src/application/gates/scaffold/`.

## 4. Config / environment model

`deploy.*` schema — `packages/config/src/domain/schemas/deploy-schema.ts`. `DeployConfigSchema`
(`:288-317`) = `{ targets?: { windows, docker, compose, linux, deno-deploy, kubernetes,
azure-aca, azure-app-service, azure-aks, cloud-run } }`; types
`config-section-types.ts:357-592`. Shared `deployTargetBaseShape` (`:21-150`): compile mode,
`compileTarget`, `concurrency`, `bundleExternal`, per-type `v8HeapMb`, `generateEnvFile`,
`logging` rotation, `health`, `docker` base images (`denoland/deno:2`,
`mcr.microsoft.com/dotnet/aspnet:9.0`), `activation` (retain/strategy symlink|dir-swap/
healthGate), `secrets` (`envFile`, POSIX mode 0o600), `otel`. Per-target extras: Windows→Servy
(`:163-173`); Linux→systemd (`:204-220`); deno-deploy→org/app/entrypoint/prod/envFile
(`:227-241`); AppHost cloud→outputPath/appHost (`:253-260`); cloud-run→registry/imageName
(`:272-279`).

Ports: `kernel/constants/port-ranges.ts:8-15` — SERVICE 3000-3099, APP 8000-8099, PLUGIN_API
8091-8099, INFRA_PLUGIN 4400-4499, ASPIRE_DASHBOARD 18888, OTEL 4318. Env contract
(bring-your-own in prod): `POSTGRES_URI`/`DATABASE_URL`, `REDIS_URI`/`GARNET_URI`, `PORT`,
`OTEL_EXPORTER_OTLP_ENDPOINT`, `NETSCRIPT_SAGA_STORE`, `NETSCRIPT_AUTH_BACKEND`, concurrency vars
(docs `deploy.md:195-205`). Secrets: no first-class manager; only the env-file convention +
unimplemented `secrets` ops. Aspire deploy state cached `~/.aspire/deployments/{sha}/{env}.json`;
CI told `--clear-cache` (docs `:331-338`). `packages/runtime-config`: hot-reloadable versioned
overrides "without a deploy" (`loadRuntimeConfig()`/`watchRuntimeConfig()`). Environments: no
matrix in config; `--environment` is an opaque pass-through to Aspire
(`aspire-compose-deploy-target.ts:184-186`); CI promotion ladder is convention only. Deploy
conventions (target-agnostic, injected ports): `kernel/domain/deploy/{activation,secrets,
observability,rollback}-convention.ts`, `health-gate.ts`, `runtime-overrides.ts`; Servy config
`servy-config.ts`.

## 5. Docs promises

Primary: `docs/site/orchestration-runtime/how-to/deploy.md`. "NetScript is in alpha… deliberately
minimal about deployment" (`:16-17`). Wired = appsettings graph + Deno entrypoints + apphost.mts;
Generated CI = 3 workflows; Delegated = docker/compose/k8s/azure → `aspire publish|deploy|
destroy`, cloud-run → docker+gcloud; Manual = no generated container image/compose/cloud stack;
`deploy: {}` ships empty (`:25-44`). Three-layer mental model (`:86-107`); "keep Aspire… or drop
it" (`:104`); "no opinionated build step that produces a single bundle — each Deno process runs
from source" (`:152-153`); cloud recipes (`:255-312`, k8s emits Helm chart); CI/promotion ladder
(`:314-338`); bare-metal primitive = one Deno process, one `deno run`, exact permissions
(`:340-369`); "Limits of the alpha scaffold" (`:371-384`) tagging arch-debt
`cli-deploy-artifacts-missing`, `streams-manifest-helpers-unsupported`,
`workers-scaffold-job-tools-noop`; health-check verification (`:386-410`).

Supporting: `deploy-deno-deploy.md` (the one fully-runnable managed path),
`deploy-local-aspire.md`, `explanation/aspire.md`, `runtime-config.md` +
`roll-out-runtime-overrides.md`, `graceful-shutdown.md`, `cli-reference.md`,
`reference/cli/commands.md`. `packages/aspire/README.md:124-131` links them.

## 6. Gaps (no deploy story today)

- No hand-authored container artifacts ever generated (Dockerfile/compose/K8s) — all delegated to
  `aspire publish` (debt `cli-deploy-artifacts-missing`).
- `rollback`/`secrets` unimplemented on every target (declared-unsupported; #341)
  (`deploy-target-port.ts:8-11,118-121`). No secret-manager integration.
- No environment/target matrix in config; promotion ladder CI-convention only.
- Cloud-Run is the only non-Aspire container cloud lane. **Vercel, Fly.io, AWS (ECS/Lambda/App
  Runner), Cloudflare/Wrangler, Netlify, Railway, Render — none exist.** No wrangler, flyctl, or
  AWS SDK/CDK anywhere in the deploy layer (Cloudflare/Vercel/Fly appear only in
  `docs/site/_plan/research/competitors/`).
- Deno Deploy target is preflight-thin: `plan` = unstable-API guard (best-effort, entrypoint +
  deno.json unstable list only, not transitive — debt in `unstable-api-guard.ts`); other ops
  shelled to native `deno deploy` CLI; prod push refused on violations
  (`deno-deploy-target.ts:98-101`).
- `packages/aspire` cannot deploy — composition/diagnostics only; execution depends on external
  `aspire`/`docker`/`gcloud`/Servy/`systemctl` binaries.
- Scaffold worker `createJobTools` helpers no-op; streams manifest helpers throw by design
  (docs `:377-378`).
- Legacy vs canonical drift: group description says "Windows Service" (`deploy-group.ts:27`);
  flat legacy verbs (`build/install/start/stop/upgrade`) coexist with the `<target> <op>` router
  pending convergence (S12/#348, `deploy-group.ts:89-90`).

## 7. Ownership map (migration-map input)

| Item | Owner today | Future home |
|---|---|---|
| `deploy` command group + verbs | `packages/cli/src/public/features/deploy/**` | `plugin-deploy` CLI contributions |
| 7-op contract (`DeployTargetPort`, `DeployOperation`) | `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts` | `deploy-core` port |
| Target registry + defaults | `kernel/application/registries/deploy-target-registry.ts` (`DEFAULT_DEPLOY_TARGETS` `:71-83`); port `domain/deploy/deploy-target-registry-port.ts` | `deploy-core` registry (named extension axis) |
| Windows/Linux service targets + Servy/systemd | `domain/deploy/{windows,linux}-service-deploy-target.ts`, `service-deploy-target.ts`, `servy-config.ts`; adapters `kernel/adapters/deploy/commands/*`; OS port `public/adapters/os-service-factory.ts` | bare-metal adapter package |
| Aspire compose/docker + k8s/azure/cloud-run | `kernel/adapters/aspire/aspire-{compose,cloud}-deploy-target.ts` | per-cloud adapter packages |
| Deno Deploy target | `domain/deploy/deno-deploy-target.ts`, `deno-deploy-cli-port.ts`; `kernel/adapters/deno-deploy/*`; `unstable-api-guard.ts` | deno-deploy adapter package |
| Bare-metal compile/build | `public/features/deploy/build/*`; engine `kernel/adapters/deploy/compile/*`; domain `compile-target.ts` | `deploy-core` build primitive |
| Desktop packaging | `public/features/deploy/target/desktop/**` (dmg/appimage/deb/msi + release sign/serve/store) | separate concern (own adapter/plugin; epic #830 graph) |
| Conventions (activation/secrets/otel/rollback/health) | `kernel/domain/deploy/*-convention.ts`, `health-gate.ts`, `runtime-overrides.ts` | `deploy-core` (R-DEPLOY-3) |
| `deploy.*` config schema | `packages/config/.../deploy-schema.ts`; types `config-section-types.ts:357-592` | base stays; per-target members move with adapters (config-plugin-specific-schema-debt) |
| Aspire substrate | `packages/aspire` | stays (foundation for Aspire adapters) |
| Scaffold deploy emission | `kernel/application/scaffold/*`, `kernel/templates/aspire/**`, workflow templates | plugin scaffold contributions |
| Runtime overrides | `packages/runtime-config` | adjacent, unchanged |
| Docs | `docs/site/orchestration-runtime/how-to/deploy*.md`, `explanation/aspire.md` | refreshed with plugin story |
| Maintainer deploy QA | `maintainer/features/test-scaffold/**`; e2e `gates/scaffold/**` | extended for plugin scaffolds |

Root `deno.json`: no app-deploy tasks (repo CI/release/agentic only); the only app-facing deploy
automation is the three scaffolded workflow templates.
