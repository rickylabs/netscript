# Provider deploy-surface research (live, 2026-07-18)

Source: Opus 4.8 web-research sub-agent of this run, 2026-07-18, primary sources only (official
docs/repos), URLs inline. Frame: "Deno-native first, then Node compat where needed"; wrap
well-maintained standard packages/APIs (doctrine A7), implement the rest.

## 1. Cloudflare

- **Mechanism:** Workers on **workerd** (V8 isolates — not a Node or Deno process). Deploy via
  `wrangler deploy` driven by `wrangler.jsonc`/`wrangler.toml` (entry `main`,
  `compatibility_date`, resource bindings) — https://developers.cloudflare.com/workers/wrangler/configuration/.
  Static assets via Workers Static Assets (`assets` binding) or Pages. OS-level workloads via
  **Cloudflare Containers** (Docker image alongside a Worker).
- **Wrap surface:** npm `wrangler` CLI (`deploy`, `versions`, `containers`, KV/R2/D1/Queues/
  Secrets management) — https://developers.cloudflare.com/workers/wrangler/commands/general/#deploy;
  Cloudflare REST API (`api.cloudflare.com`) for direct script upload; npm
  `@cloudflare/containers` — https://developers.cloudflare.com/containers/; CI action
  `cloudflare/wrangler-action` — https://github.com/cloudflare/wrangler-action.
- **Deno support:** none natively. "Deno-native first" on Workers = Web-platform-standard code
  (fetch handler, Request/Response, Web Streams, crypto) running unmodified on both; `node:`
  built-ins via the `nodejs_compat` flag (steadily improved through 2025) —
  https://developers.cloudflare.com/workers/runtime-apis/nodejs/,
  https://blog.cloudflare.com/nodejs-workers-2025/. True Deno runtime ⇒ Containers with a
  `denoland/deno` image.
- **Primitives for an optimized scaffold:** Durable Objects (incl. SQLite-backed), KV, Queues,
  R2, D1, Hyperdrive, Workers AI, Vectorize, Workflows; Workers for Platforms (dispatch
  namespaces) for multi-tenant. Containers: `containers[]` + DO binding + migrations; each
  instance backed by a DO sidecar — https://developers.cloudflare.com/durable-objects/api/container/.
  Containers public beta since late June 2025, Workers Paid —
  https://blog.cloudflare.com/containers-are-available-in-public-beta-for-simple-global-and-programmable/,
  https://developers.cloudflare.com/containers/pricing/.
