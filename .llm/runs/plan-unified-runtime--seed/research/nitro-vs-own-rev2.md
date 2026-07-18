# Nitro versus own layer — revision 2

Evidence date: 2026-07-18. Owner-linked live evidence is preserved at
`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`. This supersedes the recommendation and cost
premise in `nitro-vs-own.md`; it does not mutate the locked board or `plan.md`.

## Revised verdict

The owner's condition is correct: **HYBRID is acceptable only when Nitro does not make a target less
native.** Applying that test changes HYBRID from “Nitro for Cloudflare/Vercel/Lambda” to
**provider-native HYBRID**:

- own the composition, capability and deployment contracts;
- wrap official/provider-native tooling for Cloudflare and AWS;
- use Nitro presets only where no equally maintainable native path exists and only behind the same
  deploy port; and
- keep Aspire/Docker for image-based targets.

This follows both “wrap, do not reinvent” and the repository's already-governed deployment-target
pattern: one stable port, one adapter per target, and a thin CLI router
(`docs/architecture/doctrine/06-archetypes.md:257-299`;
`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:1-128`;
`packages/cli/src/kernel/extension-points.ts:23-37`).

## 1. Does Nitro make each target less native?

“Native” here means that provider configuration, bindings, event types, emulator, compatibility
controls and deployment CLI remain directly available through a NetScript adapter. It does not mean
copying the provider SDK. A wrapper that hides a capability is less native; a wrapper that types and
forwards it is not (`docs/architecture/doctrine/06-archetypes.md:266-275`).

