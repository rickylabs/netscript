# DP-3 — Adapter cards: per-target design, wrap targets, capability sketches

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.
> Wrap-target evidence: `research/provider-deploy-surfaces.md`; feasibility law: DP-0 L-1…L-7.

## 0. The shared conformance suite (binds every card)

One suite, run per **target variant**, is the family's acceptance instrument (the deploy
analogue of the auth board's single test kit, S14): it exercises each declared
`DeployCapabilityManifest` verdict — runtime traits (HTTP serve + static assets, graceful
shutdown through `ServiceShutdownCoordinator` (L-5), cron), health-gate + rollback behavior,
secrets redaction, log retrieval — against the variant's realization, and composes **installed
leaf backing manifests** for `scope: 'binding'` semantics (queue-consume, kv-atomic) rather than
letting a runtime manifest claim them (r2, SF-7). Verdict levels are
`lossless | partial | unsupported | unverified`: a **`lossless` verdict requires a live-platform
cell** (an in-memory fake validates the harness, never certifies the provider), and
unproven/not-installed/credential-unavailable states report as `unverified`-family diagnostics,
never as provider impossibility. **A verdict without its suite cell is a gate failure**
(backend-truthful, DP-2 §4). The suite lives in `plugin-deploy-core/testing` + per-adapter live
probes; CI matrix = target × variant × capability × verdict (board-parity lesson 9).

Every card below states: tier (DP-0 §3), wrapped surface, ops subset, manifest sketch per
**variant** (only non-obvious rows), scaffold hooks, permissions, and probe gates. Manifests
carry `schemaVersion`, adapter + upstream tool versions, probe date, and evidence ids (DP-2 §4).

## 1. `deploy-aspire` (W2 extraction) — T1

- **Wraps:** the `aspire` CLI (`publish` / `deploy` / `destroy`) — shipped behavior moved from
  `aspire-compose-deploy-target.ts` / `aspire-cloud-deploy-target.ts` unchanged; `docker compose`
  shelling for the self-host lane. `@netscript/aspire` (SDK-neutral composition) stays a separate
  substrate package — this adapter is the *executor*, that package is the *composer*.