- **CI auth:** API token + account ID as CI secrets —
  https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/. **No native
  OIDC/trusted publishing for wrangler yet** (open request:
  https://github.com/cloudflare/workers-sdk/discussions/11434).

## 2. Vercel

- **Mechanism:** `vercel` CLI (`build`/`deploy`), Git integration, and — the framework seam —
  **Build Output API v3**: emit `.vercel/output` (`config.json`, `functions/*.func` with
  `.vc-config.json`, `static/`) fully describing a deployment ("framework-defined
  infrastructure") — https://vercel.com/docs/build-output-api,
  https://vercel.com/docs/build-output-api/configuration. NetScript can emit the dir and run
  `vercel deploy --prebuilt`.
- **Wrap surface:** npm `vercel` CLI; Vercel REST API + typed `@vercel/sdk` —
  https://vercel.com/docs/rest-api/sdk; reference examples
  https://github.com/vercel/examples/tree/main/build-output-api.
- **Deno support:** not an official runtime. Official runtimes: Node.js, Bun (since 2025),
  Python/Go/Ruby — https://vercel.com/docs/functions/runtimes,
  https://vercel.com/blog/bun-runtime-on-vercel-functions. Community `vercel-deno`
  (`vercel-community/deno`, MIT): per-function `"runtime": "vercel-deno@3.2.0"` in
  `vercel.json`; latest tagged release 3.1.1 (Jul 2024), a 3.2.0 commit Jan 2026 — community-
  owned, version-lag risk — https://github.com/vercel-community/deno.
- **Primitives:** Vercel Functions on fluid compute (2025 default; in-function concurrency,
  active-CPU pricing) + Edge Functions. Storage is Marketplace-model: Vercel Blob + Edge Config
  native; **KV = Upstash Redis**, **Postgres = Neon** (native Vercel Postgres sunset June 2025) —
  https://vercel.com/docs/storage, https://vercel.com/marketplace/upstash. Queues via Upstash
  QStash (Vercel Queues beta).
- **CI auth:** `VERCEL_TOKEN`; Vercel Functions can mint OIDC tokens toward AWS/GCP.

## 3. AWS

- **Mechanisms for Deno apps:** (1) Lambda container images / custom runtime
  (`denoland/deno-lambda` — https://hub.docker.com/r/denoland/deno-lambda,
  https://docs.deno.com/examples/aws_lambda_tutorial/); (2) **Lambda Web Adapter** (LWA,
  `aws/aws-lambda-web-adapter`, AWS-official, ~2.7k stars, active through Feb 2026): any HTTP/1.1
  server (incl. `Deno.serve`) runs unchanged; same image runs on EC2/Fargate/local; Function
  URLs/API GW/ALB; response streaming; readiness via `AWS_LWA_*`; ships as layer or copied
  binary — https://github.com/aws/aws-lambda-web-adapter; (3) containers on ECS/Fargate or App
  Runner for always-on — https://docs.deno.com/runtime/deploy/.
  (Prior-run adversarial F1 stands: LWA is an HTTP sidecar; it does NOT provide SQS/event
  semantics.)
- **IaC wrap candidates:** **Pulumi Automation API** (Apache-2.0; embed IaC programmatically,
  inline programs, no CLI/no Pulumi Cloud account) —
  https://www.pulumi.com/docs/iac/concepts/automation-api/; SST v3/ion (MIT, Pulumi+Terraform
  under the hood, components tied to SST's runtime — reference not dependency;
  https://sst.dev/docs/, https://github.com/pulumi/pulumi-cdk/issues/64); AWS CDK /
  CloudFormation/SAM (first-party, Node-heavy); OpenTofu (MPL-2.0).
- **Deno support:** no managed Deno runtime; custom runtime or container image — a
  container/adapter story.
- **Scaffold seams:** SQS, EventBridge, DynamoDB, ElastiCache (Redis/Valkey), S3 via
  `npm:@aws-sdk/*` or IaC provisioning.
- **CI auth:** GitHub Actions OIDC → `sts:AssumeRoleWithWebIdentity`
  (`aws-actions/configure-aws-credentials`); long-lived keys legacy.

## 4. Fly.io

- **Mechanism:** `fly deploy` (flyctl) builds a Docker image and boots **Fly Machines**
  (Firecracker microVMs) per local `fly.toml` — https://fly.io/docs/launch/deploy/,
  https://fly.io/docs/reference/configuration/.
- **Wrap surface:** flyctl; **Machines REST API** (OpenAPI 3.0, docs.machines.dev) — Machines,
  Apps, Volumes, Certificates, Tokens (OIDC) — https://fly.io/docs/machines/api/. `fly.toml`
  optional when driving the Machines API directly. Machines boot ~300ms.
- **Deno support:** container-based; official Deno guide — `fly launch` auto-generates a
  Dockerfile — https://fly.io/docs/js/frameworks/deno/.
- **Primitives:** Fly Managed Postgres, Upstash Redis, Fly Volumes, Tigris object storage,
  LiteFS. (Deno-KV/LiteFS blueprint retired Oct 2024 —
  https://fly.io/docs/blueprints/deno-kv-litefs/.)
- **CI auth:** `FLY_API_TOKEN` (deploy tokens); Machines API Tokens resource can mint OIDC.

## 5. Deno Deploy (new, console.deno.com)

- Complete rework on a Deno 2.0 execution environment; new dashboard console.deno.com; Deno AND
  Node apps (Next/Astro/SvelteKit first-class) — https://docs.deno.com/deploy/. **Classic
  (dash.deno.com) + subhosting v1 shut down 2026-07-20.**
- **CLI:** `deno deploy` built into the runtime (`deploy create` interactive AND fully-flagged
  for CI: `--source github|local`, `--framework-preset`, `--runtime-mode dynamic|static`,
  `--region us|eu|global`); manages env vars, databases (`database provision --kind
  denokv|prisma`, `database link`), logs, sandboxes, cloud connections —
  https://docs.deno.com/runtime/reference/cli/deploy/. App config via a `deploy` section in
  `deno.json` (Jan 2026) — https://docs.deno.com/deploy/changelog/. Terraform provider exists
  for subhosting.
- **Capabilities:** Deno KV supported since Aug 2025 (`Deno.openKv()`), **but KV queues,
  read-replication, backups, primary-region selection NOT available**; Postgres external-link or
  provisioned Prisma Postgres (per-timeline isolated schemas); `Deno.cron()` auto-discovered
  (Mar 2026); **Queues NOT supported** (explicit ❌ vs Classic); OpenTelemetry export; OIDC
  tokens (`@deno/oidc` on JSR); Cloud Connections (AWS/GCP without static creds); Deno Sandbox;
  static sites; instant rollback; 2 regions (us/eu + global); self-hostable regions —
  https://docs.deno.com/deploy/, https://docs.deno.com/deploy/changelog/.
- **CI auth:** `DENO_DEPLOY_TOKEN` (user or org tokens, Dec 2025).

## 6. Thin targets — Koyeb, Sevalla, Coolify, Dokploy

All four are "Dockerfile/image (or Git repo) + env vars" platforms ⇒ **one shared
container-deploy path serves all four**, differing only in API client + resource mapping.
Managed: **Koyeb** (REST API https://www.koyeb.com/docs/reference/api + CLI; containers/git/
functions as serverless containers), **Sevalla** (Kinsta PaaS on K8s + Cloudflare edge; REST API
v3 + deploy hooks — https://docs.sevalla.com/sevalla-api/overview,
https://api-docs.sevalla.com/). Self-hosted OSS (user supplies base URL + token): **Coolify**
(REST API, Bearer token — https://coolify.io/docs/api-reference/authorization), **Dokploy**
(REST API + CLI — https://docs.dokploy.com/docs/api).

## 7. Nitro v3 (wrap/integration candidate only)

- Preset system: provider-specific output from one codebase; presets via
  `NITRO_PRESET`/config/`--preset`; zero-config CI auto-detect (cloudflare, vercel, netlify,
  aws-amplify, azure, firebase, stormkit, zeabur); compatibility dates —
  https://nitro.build/deploy.
- **Not cleanly consumable by a non-Nitro build:** presets are coupled to Nitro's rollup build
  pipeline (a preset = output format/entry/rollup config), not a standalone library. The
  reusable value is the **knowledge** encoded per preset (how to emit `.vercel/output`, a
  `_worker.js`, etc.) — reimplement, don't import.
- Deno preset: `deno_server` "build[s] your Nitro server using Node.js to run within Deno
  Runtime" — https://nitro.build/deploy/runtimes/deno — Node-compat-oriented, at odds with
  Deno-native-first. License MIT (UnJS) — studying/vendoring preset logic is unencumbered.

## 8. Cross-cutting

No single library spans all targets. **Pulumi Automation API** is the strongest embeddable IaC
candidate (AWS lane). **Serverless Framework v4 is disqualified**: login + license key required,
paid for orgs >$2M revenue (v3 EOL 2024) —
https://forum.serverless.com/t/login-and-license-key-required-for-serverless-v4/20300,
https://github.com/brefphp/bref/issues/1749. OpenTofu (MPL-2.0) if a Terraform-shaped engine is
ever needed. SST ion = AWS reference, not dependency.

## Wrap-vs-implement recommendation table

| Target | Wrap candidate | Quality/risk | Recommendation |
|---|---|---|---|
| deploy-core | — | n/a | Implement ourselves (thin orchestration over adapters) |
| Cloudflare Workers | `wrangler` CLI + `wrangler.jsonc`; CF REST API | First-party, excellent; workerd ≠ Deno | Wrap wrangler; emit wrangler config + Web-standard handler; `nodejs_compat` for node: |
| Cloudflare (true Deno) | `@cloudflare/containers` + `denoland/deno` image | Public beta Jun 2025, Paid plan, DO-backed | Wrap Containers (shares container core) |
| Vercel | Build Output API v3 + `vercel` CLI / `@vercel/sdk` | First-party, stable, made for frameworks | Wrap Build Output API (`.vercel/output` → `vercel deploy --prebuilt`) |
| Vercel (Deno runtime) | `vercel-deno` (MIT, community) | Version-lag risk, no SLA | Optional opt-in; default Node runtime |
| AWS (server app) | AWS Lambda Web Adapter + container image | AWS-official, active; HTTP only (F1) | Wrap LWA as primary Deno-on-Lambda HTTP path |
| AWS (IaC/primitives) | Pulumi Automation API (Apache-2.0) | Strong, embeddable, no account | Wrap for IaC; SST ion as reference |
| AWS (serverless fw) | Serverless Framework v4 | License-gated, paid tier | Do NOT wrap |
| Fly.io | Machines REST API + flyctl | First-party, clean REST, OIDC | Wrap Machines API (flyctl fallback); shares container core |
| Deno Deploy (new) | `deno deploy` CLI + `deno.json` deploy config | First-party, native, best Deno fit; no queues, KV limited | Wrap — the Deno-native-first default |
| Koyeb / Sevalla / Coolify / Dokploy | Each platform's REST API | First-party APIs; self-hosted need URL+token | Wrap via shared container-deploy core |
| Nitro v3 presets | Nitro build (MIT) | Coupled to rollup build; Deno preset is Node-built | Implement ourselves; study presets as reference |

**Net architectural read:** thin PaaS targets (koyeb/sevalla/coolify/dokploy) + Fly +
CF-Containers collapse onto one `deploy-container` path (build image → push → platform API →
env). The genuinely bespoke adapters are the three framework-defined-infrastructure platforms —
Cloudflare Workers (wrangler + bindings), Vercel (Build Output API), Deno Deploy (`deno deploy`) —
each rewarding a purpose-built wrapper. Deno Deploy is the Deno-native-first default;
AWS/CF-Workers/Vercel are the Node-compat/Web-standard tier. Only cross-cutting dependency worth
taking: Pulumi Automation API (AWS IaC). Serverless v4 disqualified on licensing.
