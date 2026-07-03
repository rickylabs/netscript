# Research — deploy-s6-deno-deploy

Slice **#342 [Deploy-S6]** — "Deno Deploy tier-1 adapter (MARQUEE)". Phase 2 of the deployment
epic **#327**, decision **D2**. This is a **PLAN-ONLY** run: research + plan + draft PR, then a
separate-session PLAN-EVAL. No adapter/CLI/schema code is written here.

## Re-baseline

- **Carried-in sources:**
  - Deployment epic aggregation corpus:
    `.claude/worktrees/deployment-research/.llm/tmp/run/epic-deployment-aggregation/`
    (`deployment-architecture-spec.md`, `decision-gap-tracker.md`, `sources/deno-deploy/**`).
  - **#337** landed contract on branch `feat/deploy-s1-targets-config`
    (`packages/config/src/domain/schemas/deploy-schema.ts` + `config-section-types.ts`).
  - **#338** target-adapter archetype in-flight on branch `feat/deploy-s2-doctrine`
    (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`, `deploy-target-registry-port.ts`,
    `application/registries/deploy-target-registry.ts`, `domain/deploy/windows-service-deploy-target.ts`,
    `extension-points.ts`, doctrine `07-composition-and-extension.md`).
- **Re-derived against `main`** @ `cf1ac47b` (worktree HEAD `feat/deploy-s6-deno-deploy`, forked from
  origin/main cf1ac47b on 2026-07-03).
- **What changed vs the carried-in version / key correction:** The epic corpus (written before #338)
  sketched a bespoke `DenoDeployAdapterPort { plan/up/down/status/logs/rollback/secrets }` shape and
  a `packages/cli/src/public/features/deploy/deno-deploy/` strategy folder mirroring
  `build-windows-strategy.ts`. **That is now stale.** #338 has since introduced the *real*
  target-adapter archetype as a kernel **port + registry** (`DeployTargetPort` with
  `operations: build|install|uninstall`, registered in `DeployTargetRegistry`, exported from
  `kernel/extension-points.ts`). The adapter MUST conform to #338's `DeployTargetPort`, **not** the
  corpus's speculative 7-verb port. This reconciliation is the central research correction of this
  run (see Finding 3 and the operation-mapping open decision in `plan.md`).

## Findings

| #  | Finding (fact the plan depends on) | How to verify |
| -- | ---------------------------------- | ------------- |
| 1  | **#337 base shape.** `DeployTargetBaseSchema` is a `z.object(deployTargetBaseShape)` raw-shape spread (mode, denoPath, compileTarget, concurrency, bundle*, workspace, v8HeapMb, generateEnvFile, logging, health, docker). `WindowsDeployTargetSchema` extends it by **spread** (`{ ...deployTargetBaseShape, servyCliPath, installBase, servicePrefix }`), and `DeployConfigSchema.targets` is `z.object({ windows: WindowsDeployTargetSchema.optional() }).optional()`. New members are added as sibling keys. | `git -C <wt> show feat/deploy-s1-targets-config:packages/config/src/domain/schemas/deploy-schema.ts` |
| 2  | **#337 types.** `config-section-types.ts` declares `DeployTargetBase`, `WindowsDeployTarget extends DeployTargetBase`, `DeployConfig { targets?: { windows?: WindowsDeployTarget } }`. Schemas are annotated `z.ZodType<T>` (so `.extend()` is hidden — spread composition is mandatory). A `deno-deploy` member needs BOTH a `DenoDeployTarget` interface and a `DenoDeployTargetSchema` typed `z.ZodType<DenoDeployTarget>`. | `git -C <wt> show feat/deploy-s1-targets-config:packages/config/src/domain/config-section-types.ts` |
| 3  | **#338 archetype (the port my adapter implements).** `DeployTargetPort { key; label; operations: readonly ('build'\|'install'\|'uninstall')[]; build?/install?/uninstall?: (req: DeployTargetRequest) => Promise<DeployTargetResult> }`. `DeployTargetRequest { projectRoot; outputDir? }`. `DeployTargetResult { target; operation; message }`. Registered via `DEFAULT_DEPLOY_TARGETS` in `DeployTargetRegistry` and re-exported from `kernel/extension-points.ts`. | `git -C <wt> show feat/deploy-s2-doctrine:packages/cli/src/kernel/domain/deploy/deploy-target-port.ts` |
| 4  | **#338 windows adapter is a thin descriptor.** `WindowsServiceDeployTarget implements DeployTargetPort` with `key='windows-service'`, `label='Windows service'`, `operations=['build','install','uninstall']`; its `build/install/uninstall` currently just return a `DeployTargetResult` "registered" message and **delegate real work to the existing public deploy command pipeline** (`public/features/deploy/**`). The port is an extension-point seam layered over the still-authoritative public commands. | `git -C <wt> show feat/deploy-s2-doctrine:packages/cli/src/kernel/domain/deploy/windows-service-deploy-target.ts` |
| 5  | **Doctrine axis.** `07-composition-and-extension.md` names a **Deploy target** axis with variants `windows-service, docker, cloud (future)`, and the required extension shape: `registerDeployTarget('cloud', (ctx) => createCloudDeployFlow(ctx))` — a consumer supplies a *factory* returning a package-owned contract type; **no cross-package inheritance**. Every `Registry` subclass must be exported from `extension-points.ts` or declared internal (audit rule / F-CLI-31). | `git -C <wt> show feat/deploy-s2-doctrine:docs/architecture/doctrine/07-composition-and-extension.md` |
| 6  | **Existing public deploy router is windows-hardcoded.** `public/features/deploy/deploy-group.ts` `createDeployCommand(deps)` registers 10 cliffy verbs (build, package-cli, copy, install, start, stop, status, logs, uninstall, upgrade), description "Build and manage NetScript Windows Service deployments", calling `buildWindowsDeployment` directly with no target abstraction. Generalizing to `netscript deploy <target> <verb>` is net-new. | `packages/cli/src/public/features/deploy/deploy-group.ts` |
| 7  | **External-CLI shell pattern.** `ServyCliAdapter implements WindowsServicePort` shells `servy-cli.exe` via a `ProcessPort`, captures stdout/stderr, maps exit code → `{ success, message, code }`. This is the exact pattern to mirror for shelling `deno deploy` (a `ProcessPort`-driven adapter, NOT ad-hoc `Deno.Command`). | `packages/cli/src/public/adapters/servy-cli.ts` |
| 8  | **Config resolver pattern.** `deploy-config-resolvers.ts` `resolveWindowsDeploy(userDeploy?.windows)` reads the target sub-config, applies defaults, returns a `ResolvedWindowsDeployConfig`. A sibling `resolveDenoDeployTarget(userDeploy?.targets?['deno-deploy'])` follows the same shape. NOTE: #337 re-keys targets under `deploy.targets.*`, so the resolver reads `deploy.targets['deno-deploy']`, not `deploy['deno-deploy']`. | `packages/cli/src/kernel/adapters/config/deploy-config-resolvers.ts` |
| 9  | **Deno Deploy = NEW platform, source-driven, no Dockerfile.** Corpus + live docs: target is *Deno Deploy* (`console.deno.com`, `deno deploy` CLI), NOT deprecated Deploy Classic / Subhosting (deployctl, sunset 2026-07-20). Serverless microVM; build is remote 5-stage (Queue→Prepare→Install→Build→Deploy) from source; config from `deno.json`/`deno.jsonc` + dashboard. | `sources/deno-deploy/reference-builds.md`; https://docs.deno.com/runtime/reference/cli/deploy/ |
| 10 | **Runtime constraint (critical guard).** Deno Deploy runtime is pinned (corpus: Deno 2.5), runs `--allow-all`, and **rejects custom flags including `--unstable-*`**. NetScript scaffolds routinely use `--unstable-kv`. A deployed app that imports unstable APIs (e.g. Deno KV) will fail on-platform. An **unstable-API preflight guard** is required before push. | `sources/deno-deploy/reference-runtime.md`; decision-gap-tracker.md "Blockers" |
| 11 | **`deno deploy` CLI surface (live, 2026).** `deno deploy` (deploys cwd; `--prod` for production); `deno deploy create --org --app --source github\|local --runtime-mode dynamic\|static --entrypoint --framework-preset <fresh\|nextjs\|astro…> --install-command --build-command --static-dir`; `deno deploy env add <k> <v> [--secret]` / `deno deploy env load <file>`; `deno deploy switch --org --app`; `deno deploy logs`; `deno deploy logout`; `deno deploy database`. | https://docs.deno.com/runtime/reference/cli/deploy/ |
| 12 | **Auth model (CI open question).** New `deno deploy` uses token-based auth stored in the OS **keyring**, auto-prompting interactively; supports **user tokens and organization tokens**. The docs page does **not** confirm a non-interactive env var (classic `deployctl` used `DENO_DEPLOY_TOKEN`). Non-interactive CI auth for the new CLI is unconfirmed → surfaced as `NEEDS USER` in the plan. | https://docs.deno.com/runtime/reference/cli/deploy/ ; https://docs.deno.com/deploy/classic/deployctl/ |
| 13 | **Existing debt this touches.** `arch-debt.md` §`cli-deploy-artifacts-missing` records that NetScript has no first-class deploy artifact generation / `netscript deploy` beyond the recorded manual facts. This slice partially advances that debt (adds a real cloud target) but does not close it. | `.llm/harness/debt/arch-debt.md:1300` |
| 14 | **`deno-deploy` naming vs registry key.** #338's windows key is `'windows-service'` (registry key) while the CLI-facing target token and the config member key are `windows`. For this slice the config member + CLI token is `deno-deploy`; the registry key should be a stable identifier (`'deno-deploy'`). Keep config-member key, CLI token, and registry key aligned to `deno-deploy` to avoid a windows-style split. | Finding 3 vs #337 `targets.windows` key |

## Deno Deploy deployment model (target being wrapped)

- **Platform:** the NEW **Deno Deploy** (dashboard `console.deno.com`, driven by the built-in
  `deno deploy` subcommand). Deploy **Classic** (deployctl / Subhosting v1) is deprecated
  (sunset 2026-07-20) and is explicitly a **non-target**.
- **Deployment unit:** an **organization → app** (the app is the deployable; deployments are its
  revisions). `deno deploy switch --org <org> --app <app>` sets the default context; `--org`/`--app`
  are otherwise passed per-invocation.
- **Two push modes (a product default decision — see plan open-decision sweep):**
  1. **CLI push** — `deno deploy` from the project root uploads source and triggers a remote build.
     Deterministic, one-shot, CI-friendly (modulo the auth question). This is the natural marquee
     "one-click" for a CLI tool.
  2. **GitHub-push auto-build** — the Deno Deploy GitHub app builds on push. Zero per-deploy CLI
     call, but requires repo wiring and is not a single local command. NetScript would *configure*
     it, not *drive* it.
- **Build model:** remote, source-driven, **no Dockerfile**. 5 stages Queue→Prepare→Install→Build→
  Deploy. Build config comes from `deno.json`/`deno.jsonc` (app dir, framework preset, install
  command, build command, pre-deploy command, runtime mode dynamic/static) plus dashboard overrides.
  NetScript's job is to ensure the scaffolded project's `deno.json` carries valid Deploy build
  settings and to invoke/verify the deploy — **wrap, do not reinvent** the remote builder.
- **Runtime constraints:** pinned Deno (2.5 per corpus), `--allow-all`, **no `--unstable-*`**. This
  is the single most important product caveat for NetScript, whose KV-backed plugins use
  `--unstable-kv`. The adapter must **preflight** for unstable-API usage and refuse/warn.
- **Auth/token:** OS-keyring token, interactive auto-prompt, user or org tokens. Non-interactive CI
  token mechanism (env var) unconfirmed for the new CLI (Finding 12) → `NEEDS USER`.
- **Env vars / secrets:** `deno deploy env add <k> <v> [--secret]` and `deno deploy env load <file>`,
  scoped per environment (production/preview). Maps naturally onto NetScript's existing
  `.env`/`.env.template` generation from the deploy build.
- **Managed data:** Deno Deploy offers managed Postgres/KV (`deno deploy database`). Wiring
  NetScript's DB layer to managed PG/KV is **out of scope** for this beta slice (deferred; see
  Non-goals) but is noted as a follow-up in the epic.

## #337 / #338 dependency status

- **#337 (`feat/deploy-s1-targets-config`)** — landed as a branch, **not yet merged to `main`**. The
  `deploy.targets.*` contract this slice extends exists there. **Implementation of #342 is blocked
  on #337 merging/rebasing first**; the PLAN proceeds now against the known, read contract
  (Findings 1–2). Recorded as a hard dependency in `plan.md` (Locked D1).
- **#338 (`feat/deploy-s2-doctrine`)** — in-flight branch, **not merged**. It introduces the
  `DeployTargetPort` + `DeployTargetRegistry` + `extension-points.ts` archetype this adapter
  conforms to (Findings 3–5) and the doctrine axis text. **Implementation of #342 is blocked on #338
  merging first** (or at minimum on its port/registry surface stabilizing). PLAN designs against the
  read port; PLAN-EVAL will check conformance. Recorded as Locked D2.
- **Merge ordering for the Implement phase:** #337 → #338 → rebase #342. Stated explicitly so the
  Implement phase does not begin against a missing contract or a shifting port.

## jsr-audit surface scan (package/plugin waves)

- **Surface scanned (planned):** `packages/config` public schema exports (new `DenoDeployTarget`
  type + `DenoDeployTargetSchema`) and `packages/cli` `mod.ts` / `extension-points.ts` (new registry
  member; no new public *type* export expected — the adapter is internal, registered via the
  existing `DeployTargetRegistry`).
- **Slow-type / surface risks:** `packages/config` runs under `isolatedDeclarations`; the schema is
  annotated `z.ZodType<DenoDeployTarget>` exactly like `WindowsDeployTargetSchema` to keep fast
  types. The new `DenoDeployTarget` interface must carry explicit field types (no inferred). The CLI
  adapter adds no new slow-type public surface (it implements an existing port). `packages/config`
  is a **published** package → `deno publish --dry-run` is a required gate for the schema slice.
- **Verdict:** low surface risk if the #337 spread-composition + `z.ZodType<T>` annotation pattern is
  followed exactly; PLAN-EVAL should confirm the annotation before slicing.

## Non-goals (deferred to `stable` per D-tiers; explicit)

- **HA / multi-region / autoscaling policy** — Deno Deploy manages this; NetScript does not model it
  in beta.
- **Managed Postgres/KV wiring** (`deno deploy database` → NetScript DB layer) — deferred follow-up.
- **GitHub-push auto-build orchestration** beyond, at most, emitting/validating the build settings —
  CLI-push is the beta default (pending the open decision). Full GitHub-app provisioning is deferred.
- **Rollback / promote / traffic-splitting verbs** — the corpus sketched `rollback`; #338's port
  exposes only `build|install|uninstall`. Beta conforms to the port; richer verbs are a follow-up
  that must be coordinated with the #338 port owner (see plan open decision).
- **Deploy Classic / deployctl / Subhosting** — deprecated platform, explicitly not targeted.
- **Generalizing every existing windows verb** (start/stop/upgrade/copy/package-cli) to deno-deploy —
  those are windows-service lifecycle concepts with no cloud analogue; beta implements only the
  operations the `DeployTargetPort` defines.

## Open questions (closed in `plan.md`)

1. How do the port's `build|install|uninstall` operations map onto Deno Deploy semantics
   (build=preflight/settings, install=push-deploy, uninstall=delete-app)? → plan Open-Decision + a
   possible coordinated port-vocabulary note with #338.
2. CLI-push vs GitHub-push default for the beta marquee? → `NEEDS USER`.
3. Non-interactive CI auth mechanism for the new `deno deploy` (env var / org token)? →
   `NEEDS USER` + freshness re-check at Implement time.
4. Does the router generalization to `netscript deploy <target> <verb>` land in this slice or is the
   deno-deploy target reached only through the registry until #338's router work lands? → plan Locked
   decision (register-first, minimal CLI reach).
