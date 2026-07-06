# NetScript Deployment Architecture Spec

Status: Research + Spec (no code). Run: `epic-deployment-aggregation`. Author: G5 architecture-synthesis.
Grounding: `sources/aspire/*`, `sources/deno-deploy/*`, `sources/providers/*`, `sources/watch/*`,
`servy-assessment.md`, `worklog.md`, plus repo files
`packages/config/src/domain/schemas/deploy-schema.ts` and
`packages/cli/src/public/features/deploy/deploy-group.ts`.

---

## 1. Executive summary

NetScript today ships a single, fully-formed deployment lane: a Windows Service installer built on
SERVY, exposed through `netscript deploy build|install|start|...` and configured through
`deploy.windows.*` only (`packages/cli/src/public/features/deploy/deploy-group.ts`,
`packages/config/src/domain/schemas/deploy-schema.ts`). The strategic goal of this epic is to turn
that one-target installer into an **enterprise-grade, cloud-agnostic and bare-metal-compatible
deployment framework** with two first-class drive paths: (a) the **CLI** for direct/bare-metal and
Deno-native targets, and (b) **Aspire** (`aspire publish` / `aspire deploy` / `aspire do`) for
containerized cloud compute environments. Because NetScript is Deno-native, **Deno Deploy (the new
platform)** and **`deno compile` single-binary artifacts** are treated as tier-1 strategic surfaces,
not afterthoughts. Aspire's publish-vs-deploy split, compute-environment abstraction, pipeline-step
graph, per-environment state cache, and two-layer CI/CD model become the backbone that NetScript
wraps rather than reinvents (per Operating Rule 3, "wrap, do not reinvent"). The SERVY lane is
generalized from `WindowsServicePort` to an OS-agnostic `OsServicePort` (servy + systemd adapters)
fed by `deno compile` artifacts. The result: `deploy.windows.*` becomes `deploy.<target>.*`, and one
gated `netscript deploy` surface routes each target to either an Aspire pipeline or a direct adapter.
This spec defines that architecture; it does not author doctrine or write code.

---

## 2. How NetScript maps onto Aspire's deploy pipeline

Aspire is the enterprise/container backbone. NetScript's job is to (a) contribute a Deno-app publish
shape, and (b) wrap Aspire's CLI so NetScript users get a uniform `netscript deploy` experience.

### 2.1 Publish vs deploy (the two-command spine)

Source: `sources/aspire/deploy-with-aspire.md`, `sources/aspire/ci-cd.md`.

- `aspire publish` evaluates the AppHost and emits **artifacts** (Docker Compose files, K8s
  manifests, container build context) as a one-way handoff — no target mutation.
- `aspire deploy` evaluates the AppHost, generates target-specific output, resolves parameters, and
  **applies** the change against an authenticated target in one operation.
- `aspire do <step>` runs a single named step (`build`, `push`, `deploy-<resource>`) so CI/CD can
  interleave Aspire's inner sequencing with its own stage boundaries.

NetScript maps its verbs onto this spine: `netscript deploy --dry-run/--emit` → `aspire publish`;
`netscript deploy` (cloud target) → `aspire deploy`; granular CI hooks → `aspire do`.

### 2.2 Compute environment vs Aspire environment (two orthogonal axes)

Source: `sources/aspire/deployment-overview.md`, `sources/aspire/environments.md`,
`sources/aspire/deploy-with-aspire.md`.

- **Compute environment** = *where* resources run: Docker Compose, Kubernetes, AKS, Azure Container
  Apps, Azure App Service. Added in the AppHost (`AddDockerComposeEnvironment`,
  `AddKubernetesEnvironment`, etc.).
- **Aspire environment** = *which config profile*: Development / Staging / Production, selected with
  `--environment` (or `DOTNET_ENVIRONMENT`). Scopes parameter resolution and the state cache.

These are independent: the same compose compute-env can be deployed to `staging` and `production`
with different parameters. NetScript's `deploy.<target>.environment` config maps to the Aspire
environment; the *target* itself (compose/k8s/aca/...) maps to the compute environment.

### 2.3 Pipelines: AddStep / WithPipelineStepFactory (Aspire 13, experimental)

Source: `sources/aspire/pipelines.md`, `sources/aspire/custom-deployments.md`.

