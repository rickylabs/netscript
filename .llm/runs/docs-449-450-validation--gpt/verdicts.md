# #449 / #450 opposite-family validation verdicts

Evaluator: GPT opposite-family lane; Claude-authored merged `main` docs cut. Validation date:
2026-07-11.

## Shared evidence

- `cd docs/site && deno task verify` — exit 0: site build passed; 24,055 internal links across 167
  pages all resolve; 28 caveat markers across 22 pages all resolve.
- Scoped stale-claim scan:
  `rg -n -i 'beta\.2|publish\s*:\s*false|arrives from' <six track roots> <nine pillar roots>` —
  no matches.
- Scoped positioning scan included `honest`, `honesty`, `candor`, `throughput`, and comparison
  language, followed by spot-reading each match. The three failures below are direct violations of
  the design's no-honesty-framing rule. Incidental operational uses of “throughput” (queue sizing
  and persistence selection) were not treated as product positioning.
- API sampling used at least three load-bearing claims per row. The compact trace column names the
  sampled symbols and their workspace/published-surface evidence. Workspace export anchors include
  `packages/service/mod.ts:146` / `packages/service/src/presets/define-service.ts:175`,
  `packages/plugin-workers-core/mod.ts:17-18` / `src/public/root.ts:306-313`,
  `packages/queue/ports/options.ts:14`, `packages/fresh/src/application/builders/mod.ts:26`,
  `packages/fresh/src/application/query/query-island.tsx:39`,
  `packages/telemetry/src/instrumentation/worker.ts:295`, and
  `packages/config/mod.ts:53` / `packages/config/define-config.ts:34`.

## #449 — per-track tutorial verdicts

| Track | Verdict | Evidence (shape/checkpoints; three sampled API claims) |
|---|---|---|
| storefront | **FAIL: banned honesty framing describes the write-path proof at `docs/site/tutorials/storefront/02-catalog-service.md:57` (and repeats at `04-checkout-saga.md:335`)** | Exercise-first chapters close on runnable HTTP/log/state checkpoints. Sampled `defineService`, saga runtime/builders, and trigger ingress/processor claims trace to `packages/service/mod.ts:146`, `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:71`, and `packages/plugin-triggers-core/src/runtime/create-trigger-ingress.ts:47`. |
| workspace | **PASS** | Six-step build has observable auth, database, worker, authorization, and deploy checks. Sampled auth backend/plugin surface, generated Prisma/adapter flow, and `defineJob` trace to `packages/auth*`/`plugins/auth*` source, database adapter exports/source, and `packages/plugin-workers-core/mod.ts:17`. |
| erp-sync | **FAIL: banned honesty framing is used for the cron/cutover story at `docs/site/tutorials/erp-sync/04-queue-and-cron.md:126`** | Exercise-first import, subprocess transform, queue/cron, and deploy checkpoints otherwise satisfy the track shape. Sampled `defineJob`, `defineTask`, and `QueueProvider` trace to `packages/plugin-workers-core/src/public/root.ts:306-313` and `packages/queue/ports/options.ts:14`. |
| live-dashboard | **PASS** | Each service → SDK/cache → page/island → stream step ends in a visible response or UI checkpoint. Sampled `defineService`, `definePage`, and `QueryIsland` trace to `packages/service/src/presets/define-service.ts:175`, `packages/fresh/src/application/builders/mod.ts:26`, and `packages/fresh/src/application/query/query-island.tsx:39`. |
| chat | **PASS** | Scaffold, durable route, copied chat UI, and tool-call chapters are exercise-first with browser/stream/tool-result observations. Sampled AI engine/tool registry surface, durable chat proxy, and copied `RenderPart` UI surface trace to `packages/ai*`, `packages/fresh/src/application/ai*`, and the shipped fresh-ui registry/source. No `publish:false` claim remains. |
| eis-chat (on-ramp) | **FAIL: banned honesty framing appears in the on-ramp conclusion at `docs/site/tutorials/eis-chat/04-live-stream.md:170`** | The four-stage contract → worker → live-stream miniature otherwise has literal request, log, and stream checkpoints. Sampled `defineService`, `defineJob`, and stream topic/producer/consumer APIs trace to `packages/service/mod.ts:146`, `packages/plugin-workers-core/mod.ts:17`, and `plugins/streams/src/public/stream-api.ts:10,45,61`. |

**Overall #449: FAIL** — storefront, erp-sync, and eis-chat violate the explicit positioning law.

## #450 — per-pillar positioning verdicts

