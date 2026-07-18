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
| `@netscript/plugin-deploy-core` | `packages/plugin-deploy-core/` | **A2** integration core | Ports (7-op target port, emitter port), closed-on-key target registry, capability manifest + compiler, shared conventions (activation/secrets/otel/rollback/health), compile/build primitive, deploy config schema base + schema registry, testing fakes |
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
  clients. A platform graduates to its own package the moment it needs a real SDK dependency or
  its own scaffold story.

## 2. The dependency graph (the F5 answer)

```
                    @netscript/service (Fetch handler, shutdown coordinator)
                    @netscript/config (project-level loader seam)
                    leaf cores: kv, queue, database, plugin-{workers,sagas,triggers,streams}-core
                          ▲
                          │  (types only: capability IDs, binding declarations)
        ┌─────────────────┴───────────────┐
        │   @netscript/plugin-deploy-core │   ◄── @netscript/plugin (base seams)
        └─────────────────▲───────────────┘
                          │ implements ports, registers into registry
   ┌──────────┬───────────┼────────────┬─────────────┬────────────┐
   │deploy-   │deploy-    │deploy-     │deploy-      │deploy-     │deploy-
   │aspire    │baremetal  │deno        │container    │cloudflare  │vercel / aws
   └──────────┴───────────┴────────────┴─────▲───────┴────────────┘
              (cloudflare containers-lane and aws http-lane depend on deploy-container)
                          ▲
                          │ composes: selects adapters, builds registry, wires config
              @netscript/plugin-deploy  (plugins/deploy)
                          ▲
                          │ mounts CLI contribution, install/doctor, scaffold
              @netscript/cli  (thin A6 router; presentation only)
```

Rules that keep it acyclic and non-god:

- **R-GRAPH-1 — leafward types only.** `plugin-deploy-core` may import *types and IDs* from leaf
  cores (capability identifiers, binding declaration types) — never leaf implementations, never
  provider SDKs. Enforced by import-graph gate (F-DEPLOY-2 extension; see DP-2 §6).
- **R-GRAPH-2 — adapters depend on core + their one provider surface.** An adapter imports
  `plugin-deploy-core` ports plus its wrapped upstream (wrangler, `@vercel/sdk`, Machines API
  client, aspire CLI shell). Never another adapter, never the plugin — with the single declared
  exception that `deploy-cloudflare` (Containers lane) and `deploy-aws` (image lane) depend on
  `deploy-container`'s exported container-build port, which is itself a core-port implementation,
  not a cross-adapter reach-around (it is the L-6 shared path).
- **R-GRAPH-3 — the plugin composes; nothing depends on the plugin.** `plugins/deploy` is the
  only place all adapters meet. Adapter *registration* happens in the plugin's composition root
  (closed-on-key registry, populated at composition — AP-24 avoidance), or in the scaffolded
  project's generated registry for install-time target selection.
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
| composite | A7 | Union A2(core) + A6(router) + F-DEPLOY-1 (uniform 7-op or declared subset) + F-DEPLOY-2 (no target logic in command surface) | The family as a whole is doctrine's Archetype 7, delivered through A5 |

The doctrine tension named in `research/doctrine-constraints.md` (A7 composite vs A5 delivery)
resolves cleanly: **A7 describes the core+router shape; A5 describes the delivery vehicle.** Both
laws point the same direction — conventions in core, thin shells everywhere else. Doctrine 06/11
get a follow-up amendment noting the plugin-delivered variant of A7 (debt-entry draft in
`plan.md` §Debt).

## 4. Waves (delivery phasing — mirrors "extraction before invention")

| Wave | Content | Exit proof |
| --- | --- | --- |
| **W1 — Core extraction** | `plugin-deploy-core` extracted from the CLI kernel (port, registry, conventions, compile engine, config base + schema registry); CLI re-wired over it; F-DEPLOY-1/2 → `gated`; debt `DEPLOY-ARCHETYPE-7-CORE-SEED` + `DEPLOY-SECRETS-ROLLBACK-CORE` retired | `deno task e2e:cli` green on unchanged verbs; arch:check green with new gates |
| **W2 — Adapter extraction** | `deploy-aspire`, `deploy-baremetal`, `deploy-deno` split out; per-target config member schemas move adapter-side (retiring the deploy slice of `config-plugin-specific-schema-debt`) | Same E2E green; each package passes its A2 gate set; capability manifests published |
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
