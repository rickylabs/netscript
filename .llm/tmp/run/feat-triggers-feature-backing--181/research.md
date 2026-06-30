# #181 Triggers Feature-Backing — research.md

Run-id: `feat-triggers-feature-backing--181`
Base: clean `alpha.16` (`fc911ba1`, `chore(release): cut 0.0.1-alpha.16 (#189)`).
Archetype: `@netscript/plugin-triggers-core` = **ARCHETYPE-3** (runtime/ports/adapters core);
`plugins/triggers` connector = **ARCHETYPE-5** (thin presentation seam).

## Base-state correction (re-grounded against alpha.16)

The original framing assumed a pre-convergence state. The actual base is **further along**; three
premises were stale and are corrected here so PLAN-EVAL grades against reality:

1. **The connector is already converged.** `plugins/triggers/services/src/main.ts:196` builds the
   service via `createPluginService(router, {...}).serve()`, `serveRpc: true`, with the raw HMAC
   webhook served through the `rawRoutes` escape hatch (`main.ts:207-211`). The raw-route mechanism
   is present and in use. Debt `triggers-connector-sound-deferred` (arch-debt.md:374) is resolved by
   this base; the live debt is `TRIGGERS-CONNECTOR-DEFERRED-ROUTES` (arch-debt.md:1566).
