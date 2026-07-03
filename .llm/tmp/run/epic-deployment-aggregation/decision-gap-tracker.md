# NetScript Deployment — Decision & Gap Tracker

Companion to `deployment-architecture-spec.md`. Run: `epic-deployment-aggregation`. Author: G5.
Grounding: `sources/*`, `servy-assessment.md`, `worklog.md`, repo `deploy-schema.ts` +
`deploy-group.ts`. No code; research + spec only.

---

## 1. Per-target readiness matrix

| Target | Deployment model | Driven via | Programmatic deploy | First-party Deno support | Tier | Blockers |
| --- | --- | --- | --- | --- | --- | --- |
| **Deno Deploy (new)** | Deno-native source build, no Dockerfile, serverless microVM | NetScript CLI → `deno deploy` / GitHub-push | Yes — `deno deploy` CLI + GitHub app auto-build | Yes (first-party, deno-native) | 1 | Runtime = Deno 2.5, `--allow-all`, **no `--unstable-*`**; app must avoid unstable APIs |
| **deno compile bare-metal (linux)** | Single binary + systemd unit | NetScript CLI → `OsServicePort`/SystemdAdapter | Yes — `deno compile` in CI + install | Yes (deno-native) | 1 | SystemdAdapter not built yet; code signing manual |
| **deno compile bare-metal (windows)** | Single binary + Windows service (servy) | NetScript CLI → `OsServicePort`/ServyCliAdapter | Yes — existing SERVY lane | Yes (working today) | 1 | NetScript-side rot (no rollback/multi-instance, weak secrets, `deno:2.5` pin) |
| **Docker / Compose (self-host)** | Container image + compose file | NetScript CLI → `aspire publish`/`aspire deploy` (TS AppHost) | Yes — `aspire do push` → GHCR → `docker compose up` | TS AppHost `addContainer('denoland/deno:2')`/`addDockerfile` + `publishAsDockerComposeService` (ada2a5 optional DX) | 1 | None upstream — `SystemdAdapter`-independent; TS AppHost reachable today |
| **Kubernetes** | Generated manifests → cluster | NetScript CLI → `aspire publish` (k8s, TS AppHost) | Yes — manifests + `kubectl`/helm | TS `addKubernetesEnvironment` + `publishAsKubernetesService` (ada2a5 optional DX) | 2 | Cluster-specific apply/RBAC owned by user (NOT ada2a5-gated) |
| **Azure ACA / App Service / AKS** | Aspire compute-env, provision + apply | NetScript CLI → `aspire deploy --environment` (TS AppHost) | Yes — `aspire deploy` (supersedes `azd`) | TS `addAzureContainerAppEnvironment` + `publishAsAzureContainerApp` (ada2a5 optional DX) | 2 | Azure auth/RBAC/provisioning owned by user (NOT ada2a5-gated) |
| **GCP Cloud Run** | Docker image → managed run | NetScript CLI emits image; `gcloud`/GH Actions | Yes — Docker + `gcloud run deploy` | No first-party; Docker path (guide exists) | 2 | Container-only; no native Deno runtime |
| **Koyeb** | git / Docker / buildpack | NetScript CLI emits; `koyeb app init` | Yes — git-push or Docker | Partial — documented Deno guide, not runtime-native | 2 | Buildpack/Docker mediated |
| **DigitalOcean** | Droplet + Docker + SSH | NetScript CLI emits; SSH/compose | Yes — Docker over SSH | No first-party | 2 | Manual droplet/SSH ops |
| **Render** | Docker image | NetScript CLI emits; git/Docker | Yes — Docker | No native Deno | 2 | Container-only |
| **Sevalla** | Docker image | NetScript CLI emits | Yes — Docker | No Deno | 3 | Container-only, thin docs |
| **Dokploy / Coolify** | Self-host Docker + Traefik | NetScript CLI emits compose | Yes — compose/git | No native Deno | 3 | Self-host infra owned by user |
| **Vercel** | Unofficial `@lowlighter` Deno function runtime | RFC-14 unified (Nitro) or unofficial runtime | Partial — unofficial | No (unofficial community runtime) | 3 (track) | No first-party Deno; depends on RFC-14/Nitro |
| **Cloudflare Workers** | `denoflare` (skymethod), isolate | RFC-14 unified (Nitro preset) | Partial — third-party | No (isolate, not full Deno) | 3 (track) | Isolate constraints; not full Deno runtime |
| **AWS Lambda** | Layer-hack or container Lambda (Firecracker) | Container image path | Partial — container only | No first-party | 3 (track) | No first-party Deno runtime |

