# Research: Deploy-S7 — Aspire Docker/Compose deploy target adapter (#343)

## Run Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `deploy-s7-aspire`                                            |
| Branch         | `feat/deploy-s7-aspire` (worktree, tracks `origin/main`)     |
| Phase          | `research` → `plan` (PLAN-EVAL pending, separate session)    |
| Slice          | #343 `[Deploy-S7]` Aspire Docker/Compose lane via TS AppHost |
| Epic           | #327 NetScript enterprise deployment framework               |
| Archetype      | 7 — Deployment Target Adapter (composite A2 core + A6 router) |
| Milestone      | `0.0.1-beta.3`                                               |

> This run is **PLANNING-ONLY**. No product code is written. Deliverable = `research.md`
> + `plan.md` + a DRAFT PR, then a hard STOP for a separate-session PLAN-EVAL.

## 1. Slice scope (verified from `gh issue view 343`)

Aspire container lane via the **TypeScript AppHost** — beta slice, decision D2 co-marquee
"cloud-agnostic proof" alongside the Deno Deploy marquee (#342). Acceptance criteria:

1. `apphost.mts` generated with a Deno **container/dockerfile** resource + `publishAsDockerComposeService`.
2. `netscript deploy docker|compose <verb>` wraps `aspire publish` / `aspire deploy`; emitted
   compose file + image build verified.
3. NetScript deploy config mapped to `Parameters__*` env vars.
4. `denoland/deno:2` base (not `2.5`).
5. E2E: compose artifact emits and `docker compose up` boots the app (**or a CI-safe equivalent**).

Dependencies (from the issue): S1 (config contract) only. Independent of bare-metal (#339/#340/#341)
and Deno Deploy (#342) lanes — Phase 3a, parallelizable. **Explicitly NOT blocked on ada2a5 / #320**
(`AddDenoApp` is optional DX sugar folded in later). k8s + Azure publish shapes are the stable slice
(S10 / #346).

## 2. The LOCKED contract (Archetype 7 — do not re-litigate)

Source (read-only, pending merge via PR #357 in the `deploy-s2` worktree):
`ARCHETYPE-7-deploy-target-adapter.md`, `06-archetypes.md#archetype-7`, `archetype-gate-matrix.md`,
`contract-reconciliation.md`.

- **Uniform 7-op contract** every adapter implements a subset of:
  `plan`/`emit` · `up` · `down` · `status` · `logs` · `rollback` · `secrets`.
- **A7 — wrap, do not reinvent:** Aspire-driven adapters **DELEGATE** `up`/`plan` to the Aspire CLI.
  S7 must not reimplement compose/manifest generation — it shells `aspire publish`/`aspire deploy`.
- **R-DEPLOY-1** uniform 7-op contract (subset allowed; Aspire adapters delegate up/plan) → F-DEPLOY-1.
- **R-DEPLOY-2** no target-specific business logic in the command surface; router only parses+routes → F-DEPLOY-2.
- **R-DEPLOY-3** convention-bearing primitives (health, OTEL, **secrets**, **rollback**) live in the
  core, shared across targets — not per-target ad-hoc code → F-DEPLOY-2.
- **R-DEPLOY-4** each target config member spreads `DeployTargetBaseSchema`; no config base-class
  hierarchy (A5) → F-DEPLOY-1.
- **R-DEPLOY-5** the cloud-adapter seam is justified by ≥2 foreseeable adapters (compose, aca, k8s…) — not premature.
- Composite: the **core** satisfies Archetype 2 universal gates; the **router** satisfies Archetype 6
  universal + F-CLI gates. `F-DEPLOY-1/2` are additive and seeded **`reviewed`** (manual evidence)
  until the deployment packages exist.

### 2.1 Reconciliation note (authoritative, `contract-reconciliation.md`)

- Main ships a **3-op** seed `DeployTargetPort` (`build | install | uninstall`, all optional) with a
  stub `WindowsServiceDeployTarget` (landed by unrelated commit `3137e455`, **not** #338).
- The **7-op** lifecycle is the canonical epic contract; the 3-op port is a placeholder seed to be
  **expanded**, never entrenched. Verb map: `build → plan/emit`, `install → up`, `uninstall → down`;
  `status`/`logs`/`rollback`/`secrets` are net-new.
- "Verb-vocabulary lock is deferred to the first real adapter (#339/#340)." Whichever real adapter
  lands first drives the seed→7-op expansion; later adapters rebaseline. **S7 targets 7-op regardless.**

## 3. Ground truth already on `main` (verified against `origin/main`)

- **Config contract (S1/#352, landed `44d7945b`):**
  `packages/config/src/domain/schemas/deploy-schema.ts` now exports `DeployTargetBaseSchema`
  (a shared `z.object(deployTargetBaseShape)`) + `WindowsDeployTargetSchema` (spreads the base). Top
  section is `deploy.targets` — a **name-keyed map** (currently only `windows`). Base shape already
  carries a `docker` sub-block (`denoBaseImage` default `'denoland/deno:2'`, `dotnetBaseImage`). New
  targets add sibling keys by spreading `deployTargetBaseShape`. **Clean break (D5): no `deploy.windows.*` alias.**
  (NOTE: the working-tree copy of this file on the older `fix/cli-db-init-flake` branch is the pre-#352
  version — the worktree is cut from `origin/main`, which has the map form.)
- **Deploy port seed:** `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts` — 3-op
  `DeployTargetPort` (`key`, `label`, `operations`, optional `build`/`install`/`uninstall`), plus
  `DeployTargetRequest` (`projectRoot`, `outputDir?`) / `DeployTargetResult`.
- **Reference adapter:** `.../deploy/windows-service-deploy-target.ts` (stub; each op resolves a canned message).
- **Registry seam:** `.../deploy/deploy-target-registry-port.ts` (`register`/`get`/`entries`) +
  `.../application/registries/deploy-target-registry.ts` (`DeployTargetRegistry extends Registry`,
  closed-on-key, sorted `entries()`, seeded with `windows-service`).
- **CLI router (today):** `packages/cli/src/public/features/deploy/deploy-group.ts` —
  `createDeployCommand(deps)` registers a **flat Windows-centric verb list**
  (`build | package-cli | copy | install | start | stop | status | logs | uninstall | upgrade`),
  description "Build and manage NetScript **Windows Service** deployments". Each verb is its own
  per-verb command file under `features/deploy/<verb>/`. **Target is not yet a first-class dimension.**
- **AppHost:** the scaffold already generates `aspire/apphost.mts` — a TypeScript/Node AppHost
  (Aspire SDK 13.x, `Aspire.Hosting.PostgreSQL`), isolated under `aspire/` so its Node graph never
  leaks into the Deno root. `netscript.config.ts` records the path under `aspire.appHost`.
  `deploy: {}` currently ships empty; **no** Dockerfile/compose/cloud target is generated
  (`docs/site/how-to/deploy.md`, `arch-debt:cli-deploy-artifacts-missing`).

## 4. Aspire TS-AppHost API surface (verified, `?aspire-lang=typescript` corpus)

The earlier "container lane is C#-only / gated on ada2a5" finding was a **false alarm** from reading
only the default C# doc tab. The TS AppHost drives the whole container lane today. Verbatim TS
(`sources/aspire/docker-compose--ts-tab.md`, `pipelines--ts-tab.md`, `deploy-with-aspire--ts-tab.md`,
`deployment-architecture-spec.md` §2.3):

- `const builder = await createBuilder();`
- `await builder.addDockerComposeEnvironment('env');` — compose **compute-environment**.
- `await builder.addContainer('api', 'denoland/deno:2');` / `await builder.addDockerfile('web', './web');`
  — arbitrary container/dockerfile resources from TS (proves `denoland/deno:2` is reachable).
- Per-resource publish callback: `publishAsDockerComposeService(async (_r, service) => {...})`.
- Env-file customization: `compose.configureEnvFile(async (envVars) => {...})`.
- Secret parameters: `await builder.addParameter('apiKey', { secret: true });`.
- App-level pipeline steps: `builder.pipeline.addStep(name, async (ctx)=>{...}, { requiredBy:['deploy'] })`.
- **Two-command spine:** `aspire publish` evaluates the AppHost and **emits artifacts** (compose file
  + build context) without applying; `aspire deploy --environment <env>` resolves params and applies.
  NetScript passes config via `Parameters__*` env + `--environment`. Aspire owns image build + compose
  emission + apply; NetScript owns **AppHost generation** and **config→parameter mapping** only.
- **Only genuinely C#-only capability** = authoring brand-new custom resource *types* — the container
  lane does not need it (`addContainer`/`addDockerfile` + `publishAs*` callbacks suffice).

## 5. Op → concrete implementation mapping (Aspire docker/compose adapter)

The adapter declares its supported subset and delegates to upstream CLIs. `plan`/`up` delegate to
Aspire (A7); post-apply lifecycle (`down`/`status`/`logs`) queries the emitted compose project via
`docker compose`; `rollback`/`secrets` map to platform-native + the centralized core convention.

| Op            | Delegates to                       | Concrete mapping                                                                                     |
| ------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `plan`/`emit` | **Aspire CLI**                     | `aspire publish` against the generated `apphost.mts` → emits `docker-compose.yaml` + build context into an output dir; no target mutation. |
| `up`          | **Aspire CLI** (+ `docker compose`) | `aspire deploy --environment <env>` (builds image + applies), OR `docker compose up -d` against the emitted artifact for the pure self-host path. Delegates, does not reimplement. |
| `down`        | `docker compose`                   | `docker compose -f <emitted> down` (optionally `--volumes`).                                          |
| `status`      | `docker compose`                   | `docker compose ps` (`--format json`) against the emitted project.                                   |
| `logs`        | `docker compose`                   | `docker compose logs [service] [-f]`.                                                                 |
| `rollback`    | platform-native (NOT a no-op)      | Re-deploy the previous emitted compose artifact / previous image tag from retained deploy state (Aspire caches deployment state at `~/.aspire/deployments/{sha}/{env}.json`). Surfaces the uniform verb mapping to the compose redeploy of the last-good artifact. |
| `secrets`     | **core** convention                | Aspire secret **parameters** (`addParameter(name,{secret:true})`) surfaced as `Parameters__*`; written to a restricted-perm compose env-file via the centralized core secrets primitive (R-DEPLOY-3), never per-target ad-hoc. |

Deferred / declared-unsupported for the beta subset (recorded, not silently dropped): none of the 7
is a silent no-op. If full non-interactive `aspire deploy` apply is not CI-safe (needs a Docker
daemon + registry auth), the beta `up` E2E asserts the **artifact-emission + `docker compose config`
validation** path, with live `docker compose up` boot as a local/opt-in gate (see §7 open decisions).

## 6. Where the code lands (conformance to Archetype 7, one-adapter-per-file)

The deployment core lives inside `packages/cli` today (Archetype 6). Extraction to a dedicated
`@netscript/deploy` package is a later **stable** concern (arch-debt), NOT this slice. For beta:

- **Core (A2 seam):** expand `deploy-target-port.ts` from 3-op → the uniform 7-op contract (all ops
  optional; adapters declare supported ops via `operations`). Centralize the secrets + rollback
  convention primitives in the deploy core (R-DEPLOY-3), shared, not in the adapter.
- **Adapter (one file):** `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts`
  — implements the supported subset, shells `aspire` + `docker compose` through the CLI's existing
  process-runner port (see §Explore anchors), registered into `DeployTargetRegistry` under keys
  `docker` / `compose`. Mirrors the `adapters/windows/*` reference layout.
- **AppHost generation:** extend the scaffold's `aspire/apphost.mts` generator to add
  `addDockerComposeEnvironment` + a Deno `addContainer('denoland/deno:2')`/`addDockerfile` resource +
  `publishAsDockerComposeService`, driven from `appsettings.json` process facts.
- **Router (A6, thin):** add `docker` / `compose` target sub-commands to the deploy group that only
  parse + route to the adapter — **no** target-specific business logic (R-DEPLOY-2 / F-DEPLOY-2). Do
  NOT rip out the legacy flat Windows verbs in this slice (uniform `deploy <target> <verb>`
  convergence for ALL targets is S12/#348).
- **Config:** add a `docker`/`compose` member schema to `deploy.targets.*` that **spreads**
  `deployTargetBaseShape` (R-DEPLOY-4); re-home the existing `docker` sub-block; keep `denoland/deno:2`.

## 7. Key open decisions (full sweep in plan.md)

1. **Port expansion ownership (3-op → 7-op).** Coordinated with #342 (Deno Deploy, Phase 2, p0) and
   #339. Whichever real adapter lands first performs the expansion; S7 targets 7-op regardless and
   rebaselines at the impl baseline. → design-stable, merge-order only (not rework).
2. **`docker` vs `compose` — two keys or one.** Issue says `docker|compose`. Proposal: one adapter,
   two registry keys (compose = the emitted-artifact self-host path; docker = single-image build) —
   or `compose` only for beta with `docker` deferred. Resolve in plan.
3. **E2E depth (CI-safe).** Full `docker compose up` boot needs a Docker daemon in the runner;
   default the merge gate to artifact-emit + `docker compose config` validation, live boot opt-in.
4. **Not NEEDS-USER for S7:** the two epic NEEDS-USER items (CLI-push-vs-GitHub-push default;
   non-interactive `deno deploy` auth) belong to #342 (Deno Deploy), not the docker/compose lane.

## 8. Dependencies

- **Merged:** #352 (`deploy.targets.*` config contract) — on `main`.
- **Pending merge (read-only reference):** #357 / #338 (Archetype 7 doctrine). S7 conforms to it;
  if it has not merged when S7 slices, the archetype md is authoritative-by-reference.
- **Runtime:** `aspire` CLI (Aspire SDK 13.x) + `docker`/`docker compose` present in the E2E env.
  The `scaffold.runtime` E2E already restores+starts Aspire, so the Aspire CLI is available there.
- **Parallel (no hard block):** #339 (OsServicePort), #342 (Deno Deploy). Coordinate port expansion.
- **Optional DX (TRACK, not a blocker):** ada2a5 `AddDenoApp` / #320.

## 9. Sources

- `gh issue view 343 / 327` (rickylabs/netscript).
- Read-only doctrine (deploy-s2 worktree): `ARCHETYPE-7-deploy-target-adapter.md`,
  `archetype-gate-matrix.md`, `contract-reconciliation.md`, `06-archetypes.md#archetype-7`,
  `docs/site/how-to/deploy.md`.
- Epic corpus (deployment-research worktree): `deployment-architecture-spec.md` §§2.3, 3.1–3.4, 6.3,
  Phase 3; `sources/aspire/{docker-compose,pipelines,deploy-with-aspire}--ts-tab.md`;
  `dogfood-aspire-deno-runtime--dogfood/deploy-path-archaeology.md`.
- Main source: `deploy-target-port.ts`, `windows-service-deploy-target.ts`,
  `deploy-target-registry*.ts`, `deploy-group.ts`, `deploy-schema.ts` (`origin/main`).
</content>