- **Targets/ops:** `compose`, `docker`: plan/up/down/status/logs; `kubernetes`, `azure-aca`,
  `azure-app-service`, `azure-aks`: plan/up/down (+status where `aspire` reports it). AppHost
  platform-marker validation preserved. `rollback`: convention-backed for compose (previous
  emitted dir + dir-swap); platform-native where Azure provides it — else absent from
  `operations`. (r4, DP-9) **Delegation deepened:** `down` prefers **`aspire destroy`** (the
  pipeline teardown command); `plan` surfaces `aspire deploy --list-steps` as its pipeline-step
  section; per-env provisioning state delegates to Aspire's deployment state cache
  (`~/.aspire/deployments/{AppHostSha}/{env}.json`, `--clear-cache` surfaced, plaintext-secret
  CI caution kept); `secrets` rides the `Parameters__*` convention. Binding is **CLI +
  application-level pipeline steps only** (the callback-annotation surface is mid-migration
  upstream and C#-only — DP-9 §4).
- **Radius watch (r4, DP-9 §3):** once microsoft/aspire#18759 (TS AppHost projection of the
  merged #18696 `Aspire.Hosting.Radius`) ships in the pinned CLI, **`radius` joins this card as
  a target key** — same `publish`(→`app.bicep`)/`deploy`(→`rad deploy`) verbs, control-plane
  credentials (no cloud secrets in CI), capability rows from the environment's bound Recipes
  (binding scope). Tracked in DPB-29; not claimed for v1.
- **Manifest sketch (per variant: `compose`, `docker`, `kubernetes`, `azure-*`):**
  `process: long-lived`; sagas `supported` (long-lived containers). (r2, SF-7) Queue and
  exclusive-writer semantics are **`scope: 'binding'` verdicts composed from installed leaf
  backing manifests + workload constraints — withdrawn from this runtime card** until their
  conformance cells exist: process liveness proves neither delivery/ack/redelivery semantics nor
  single-writer topology. The k8s variant carries a `singleton` `WorkloadConstraint` interaction
  note (replica-dependent) instead of a mode-collapsed verdict.
- **Scaffold hooks:** owns the `deploy-compose-ghcr.yml` workflow template; keeps emitting
  nothing hand-authored (aspire publish output stays the artifact) until W4's container path
  offers generated Dockerfiles as an alternative.
- **Permissions:** `--allow-run=aspire,docker`, `--allow-read/write` on output dirs.

## 2. `deploy-baremetal` (W2 extraction) — T1

- **Lane naming (r3, KF-3):** one target key **`baremetal`**, variants **`windows` | `linux`**
  (the SF-7 variant mechanism); legacy config keys `windows`/`linux` map in via the compat
  union.
- **Wraps:** Servy (Windows) / systemd (Linux) via the shipped OS-service port; the
  `deno compile` build pipeline (owned here from W2; the adapter-neutral emitter graduates to
  core later — SF-2).
- **Ops:** full eight-op set including convention-backed `rollback` (activation retain + symlink/
  dir-swap + health gate — already designed, `DEPLOY-BAREMETAL-PUBLIC-WIRING` debt closes by
  composing the ports in the plugin's composition root) and `secrets` (env-file reference,
  0o600). Legacy flat verbs (`build/install/start/stop/copy/upgrade/package-cli/uninstall`)
  live here as first-class compatibility handlers with their exact shipped semantics —
  `BaremetalCompatibilityCommands`, DP-2 §2 (r2, SF-9).
- **Manifest (r2, SF-7 — enumerated rows, no blanket claim):** `process: long-lived`; runtime
  rows: `runtime:http-serve` lossless, `runtime:static-assets` lossless,
  `runtime:long-running-process` lossless, `runtime:cron` via OS scheduler `partial` (note),
  `runtime:websocket` lossless; sagas `supported`; binding-scope semantics come from whatever
  leaf backings the project installs (host machine ≠ automatic `lossless`). The Linux systemd
  lane's integration-test debt (`cli-deploy-linux-integration-untested`) becomes a live-probe
  card in this adapter's suite. Owns the `BaremetalCompatibilityCommands` legacy-verb adapter
  (DP-2 §2, SF-9).
- **Permissions:** `--allow-run=servy,systemctl,deno`, filesystem on install base.

## 3. `deploy-deno` (W2 extraction; T1 flagship)

- **Wraps:** the built-in **`deno deploy`** CLI (create/env/database/logs) + the `deno.json`
  `deploy` config section; keeps the unstable-API preflight guard (improving its transitive-graph
  scan is a named follow-up card). Target key stays `deno-deploy`.
- **Ops:** plan (preflight + build config)/up/down/status/logs; `secrets` via
  `deno deploy env` (reference model — values never serialized into artifacts); `rollback` via
  the platform's instant-rollback revision routing. (r3, KF-9) **`emit` is deliberately NOT
  declared**: the platform builds from source (install/build → artifact → warmup), so there is
  no meaningful local artifact materialization — the flagship target showcases the
  declared-subset mechanism. Getting-started flow is `plan → up`; the CI build/deploy split
  (`emit` + `up --prebuilt`) is demonstrated on targets where emission is real (container,
  cloudflare, vercel).
- **Manifest (the honesty showcase; r2, SF-7):** `tier: deno-native`;
  `process: bounded-window`; `@netscript/queue:consume → unsupported` at binding scope (the
  platform has no queues — note points to `externalized` MQ bindings);
  `@netscript/kv:atomic → judged by the leaf's atomic conformance suite` — NetScript's Deno KV
  adapter implements version checks and atomic commit
  (`packages/kv/adapters/deno-kv.adapter.ts:155-194`), so atomicity is NOT downgraded for the
  platform's separate gaps; those gaps are their own refs (`kv:queues → unsupported`,
  `kv:replication-controls → unsupported`); `runtime:cron → lossless` (`Deno.cron()`
  auto-discovered); sagas `externalized` (macro-service split or external transport). Monorepo
  git integration gap noted; local-source deploys (`--source local`) unaffected.
- **Scaffold hooks:** the **recommended first target** (Deno-native-first default), added
  explicitly via `deploy target add deno-deploy` — no target is preinstalled (Story 0 single
  flow, r2 quick win); `deploy-deno-deploy.yml` workflow with `DENO_DEPLOY_TOKEN` (org tokens).