---

## 2. Watch-item verdicts

**Pulumi #3838 (Deno provider / milestone 0.140) — TRACK.**
Issue is OPEN, milestone `0.140` intent (due ~2026-06-21) but **not announced-shipped**; carries a
`blocked` label. Root blocker is running a gRPC server inside Deno (`denoland/deno#23714`), reportedly
working on deno 2.7.12 but not confirmed released. If it ships, it enables a Pulumi-driven
multi-cloud adapter (IaC lane) — but it is not on the critical path and must not gate Phases 0-2.
Source: `sources/watch/pulumi-3838.md`.

**Nitro unified-mode (deno_server preset) — TRACK.**
Nitro's `deno_server` preset still requires `--unstable` and is not zero-config; it is the build
engine RFC-14 leans on for Vercel/Cloudflare/Netlify tier-3 targets. Track for when the preset
stabilizes; adopting it early would import instability into the serverless lane. Source:
`sources/watch/nitro-deno.md`.

**RFC-14 unified deployment (single-deploy / mode-parity) — PRODUCT DECISION (do not decide here).**
RFC-14 proposes a "unified mode" collapsing NetScript's multi-process architecture into one
serverless deployable (Vercel/Netlify/Deno Deploy/Cloudflare) via Nitro v3 + oRPC + Fresh 2 adapters,
with mode-parity and zero app-code change. It is a strategic, exploratory RFC (v3.0.0), 3-5 month
scope, sagas excluded. This is a positioning/roadmap decision for the user, not an architecture
verdict — surfaced in Section 4. Source: `sources/watch/netscript-start-rfc-14.md`.

**Deno single-file / `deno compile` — ADOPT (now).**
Self-contained binary, `denort` stripped runtime, 5 cross-compile triples, cross-compile from any
host, framework detection (2.8+). Directly enables the bare-metal successor (Phase 1). Only caveat:
code signing is manual (no built-in signing). Adopt as the bare-metal artifact. Source:
`sources/watch/deno-compile-reference.md`.

**Deno desktop (v2.9+) — TRACK (reference only).**
Built on `deno compile`/`denort` + webview with `latest.json` + bsdiff auto-update/rollback. Not a
server-deploy target; useful only as a design reference for the bare-metal update/rollback shape.
Signing not automated. Source: `sources/watch/deno-desktop-overview.md`.

---

## 3. Gap list per phase

**Phase 0 (contract + taxonomy):**
- No `deploy.targets.*` schema — only `deploy.windows.*` exists (`deploy-schema.ts`).
- No `area:deploy` / `epic:deployment` labels; no umbrella issue (`worklog.md`).
- No deployment archetype in `docs/architecture/doctrine/`.

**Phase 1 (bare-metal successor):**
- No Linux/systemd adapter (`WindowsServicePort` is Windows-only).
- No rollback, no multi-instance, weak secrets (`generateEnvFile`), fake-only tests
  (`servy-assessment.md`).
- Artifact still `compile|script` per-OS; not yet standardized on `deno compile` cross-compile.
- `deno:2.5` pin + dead docker/script config fragments to retire/migrate.
- `deno compile` code signing is manual — no automated signing story.

**Phase 2 (Deno Deploy):**
- No Deno Deploy adapter wrapping `deno deploy` / GitHub-push.
- No guard against `--unstable-*` API usage (runtime rejects unstable on that platform).
- Managed PG/KV wiring not mapped to NetScript config.

