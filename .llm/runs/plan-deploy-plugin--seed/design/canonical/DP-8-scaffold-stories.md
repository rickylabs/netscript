# DP-8 — Scaffold stories: provider-optimized projects, walked end to end

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.
> Each story names: the command, what lands on disk, the leaf backings chosen (DP-7 §2), the dev
> loop, the deploy path, and the honest caveats the capability manifest will render. App code is
> identical across all four stories (L-4; DP-7 §3 invariant 1).

## Story 0 — The Deno-native default (baseline every story diffs against)

```
netscript init my-app            # deploy plugin preinstalled from W3
netscript deploy target add deno-deploy
```

- **Lands:** `deploy/targets.ts` (user-owned leaf: `defineDeployTargets({ 'deno-deploy': {...} })`),
  `deploy.targets.deno-deploy` config member, `.github/workflows/deploy-deno-deploy.yml`
  (`DENO_DEPLOY_TOKEN` org token), `deno.json` `deploy` section.
- **Backings:** db → Prisma Postgres or linked PG; kv → Deno KV (partial: no queues/replication
  controls); queue → **external MQ env contract** (platform has none — compiler note);
  cron → `Deno.cron()` lossless.
- **Dev loop:** `aspire start` unchanged (M-13). **Deploy:** `netscript deploy deno-deploy plan`
  (preflight + capability verdict) → `up`. Rollback: platform instant revision routing.
- **Caveats rendered:** sagas `externalized`; queue `unsupported` in-platform; monorepo git
  integration gap (local-source deploys unaffected).

## Story 1 — Cloudflare-optimized (`netscript init my-app --deploy cloudflare`)

- **Lands:** everything in Story 0's shape plus `wrangler.jsonc` (entry, `compatibility_date`,
  bindings blocks generated from the logical graph), a generated worker entry adapting
  `ServiceApp.fetch` (T2 Web-standard), `deploy/targets.ts` with the `cloudflare` member,
  workflow using `cloudflare/wrangler-action` (API token + account ID secrets — no OIDC on CF
  yet, scaffold README says so).
- **Backings (catalog):** kv → Workers KV via `@netscript/kv-cloudflare` *when it exists*
  (capability-scoped: `kv-atomic: unsupported`, CAS-dependent consumers rejected at build);
  queue → CF Queues binding declared by name, consumption gated on the leaf probe card
  (`@netscript/queue-cf`); db → D1 or Hyperdrive→Postgres; static assets → Workers Static
  Assets (lossless).
- **Compute split:** HTTP + stateless services → Workers; anything requiring
  `long-running-process` (sagas `supported`, exclusive DB writer, owned queue `listen()` loops)
  → **Containers lane** (same image as Story 3's container path) — the compiler proposes the
  macro-service split rather than silently degrading (L-3, sagas law).
- **Dev loop:** `aspire start` for the graph + `wrangler dev` for worker-path fidelity, with the
  documented Miniflare caveat (simulator, not oracle — remote-binding smoke advised before
  first deploy; CF-PROBE evidence backs the wording).
- **Deploy:** `deploy cloudflare plan` (emit config+entry, compile verdict) → `up`
  (`wrangler deploy`); rollback `wrangler versions rollback`; secrets `wrangler secret`
  references.

## Story 2 — AWS-optimized (`--deploy aws`)

- **Lands:** Dockerfile emitted by `deploy-container` (denoland/deno base + Lambda Web Adapter
  layer/binary), `deploy/targets.ts` `aws` member (region, function/service names, or
  `pulumi: true` for the IaC subpath), workflow with **GitHub OIDC → AssumeRoleWithWebIdentity**
  (role-trust snippet emitted; no static keys).
- **Backings:** queue → SQS **by name** (consumption via `@netscript/queue-sqs` leaf card once
  proven — AWS-PROBE-EVENTS; until then `external` contract); kv → DynamoDB leaf card;
  cache → ElastiCache endpoint env; db → RDS/Aurora URL.
- **Compute:** HTTP → Lambda (LWA container, Function URL/API GW); long-lived (sagas
  `supported`) → Fargate service from the same image — the image portability is the point
  (research §3).
- **Deploy:** `deploy aws plan` (image + optional Pulumi inline-program preview) → `up`;
  rollback via Lambda versions / service revisions; secrets via SSM/Secrets Manager references.
- **Caveats rendered:** event/queue semantics not claimed until the leaf probe passes
  (adversarial F1 wording in the manifest note).

## Story 3 — Container/PaaS (`--deploy fly` | `koyeb` | `sevalla` | `coolify` | `dokploy`)

- **Lands:** generated Dockerfile (+ compose for local parity), `deploy/targets.ts` member with
  the platform client selection (self-hosted platforms: base URL + token env names), workflow
  calling `deploy <key> up`.
- **Backings:** whatever the image runs — the Deno-native defaults (Story 0's leaf set) apply
  unchanged; platform add-ons (Fly Postgres/Upstash) offered as catalog rows.
- **Sagas `supported`** (long-lived containers) — this lane is the "everything just works" tier
  and the recommended default for stateful apps.
- **Deploy:** `plan` (image build) → `up` (push + platform API create/deploy); rollback via
  platform revision/machine swap where offered.

## Story 4 — Vercel-optimized (`--deploy vercel`)

- **Lands:** `.vercel/output` emission wired into `plan` (config.json, `functions/*.func` with
  `.vc-config.json`, `static/`), `deploy/targets.ts` `vercel` member (`runtime: 'node' |
  'vercel-deno'` — Node default, T3 honest; `vercel-deno` opt-in with version-lag warning),
  workflow with `VERCEL_TOKEN`.
- **Backings:** kv → Upstash Redis (marketplace) leaf card; queue → QStash card or `external`;
  db → Neon; static assets lossless (first-class).
- **Deploy:** `deploy vercel plan` (emit output dir + verdict) → `up`
  (`vercel deploy --prebuilt`); rollback via deployment aliasing.
- **Caveats rendered:** sagas `externalized`; `bounded-window` process; Deno runtime is
  community-maintained when opted in.

## Cross-story acceptance (feeds the board's scaffold issue)

- gate: the same app source tree scaffolds and passes `deploy <target> plan` for every story
  with zero app-code diffs (only `deploy/`, config, emitted artifacts, workflows differ).
- gate: every story's first `plan` runs the capability compiler and renders the target's honest
  caveats; an app requiring an `unsupported` capability fails scaffold-time selection with the
  macro-service or external-binding proposal.
- gate: golden tests cover every emitted artifact per story; emitted workflows reference only
  documented secrets/OIDC contracts.
- gate: `scaffold.runtime` E2E covers Story 0 end-to-end; Stories 1–4 covered by emission golden
  tests + their adapter live probes (full live E2E per cloud is the adapter card's probe, not
  the scaffold suite's job).