2. **KV stores already use `@netscript/kv`, not raw `Deno.openKv`.**
   `packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores.ts:1` imports `getKv` from
   `@netscript/kv`; `openTriggerRuntimeKv()` (line 27) calls `getKv({ path: ... })`. `deno.json:23`
   declares the dep. The only `Deno.Kv` reference is a test double
   (`src/testing/deno-kv-trigger-event-store-double.ts:6`). The relocation debt
   `PLUGIN-RUNTIME-ADAPTER-RELOCATION` (arch-debt.md:1619, #172c) is satisfied for triggers-core.
3. **Connector deferral is a plain `throw` mapped to HTTP 500**, not typed errors
   (`services/src/routers/v1.ts:164-193`); `subscribeEvents` is a never-yielding async generator
   (`v1.ts:188-193`).

**Net effect:** #181 is a **pure `-core` runtime/behavior feature-backing program**. The KV-migration
slice is a no-op for production (drop). All else (domain fields, enabled-state port, manual-fire,
test-webhook helper, cron-preview engine, SSE port) is genuinely net-new and correctly scoped.

## 1. Current triggers service contract (authoritative 11 routes)

Connector contract is a pure re-export: `plugins/triggers/contracts/v1/triggers.contract.ts:9` →
`export * from '@netscript/plugin-triggers-core/contracts/v1'`. Authoritative definition:
`packages/plugin-triggers-core/src/contracts/v1/triggers.contract.ts`
(`TriggersContractDefinitionShape`, contract.ts:550-565). Handlers:
`plugins/triggers/services/src/routers/v1.ts`, bound via `router-context.ts:19`
(`triggersContractV1.$context<TriggerServiceContext>()`).

| # | Route | Method/Path | Input | Output | Status | Site |
|---|-------|-------------|-------|--------|--------|------|
| 1 | `describe` | GET `/describe` | base seam | `PluginCapabilities` | BACKED | v1.ts:95 |
| 2 | `listTriggers` | GET `/triggers` | `listTriggersInput` (pagination + kind/enabled/tags) c:455 | `listTriggersOutput` c:459 | BACKED — gap: synthesizes `enabled:true` (v1.ts:240) | v1.ts:97 |
| 3 | `getTrigger` | GET `/triggers/{id}` | `{id}` c:471 | `triggerDefinitionResponseSchema` c:233 | BACKED — gap: omits `name` (v1.ts:218-228) | v1.ts:111 |
| 4 | `listEvents` | GET `/events` | `listEventsInput` c:473 | `listEventsOutput` c:477 | BACKED | v1.ts:123 |
| 5 | `getEvent` | GET `/events/{id}` | `{id}` c:489 | `triggerEventResponseSchema` c:264 | BACKED | v1.ts:146 |
| 6 | `fireTrigger` | POST `/triggers/{id}/fire` | `{id, body?: triggerFireInputSchema}` c:491 | `triggerFireResponseSchema` c:321 | **DEFERRED** | v1.ts:164-166 throw |
| 7 | `testWebhook` | POST `/webhooks/{id}/test` | `{id, body?}` c:496 | `triggerFireResponseSchema` | **DEFERRED** | v1.ts:168-170 |
| 8 | `previewSchedule` | GET `/triggers/{id}/preview` | `{id, count?:1-50 default 5}` c:501 | `triggerPreviewResponseSchema` c:337 | **DEFERRED** | v1.ts:172-174 |
| 9 | `enableTrigger` | POST `/triggers/{id}/enable` | `{id}` c:509 | `triggerDefinitionResponseSchema` | **DEFERRED** | v1.ts:176-178 |
| 10 | `disableTrigger` | POST `/triggers/{id}/disable` | `{id}` c:511 | `triggerDefinitionResponseSchema` | **DEFERRED** | v1.ts:180-182 |
| 11 | `subscribeEvents` | GET `/events/subscribe` | `subscribeEventsInput` c:513 | `eventIterator(triggerSSEEventSchema)` c:629-632 | **DEFERRED** | v1.ts:188-193 |

Note: `subscribeEvents` is built via `oc.route(...)` (c:629), not `baseContract`, so its error map is
empty; the other ten carry `BaseErrors`. The contract erases its typed `errors` map via the sanctioned
`as unknown as Parameters<typeof oc.errors>[0]` cast (c:109-111); handlers throw a plain `Error`
(→500) for deferral and use `notFound` from `@netscript/contracts` (v1.ts:36).

## 2. triggers-core ports (existing vs net-new)

Barrel: `packages/plugin-triggers-core/src/ports/mod.ts`.

Backed today: `TriggerEventStorePort` (KvTriggerEventStore, stores:32), `TriggerIdempotencyPort`
(stores:104), `TriggerDlqPort` (KvTriggerDlqStore, stores:175 — `enqueue/list/replay`),
`TriggerIngressPort` (DefaultTriggerIngress, runtime/create-trigger-ingress.ts:49),
`TriggerProcessorPort` (TriggerProcessor, runtime/trigger-processor.ts:62), `TriggerSchedulerPort`
(CronTriggerSchedulerAdapter, adapters/cron-trigger-scheduler-adapter.ts:83 — wraps `@netscript/cron`;
persistent schedules throw `unsupportedOperation` adapter:105-110; exposes `fireNow(id)` adapter:170),
`TriggerClockPort` (interface; prod uses inline `() => new Date()`), `WebhookVerifierPort`
(HmacSha256/Memory verifiers), `FileWatcherPort` (WatchersFileWatcherAdapter).

**Net-new surface #181 must add:**
- **Enabled-state port** — no persistence of enabled/disabled (backs #9/#10, un-synthesizes #2/#3).
- **Manual-dispatch entrypoint** — `manual` is in `RESERVED_KINDS` (trigger-processor.ts:59) and
  rejected; no public "fire on demand → build event → persist → ack" helper (backs #6).
- **Webhook test-delivery helper** — ingress only accepts a real `Request` + real signature
  (create-trigger-ingress.ts:80-95) (backs #7).
- **Cron next-fire-times preview engine** — see §6 (backs #8).
- **Event-subscription / SSE port** — no live stream (backs #11).

## 3. Domain-type gaps (confirmed)

`TriggerDefinitionBase` (`src/domain/trigger-definition.ts:19-36`):
`id, kind, durability, handler, retry?, concurrency?, circuitBreaker?, deduplication?, description?,
tags?, metadata?`. **No `enabled`, no `name`.** Builders accept neither
(`DefineScheduledTriggerSpec` define-scheduled-trigger.ts:21-28 = `id, description?, tags?, metadata?`
+ spec; grep `enabled`/`name?:` across `src/builders` = no matches).

Synthesis/omission sites: `enabled: true` synthesized at `v1.ts:240` (`toTriggerDefinitionResponse`);
`name` never set (v1.ts:236-247). Contract response **allows** `name` (`name: z.string().optional()`
c:243) and **requires** `enabled` (`triggerDefinitionResponseSchema.enabled` required; soundness test
`tests/contracts/triggers-contract-soundness_test.ts:52` asserts it required — must stay required).
`listTriggers` input already has an `enabled` filter (c:403/407) the handler ignores
(`filterDefinitions` v1.ts:197 has no enabled branch).

## 4. KV-engine (already engine-agnostic)

Production stores inject `kv: KvStore` from `@netscript/kv` and guard atomics
(`stores/kv-trigger-runtime-stores.ts:1-2,20,230`); connector registers Redis via
`import '@netscript/kv/redis'` (main.ts:21). Matches the workers reference pattern
(`packages/plugin-workers-core/src/stores/kv-worker-idempotency-store.ts:1-35`). Only remaining
raw ref: the test double `src/testing/deno-kv-trigger-event-store-double.ts:6` (testing-only).
**KV migration is complete for production code — drop the migration slice.**

## 5. Raw-bytes / HMAC vs oRPC-Zod (constraint, already handled for ingress)

HMAC must hash exact raw bytes: `create-trigger-ingress.ts:83`
`const body = new Uint8Array(await request.request.arrayBuffer());` → `verifier.verify(...)`
(line 85). oRPC Zod parsing would re-serialize the body and break the signature. The base resolves
this: the webhook route is NOT oRPC — it is mounted via `rawRoutes` (main.ts:207-211) at
`POST /api/v1/webhooks/:triggerId` (+`/*`), handled by `acceptWebhook` (main.ts:298) passing
`c.req.raw` into `ingress.accept(...)` (main.ts:321-324); trigger id resolved cast-free by
string-equality (main.ts:375-389).

**Implication for `testWebhook` (#7):** it IS an oRPC route (Zod-parsed body), so it cannot reuse the
raw HMAC path — the helper must construct a *synthetic signed* request internally (see plan L9).

## 6. Cron-preview capability gap (load-bearing for #8)

`@netscript/cron` has **no real next-N-occurrences engine**. `parseCronExpression`
(`packages/cron/ports/types.ts:273`) only field-splits (no validation, no iteration);
`calculateNextRun` is private, heuristic, single-occurrence, self-described placeholder
(deno.adapter.ts:257-260; memory.adapter.ts:410-414 interval-based).
`ScheduledTriggerHandle.nextFireAt` (trigger-scheduler-port.ts:8) carries at most one approximate
value for already-scheduled triggers. The contract demands `nextFireAt: readonly string[]` up to
`count` (1-50, default 5) ISO datetimes honoring timezone (c:337-347, 501-507). **No primitive
computes this** → `previewSchedule` needs a genuine cron-iteration engine (highest-uncertainty slice).

## References

Contract `packages/plugin-triggers-core/src/contracts/v1/triggers.contract.ts`; handlers
`plugins/triggers/services/src/routers/v1.ts` + `v1-types.ts`; service assembly
`plugins/triggers/services/src/main.ts`; stores `…/src/stores/kv-trigger-runtime-stores.ts`; KV
reference `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store.ts`; cron gap
`packages/cron/ports/types.ts` + `packages/cron/adapters/deno.adapter.ts`; soundness lock
`packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts`; debt
`.llm/harness/debt/arch-debt.md:1566` and `:1619`.
