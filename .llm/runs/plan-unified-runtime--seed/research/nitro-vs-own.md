# Should the unified runtime build on Nitro?

Evidence date: 2026-07-18. Live-source extracts are preserved at
`../evidence/nitro-vs-own-live-2026-07-18.md`. This is supplemental Stage-B research, not a board
change.

## Verdict

**Choose HYBRID: NetScript owns the composition root, runtime contracts, and deploy-target port;
Nitro is an optional, replaceable output-emitter/host adapter for targets where its maintained
preset materially avoids provider-specific work.** Do not make H3, Nitro storage, or Nitro tasks the
universal NetScript runtime. This preserves the existing Fetch-shaped service seam and port
architecture while buying Nitro's real advantage: build and provider-output maintenance
(`packages/service/src/types.ts:13-20`;
`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:1-128`;
`docs/architecture/doctrine/07-composition-and-extension.md:15-37`;
`../evidence/nitro-vs-own-live-2026-07-18.md`).

NITRO-HOST would couple every cell to a public-beta build/HTTP host even though NetScript's durable
queue, saga, trigger, and stream contracts remain necessary. OWN-LAYER would preserve control but
needlessly make NetScript maintain several fast-moving serverless artifact formats. HYBRID keeps the
logical runtime independent and permits a target to move from Nitro to an owned emitter without
changing application code (`adapter-mapping.md:19-33`; `adapter-mapping.md:35-42`;
`docs/architecture/doctrine/06-archetypes.md:119-145`).

## 1. What Nitro actually adds

| Surface                      | Nitro's real contribution                                                                                                                                                                                                                                                    | NetScript reality                                                                                                                                                                                                                                                                                                                 | Decision                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Deployment outputs           | Roughly twenty documented provider families/recipes, preset selection/auto-detection, and provider-specific artifacts. The count is a breadth signal, not a claim that all presets have equal maturity (`../evidence/nitro-vs-own-live-2026-07-18.md`; `nitro-v3.md:43-59`). | A shipped deploy port and registry already cover process, Docker/Compose, Kubernetes, Azure, Deno Deploy, and Cloud Run (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:1-128`; `packages/cli/src/kernel/application/registries/deploy-target-registry.ts:1-114`).                                                  | Unique value is highest for tier-3 serverless formats, not Docker-image targets.                                          |
| Build                        | Rolldown/Vite backend build with route compilation, code splitting, tree shaking, minification, HMR, and a normalized `.output` (`../evidence/nitro-vs-own-live-2026-07-18.md`).                                                                                             | NetScript would require bundling/externalization/assets for any serverless emitter, but already delegates container publication to Aspire and Docker tooling (`packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts:41-227`; `packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts:106-180`). | A meaningful shared build subsystem for serverless; little incremental value for existing image lanes.                    |
| HTTP host                    | H3 v2, Web-standard requests/responses, routes, middleware, lifecycle, and cross-runtime serving (`../evidence/nitro-vs-own-live-2026-07-18.md`; `nitro-v3.md:27-34`).                                                                                                       | `ServiceApp.fetch(Request)` is already mountable; only `serve()` currently owns a listener (`packages/service/src/types.ts:13-20`; `packages/service/src/builder/service-builder-impl.ts:423-432`; `packages/service/src/builder/service-builder-impl.ts:501-521`).                                                               | Useful adapter, not a unique application contract. Keep Fetch authoritative.                                              |
| Storage/cache/database/tasks | Host bindings, unstorage/ocache, experimental db0, tasks and scheduled activation (`nitro-v3.md:18-23`; `adapter-mapping.md:19-33`).                                                                                                                                         | KV, queue, database, workers, sagas, triggers and streams expose stronger lifecycle/durability semantics; Nitro tasks are not a queue or saga engine (`adapter-mapping.md:19-33`).                                                                                                                                                | Keep NetScript ports. HTTP/function cache is a genuine optional Nitro feature; other primitives are scoped adapters only. |
| Provider lifecycle           | Cloudflare queue/scheduled hooks, Vercel Cron/queue hooks, and Lambda event adaptation are maintained with the preset (`../evidence/nitro-vs-own-live-2026-07-18.md`).                                                                                                       | NetScript owns normalized activation, retry, DLQ, idempotency and workflow state (`adapter-mapping.md:23-31`).                                                                                                                                                                                                                    | Let Nitro translate provider events, then enter NetScript ports; do not inherit provider semantics into the domain.       |