Aspire 13 replaced `WithPublishingCallback` (13.0-deprecated) with a **pipeline step graph**. Steps
are registered (`AddStep`, `WithPipelineStepFactory`), resolved (dependency graph via
`dependsOn`/`requiredBy`), then executed. Well-known steps: `Build`, `Push`, `Publish`, `Deploy`
with prerequisite ordering. `aspire deploy --list-steps` enumerates the resolved graph; `aspire do`
runs one. Custom deployment logic uses `IResourceContainerImageBuilder` (image build) and
`IPipelineActivityReporter` (Step/Task/Completion progress reporting).

**What the TypeScript AppHost CAN do today (corrected 2026-07-03 — see G7 re-verification of the
`?aspire-lang=typescript` doc tab; evidence in `sources/aspire/*--ts-tab.md`)**: the earlier
"custom steps are C#-only, so NetScript cannot drive the container lane from TS" conclusion was an
artifact of reading only the default C# doc tab and is **substantially false**. The `.mts` tab shows
the container/cloud lane is fully TS-expressible:

- App-level custom pipeline steps in TS:
  `builder.pipeline.addStep('validate-deployment', async (context) => {...}, { requiredBy: ['deploy'] })`.
- Per-resource publish customization callbacks in TS: `publishAsDockerComposeService(async (_r, service) => {...})`,
  `publishAsKubernetesService(async (r) => { await r.workload.spec.replicas.set(3); })`,
  `publishAsAzureContainerApp(async (_infra, _app) => {...})`.
- Compute-environments in TS: `builder.addDockerComposeEnvironment('env')`,
  `builder.addKubernetesEnvironment('k8s')`, `builder.addAzureContainerAppEnvironment('aca-env')`.
- Deno compute resource in TS without any custom resource type: `builder.addContainer('denoland/deno:2', ...)`
  or `builder.addDockerfile('web', './web')`.

**What genuinely remains C#-only (narrow, and NOT needed by NetScript's container lane)**: authoring
brand-new custom resource *types* and generic callback-based deployment extensibility — the
custom-deployments TS tab states verbatim that these "aren't yet available in the TypeScript AppHost
SDK, so this AppHost example is currently C#-only." NetScript's container lane uses **built-in**
resource types (`addContainer`/`addDockerfile`) plus the TS `publishAs*` callbacks, so it does not
touch this gap. (Minor secondary C#-only item: `appsettings.{environment}.json` file-layering — TS
equivalent via `env.isDevelopment()` branching + `Parameters__*`.)

Consequence: the container/cloud lane is **not gated on the ada2a5 `AddDenoApp` seam** (see 2.6);
ada2a5 is optional DX sugar. NetScript can generate an `apphost.mts` against the built-in TS
primitives today.

### 2.4 Resource publishing / manifest model

Source: `sources/aspire/architecture--resource-publishing.md`.

Resources serialize to JSON manifests via `ManifestPublishingCallbackAnnotation` + value objects
(`IManifestExpressionProvider.ValueExpression`) that preserve deferred secret/output placeholders.
`ExcludeFromManifest()` opts a resource out. This is the substrate that produces compose/k8s output.
NetScript's Deno app can emit a manifest entry today by driving a built-in `addContainer`/`addDockerfile`
resource from the TS AppHost (see 2.3) — the ada2a5 `AddDenoApp` type is an optional DX improvement,
not a prerequisite.

### 2.5 State caching (per-app, per-environment)

Source: `sources/aspire/deployment-state-caching.md`.

`aspire deploy` caches provisioning + parameter values to
`~/.aspire/deployments/{AppHostSha}/{environment}.json`. First deploy prompts; subsequent deploys
confirm-and-reuse. `--clear-cache` resets one environment. `--environment` scopes cache isolation.
**Security note**: secrets are stored in plaintext (same model as .NET user-secrets). NetScript's
enterprise guidance (Section 6) must treat this cache as sensitive and prefer CI secret stores +
`Parameters__*` over persisted local cache in shared/CI contexts.

### 2.6 Deno-app publish shape vs the five JS shapes (+ ada2a5)

Source: `sources/aspire/javascript-apps.md`, `worklog.md` (ada2a5 hand-off).