**Phase 3 (Aspire container lane) — NOT ada2a5-gated (corrected 2026-07-03, see G7 re-verification):**
- The TS AppHost SDK **can already drive the full container lane today**: `builder.addContainer('denoland/deno:2', ...)` / `builder.addDockerfile(...)` for the compute resource, `addDockerComposeEnvironment`/`addKubernetesEnvironment`/`addAzureContainerAppEnvironment` for compute-environments, per-resource `publishAsDockerComposeService`/`publishAsKubernetesService`/`publishAsAzureContainerApp` callbacks, and app-level `builder.pipeline.addStep(...)`. Evidence: `sources/aspire/*--ts-tab.md`.
- ada2a5 `AddDenoApp` is **optional DX sugar** (named resource type, canonical `denoland/deno:2` build context, baked-in `OTEL_DENO`), **not a hard blocker**. Because new resource *types* land in C# first (the TS SDK is a generated projection), depending on `AddDenoApp` is arguably riskier than using the already-TS `addContainer`/`addDockerfile` primitives. Track ada2a5 as an enhancement.
- The one genuinely C#-only capability — authoring brand-new custom resource *types* + generic callback-based deployment extensibility — is **not needed** by NetScript's container lane (custom-deployments TS tab states this verbatim; NetScript uses built-in resource types + the TS `publishAs*` callbacks).
- Remaining real work (no upstream blocker): config→`Parameters__*` mapping; `netscript deploy` → `aspire deploy`/`do` wrapper; generate `apphost.mts`; re-pin `denoland/deno:2.5` → `denoland/deno:2`.
- Minor C#-only gap: `appsettings.{environment}.json` per-environment file-layering (TS equivalent via `env.isDevelopment()` branching + `Parameters__*`).

**Phase 4 (CI/CD + hardening):**
- No generated CI templates (compose/GHCR, Deno Deploy push, bare-metal compile).
- Aspire state cache stores secrets in plaintext (`~/.aspire/deployments/*.json`) — needs CI-safe
  handling.
- No promotion flow between environments.

**Phase 5 (one-click convergence):**
- No `netscript deploy <target> init` one-time config/secret capture.
- Not folded into the deterministic one-shot release skill.

---

## 4. Open product decisions for the user