| Pillar | Verdict | Evidence (story-template; three sampled API claims) |
|---|---|---|
| services-sdk | **PASS** | Story/what-it-is/learn-do/minimal-example/production/reference spine is present; the tRPC comparison is bounded to the SDK feature. Sampled `defineService`, service health/TLS options, and SDK client/query helpers trace to `packages/service/mod.ts`, `packages/service/src`, and `packages/sdk/src`. |
| durable-workflows | **PASS** | Pillar tells the saga → trigger → stream build story and each feature page follows the story/reference template with a bounded comparison. Sampled saga runtime, trigger ingress, and stream producer claims trace to `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:71`, `packages/plugin-triggers-core/src/runtime/create-trigger-ingress.ts:47`, and `plugins/streams/src/public/stream-api.ts:45`. |
| background-processing | **PASS** | Screenshot-to-diagnosis story, learn/do path, minimal example, operational caveats, comparison, and reference are present. Sampled `defineJob`, `defineTask`, and queue-provider selection trace to `packages/plugin-workers-core/src/public/root.ts:306-313` and `packages/queue/ports/options.ts:14`. |
| data-persistence | **PASS** | “Edit one schema, run one generate” build-efficiency story leads into database and KV/queue/cron feature pages; the BullMQ/Celery contrast is one bounded comparison. Sampled database adapter lifecycle, Prisma tracing, and queue provider APIs trace to database adapter/tracing source and `packages/queue/ports/options.ts:14`. |
| identity-access | **PASS** | Agent-built-auth failure story, what-it-is, learn/do, integration, production, and reference sections form the required spine; caveats distinguish prerequisites from shipped behavior. Sampled auth plugin factory, session resolution/service middleware, and better-auth backend wiring trace to `packages/auth*`, `plugins/auth*`, and better-auth adapter source. |
| observability | **PASS** | Pillar starts from one request across process boundaries and distinguishes framework-real instrumentation from scaffold stubs without claiming unshipped APIs. Sampled `createLogger`, `traceJobExecution`, and trigger/saga telemetry instrumentation trace to `packages/logger/creators.ts:113`, `packages/telemetry/src/instrumentation/worker.ts:295`, and the plugin-core telemetry sources. |
| orchestration-runtime | **PASS** | Scaffold/resource-graph story is build-efficiency focused; CLI and runtime-config leaves provide caveats and reference paths without throughput positioning. Sampled `defineConfig`, async config, and generated CLI/AppHost behavior trace to `packages/config/mod.ts:53`, `packages/config/define-config.ts:34,68`, and `packages/cli/src/kernel` generators/templates. |
| web-layer | **PASS** | Copy-source/meta-framework story leads to concrete page, query, form, defer, route, and Vite leaves; claims are framed as reducing agent assembly work. Sampled `definePage`, `QueryIsland`, and route/form runtime helpers trace to `packages/fresh/src/application/builders/mod.ts:26`, `packages/fresh/src/application/query/query-island.tsx:39`, and `packages/fresh/src/application/route` / `form` source. |
| ai | **PASS** | “Chat that stops being a demo” story, two-plane model, engine design center, one bounded comparison, caveats, and next actions satisfy the template. Sampled engine/tool registries, MCP transports/pool, and durable chat proxy/sandbox claims trace to `packages/ai*`, MCP transport source, and `packages/fresh/src/application/ai*`. |

**Overall #450: PASS** — all nine pillar verdicts pass the requested shape, positioning, sampled
API-trace, link/caveat, and stale-version gates.

## Re-verdict after PR #652

Scope: re-ran only the failed positioning-law dimension on merged-main commit `fe2e1b73`, trusting
the original exercise shape, API-trace, link/caveat, stale-version, and all #450 results as directed.

Command:

```sh
rg -n -i '\bhonest(y|ly)?\b|\bcand(or|our)\b' \
  docs/site/tutorials/{storefront,erp-sync,eis-chat}
```

Result: no matches. Spot-reading the four formerly failing locations confirms that PR #652 replaced
the banned framing without introducing an equivalent honesty/candor claim.

| Track | Re-verdict | Fix evidence |
|---|---|---|
| storefront | **PASS** | `docs/site/tutorials/storefront/02-catalog-service.md:57` now says “direct way to prove the write path”; `04-checkout-saga.md:335` now says “observable checkpoint.” |
| erp-sync | **PASS** | `docs/site/tutorials/erp-sync/04-queue-and-cron.md:126` now describes keeping CSB “aligned with VIF until cutover.” |
| eis-chat (on-ramp) | **PASS** | `docs/site/tutorials/eis-chat/04-live-stream.md:170` now begins “Two notes on what the miniature simplified.” |

**Final overall #449: PASS** — all three prior failures are clean after PR #652; the other three
tracks retain their original PASS verdicts.

**Final overall #450: PASS** — unchanged from the original verdict.