Aspire's JS integration (experimental `ASPIREJAVASCRIPT001`) offers five publish shapes plus Next.js:
`PublishWithContainerFiles`, `PublishWithStaticFiles`, `PublishAsStaticWebsite`,
`PublishAsNodeServer`, `PublishAsPackageScript`, and `AddNextJsApp`. A NetScript service is a
long-running HTTP server, so the Deno-app publish shape **mirrors `PublishAsNodeServer` /
`PublishAsPackageScript`** (container-with-server + package-script entrypoint), not the static
shapes. (Caveat: `addNodeApp`/`PublishAsNodeServer` are Node-runtime-specific and will not run Deno;
the Deno-usable path is the **container primitives** `addContainer('denoland/deno:2')` /
`addDockerfile` — which are also TS-expressible, see 2.3.) The **ada2a5 upstream lane** adds DX sugar
on top: a named `AddDenoApp` resource type, a canonical `denoland/deno:2` single-stage build context,
and baked-in `OTEL_DENO` wiring. **Corrected 2026-07-03**: `AddDenoApp` is an *optional enhancement*,
not the gate for the container/cloud lane — NetScript can ship that lane on the built-in TS container
primitives today, and because new resource types land C#-first (the TS SDK is a generated projection),
depending on `AddDenoApp` is arguably the riskier path. Track ada2a5 as a DX upgrade (Section 8).

### 2.7 Two-layer CI/CD

Source: `sources/aspire/ci-cd.md`, `sources/aspire/app-lifecycle.md`.

Layer 1 (CI/CD system: GitHub Actions / GitLab / Azure DevOps) owns *when* stages run, approvals,
identities, artifact promotion. Layer 2 (Aspire pipeline) owns *what the app means* and the
build/push/publish/deploy ordering. Parameters flow in via `Parameters__*` env vars + `--environment`.
The app-lifecycle worked example is: inner-loop `aspire run` → local validation `aspire deploy` →
`aspire publish` artifacts in GitHub Actions → runtime `docker compose up` from published output,
using GHCR for images. NetScript's generated CI templates (Section 3.4, Section 6) should emit this
exact two-layer shape rather than re-encoding topology in YAML.

---

## 3. CLI ↔ Aspire integration for near-one-click deploy

### 3.1 The `netscript deploy` surface, generalized beyond Windows

Today `createDeployCommand` (`packages/cli/src/public/features/deploy/deploy-group.ts`) registers
`build | package-cli | copy | install | start | stop | status | logs | uninstall | upgrade` with the
description "Build and manage NetScript Windows Service deployments". The redesign keeps the
lifecycle verbs but makes **target** a first-class dimension:

```
netscript deploy <target> <verb> [flags]

targets:  windows | linux | deno-deploy | docker | compose | k8s | azure(aca|appservice) | <cloud>
verbs:    plan(--emit) | up | down | status | logs | rollback | upgrade | secrets
```

- `plan` / `--emit` = dry-run + artifact emission (wraps `aspire publish` for Aspire targets;
  emits compiled binary + unit file for bare-metal).
- `up` = apply (wraps `aspire deploy` for cloud; drives adapter directly for bare-metal/Deno Deploy).
- `down|status|logs|rollback|upgrade|secrets` = lifecycle, routed to the target adapter.

The command layer stays a **thin router** (per plugin-thinness law): each target resolves to either
an Aspire-pipeline driver or a direct adapter. No target-specific business logic lives in the command
surface.

### 3.2 CLI wraps `aspire publish` / `aspire deploy` for cloud; drives bare-metal directly

Two drive paths behind one surface:

1. **Aspire-driven targets** (docker, compose, k8s, aca, appservice, azure): the CLI shells the
   Aspire CLI (`aspire publish --output-path`, `aspire deploy --environment <env>`,
   `aspire do <step>`), passing NetScript config through as `Parameters__*` + `--environment`. Aspire
   owns image build, manifest generation, and apply. NetScript owns AppHost generation (already part
   of scaffold) and config→parameter mapping.
2. **Directly-driven targets** (windows, linux bare-metal, deno-deploy): the CLI calls a NetScript
   adapter (OsServicePort for bare-metal; a Deno Deploy adapter wrapping `deno deploy` for the
   Deno-native cloud). No Aspire in the loop — these targets have no container/compute-env story that
   Aspire drives, or (Deno Deploy) are deno-native and CLI-first by design
   (`sources/deno-deploy/*`).

### 3.3 Deploy config evolution: `deploy.windows.*` → `deploy.<target>.*`

