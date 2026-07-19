# DP-1 — Family architecture: packages, dependency graph, archetypes

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.

This document is the explicit package/import graph the prior run's adversarial F5 demanded before
any deploy core could be accepted ("`@netscript/deploy` is specified as both a neutral core and a
cross-domain composition god-object … require an explicit package/import graph and
adapter-registration ownership", `adversarial-nitro-vs-own.md:35-41`).

## 1. The family

| Package | Dir | Archetype | Role |
| --- | --- | --- | --- |
| `@netscript/plugin-deploy` | `plugins/deploy/` | **A5** thin plugin | Delivery shell: manifest + contributions (CLI, scaffold, streams, telemetry, doctor), composition root, re-exports |
| `@netscript/plugin-deploy-core` | `packages/plugin-deploy-core/` | **A2** integration core | Ports (eight-op target port, emitter port, container-build port), **empty** duplicate-rejecting target registry, structural capability + topology contracts + rejection compiler, shared pure conventions (activation/secrets/otel/rollback/health), deploy config schema base + two-phase schema registry, testing fakes (adapter-neutral compile emitter graduates here from `deploy-baremetal` once fs/process/output/config ports exist — r2, SF-1/SF-2) |
| `@netscript/deploy-aspire` | `packages/deploy-aspire/` | **A2** adapter | Wraps the `aspire` CLI (`publish`/`deploy`/`destroy`): compose, docker, kubernetes, azure-aca, azure-app-service, azure-aks lanes (extraction of the shipped Aspire target adapters) |
| `@netscript/deploy-baremetal` | `packages/deploy-baremetal/` | **A2** adapter | OS-service lane: Windows (Servy) + Linux (systemd) install/lifecycle (extraction of the shipped service targets) |
| `@netscript/deploy-deno` | `packages/deploy-deno/` | **A2** adapter | Deno Deploy (new platform): wraps the built-in `deno deploy` CLI + `deno.json` deploy config. **T1 flagship.** |
| `@netscript/deploy-container` | `packages/deploy-container/` | **A2** adapter (+subpaths) | Shared OCI path: image build/push + generic container-platform port; thin platform clients as subpaths `./fly`, `./koyeb`, `./sevalla`, `./coolify`, `./dokploy` (+ backs CF Containers and cloud-run) |
| `@netscript/deploy-cloudflare` | `packages/deploy-cloudflare/` | **A2** adapter | Workers lane: wraps `wrangler` (config emission + deploy) with Web-standard worker entry over `ServiceApp.fetch`; Containers lane delegates to `deploy-container`. **Probe-gated (CF-PROBE).** |
| `@netscript/deploy-vercel` | `packages/deploy-vercel/` | **A2** adapter | Build Output API v3 emitter (`.vercel/output` → `vercel deploy --prebuilt`); Node runtime default, `vercel-deno` opt-in. **Probe-gated.** |
| `@netscript/deploy-aws` | `packages/deploy-aws/` | **A2** adapter | HTTP path: Lambda Web Adapter container (shares `deploy-container` build); Fargate/App Runner via container path; optional `./pulumi` subpath (Automation API) for IaC. **Probe-gated (AWS-PROBE); HTTP-scope only until the event-semantics probe passes.** |

Naming decisions (owner fork OF-1 records the alternative):

- Core keeps the `plugin-` prefix — `@netscript/plugin-deploy-core` — for exact auth parity
  (`plugin-auth-core`). The kickoff's shorthand "deploy-core" names the same package.
- Adapters drop the prefix (`@netscript/deploy-<provider>`), exactly as `auth-workos` does
  (`research/auth-composition-anatomy.md` §7).
- Plugin dir is the bare canonical name `plugins/deploy` (`officialSource.canonicalName:
  "deploy"`).
- `@netscript/deploy-deno` (not `deploy-deno-deploy`); its registry/target key stays the shipped
  `deno-deploy` for config back-compat.
- Thin PaaS platforms are **subpaths of `deploy-container`**, not packages (owner fork OF-2):
  they are tiny REST clients with no heavy SDKs; A9 says pick the smallest structure and fold
  smaller into larger; five extra JSR packages would multiply publish surface for ~100-line
  clients. (r2 quick win) A platform graduates to its own package when it gains a real SDK
  dependency or its own scaffold story — **or** when its auth model, lifecycle/error semantics,
  release cadence, or live-gate ownership diverges from the shared container path.

## 2. The dependency graph (the F5 answer)

```
                    @netscript/service (Fetch handler, shutdown coordinator)
                    @netscript/config (project-level loader seam)
                    leaf cores: kv, queue, database, plugin-{workers,sagas,triggers,streams}-core
                          ▲
                          │  (NO import edge — leaves contribute namespaced capability
                          │   descriptors through core's structural contracts; r2, SF-6)
        ┌─────────────────┴───────────────┐
        │   @netscript/plugin-deploy-core │   ◄── @netscript/plugin (base seams)
        └─────────────────▲───────────────┘
                          │ implements ports, registers into registry
   ┌──────────┬───────────┼────────────┬─────────────┬────────────┐
   │deploy-   │deploy-    │deploy-     │deploy-      │deploy-     │deploy-
   │aspire    │baremetal  │deno        │container    │cloudflare  │vercel / aws
   └──────────┴───────────┴────────────┴─────────────┴────────────┘
        (no deploy-* imports another deploy-*; cloudflare/aws receive a core-owned
         ContainerBuildPort by injection — deploy-container supplies the implementation
         at composition time)
                          ▲
                          │ composes RESOLVED adapter descriptors (dynamic loaders),
                          │ builds registry, wires config — depends on core only
              @netscript/plugin-deploy  (plugins/deploy)
                          ▲
                          │ mounts CLI contribution, install/doctor, scaffold
              @netscript/cli  (thin A6 router; presentation only)
```

Rules that keep it acyclic and non-god:

- **R-GRAPH-1 — core imports no leaf package.** (r2, SF-6) `plugin-deploy-core` owns only
  *structural* capability/binding contracts (`CapabilityRef`, `BindingRequirement`,
  `WorkloadConstraint` — DP-2 §4) plus a small well-known runtime-trait vocabulary; leaf packages
  contribute namespaced capability descriptors **through those structural contracts**, so core
  never imports a leaf package, a leaf implementation, or a provider SDK. Enforced by
  import-graph gate (F-DEPLOY-2 extension; see DP-2 §7).
- **R-GRAPH-2 — adapters depend on core + their one provider surface, and never on each other.**
  (r2, SF-11) An adapter imports `plugin-deploy-core` ports plus its wrapped upstream (wrangler,
  `@vercel/sdk`, Machines API client, aspire CLI shell). **No `deploy-*` package imports another
  `deploy-*` package** — an explicit import-graph gate. The L-6 shared container path composes by
  injection: `deploy-cloudflare` (Containers lane) and `deploy-aws` (image lane) accept a
  core-owned `ContainerBuildPort` in their factories, and the composition root injects
  `deploy-container`'s implementation.
- **R-GRAPH-3 — the plugin composes descriptors; nothing depends on the plugin.** (r2, SF-12)
  `plugins/deploy` depends only on core. Adapters reach the runtime as
  `DeployTargetContribution` descriptors (`{key, targetLoader, schemaLoader, permissions}` —
  DP-4 §3) written by `deploy target add` into the generated project registry; the plugin's
  composition root resolves those loaders and populates the duplicate-rejecting registry
  (AP-24 avoidance). The plugin never statically imports the official adapter set.
- **R-GRAPH-4 — leaf provider backings live with the leaves.** A Cloudflare KV backing for
  `KvStore`, an SQS backing for `MessageQueue`, a DO-backed saga store — these are **leaf-domain
  adapter packages** (e.g. future `@netscript/kv-cloudflare`, `@netscript/queue-sqs`), owned and
  gated by the leaf, never by the deploy family. Deploy adapters only *declare and transport
  bindings by name* (DP-2 §4) and *select* leaf backings at scaffold time (contribution matrix).
  This is the precise line that makes deploy-core not a god-object: **deploy owns placement,
  artifacts, and lifecycle; leaves own semantics.**
- **R-GRAPH-5 — CLI is presentation.** `packages/cli` keeps only the A6 thin router
  (`deploy <target> <op>` parse/route) delegating to core + registry; during wave 3 the group
  itself becomes a plugin-contributed mount (DP-4). No business logic remains in the CLI
  (F-DEPLOY-2).

## 3. Archetype + gate mapping

| Package | Archetype | Gate set (from `archetype-gate-matrix.md`) | Notes |
| --- | --- | --- | --- |
| plugin-deploy | A5 | F-1, F-3, F-5–F-12, F-13-subtype, F-14–F-19 + runtime/Aspire + consumer-import + R-PLUGIN-PARITY checklist | `verify-plugin.ts`, golden scaffold tests, `plugin doctor`, `scaffold.runtime` case |
| plugin-deploy-core | A2 | Full F-1…F-19 + F-DEPLOY-1/2 (flip `reviewed`→`gated`) | oRPC not used ⇒ no slow-type exception needed unless a contract lands (DP-4) |
| each adapter | A2 | Full F-1…F-19; runtime validation required when exercised against a real backend | Wrap-target permission READMEs (F-9/AP-19) |
| composite | A7 | Union A2(core) + A6(router) + F-DEPLOY-1 (uniform eight-op or declared subset) + F-DEPLOY-2 (no target logic in command surface) | The family as a whole is doctrine's Archetype 7, delivered through A5 |

The doctrine tension named in `research/doctrine-constraints.md` (A7 composite vs A5 delivery)
resolves cleanly: **A7 describes the core+router shape; A5 describes the delivery vehicle.** Both
laws point the same direction — conventions in core, thin shells everywhere else. Doctrine 06/11
get a follow-up amendment noting the plugin-delivered variant of A7 (debt-entry draft in
`plan.md` §Debt).

## 4. Waves (delivery phasing — mirrors "extraction before invention")

| Wave | Content | Exit proof |
| --- | --- | --- |
| **W1 — Core extraction** (r2, SF-1/SF-2: refactor-then-extract, ordered sub-slices) | (a) port/result/error contracts move behind compatibility re-exports; (b) **empty** duplicate-rejecting registry in core, concrete default factories stay in the CLI composition root; (c) host-owned `deploy` shell split that preserves `desktop` + help; (d) demonstrably pure conventions move *with their constants* (`runtime-overrides.ts` stays with bare-metal/leaf owners); (e) router rewired through the contracts — **no build-implementation move in W1**. F-DEPLOY-1/2 → `gated`; debt `DEPLOY-ARCHETYPE-7-CORE-SEED` retirement is **conditional on the externalized composition root** | `deno task e2e:cli` green after every sub-slice; arch:check green with new gates |
| **W2 — Adapter extraction** | `deploy-aspire`, `deploy-baremetal` (receives the current Windows/Linux build behavior — the adapter-neutral compile emitter graduates to core only after fs/process/output/config ports exist), `deploy-deno` split out; per-target config member schemas move adapter-side over the **two-phase config loader** (SF-10; retiring the deploy slice of `config-plugin-specific-schema-debt`); `DEPLOY-SECRETS-ROLLBACK-CORE` retired | Same E2E green; each package passes its A2 gate set; capability manifests published |
| **W3 — Pluginization** | `plugins/deploy` + host contribution-axis extensions (DP-4); deploy group becomes plugin-mounted with built-in back-compat shim; scaffold emits deploy assets via plugin scaffolder | `plugin install deploy` on a scaffold; `scaffold.runtime` case; doctor + verify-plugin green |
| **W4 — Container path** | `deploy-container` (+ fly/koyeb/sevalla/coolify/dokploy subpaths); first *generated* Dockerfile/compose artifacts (retiring `cli-deploy-artifacts-missing` for the container lane) | Live smoke on ≥1 managed (fly or koyeb) + 1 self-hosted (coolify or dokploy) platform |
| **W5 — Probe-gated clouds** | CF-PROBE → `deploy-cloudflare`; Vercel Build-Output probe → `deploy-vercel`; AWS-PROBE (HTTP) → `deploy-aws` HTTP scope; event-semantics probes remain separate cards | Each adapter ships only after its probe card passes the shared conformance suite (L-1, L-7) |

Provider-optimized scaffolds (the owner's point 3) ride W3–W5: the scaffold story for a target
ships with (or immediately after) its adapter (`scaffold-stories.md`).

## 5. Versioning, publishing, conventions

- All packages pin the workspace version; `jsr:@netscript/*@<version>` specifiers centralized
  (`deps:check`); npm upstream deps via `catalog:` (wrangler, `@vercel/sdk`, `@pulumi/pulumi` if
  taken) — auth parity (`research/auth-composition-anatomy.md` §7).
- Adapter upstream CLIs invoked as tools (wrangler, vercel, aspire, deno, flyctl) are **invoked,
  not imported**, wherever a supported CLI exists — the wrap seam is the process boundary, which
  keeps vendor SDK weight out of the module graph (and JSR publish surface). SDK imports are the
  exception and are named per adapter card (DP-3).
- String-constant templates (not text imports) for every emitted artifact — the JSR text-import
  lineage rule (`jsr-text-import-lineage` memory; permanent doctrine).
- Each package README declares required permissions (F-9/AP-19) — deploy adapters are
  permission-heavy (`--allow-run` for CLIs, `--allow-net` for APIs) and must say so exactly.