| Target/tool                        | Native path evidence                                                                                                                                                                                                                                                                               | Compared with Nitro                                                                                                                                                                                     | Finding                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel / `vercel-deno`             | The community runtime accepts `Deno.ServeHandler`/default `Deno.serve`, Deno permissions/version directives, assets and `vercel dev` (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                                                                                         | Nitro supplies a maintained Vercel output, routing, Cron and queue hooks, but builds through its Vite/Rolldown/Node toolchain (`nitro-vs-own.md:27-39`; `../evidence/nitro-vs-own-live-2026-07-18.md`). | **The Deno runtime is more runtime-native, but not yet more maintenance-native.** Its small community footprint and separate build-time Deno install make it an experimental owned adapter, not the v1 default. Nitro remains the safer provisional emitter if conformance proves no required Vercel feature is hidden. |
| Cloudflare / Wrangler Deno path    | Deno's tutorial points Wrangler at TypeScript directly. Cloudflare's Vite plugin runs in workerd, exposes bindings/runtime APIs, builds assets and supports multi-Worker apps; Miniflare models modules, bindings and compatibility controls (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`). | Nitro can emit `cloudflare_module` and forward hooks, but adds a generic build/host layer between NetScript and the official Worker toolchain (`../evidence/nitro-vs-own-live-2026-07-18.md`).          | **Yes, Nitro is less native for the full Cloudflare suite.** The official stack already solves bundle/dev/preview/deploy and exposes provider bindings directly. Own a thin Cloudflare adapter wrapping Wrangler/Vite/Miniflare.                                                                                        |
| Cloudflare / Denoflare             | Denoflare offers a Deno-first CLI, Deno-2 esbuild loader, R2, and experimental multi-platform output (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                                                                                                                         | It removes Node/Wrangler but duplicates part of Cloudflare's official toolchain and is not needed to prove a Deno-native path.                                                                          | Treat as an optional build strategy/research input, not the authoritative Cloudflare deploy adapter. Wrapping official Wrangler keeps product-suite coverage and compatibility semantics.                                                                                                                               |
| AWS / Lambda Web Adapter           | AWS's adapter runs any HTTP app across managed/custom runtimes and OCI images, handles API Gateway/Function URL/ALB, binary, streaming, graceful shutdown and non-HTTP triggers, and includes a Deno example (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                 | Nitro's Lambda preset emits its own Lambda event handler and chunks (`../evidence/nitro-vs-own-live-2026-07-18.md`).                                                                                    | **Nitro is less native for AWS breadth.** Wrapping the AWS-maintained adapter retains the NetScript HTTP server and extends to AWS event/service bindings without adopting Nitro's handler.                                                                                                                             |
| AWS / Node-wrapper Deno experiment | The experiment demonstrates zip/layer feasibility but requires unstable compatibility flags, `--allow-all`, and disables telemetry (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                                                                                           | It is more Deno-direct than Nitro but operationally weaker than the AWS adapter.                                                                                                                        | Evidence for a research branch only; do not make it the production base. “Deno-native” alone does not outweigh telemetry/security/runtime risk.                                                                                                                                                                         |

The rev1 claim that Nitro avoids building raw output contracts was true but framed the alternative
incorrectly. The real choice is **wrap Nitro versus wrap the provider's own toolchain**. On
Cloudflare and AWS the second wrapper is both thinner and deeper. On Vercel, the available
Deno-native runtime is compelling but community-maintained, so Nitro retains provisional value
(`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).

### Revised cost estimates

These are planning estimates inferred from the cited wrapper surfaces, not measured delivery data.
They include adapter code, configuration emission and conformance fixtures, but exclude provider
accounts and production soak.

| Target                                      | Rev1 greenfield estimate |                                       Wrap-don't-reinvent estimate | Why it falls                                                                                                                                                                                                                                                       |
| ------------------------------------------- | -----------------------: | -----------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cloudflare Workers HTTP/deploy              |       4–7 engineer-weeks |                                                      **2–4 weeks** | Wrangler accepts the TS entry; the Vite plugin supplies workerd build/preview and binding access; Miniflare supplies local target semantics (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                                                  |
| Cloudflare first leaf backing (KV or Queue) |            not separated |            **1–2 weeks/backing**, after shared CF binding resolver | Provider APIs already exist; work is semantic mapping and conformance, not service implementation. KV lacks NetScript CAS guarantees and Queue must preserve retry/DLQ semantics (`adapter-mapping.md:10-24`; `../evidence/nitro-vs-own-rev2-live-2026-07-18.md`). |
| AWS Lambda HTTP                             |                5–9 weeks |                                                      **2–4 weeks** | Lambda Web Adapter supplies event/HTTP translation, binary, streaming, readiness and shutdown (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                                                                                                |
| AWS first leaf backing/event source         |            not separated | **1.5–3 weeks/backing**, after shared AWS client/identity resolver | AWS supplies SQS polling/batching and broad event sources; NetScript must still map at-least-once delivery, idempotency and partial failures (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `adapter-mapping.md:19-29`).                                     |
| Vercel HTTP via `vercel-deno`               |                4–7 weeks |                                         **1–3 weeks experimental** | Runtime, dev integration and Deno handler contract already exist, but maintenance/builder compatibility need proof (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                                                                           |
| Docker-image provider                       |   0.5–1.5 weeks/provider |                                         **0.5–1.5 weeks/provider** | Already an image plus thin deploy/config invocation; Nitro adds little (`packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts:106-180`; [#346](https://github.com/rickylabs/netscript/issues/346)).                                               |

The cost reduction invalidates rev1's blanket reason to rent all tier-3 translation. It does not
make owned adapters free: each provider mapping still needs capability rejection, lifecycle,
security, local-emulator and live-smoke gates
(`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:90-128`;
`docs/architecture/doctrine/06-archetypes.md:257-299`).

## 2. Does provider-suite depth flip Cloudflare and AWS?

**Yes. Cloudflare and AWS flip to owned, provider-native adapter families.** Nitro can expose some
hooks and bindings, but its generic storage/tasks layer is weaker than NetScript's ports and cannot
express the full provider suite without provider-specific adapters anyway
(`adapter-mapping.md:10-33`).

### Cloudflare

| Provider capability | NetScript leaf                                            | Fit and guardrail                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers KV          | `@netscript/kv` adapter                                   | Basic get/set/list/delete maps directly, but it must advertise no CAS/strong-consistency capability where the provider cannot prove it; it cannot back saga state requiring atomics (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `adapter-mapping.md:11-14`).                                                                                                                     |
| Queues              | `@netscript/queue` adapter plus worker/trigger activation | Guaranteed delivery, batching, retry, delay, DLQ and pull consumers are much closer to `MessageQueue` than Nitro tasks. Conformance must still pin ack, attempt, ordering and duplicate behavior (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `adapter-mapping.md:19-24`).                                                                                                        |
| Durable Objects     | saga/worker state and coordination adapters               | Strongly consistent attached storage, serialization and alarms are plausible saga/worker primitives. This is **not** a generic `KvStore` substitution: object identity/placement and transactional scope require a dedicated adapter and a saga-store proof (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:20-115`). |
| Workers Cache       | HTTP cache adapter                                        | Direct provider cache is more native than routing through generic Nitro cache and can avoid Worker execution on hits (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `adapter-mapping.md:15-18`).                                                                                                                                                                                    |

### AWS

An owned AWS family can compose Lambda Web Adapter for HTTP with leaf adapters for SQS, DynamoDB,
Step Functions or later services. AWS explicitly documents SQS at-least-once delivery, duplicate
possibility, batching, visibility timeout and partial failures; those are exactly the semantics a
`MessageQueue` adapter must preserve rather than flatten
(`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `adapter-mapping.md:19-29`). Lambda
event-source mappings also cover DynamoDB Streams, Kinesis, Kafka, MQ and DocumentDB; Step Functions
has richer workflow error handling than Lambda retries. That breadth makes a provider-family
boundary valuable even when only a subset ships in v1
(`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).

Owning these families does not mean one giant cloud SDK abstraction. Each leaf package retains its
stable semantic port and ships or imports a provider adapter; the deployment layer resolves
bindings, provisions/configures resources, and routes activation. The provider name is an extension
axis, not a replacement domain (`docs/architecture/doctrine/06-archetypes.md:266-281`).

## 3. Merge single- and multi-runtime deployment layers

The owner's proposed merge is architecturally stronger than separate “single-runtime” and
“distributed” deployment stacks. Logical topology and physical placement are separate decisions: the
same leaf adapter can bind locally/in-process or to a provider service, while deploy selects a cell
and wires it. The single composition root remains caller-owned
(`docs/architecture/doctrine/07-composition-and-extension.md:13-38`).

### Leaf ownership

- `@netscript/kv`: provider KV/storage implementations and declared consistency/atomic/watch
  capabilities (`adapter-mapping.md:11-14`).
- `@netscript/queue`: provider enqueue/consumer implementations, retry/DLQ/ordering capability
  (`adapter-mapping.md:19-24`).
- `@netscript/database`: provider connectors and writer/topology constraints
  (`adapter-mapping.md:9-10`; `packages/database/deno.json:5-13`).
- workers/sagas/triggers/streams cores: provider activation, state, scheduler and transport adapters
  only where their richer semantics belong (`adapter-mapping.md:25-31`).
- service/Fresh/oRPC: one Fetch-shaped host contract, independent of placement
  (`adapter-mapping.md:32-33`; `packages/service/src/types.ts:13-20`).

### Proposed `@netscript/deploy`

Move the existing deploy domain out of CLI into a callable Archetype-2/7 core; retain CLI as the
Archetype-6 presentation router. This is a package proposal, not an implementation decision. It is
directly anticipated by doctrine's package-agnostic deploy core plus thin CLI layout
(`docs/architecture/doctrine/06-archetypes.md:257-299`) and extracts the already-public CLI port
(`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:1-128`;
`packages/cli/src/kernel/extension-points.ts:23-37`).

Suggested public surface:

| Surface                                        | Responsibility                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DeploymentPlan` / `DeploymentCell`            | Declarative physical topology: processes/functions, entrypoints, assets, leaf bindings, routes, triggers and placement; the provider target remains the named extension axis (`docs/architecture/doctrine/06-archetypes.md:257-281`).                                                                                     |
| `CapabilityRequirement` / `CapabilityManifest` | Requirements and supplied capabilities with explicit rejection before emit/up; reuses UR-5's contract rather than inventing preset flags (`../design/canonical/slot-map.md:20,42-44`).                                                                                                                                    |
| `DeployTargetPort`                             | Keep `plan/emit/up/down/status/logs/rollback/secrets`; move ownership from CLI and preserve adapter conformance (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:12-128`).                                                                                                                                   |
| `ArtifactEmitterPort`                          | Turn a validated cell into target artifacts without deploying; implementations wrap Cloudflare official tooling, Lambda Web Adapter/IaC, Vercel Nitro or Deno runtime, process, or container (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:106-110`). |
| `ResourceBindingResolverPort`                  | Resolve declared logical leaf bindings to provider handles/config without exposing credentials or provider SDK objects across package ports; the need follows from CF KV/Queue bindings and leaf semantic boundaries (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `adapter-mapping.md:10-24`).                    |
| `ProvisionerPort`                              | Plan/apply/status/rollback provider resources; wrap Wrangler/AWS/Aspire/provider CLI or IaC and remain separate from artifact emission (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:106-121`; `docs/architecture/doctrine/06-archetypes.md:266-275`).                                                    |
| `ActivationRouterPort`                         | Map provider events (HTTP, queue, schedule, stream) into service/worker/trigger entrypoints while retaining delivery semantics (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `adapter-mapping.md:19-31`).                                                                                                          |
| `DeployTargetRegistry`                         | Closed-on-key target registration and dynamic selection; CLI performs parse → resolve → invoke only (`packages/cli/src/kernel/extension-points.ts:23-37`; `docs/architecture/doctrine/06-archetypes.md:272-299`).                                                                                                         |

The dependency direction is critical: leaf packages define semantic ports; provider adapter packages
depend on those ports; `@netscript/deploy` composes adapters and resource declarations; CLI depends
on deploy. `@netscript/deploy` must not absorb KV/queue/saga behavior or become a cloud god-object
(`docs/architecture/doctrine/07-composition-and-extension.md:70-76`; `adapter-mapping.md:35-42`).

## 4. Revised per-target recommendation

| Target family                                                             | v1 path                                                                                          | Nitro role                                        | Rationale                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deno server/bare metal                                                    | **Owned Deno-native host/emitter**                                                               | None                                              | Existing Fetch/listener and deploy-port seams; no provider translation benefit (`packages/service/src/builder/service-builder-impl.ts:501-521`; `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:90-128`).                                                                                   |
| Docker/Compose, Kubernetes, Azure                                         | **Aspire/Docker lane**                                                                           | None                                              | Existing registry and Aspire adapters already own this path (`packages/cli/src/kernel/application/registries/deploy-target-registry.ts:1-114`; `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts:41-227`).                                                                        |
| Cloud Run, Koyeb, Sevalla, Coolify, Dokploy, Fly.io, Render, DigitalOcean | **Aspire/Docker image + thin target adapter**                                                    | None                                              | Image is the portable artifact; target work is provider config/invocation. Existing Cloud Run proves the pattern and #346 owns the Docker-provider lineage (`packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts:106-180`; [#346](https://github.com/rickylabs/netscript/issues/346)). |
| Cloudflare Workers + suite                                                | **Owned wrapper over Wrangler + CF Vite plugin + Miniflare; leaf CF bindings**                   | None by default; optional comparison fixture only | Official tooling is Deno-compatible and gives direct workerd/binding/product access (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                                                                                                                                                |
| AWS Lambda + suite                                                        | **Owned wrapper over AWS Lambda Web Adapter + AWS event/resource adapters**                      | None by default; optional comparison fixture only | AWS adapter preserves HTTP portability and native event/product breadth; community Deno wrapper remains research-only (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`).                                                                                                                              |
| Vercel                                                                    | **Nitro preset provisionally; owned `vercel-deno` adapter as a research/conformance challenger** | Optional v1 emitter                               | Deno runtime is more native but lacks vendor ownership/scale evidence; choose by identical conformance and maintenance gates (`../evidence/nitro-vs-own-rev2-live-2026-07-18.md`; `../evidence/nitro-vs-own-live-2026-07-18.md`).                                                                        |
| Netlify and unsupported long-tail function formats                        | **Nitro preset only when it is the thinnest proven wrapper**                                     | Optional                                          | Retains Nitro's real breadth benefit without putting it in the composition contract (`nitro-vs-own.md:27-39`).                                                                                                                                                                                           |
| New Deno Deploy                                                           | **Owned research card**                                                                          | None until proved                                 | Current corpus withdrew it from v1 pending platform proof (`../design/canonical/slot-map.md:45-48,65-66`; `deno-deploy-new.md:85-102`).                                                                                                                                                                  |

## 5. Delta to the locked UR cards

This is a supervisor-facing drift proposal only. The locked source remains
`../design/canonical/slot-map.md:15-28`.

| Card                                            | Rev2 disposition                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UR-0, UR-1, UR-3, UR-4, UR-7, UR-8, UR-9, UR-10 | **Survive in intent.** Lifecycle, in-process composition, Fetch mounting, writer/offline/durability and single-process contracts are provider-independent (`../design/canonical/slot-map.md:15-25`; `adapter-mapping.md:19-33`).                                                                                                                  |
| UR-2                                            | **Replace Nitro ownership.** NetScript host lifecycle owns listener/close; provider host adapters, including optional Nitro, consume it (`../design/canonical/slot-map.md:17,36-37`; `packages/service/src/builder/service-builder-impl.ts:501-521`).                                                                                             |
| UR-5                                            | **Generalize preset → deployment cell/provider capability.** Add provider-resource and leaf-binding requirements; preserve compile-time rejection and saga semantics (`../design/canonical/slot-map.md:20,42-44`; `adapter-mapping.md:25-29`).                                                                                                    |
| UR-6                                            | **Replace preset columns with emitter/provider cells.** Keep `deno_server`, `node_server`, `cloudflare_module`, but Cloudflare becomes the owned official-toolchain reference cell; add emitter provenance and target-native conformance. Do not add Vercel/AWS to v1 merely because wrappers exist (`../design/canonical/slot-map.md:21,45-48`). |
| UR-11                                           | **Expand architecture contract.** Decide/extract `@netscript/deploy`, dependency direction, leaf adapter ownership, binding resolver, emitter/provisioner separation and thin CLI (`../design/canonical/slot-map.md:26,60-62`; `docs/architecture/doctrine/06-archetypes.md:257-299`).                                                            |
| UR-12                                           | **Rewrite acceptance around provider-native replacement.** Prove the three cells and that Nitro is absent from the public composition/leaf contracts; optional emitters must be droppable (`../design/canonical/slot-map.md:27,63-64`; `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:90-128`).                                     |
| DD-RESEARCH                                     | **Unchanged.** New Deno Deploy remains a successor proof, not a v1 claim (`../design/canonical/slot-map.md:28,65-66`).                                                                                                                                                                                                                            |

## Final recommendation

Adopt **provider-native HYBRID**, with Cloudflare and AWS flipped from Nitro presets to owned
adapter families built by wrapping their official tools. Keep Nitro only as a replaceable long-tail
emitter and a provisional Vercel option. Merge single- and multi-runtime deployment through
leaf-owned provider adapters plus a new `@netscript/deploy` composition/provisioning package; do not
merge leaf semantics into deploy.

The decision rule is stricter than rev1: **Nitro is chosen per target only when it passes the same
conformance suite, exposes every required native binding/event/config surface, and costs less to
maintain than the best provider-native wrapper.** If it introduces a native-integration trade-off,
it fails the condition and the owned wrapper wins.