The benefit is therefore narrower and more concrete than “one unified runtime”: Nitro packages a
backend build plus changing provider artifact/event conventions. It does **not** eliminate the
composition root or the durable adapters NetScript would build anyway (`adapter-mapping.md:19-42`).

## 2. The OWN-LAYER alternative

The owned design extends each package through its existing port: a hostable service lifecycle;
worker scheduler/queue activation; saga store, transport and scheduler; trigger ingress/scheduler;
stream transport; and KV/database/queue bindings. One composition root orders start, drain and stop.
That is consistent with the shipped worker and saga runtime factories
(`packages/plugin-workers-core/src/runtime/composition-root.ts:91-148`;
`packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:20-115`) and the doctrine's stable
port plus target-adapter archetype (`docs/architecture/doctrine/06-archetypes.md:119-145`).

Deployment should remain a NetScript-owned extension axis. `DeployTargetPort`, its registry, and
shared target configuration already exist
(`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:1-128`;
`packages/cli/src/kernel/application/registries/deploy-target-registry.ts:1-114`;
`packages/config/src/domain/config-section-types.ts:356-593`). A narrower output-emitter port can
sit behind that surface: `emit(cell, target, capabilities) -> artifact + manifest`, with either an
owned or Nitro implementation. Nitro must not become the public deploy contract.

### What an owned emitter must produce