Source anchor: `packages/config/src/domain/schemas/deploy-schema.ts` (top comment already declares
"Supports multiple deployment targets (windows, future: linux, docker, k8s)").

Contract-first evolution (Operating Rule 2):

**Migration stance — CLEAN BREAK (D5, user override 2026-07-03):** `deploy.windows.*` is removed and
replaced outright by `deploy.targets.*`. No back-compat alias, no deprecation window, no aliasing
layer. Rationale (user): the framework is alpha, breaking changes are allowed, and shipping the
production-grade shape directly is the right move. The Windows lane is re-expressed as
`deploy.targets.windows` from the outset; a one-line migration note in the release/config docs covers
the break for any existing config.

- Introduce a discriminated `deploy.targets` map keyed by target name, each entry a target-specific
  schema. `windows` becomes one member; the current `WindowsDeployConfigSchema` field set is reused
  verbatim **under `deploy.targets.windows`** to preserve the working lane's behaviour (only the key
  path changes, not the Windows schema itself).
- Factor **common** fields (mode `compile|script`, `denoPath`, `compileTarget`, concurrency,
  timeouts, `bundleExternal/Imports`, `workspace`, `v8HeapMb`, `generateEnvFile`, `logging`,
  `health`) into a shared base; keep **target-specific** fields (servy `installBase`,
  `servicePrefix`, `servyCliPath` for windows; systemd `unitDir`, `user` for linux; project/org/token
  for deno-deploy; registry/compute-env for docker/k8s) in the member schema.
- The existing (currently-unused) `docker` sub-block and `denoBaseImage: 'denoland/deno:2.5'` pin
  migrate under the docker/compose target and re-pin to the ada2a5 `denoland/deno:2` base.

### 3.4 One-click flow, end to end

Target = Deno Deploy (the shortest one-click path, deno-native):

```
netscript deploy deno-deploy up
  → resolve deploy.targets.deno-deploy (project, org, token from secret store)
  → deno compile/bundle not required (Deno Deploy builds from source, no Dockerfile)
  → wrap `deno deploy` (CLI-first) OR register GitHub-push auto-build
  → stream build stages (Queue→Prepare→Install→Build→Deploy) back through CLI reporter
```

Target = cloud container (aca/compose), one-click with an Aspire pipeline:

```
netscript deploy aca up --environment production
  → generate/refresh AppHost (AddDenoApp resource, OTEL_DENO wired)
  → netscript maps deploy config → Parameters__* + --environment
  → aspire deploy --environment production   (Aspire: build image → push GHCR → apply ACA)
  → first run prompts provisioning; cached to ~/.aspire/deployments/{sha}/production.json
```

Target = bare-metal (linux/windows), one-click direct:

```
netscript deploy linux up
  → deno compile → single binary (denort stripped runtime)
  → OsServicePort(systemd adapter): render unit, install, enable, start
  → health check + activate; keep previous binary for rollback
```

"Near-one-click" = a single `netscript deploy <target> up` after a one-time
`netscript deploy <target> init` (which captures target config + secrets). The gated release skill
(per the "release must be one-shot + deterministic" mandate) wraps the whole thing.

---

## 4. Per-target adapter architecture

Each target is an adapter behind a stable port. Model / driven-via / programmatic path / tier below;
the readiness matrix + blockers live in `decision-gap-tracker.md`.