- **Permissions:** `--allow-run=deno`, `--allow-net` (API), `--allow-read`.

## 4. `deploy-container` (W4, NEW) — T1; the L-6 shared path

- **Owns:** OCI image build (`ContainerBuildPort` impl: Dockerfile generation from the
  `EmittedArtifactManifest` — `denoland/deno:2` base per the shipped config defaults — plus
  build/push via `docker`/`podman`), registry auth, and a small **generic container-platform
  port** (`create/deploy service, set env, logs, status, destroy` over REST).
- **Subpath clients:** `./fly` (Machines REST API, OpenAPI; flyctl fallback), `./koyeb`,
  `./sevalla` (managed REST APIs), `./coolify`, `./dokploy` (self-hosted: user-supplied base URL
  + token). Each ~thin JSON client mapping the generic port; one shared conformance run each.
- **Ops:** plan (emit Dockerfile/compose + image build)/up/down/status/logs; `secrets` = env-set
  via platform API (reference model); `rollback` = platform revision/machine-image swap where the
  API offers it, else declared absent.
- **Manifest (r2, SF-7 — composition rule made explicit):** `process: long-lived` containers ⇒
  sagas `supported`; runtime rows from the image contract (`runtime:http-serve`,
  `runtime:long-running-process` lossless). Binding-scope verdicts are **composed by the
  compiler** from the *installed leaf backing manifests* the project selected at scaffold time —
  the container runtime manifest itself claims nothing about queue/KV semantics; "inherited"
  means that composition, not an implicit blanket.
- **This retires** the container half of `cli-deploy-artifacts-missing`: NetScript finally emits
  a Dockerfile — but as adapter output, not scaffold hand-authoring.
- **Permissions:** `--allow-run=docker,podman,flyctl`, `--allow-net` per platform API.

## 5. `deploy-cloudflare` (W5; CF-PROBE-gated) — T2 (Workers), T1 (Containers lane)

- **Wraps:** `wrangler` (npm, invoked as a tool): emits `wrangler.jsonc` (entry, compatibility
  date, bindings blocks) + a **worker entry adapting `ServiceApp.fetch`** (Web-standard, L-4:
  in-process Fetch delegation), then `wrangler deploy` / `wrangler versions`. The Containers
  lane accepts a core-owned `ContainerBuildPort` **by injection** (`deploy-container` supplies
  the implementation at composition time — no adapter-to-adapter import; r2, SF-11) +
  `@cloudflare/containers` wiring.
- **Probe gate (CF-PROBE, before adapter graduation):** build+deploy a NetScript service to a
  live Workers target; measure Miniflare-vs-production fidelity for the dev loop (Miniflare is
  a simulator, not an oracle — adversarial F2); demonstrate static-assets, `nodejs_compat`
  coverage for the service runtime's `node:` touchpoints; document the CI-token story (no OIDC
  yet — a real operational caveat).
- **Ops:** plan (emit config + entry)/up/down (delete)/status/logs (`wrangler tail`); `secrets`
  via `wrangler secret` (reference model); `rollback` via `wrangler versions rollback`.
- **Manifests (r2, SF-7 — two variants, no mode collapse):**
  - `variant: workers` — `tier: web-standard`; `process: isolate`;
    `runtime:long-running-process → unsupported`; sagas `rejected`;
    `@netscript/queue:consume → unsupported` at binding scope in v1 (CF Queues push-consumer
    wiring is leaf territory — a future `@netscript/queue-cf` card, R-GRAPH-4; the binding
    transport still declares the queue by name); `@netscript/kv:atomic → unsupported` (Workers
    KV no-CAS — capability rejection per L-2).
  - `variant: containers` — `tier: deno-native`; `process: long-lived`;
    `runtime:long-running-process → lossless`; sagas `supported`-or-`externalized` per the
    project's leaf backings (container composition rule, §4).
  DO-backed saga/worker stores are explicitly **probe cards owned by the saga/worker leaves**,
  not this adapter. v1 scaffold story uses ONE variant per target (topology cells are
  user-declared — DP-2 §5, SF-8); the second variant is added as a second declared cell/target.