| Cell/target            | Work without Nitro                                                                                                                                                                                                                                                                              |      Initial cost estimate |                    Nitro-adapter estimate |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------: | ----------------------------------------: |
| Node/Deno process      | Bundle or preserve modules, copy assets, emit an entry shim and lifecycle/capability manifest. NetScript already has the Fetch app and process listener seam (`packages/service/src/types.ts:13-20`; `packages/service/src/builder/service-builder-impl.ts:501-521`).                           |     **1–2 engineer-weeks** |           **1–2 weeks**; little advantage |
| Docker-image providers | Reuse the image and add thin provider invocation/config for Cloud Run, Koyeb, Render, and DigitalOcean. Cloud Run build/push/deploy already ships (`packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts:106-180`; [#346](https://github.com/rickylabs/netscript/issues/346)). | **0.5–1.5 weeks/provider** | **0.5–1 week/provider**; little advantage |
| Cloudflare Workers     | Bundle for workerd, emit `export default { fetch(request, env, ctx) }`, map assets/routes/bindings/environments/compatibility date, and emit Wrangler metadata plus schedules/queues (`../evidence/nitro-vs-own-live-2026-07-18.md`).                                                           |              **4–7 weeks** |  **1–2 weeks** to adapt/test Nitro output |
| Vercel                 | Emit `.vercel/output/static`, `.func` directories with `.vc-config.json`, global routing/config, function entry/event adaptation, Cron and queue configuration (`../evidence/nitro-vs-own-live-2026-07-18.md`).                                                                                 |              **4–7 weeks** |                             **1–2 weeks** |
| AWS Lambda             | Transpile/bundle dependencies, package handler/chunks, translate Lambda/API-Gateway or Function-URL events to Fetch responses, and handle streaming/binary/cookies plus deployment configuration (`../evidence/nitro-vs-own-live-2026-07-18.md`).                                               |              **5–9 weeks** |                             **1–3 weeks** |

These are **planning estimates, not measured delivery data**. They infer scope from each cited
provider output contract and include implementation plus conformance fixtures, but exclude provider
account provisioning and production soak. Their purpose is comparative: the owned image lane is
already cheap, whereas recreating three serverless output/event contracts is several times the
adapter effort. The tier lineage agrees: Docker-image providers are active S10 scope while
Vercel/Cloudflare/Lambda were placed in WATCH tier 3
([#327](https://github.com/rickylabs/netscript/issues/327),
[#346](https://github.com/rickylabs/netscript/issues/346),
[#349](https://github.com/rickylabs/netscript/issues/349)).

## 3. Maintenance and risk delta

| Choice     | Risk NetScript accepts                                                                                                                                                                                                                                                                                           | Risk NetScript avoids                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| NITRO-HOST | Nitro v3 is public beta; H3/build/preset changes affect every runtime cell. Provider compatibility dates must be pinned and deliberately advanced. A Deno-hosted project still consumes Nitro's Node/Vite/Rolldown build path (`../evidence/nitro-vs-own-live-2026-07-18.md`; `nitro-v3.md:8-14`).               | Most provider bundling and output-format churn.                                                  |
| OWN-LAYER  | NetScript owns bundler policy, Node compatibility, provider event translation, output manifests and every provider API change. Cloudflare compatibility dates, Vercel Build Output changes, and Lambda packaging become direct maintenance (`../evidence/nitro-vs-own-live-2026-07-18.md`).                      | Beta/API coupling and upstream preset regressions; exact control over artifacts.                 |
| HYBRID     | Nitro remains a pinned optional build dependency for selected targets, with a target conformance suite required on upgrades. A preset failure affects that emitter, not the logical runtime (`../evidence/nitro-vs-own-live-2026-07-18.md`; `docs/architecture/doctrine/07-composition-and-extension.md:15-37`). | Reimplementing high-churn tier-3 formats while avoiding Nitro as a universal runtime dependency. |

HYBRID still needs exact Nitro/Vite/Rolldown pins, recorded compatibility dates, artifact snapshots,
and live target smoke tests. “Nitro supports the preset” is not proof that NetScript's queue,
database, asset, lifecycle, or durability contract works there (`adapter-mapping.md:19-33`). The
Deno-via-Node build path is acceptable only inside the emitter toolchain; emitted runtime code must
pass the target cell's own conformance gate (`nitro-v3.md:8-14`).

## 4. Effect on the locked UR board

The following is a drift proposal for the supervisor, not an edit to the locked board. Card names
come from `../design/canonical/slot-map.md:15-28`.

| Card(s)                             | Under OWN/HYBRID                                                                                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UR-0, UR-1, UR-7, UR-8, UR-9, UR-10 | **Survive unchanged in intent.** Hostable lifecycle, no-loopback logical composition, writer safety, offline profile, durable bindings, and single-process proof do not require Nitro (`../design/canonical/slot-map.md:15-28`; `adapter-mapping.md:19-33`). |
| UR-3                                | **Generalize only:** Fresh mounts through a host-neutral Fetch/static contract; Nitro/H3 is one adapter (`packages/service/src/types.ts:13-20`; `../design/canonical/slot-map.md:18`).                                                                       |
| UR-4                                | **Survives, remove host assumption:** the oRPC Fetch bridge remains; test it against the generic host conformance suite and optionally Nitro (`../design/canonical/slot-map.md:19`; `orpc-fresh.md:37-52`).                                                  |
| UR-5                                | **Rename:** preset capability manifest becomes a target/cell capability manifest. Unsupported saga/durability rejection is unchanged (`../design/canonical/slot-map.md:20`; `adapter-mapping.md:25-29`).                                                     |
| UR-11                               | **Survives and expands:** document composition/public seams plus the deploy-output-emitter port and Nitro dependency boundary (`../design/canonical/slot-map.md:26`; `docs/architecture/doctrine/06-archetypes.md:119-145`).                                 |
| UR-2                                | **Replace:** “Nitro owns listener/lifecycle” becomes a NetScript host-runtime port/default listener, with `NitroHostAdapter` optional (`../design/canonical/slot-map.md:17`; `packages/service/src/builder/service-builder-impl.ts:501-521`).                |
| UR-6                                | **Replace:** three Nitro-preset cells become target emitter cells recording owned-vs-Nitro provenance and running identical conformance tests (`../design/canonical/slot-map.md:21`; `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:1-128`).   |
| UR-12                               | **Adjust acceptance wording:** prove the target matrix and replacement boundary, not Nitro adoption itself (`../design/canonical/slot-map.md:27`).                                                                                                           |

## 5. Recommendation and decision rule

Adopt Nitro only behind a NetScript-owned output-emitter/host port for Cloudflare, Vercel, Lambda,
or a future target where its maintained output saves more work than the adapter costs. Keep owned
emitters for process, Docker/Compose, Kubernetes/Azure and Docker-image providers, where shipped
ports and Aspire delegation already cover the hard part
(`packages/cli/src/kernel/application/registries/deploy-target-registry.ts:1-114`;
`packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts:41-227`;
`packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts:17-180`).

A target may use Nitro only if its artifact is reproducible under exact pins, its compatibility date
is explicit, it passes the same cell conformance suite as an owned emitter, and no Nitro
storage/task/database type crosses a NetScript public port. If any one condition fails, replace that
target emitter without redesigning the composition root. This is the concrete benefit/risk balance:
**own the semantics; rent the volatile provider translation.**