**RESOLVED 2026-07-03** — delegated to the deployment epic supervisor by the user ("I trust him to
take the right decisions; not all should ship now — prioritize"). Each decision below is a call, not
a question, with rationale + target milestone. All are reversible except where noted.

**D1. RFC-14 unified-mode (Nitro) — DECISION: WATCH / separate track. NOT in v1.**
Do not own tier-3 serverless (Vercel/Cloudflare/Netlify) via RFC-14 in this epic. Rationale: it is a
3-5 month, architecturally distinct program (Nitro v3 + oRPC + Fresh 2, mode-parity), it excludes
sagas, and it depends on the still-`--unstable` Nitro `deno_server` preset. The corrected corpus
shows Aspire + Deno Deploy already deliver a strong cloud-agnostic + deno-native story for beta/stable
**without** RFC-14, so it is not on the critical path. Keep as a tracked watch-item (sub-issue #13);
revisit after tier-1/2 land and the Nitro preset stabilizes. Tier-3 serverless targets are deferred
behind it.

**D2. Flagship one-click — DECISION: Deno Deploy is the beta marquee; Aspire Docker/Compose ships
alongside it in beta as the cloud-agnostic proof.**
Both lanes are unblocked (the "Aspire gated on ada2a5" premise was false), so this is positioning, not
feasibility. Deno Deploy gets the headline + first polish: it is deno-native, needs no Dockerfile, is
the shortest one-click path, and is the strategic Deno-team play. The Aspire Docker/Compose lane is
built in parallel in beta as the self-host / cloud-agnostic proof (no upstream blocker). Kubernetes +
Azure are tier-2/stable. (Positioning is easily revisited; this only sets marquee + polish order.)

**D3. Bare-metal hardening line — DECISION: v1/beta = Linux systemd + `deno compile` single-binary +
atomic rollback + health-gated activation + `OTEL_DENO` + restricted-perm env-file secrets. DEFER to
stable: multi-instance/HA, external secret-store (Vault/cloud KMS), signing automation.**
Rationale: the Windows SERVY lane already works; generalizing to `OsServicePort` + a systemd adapter
on a `deno compile` artifact ships real cross-OS bare metal. Rollback + health-gate are low-cost
table-stakes on the compile artifact (deno desktop's bsdiff/`latest.json` pattern is the reference).
Multi-instance/HA + external secret stores are larger and land at stable. Sub-issue #7 is split
accordingly (see §5).

**D4. `deno compile` code signing — DECISION: accept manual/documented for v1; do NOT block. Automate
at stable.**
`deno compile` has no built-in signing; building cross-platform signing (Windows `signtool`, macOS
Developer ID + notarization) is platform-specific scope that must not gate the bare-metal lane. Ship a
documented manual-signing step + a pipeline hook point now; add automated signing as a stable
enhancement. Reversible.

**D5. `deploy.windows.*` migration — DECISION (USER OVERRIDE 2026-07-03): CLEAN BREAK to
`deploy.targets.*` with NO back-compat alias.**
User override, verbatim intent: "we're alpha, breaking changes are allowed, and it's the right move
to go for the production-grade solution directly." Ship the production-grade `deploy.targets.*` shape
directly — no deprecation seam, no aliasing layer. The prior "alias through beta, remove at stable"
plan is dropped entirely. The Windows SERVY lane is re-expressed under `deploy.targets.windows`
(or equivalent) from the outset; a one-line migration note in the release/config docs covers the
break. Lower complexity than an alias (no shim to build or later remove).

**D6. Pulumi IaC adapter — DECISION: PURE WATCH. NOT a planned lane.**
Pulumi #3838 is OPEN, `blocked`-labeled, and its real blocker (gRPC-server-in-Deno,
`denoland/deno#23714`) is unshipped; the 0.140 milestone is intent, not a ship. Aspire already
provides the IaC/publish path (Bicep/Helm/compose), so a Pulumi lane is not needed for cloud-agnostic.
Track only (sub-issue #14); revisit if #3838 ships and there is demand for a Pulumi-native lane.

**Strategic plays (informational, not blocking):** first-class Deno Deploy support (D2 marquee) is the
Deno-team play; the ada2a5 `AddDenoApp` DX lane is the Aspire-team play. Both are pursued via the beta
Deno Deploy adapter + the (optional) ada2a5 fold-in — no separate decision needed.

No `NEEDS USER:` lines — all six are decided (D5 now a user-overridden clean break); none is
irreversible. D2 positioning is the most product-surface-facing and cheaply revisitable.

---

## 4b. Priority ordering — what ships beta / stable / watch

**0.0.1-beta (tier-1 — ship now):**
- Phase 0: `deploy.targets.*` config contract — **clean break, no `deploy.windows.*` alias** (D5,
  user override); Windows lane re-expressed as `deploy.targets.windows`. Deployment doctrine
  archetype stub. (Labels + epic issue already done.)
- Phase 1: bare-metal successor — `OsServicePort` + `SystemdAdapter` + `deno compile` artifact +
  rollback + health-gate + `OTEL_DENO` + restricted-perm secrets (D3 v1 line).
- Phase 2: **Deno Deploy tier-1 adapter (marquee, D2)**.
- Phase 3a: Aspire **Docker/Compose** lane via TS AppHost (co-tier-1 cloud-agnostic proof).
- Fix the docs/code divergence (`docs/site/how-to/deploy.md` + arch-debt `cli-deploy-artifacts-missing`).

**0.0.1-stable (tier-2):**
- Phase 3b: Kubernetes + Azure (ACA/App Service/AKS) via TS AppHost.
- Docker-image providers as thin adapters on the Docker path: GCP Cloud Run, Koyeb, Render,
  DigitalOcean.
- Phase 4: CI/CD template generation + Aspire state/secret hardening.
- Bare-metal enterprise hardening: multi-instance/HA + external secret store + signing automation
  (D3 deferred set, D4 automation).
- Phase 5: one-click convergence (`netscript deploy <target> init|up`) + release-skill integration.

**Watch / deferred (NOT v1 — tracked, deliberately not shipping):**
- RFC-14 unified-mode + Nitro `deno_server` preset (D1) — architecturally distinct, unstable
  dependency; revisit post tier-1/2.
- Tier-3 serverless: Vercel, Cloudflare Workers, AWS Lambda — no first-party Deno; depend on
  RFC-14/Nitro or unofficial runtimes.
- Pulumi #3838 IaC adapter (D6) — unshipped, `blocked` upstream; Aspire already covers IaC.
- Sevalla / Dokploy / Coolify exotic self-host — low priority; covered generically by the Docker/
  compose emit, community-supported.
- ada2a5 `AddDenoApp` — optional DX; fold into the Aspire lane when it lands (not a blocker).
- `deno desktop` — reference only for the bare-metal update/rollback shape; not a server target.

**Deliberately NOT shipping in v1 and why:** RFC-14 unified-mode (too large + unstable dep, not needed
for a strong cloud story); Pulumi lane (unshipped upstream, Aspire covers IaC); tier-3 serverless +
exotic self-host providers (long tail, no first-party Deno, generic Docker emit suffices); bare-metal
multi-instance/HA + external secret stores + signing automation (enterprise depth that can follow the
working v1 line); k8s/Azure (feasible but user-owned cluster ops — stable, not beta).

---

## 5. Proposed epic sub-issue breakdown (v1 vs deferred)

Each sub-issue tagged **[BETA]** (0.0.1-beta, tier-1), **[STABLE]** (0.0.1-stable, tier-2),
**[SPLIT]** (part beta / part stable), **[WATCH]** (deferred/tracked), or **[DONE]**.

1. **[DONE] [epic] NetScript enterprise deployment framework (umbrella)** — #327; child of
   road-to-0.0.1-stable.
2. **[BETA] deploy: introduce `deploy.targets.*` config contract** (Phase 0) — generalize
   `deploy.windows.*` to a per-target schema with a shared base, **clean break — no back-compat
   alias** (D5, user override); Windows lane re-expressed as `deploy.targets.windows` + one-line
   migration note.
3. **[DONE] taxonomy: `area:deploy` + `epic:deployment` labels + umbrella** — precedent
   `epic:ai-stack` + `type:umbrella`.
4. **[BETA] doctrine: deployment target-adapter archetype** (Phase 0) — port/adapter contract,
   thin-router law, op set; TS-AppHost external surface note (no hard ada2a5 dependency).
5. **[BETA] deploy: generalize `WindowsServicePort` → `OsServicePort` + SystemdAdapter** (Phase 1) —
   cross-OS bare metal; keep ServyCliAdapter for Windows.
6. **[BETA] deploy: adopt `deno compile` single-binary artifact for bare metal** (Phase 1) —
   cross-compile triples, denort, retire `deno:2.5` pin + dead config. Manual signing documented (D4).
7. **[SPLIT] deploy: bare-metal enterprise hardening** — **beta (Phase 1):** rollback + health-gated
   activation + `OTEL_DENO` + restricted-perm env-file secrets (D3 v1 line). **stable:**
   multi-instance/HA + external secret store + signing automation (D3 deferred set + D4 automation).
8. **[BETA] deploy: Deno Deploy tier-1 adapter — MARQUEE** (Phase 2, D2) — wrap `deno deploy` +
   GitHub-push; managed PG/KV; unstable-API guard.
9. **[SPLIT] deploy: Aspire container lane via TS AppHost** — **beta (Phase 3a):** Docker/Compose via
   `addContainer('denoland/deno:2')`/`addDockerfile` + `publishAsDockerComposeService`; `netscript
   deploy` → `aspire publish/deploy`; config→`Parameters__*`. **stable (Phase 3b):** k8s + Azure
   publish shapes. **Not blocked on ada2a5** (optional DX; fold in when it lands).
10. **[STABLE] deploy: Kubernetes + Azure targets** (Phase 3b) — `publishAsKubernetesService` +
    `aspire deploy` Azure (ACA/App Service/AKS). + Docker-image providers as thin adapters (Cloud
    Run, Koyeb, Render, DigitalOcean).
11. **[STABLE] deploy: CI/CD template generation + state/secret hardening** (Phase 4) — two-layer GH
    Actions (compose/GHCR, Deno Deploy push, bare-metal compile); CI-safe Aspire state.
12. **[STABLE] deploy: one-click convergence + release-skill integration** (Phase 5) — `netscript
    deploy <target> init|up`; fold into deterministic one-shot release.
13. **[WATCH] watch: RFC-14 unified-mode + Nitro deno_server preset** — tier-3 serverless
    (Vercel/CF/Netlify) tracking issue (D1); revisit post tier-1/2.
14. **[WATCH] watch: Pulumi #3838 Deno provider** — IaC multi-cloud adapter feasibility (D6); track
    only, Aspire covers IaC.

**v1 (beta) set:** #2, #4, #5, #6, #7-beta, #8, #9-beta + docs/code divergence fix.
**stable set:** #7-stable, #9-stable, #10, #11, #12.
**deferred/watch:** #13, #14 + tier-3 serverless + exotic self-host providers + ada2a5 fold-in.