- **Scaffold hooks:** the cloudflare-optimized scaffold story (scaffold-stories §2).
- **Permissions:** `--allow-run=wrangler,npx`, `--allow-net`.

## 6. `deploy-vercel` (W5; probe-gated) — T3 default, T1 opt-in

- **Wraps:** **Build Output API v3** — emit `.vercel/output` (config.json, `functions/*.func`
  with `.vc-config.json`, `static/`) from the `EmittedArtifactManifest`, then
  `vercel deploy --prebuilt`; management via `vercel` CLI/`@vercel/sdk`.
- **Runtime stance:** Node runtime default (fluid compute), honest T3; `vercel-deno` community
  runtime as opt-in flag with a version-lag warning (research §2 risk). The Fetch-handler
  boundary keeps app code identical across stances.
- **Ops:** plan (emit output dir)/up/down/status/logs; `rollback` via deployment aliasing;
  `secrets` via Vercel env API (reference model).
- **Manifest:** `process: bounded-window`; `queue-consume: unsupported` in-adapter (QStash etc.
  are leaf bindings); `kv-atomic`: marketplace-dependent note (Upstash Redis backing is a leaf
  concern); sagas `externalized`; static assets `lossless` (first-class).
- **Probe:** a minimal NetScript service through Build Output → live deploy → conformance HTTP
  suite; validates the `.vc-config.json` emission before the adapter is claimed.

## 7. `deploy-aws` (W5; AWS-PROBE-gated, HTTP scope first) — T1 via containers

- **Wraps (HTTP scope):** **AWS Lambda Web Adapter** as layer/binary in a `denoland/deno`
  container image (image build via an **injected** core-owned `ContainerBuildPort` — r2, SF-11),
  fronted by Function URL/API GW/ALB; Fargate/App Runner lanes via the same injected container
  path. Adversarial F1 stands: **LWA is an HTTP sidecar** — this adapter claims HTTP hosting
  only until the event-semantics probes pass.
- **IaC:** optional `./pulumi` subpath wrapping the **Pulumi Automation API** (Apache-2.0,
  inline programs, no Pulumi Cloud) for users who want provisioned infra; plain
  image+existing-infra deploys need no IaC dependency. Serverless Framework v4 excluded
  (licensing). SST ion = reference only.
- **Ops:** plan (emit image + optional IaC program)/up/down/status/logs (CloudWatch);
  `secrets` via SSM/Secrets Manager references; `rollback` via Lambda versions/App Runner
  revisions.
- **Manifests (r2, SF-7 — two variants):**
  - `variant: lambda` — `process: bounded-window`; HTTP rows only in v1; sagas `externalized`;
    `@netscript/queue:consume → unverified` at binding scope with note "SQS backing is
    `@netscript/queue` leaf territory (`ReportBatchItemFailures`, per-record ack, visibility
    timeout — see AWS-PROBE-EVENTS card)".
  - `variant: fargate` — `process: long-lived`; sagas `supported` per leaf backings; same image.
  v1 story uses one variant; the second is a second declared cell (DP-2 §5). CI auth: GitHub
  OIDC → `AssumeRoleWithWebIdentity` (no static keys) — scaffold emits the role-trust snippet.
- **Probe gates:** AWS-PROBE-HTTP (live LWA conformance) before shipping; AWS-PROBE-EVENTS
  (SQS conformance design + live probe, leaf-owned) before any event claims.

## 8. Explicit non-cards

- **Desktop packaging** (dmg/appimage/deb/msi + release channels) stays outside this family —
  epic #830 desktop-graph owns it; the migration map only names the boundary.
- **`@netscript/kv-cloudflare`, `@netscript/queue-sqs`, DO saga stores** — leaf-owned provider
  backings (R-GRAPH-4). The scaffold stories *select* them when they exist; this family never
  ships them.
- **Netlify, Railway, Render, GCP-direct**: not designed; the registry is open — community
  adapters implement the core port. cloud-run's current gcloud lane folds into
  `deploy-container` + a `./cloudrun` client if demand holds (micro-decision left to W4).
- **Nitro emitter**: no package. DP-5 records the conditional re-entry path.
