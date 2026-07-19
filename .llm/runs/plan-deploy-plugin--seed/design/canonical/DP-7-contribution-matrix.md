# DP-7 — Contribution matrix: what the deploy plugin contributes at every layer

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.
> The owner's point 3 made concrete: "the plugin allows us to contribute to every layer."

## 1. The matrix

| Layer | Contribution (mechanism) | Cloud-agnostic core part | Provider-optimized part |
| --- | --- | --- | --- |
| **CLI** | `cli-command` axis (DP-4 §5): the `deploy` group; `deploy target add/remove`, `deploy capabilities --json`, eight-op target verbs; doctor check `deploy-target` | Verb grammar, registry routing, capability rendering | Each adapter surfaces its target key + config member; doctor validates its tool/credential prerequisites |
| **Services runtime** | None resident in v1 (OF-4). Lifecycle contract only: artifacts drive services through `ServiceShutdownCoordinator` (L-5) | Hostable build/start/stop semantics identical across targets | Entry emission differs per target (deno process, worker entry, LWA container) but never changes app code |
| **Scaffolding** | Plugin scaffolder (DP-4 §4): userland `deploy/targets.ts` leaf + per-target assets on `target add`; provider-optimized project templates (DP-8) | The leaf file, the logical graph (appsettings) untouched by target choice | wrangler.jsonc / fly.toml / `.vercel` config / workflows / OIDC snippets; leaf-backing selection (below) |
| **Config** | `deploy.*` schema (base in core, members with adapters); environments overlay; runtime-config topic `deploy` (freeze/pause flags) | Base shape + conventions sub-blocks | Target member schemas spread the base + vendor fields only (R-DEPLOY-4) |
| **Database** | None (no `.prisma`) — deploy holds no server-side state in v1; deployment history rides the stream, not a schema | — | — |
| **Streams** | `deploy-events` durable stream (versioned envelope: started/succeeded/failed/rolled-back, artifact digest, actor, trace ctx) | Envelope schema, producer, redaction | Target key + environment dimensions in every event |
| **Telemetry** | Span vocabulary for plan/up/rollback; secrets redaction at the seam | Naming + redaction rules | Provider call spans (wrangler/aspire/deno-deploy invocations) |
| **Contracts** | v1: none (no HTTP service). The machine-readable surface is the published `DeployCapabilityManifest` schema + `--json` CLI output | Manifest schema | Each adapter's authored manifest |
| **E2E / testing** | `scaffold.runtime` deploy case; the shared conformance suite (DP-3 §0) in core `./testing` + per-adapter live probes | Suite harness, in-memory target | Live-probe lanes per platform |
| **Docs** | Target-matrix reference + per-target how-tos replacing the "alpha-minimal" page (M-18) | Concepts: targets, capabilities, tiers | One how-to per adapter with its honest caveats (manifest notes rendered) |
| **Frontend (forward)** | When the `frontend` axis lands (parallel seed run): deploy status/history panel fed by `deploy-events` | Panel consumes the stream schema | Per-target status detail |

## 2. Leaf-backing selection — how scaffolds get provider-first seams

The deploy plugin **selects but never owns** leaf backings (R-GRAPH-4). At `target add <key>`
(or provider-optimized `init`), the scaffolder:

1. Reads the project's logical graph (appsettings resources: kv, queue, db, cache…).
2. Consults the target's **backing catalog** — a declarative table shipped by the adapter naming,
   for each `LeafBindingKind`, the recommended provider backing *package* (a leaf-owned adapter,
   e.g. `@netscript/kv-cloudflare`) or an `external` strategy, with its capability caveats.
3. Emits config + env wiring for the chosen backings and runs the **capability compiler** so an
   impossible combination fails at scaffold time, not deploy time (L-3). (r2, SF-10) Backing
   config members parse through the **two-phase loader** (DP-2 §6) — the catalog mechanism
   depends on that slice, not on a loader seam that does not exist yet.

Catalog sketches (each row exists only when the leaf-owned adapter exists — otherwise the
catalog row says `external` and the scaffold wires a URL-based binding):

| Kind | Cloudflare-optimized | AWS-optimized | Vercel-optimized | Deno-native default |
| --- | --- | --- | --- | --- |
| kv | Workers KV (no-CAS caveat → capability-scoped) or DO-SQLite (probe) | DynamoDB | Upstash Redis (marketplace) | Deno KV / Redis |
| queue | CF Queues (leaf probe card) | SQS (leaf probe card) | QStash (leaf card) | external MQ (platform has none) |
| database | D1 / Hyperdrive→Postgres | RDS/Aurora | Neon (marketplace) | Prisma Postgres / linked PG |
| cache | Workers Cache | ElastiCache | — (CDN layer) | Redis/Garnet |
| sagas | `rejected` on Workers; Containers lane or DO-store probe | `externalized`/Fargate `supported` | `externalized` | `externalized`; baremetal/aspire `supported` |

This is the "defeats cloud-agnosticism yet makes it credible" mechanism: the **ports and the app
model never change**; the scaffold's provider-first choices are explicit, capability-checked, and
reversible (swap the backing package + config; the logical graph is untouched).

## 3. Credibility invariants

1. (r2, SF-16 — scoped to be enforceable) A provider-optimized scaffold **must not** fork app
   code per provider **within the declared runtime profile**: the canonical fixture, constrained
   to its profile (`deno-native` / `web-standard` / `node-compat`), uses the same domain/service
   source across targets; only generated entry modules, config, bindings, emitted artifacts,
   workflows, and backing packages differ (L-4 one-graph rule). For arbitrary projects, `plan`
   performs dependency/API compatibility analysis and rejects unsupported runtime touchpoints
   (`Deno.*` on an isolate target, native addons, fs/process APIs) with file-level diagnostics —
   a generated Fetch entry adapts the framework boundary, it does not make arbitrary code
   portable.
2. Every optimization is **capability-manifest-visible** — `deploy capabilities` shows exactly
   what the chosen target/backings support, with notes (backend-truthful, auth-S1).
3. Anything the catalog cannot honestly back is scaffolded as `external` with a named env
   contract — never a lowest-common-denominator shim (adversarial F3 honored at scaffold time).
4. Switching targets is additive: `deploy target add aws` beside `cloudflare` composes; the
   compiler reports per-target verdicts independently (multi-target registry, DP-2 §6).