| Target | Deployment model | Driven via | Programmatic / CI path | Tier |
| --- | --- | --- | --- | --- |
| **Deno Deploy (new)** | Deno-native source build, no Dockerfile/buildpack, serverless microVM | NetScript CLI → `deno deploy` (or GitHub-push auto-build) | `deno deploy` CLI + GitHub app; managed PG/KV | **1** |
| **deno compile bare-metal (linux/windows)** | Single self-contained binary + OS service (systemd/servy) | NetScript CLI → OsServicePort adapter | `deno compile` in CI → ship binary + unit; SSH/agent install | **1** |
| **Docker / Compose (self-host)** | Container image + compose file | NetScript CLI → `aspire publish`/`aspire deploy` (compose compute-env) | `aspire do push` → GHCR → `docker compose up` | **1** |
| **Kubernetes** | Generated manifests applied to a cluster | NetScript CLI → `aspire publish` (k8s) → `kubectl/helm apply` | `aspire publish` manifests + existing cluster workflow | **2** |
| **Azure (ACA / App Service / AKS)** | Aspire compute-env, provisioned + applied | NetScript CLI → `aspire deploy --environment` | `aspire deploy`; supersedes `azd` | **2** |
| **GCP Cloud Run** | Docker image → managed run | NetScript CLI emits image; `gcloud run deploy` / GH Actions | Docker + `gcloud`; GH Actions guide exists | **2** |
| **DigitalOcean / Render / Sevalla / Dokploy / Coolify** | Docker image or droplet/self-host compose | NetScript CLI emits image/compose; provider CLI or git-push | Docker path (no first-party Deno); Dokploy/Coolify = Traefik self-host | **2/3** |
| **Koyeb** | git / Docker / buildpack; has a Deno guide | NetScript CLI emits; `koyeb app init` | git-push or Docker; documented Deno path | **2** |
| **Vercel** | Unofficial `@lowlighter` Deno function runtime | RFC-14 unified mode (Nitro preset) or unofficial runtime | Not first-party Deno; via unified-mode Nitro build | **3 (track)** |
| **Cloudflare Workers** | `denoflare` (third-party skymethod), isolate model | RFC-14 unified mode (Nitro preset) | Not first-party; isolate constraints | **3 (track)** |
| **AWS Lambda** | Layer-hack or container Lambda (Firecracker) | Container image path only | No first-party Deno runtime | **3 (track)** |

Adapter contract (all targets implement a subset): `plan/emit`, `up`, `down`, `status`, `logs`,
`rollback`, `secrets`. Aspire-driven adapters delegate `up/plan` to the Aspire CLI; direct adapters
implement them natively. Sources: `sources/deno-deploy/*`, `sources/providers/*`,
`sources/aspire/*`.

---

## 5. Bare-metal successor design (fold servy-assessment)

Verdict from `servy-assessment.md`: **MODERNIZE** — SERVY upstream is healthy; the rot is
NetScript-side (no Linux, doc/code divergence, no rollback/multi-instance, weak secrets, fake-only
tests, dead docker/script config, `deno:2.5` pin).

### 5.1 Generalize `WindowsServicePort` → `OsServicePort`

The existing hexagonal seam (`WindowsServicePort` 5 ops + `ServyCliAdapter` + `ProcessPort`) is the
reference. Generalize the port to an OS-agnostic `OsServicePort` with two adapters:

- **ServyCliAdapter** (Windows) — retained, wraps `servy-cli` (C# MIT); today's working lane.
- **SystemdAdapter** (Linux) — new; renders a unit file, `systemctl daemon-reload/enable/start/stop`,
  `journalctl` for logs. This closes the single biggest gap (no Linux).

The port's op set (install / start / stop / status / uninstall today) extends with `rollback`,
`upgrade`, and `logs` so both adapters expose the same lifecycle the CLI verbs (Section 3.1) call.

### 5.2 Artifact: `deno compile` single binary

Source: `sources/watch/deno-compile-reference.md` (ADOPT).

Bare-metal artifacts are produced by `deno compile` (self-contained binary, `denort` stripped
runtime, `--include`/`--bundle`, 5 cross-compile target triples, cross-compile from any host,
framework detection 2.8+). This removes the need for a Deno install on the target and is the natural
successor to the current `compile|script` mode split — `compile` becomes the enterprise default,
`script` remains for dev/iteration. Code signing is **manual** today (no automated signing in
`deno compile`) — flagged as a gap in the tracker.

### 5.3 Enterprise features the successor must add

Folding `servy-assessment.md` gap analysis:

- **Rollback**: keep N previous binaries + unit versions; `rollback` re-points the service to the
  prior binary and restarts. (Deno desktop's `latest.json` + bsdiff model,
  `sources/watch/deno-desktop-overview.md`, is a reference for the update/rollback shape but is
  TRACK, not adopt.)
- **Multi-instance**: `servicePrefix` + instance index → N services behind a local load-balancer or
  distinct ports; concurrency config already exists per-type.
- **Secrets**: replace the weak `generateEnvFile` approach with a secrets op that sources from an
  external store (env / file / OS keystore) and injects at service-config time — never bake secrets
  into the compiled binary or a world-readable env file.
- **OTEL**: wire `OTEL_DENO` into the service environment (aligns bare-metal observability with the
  ada2a5 container lane; Section 6.2).
- **Health**: the existing `health` config (interval / failedChecks / restart) drives an activation
  gate — a new binary is only promoted after it passes health; failed health → auto-rollback.

### 5.4 Retire the dead config

The unused `docker`/`script` config fragments and the `deno:2.5` pin under `deploy.windows.*` are
removed or migrated: docker → the docker/compose target (re-pinned `denoland/deno:2`); the bare-metal
service config keeps only fields both adapters honor.

---

## 6. Enterprise concerns

### 6.1 Secrets & least-privilege

- **Cloud/Aspire**: use `Parameters__*` sourced from the CI secret store, not the plaintext
  `~/.aspire/deployments/*.json` cache (`sources/aspire/deployment-state-caching.md` security note).
  In CI, prefer `--clear-cache` semantics / ephemeral state over persisting secrets in the cache.
  Secret parameters use `AddParameter(..., secret: true)` and are preserved as deferred value objects
  in manifests (`sources/aspire/architecture--resource-publishing.md`).
- **Bare-metal**: secrets op (Section 5.3) sources from an external store, injected at config time;
  binary and env files never hold plaintext long-term secrets; least-privilege service account
  (dedicated non-root systemd `User=`, constrained Windows service account).
- **Deno Deploy**: runtime is `--allow-all` with **no `--unstable-*` flags**
  (`sources/deno-deploy/reference-runtime.md`) — code must not depend on unstable APIs on that
  target; secrets via the platform's env/secret surface.

### 6.2 OTEL tied to `OTEL_DENO`

Both the container lane (`OTEL_DENO` set on the resource in the TS AppHost via
`.withEnvironment('OTEL_DENO', ...)`, or baked into the image by ada2a5 as DX) and the
bare-metal lane (Section 5.3) standardize on Deno's `OTEL_DENO` OpenTelemetry integration, giving one
observability contract across targets. Aspire's dashboard/telemetry consume it in the container lane.

### 6.3 Rollback & HA

- Bare-metal: binary/version retention + health-gated activation + `rollback` verb (Section 5).
- Cloud: rollback is target-native (ACA revisions, K8s rollout undo, Deno Deploy versioned deploys) —
  the adapter surfaces a uniform `rollback` verb that maps to each platform's mechanism.
- HA: multi-instance bare-metal; replica count / scaling in the compute-env (compose replicas, K8s
  replicas, ACA scale rules) for cloud.

### 6.4 Environments & promotion

`--environment` (Aspire) ↔ `deploy.targets.<t>.environment` (NetScript) select isolated config +
state per Development/Staging/Production (`sources/aspire/environments.md`,
`deployment-state-caching.md`). Promotion = re-run the same AppHost/artifact against the next
environment (artifact-first via `aspire publish` handoff, or direct `aspire deploy --environment`).

### 6.5 CI/CD

Emit the two-layer shape (Section 2.7): CI system owns stage/approval/identity; Aspire owns
build/push/publish/deploy; parameters via `Parameters__*`. NetScript's scaffold should generate a
GitHub Actions template mirroring `sources/aspire/app-lifecycle.md` (publish artifacts → GHCR →
compose/aca), plus a Deno Deploy GitHub-push template for the deno-native lane, plus a bare-metal
`deno compile` → ship-binary template.

---

## 7. Doctrine impact

No doctrine is authored here; these are the entries the epic must open (coordinate with the
netscript-doctrine skill and parent epic):

1. **New deployment archetype** under `docs/architecture/doctrine/`: a "deploy target adapter"
   archetype defining the `OsServicePort` / cloud-adapter contract, the thin-CLI-router law
   (targets carry no business logic in the command surface), and the plan/up/down/status/logs/
   rollback/secrets op set. Precedent: existing package/plugin archetypes.
2. **Contract-first debt entry** for the `deploy.windows.*` → `deploy.targets.*` schema evolution —
   **clean break, no back-compat alias** (D5, user override 2026-07-03; alpha breaking change), plus a
   one-line config migration note. Anchor: `packages/config/src/domain/schemas/deploy-schema.ts`.
3. **Taxonomy**: create `area:deploy` label + `epic:deployment` label (+ `type:umbrella` for the
   epic issue). None exist today (`worklog.md`); precedent is `epic:ai-stack` + `type:umbrella`.
4. **Upstream-dependency note (corrected 2026-07-03)**: the TS AppHost SDK **can** drive the
   container/cloud lane today (`addContainer`/`addDockerfile` + `add*Environment` +
   `publishAs*Service` + `pipeline.addStep`, see 2.3). The only C#-only gap is authoring brand-new
   custom resource *types* / generic callback-based deployment extensibility, which NetScript's
   container lane does not need. Record the accurate scope: the container lane is **not** ada2a5-gated;
   ada2a5 `AddDenoApp` is an optional DX enhancement (track), and custom-resource-type authoring is
   the only capability that would require C#.
5. **Plugin-thinness alignment**: confirm the deploy feature stays a thin router + adapters and that
   convention-bearing primitives (health, OTEL, secrets, rollback) live in a core, not per-target
   (per the plugin-thinness / core-centralization law).

---

## 8. Phasing & milestones toward one-click

Ordering respects dependencies; each phase is a candidate epic sub-issue (titles in the tracker).

**Phase 0 — Contract + taxonomy (no behavior change).**
Introduce `deploy.targets.*` schema with `windows` as first member — **clean break, no back-compat
alias** (D5, user override; Windows lane re-keyed to `deploy.targets.windows` + one-line migration
note); create `area:deploy`/`epic:deployment` labels + umbrella issue; open doctrine archetype stub.
Depends on: nothing. Unblocks everything.

**Phase 1 — Bare-metal successor (highest-value, no upstream blocker).**
Generalize `WindowsServicePort` → `OsServicePort`; add `SystemdAdapter`; switch artifact to
`deno compile`; add rollback + health-gated activation + secrets op + `OTEL_DENO`. Depends on:
Phase 0. Deno compile is ADOPT-ready (`sources/watch/deno-compile-reference.md`). This ships a real
cross-OS bare-metal lane without waiting on Aspire/upstream.

**Phase 2 — Deno Deploy tier-1 adapter (deno-native cloud).**
CLI adapter wrapping `deno deploy` + GitHub-push auto-build; managed PG/KV wiring; runtime
constraint guard (no `--unstable-*`). Depends on: Phase 0. Independent of Aspire. Delivers the
shortest one-click cloud path.

**Phase 3 — Aspire container lane (NOT ada2a5-gated; can run in parallel with Phases 1-2).**
Generate an `apphost.mts` using the built-in TS primitives — `addContainer('denoland/deno:2')` /
`addDockerfile` + `addDockerComposeEnvironment`/`addAzureContainerAppEnvironment` +
`publishAsDockerComposeService`/`publishAsAzureContainerApp` (see 2.3); wire `netscript deploy` →
`aspire publish`/`aspire deploy`/`aspire do`; config→`Parameters__*` mapping; compose + ACA targets
first (k8s/appservice next). **Corrected 2026-07-03**: no upstream hard dependency — the TS AppHost
authors the Deno compute resource today. Depends on: Phase 0. ada2a5 `AddDenoApp` (optional DX) can
be folded in later to replace the hand-generated container context with the named resource type.

**Phase 4 — CI/CD templates + state/secret hardening.**
Generate the two-layer GH Actions templates (compose/GHCR, Deno Deploy push, bare-metal compile);
harden Aspire state-cache secret handling for CI; promotion flows. Depends on: Phases 1-3.

**Phase 5 — One-click convergence + release skill.**
Single gated `netscript deploy <target> up` after `init`; fold into the deterministic release skill
(per the one-shot-release mandate). Depends on: Phases 1-4.

**Watch dependencies (do not block phases; re-evaluate per tracker):**
- **ada2a5 AddDenoApp** — optional DX enhancement for Phase 3 (NOT a blocker; corrected 2026-07-03).
  There is now **no upstream hard dependency on the critical path** — Phases 0-3 can all proceed.
- **Pulumi #3838** (0.140 intent, gRPC-in-Deno blocker `denoland/deno#23714`) — TRACK; would enable
  a Pulumi-driven multi-cloud adapter if it ships.
- **Nitro deno_server preset** — TRACK; central to RFC-14 unified mode (Vercel/CF/Netlify tier-3
  targets); needs `--unstable`, not zero-config yet.
- **RFC-14 unified mode** — product decision (Section: tracker); if adopted, tier-3 serverless targets
  come "for free" via Nitro presets rather than per-target adapters.
- **deno desktop** — TRACK; reference for the bare-metal auto-update/rollback shape only.
