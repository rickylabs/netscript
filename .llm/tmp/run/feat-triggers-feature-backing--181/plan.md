# #181 Triggers Feature-Backing — plan.md

Run-id: `feat-triggers-feature-backing--181`. Base: `alpha.16` (`fc911ba1`).
Scope: feature-back the 6 deferred triggers oRPC routes + close the 2 backed-route gaps, via net-new
`@netscript/plugin-triggers-core` runtime (ARCHETYPE-3), with thin `plugins/triggers` connector
wiring (ARCHETYPE-5). Each slice = a daemon-attached WSL Codex implementation slice, independently
committable, with its own gate; connector un-defer rides the slice that backs each route so each
lands green end-to-end.

## Locked decisions

- **L1** — #181 is **core-only feature-backing**; connector convergence and the service-assembly
  (`main.ts`) are NOT re-touched (already converged). Connector edits limited to `v1.ts` handler
  bodies (un-defer, un-synthesize, include `name`) and `v1-types.ts` context (new ports the routes
  read).
- **L2** — **Deno.openKv→@netscript/kv migration: DROPPED** (already complete for production code;
  only a test-double remains). No functional credit, not gated. Optional micro-cleanup may ride
  Slice 1.
- **L3** — Add `enabled` and `name` to `TriggerDefinitionBase` as **optional** fields
  (`enabled?: boolean`, `name?: string`). Keep contract response `enabled` **required** (soundness
  test :52). The connector resolves `enabled = !disabledStore.has(id)` (store is source of truth; the
  domain field is an authoring default), and sets `name: definition.name`.
- **L4** — Enabled-state persistence = **NEW port + KV adapter** following the workers structural-port
  pattern, engine-agnostic via `@netscript/kv`, prefix `['triggers','enabled-state']`. Default =
  enabled; the store records overrides.
- **L5** — Manual-fire = **NEW runtime entrypoint** in triggers-core (`createManualDispatcher` /
  `fireTrigger`): builds a `ManualTriggerPayload` event (trigger-event.ts:50), persists via
  `TriggerEventStorePort`, dispatches via `TriggerProcessorPort`, returns
  `{accepted,eventId,triggerId,status}`. Lift the `manual` reserved-kind guard
  (trigger-processor.ts:59) for the explicit-fire path only.
- **L6** — `previewSchedule` = **NEW triggers-core-owned cron-iteration engine**
  (`computeNextFireTimes(spec, count, from?)`), NOT cron's heuristic `calculateNextRun`. Owned in
  triggers-core to avoid blocking on a cross-package `@netscript/cron` upgrade; **upstreaming a real
  iterator into `@netscript/cron` is recorded as future debt** (`CRON-NEXT-FIRE-ENGINE`).
- **L7** — `subscribeEvents` = **NEW `TriggerEventSubscriptionPort`** + in-process pub/sub adapter;
  ingress/processor publish lifecycle transitions; connector consumes and maps `TriggerEvent` →
  `TriggerSSEEvent` (c:197).
- **L8** — DLQ backing is **not net-new** (KvTriggerDlqStore exists). No separate DLQ slice; the
  subscription port surfaces existing DLQ enqueue as the `trigger:dlq` SSE type (c:358).
- **L9** — `testWebhook` helper **genuinely HMAC-signs a synthetic canonical request** using the
  configured verifier/secret and routes through the existing ingress (does not weaken HMAC on the
  real path). If no secret is configured, uses `MemoryWebhookVerifier` semantics. *(Locked default;
  the alternative — bypass verification and inject directly — was rejected as less faithful.)*
- **L10** — No new public brand constructor required (connector stays cast-free via string-equality +
  `definition.id`). A `toTriggerId` convenience may be added but is not gated.
- **L11 (durability)** — `subscribeEvents` is **in-process / single-replica** for now; multi-replica
  shared-bus SSE is recorded as new debt (`TRIGGERS-SSE-MULTI-REPLICA`), out of scope here.
- **L12 (sequencing vs #184)** — **#181 lands first, in full; then #184 absorbs the relocation.**
  Both PLAN lanes may run concurrently (planning touches no source). See §coordination. *(Locked
  default; user may override to the single-lane fallback.)*

## Slices (dependency-ordered)

### Slice 1 — Domain fields `enabled` + `name` (foundation)
- Core: `src/domain/trigger-definition.ts` (+`enabled?: boolean; name?: string`);
  `src/builders/define-{webhook,scheduled-trigger,file-watch}.ts` (thread optional `name`/`enabled`);
  `src/domain/mod.ts` + `src/public/mod.ts` (types re-flow).
- Connector: `v1.ts` `toTriggerDefinitionResponse` sets `name: definition.name` (rides here).
- Test: domain test — builders accept + freeze `name`/`enabled`; soundness test stays green.
- Gate: scoped `check --unstable-kv` + `test --unstable-kv` + `publish --dry-run` (no new slow types).

### Slice 2 — Enabled-state port + KV adapter; back `enable`/`disable`, un-synthesize (deps S1)
- Core: NEW `src/ports/trigger-enabled-state-port.ts` (`isEnabled(id)`, `setEnabled(id,bool)`,
  `list()`) + export in `ports/mod.ts`; NEW `src/stores/kv-trigger-enabled-state-store.ts`
  (structural `KvStore`, prefix `['triggers','enabled-state']`, mirror
  `kv-worker-idempotency-store.ts`) + export in `stores/mod.ts`; testing memory adapter.
- Connector: `v1-types.ts` (+`enabledState` in `TriggerServiceContext`); `main.ts`
  `createTriggersServiceContext` constructs default KV-backed store; `v1.ts`
  `enableTrigger`/`disableTrigger` call `setEnabled` then return mapped definition;
  `toTriggerDefinitionResponse` reads `enabled` from store (un-synthesize :240); `filterDefinitions`
  honors `enabled` query filter.
- Test: core store test (override/list, atomic + sequential); connector smoke — enable→disable
  round-trip, `listTriggers?enabled=false` filters.
- Gate: as S1 + connector smoke green; both `publish --dry-run`.

### Slice 3 — Manual-fire entrypoint; back `fireTrigger` (deps S1)
- Core: NEW `src/runtime/create-manual-dispatcher.ts` (builds `ManualTriggerPayload` event → event
  store → processor; explicit-fire bypass of the reserved-kind guard) + export in `runtime/mod.ts` +
  `public/mod.ts`.
- Connector: `v1-types.ts`/`main.ts` wire dispatcher; `v1.ts` `fireTrigger` replaces throw (:164).
- Test: core (event persisted, status mapping, idempotencyKey honored); connector smoke — fire → 200
  `accepted:true`.
- Gate: as above; assert `fireTrigger` no longer 500s.

### Slice 4 — Webhook test-delivery helper; back `testWebhook` (deps S3 + ingress)
- Core: NEW `src/runtime/create-webhook-test-delivery.ts` (signs synthetic canonical body per L9,
  routes through `TriggerIngressPort.accept`) + export.
- Connector: `v1.ts` `testWebhook` replaces throw (:168); `main.ts`/`v1-types.ts` wire helper.
- Test: core (signed synthetic request verifies + accepts; memory-verifier path); connector smoke.
- Gate: as above.

### Slice 5 — Cron next-fire-times engine; back `previewSchedule` (deps S1; highest risk)
- Core: NEW `src/runtime/compute-next-fire-times.ts`
  (`computeNextFireTimes(spec: ScheduledTriggerSpec, count: number, from?: Date): string[]` — real
  5-field cron iteration with timezone/DST, honoring `spec.persistent`) + export in `runtime/mod.ts`
  + `public/mod.ts`. Do NOT reuse cron heuristic (research §6).
- Connector: `v1.ts` `previewSchedule` replaces throw (:172) — resolve scheduled def, call engine,
  map to `{triggerId,nextFireAt,timezone,persistent}`.
- Test: core table-test (known crons → expected next N across DST/timezone); connector smoke.
- Gate: as above. Record `CRON-NEXT-FIRE-ENGINE` upstream-debt.

### Slice 6 — Event-subscription / SSE port; back `subscribeEvents` (deps S2/S3; most novel)
- Core: NEW `src/ports/trigger-event-subscription-port.ts`
  (`subscribe(filter?): AsyncIterable<…>`, `publish(event)`); NEW in-process adapter
  `src/runtime/create-event-subscription.ts`; ingress/processor publish status transitions
  (`create-trigger-ingress.ts` `#recordStatus`, `trigger-processor.ts`) + export.
- Connector: `v1.ts` `subscribeEvents` replaces the throwing generator (:188) — consume subscription,
  map `TriggerEvent` → `TriggerSSEEvent` (accepted/started/completed/failed/dlq/heartbeat,
  c:188-203), emit heartbeats; `v1-types.ts`/`main.ts` wire the port.
- Test: core (publish→subscriber receives, filter, cancel); connector SSE smoke (eventIterator yields
  a mapped event then closes).
- Gate: as above; assert SSE output-schema conformance. Record `TRIGGERS-SSE-MULTI-REPLICA` debt (L11).

## Coordination with #184 (Plugin RE-ARCHITECTURE v2)

Overlap is real and concentrated on: `domain/trigger-definition.ts`, `ports/mod.ts` + new port files,
`stores/`, `runtime/`, `contracts/v1/triggers.contract.ts`, and connector `v1.ts`/`v1-types.ts`/
`main.ts`. **Locked (L12): #181 lands first, in full; #184 absorbs the relocation of #181-added
files.** Rationale: #181 is purely additive *content* (new files + handler-body swaps + 2 optional
domain fields), far easier to relocate than to author into a layout still in flux. Fallback if #184
must start first: single-lane the **triggers structural-conform only** ahead of the #181 train; never
interleave. **Hard rule:** no concurrent open PRs touching the four hot files
(`trigger-definition.ts`, `ports/mod.ts`, `contracts/v1/triggers.contract.ts`, `v1.ts`). Lock the
#184 base contract/service seam before #181 Slice 6 (most seam-sensitive); prefer landing #181
entirely before any base-seam change.

## Gates

- **arch:check** — `deno task arch:check` (`FAIL=0`; triggers is a configured root). Watch
  connector→core leak rules + cast scanner.
- **scoped check** — `deno task check` in `plugin-triggers-core` (`deno check --unstable-kv` over all
  entrypoints); connector own check.
- **scoped lint + fmt** — `--ext ts,tsx`.
- **scoped test --unstable-kv** — `deno task test`; connector smoke (`services/src/main_test.ts`)
  extended per slice.
- **publish --dry-run** — per touched package; no NEW slow types beyond the accepted T4 carve-out
  (arch-debt.md:346); do not regress further.
- **scaffold.runtime** — triggers webhook/health e2e stays green (do not let the unrelated
  `PLUGIN-LIST-MANIFEST-REGISTRATION-BLOCKER` arch-debt.md:1680 mask regressions).
- **e2e-cli-prod (HARD)** — post-publish only (cannot run pre-merge against unpublished exports);
  release-validation gate, record raw exit/test counts post-alpha publish.
- **regression lock** — `triggers-contract-soundness_test.ts` stays green (required-`enabled` :52).

## Risks

- **R1 (high)** cron preview engine — timezone/DST-correct multi-occurrence iteration is the riskiest
  slice; mitigate with table-driven tests; keep triggers-core-owned (L6).
- **R2 (med)** `testWebhook` synthetic-signing semantics (L9 resolves; verify it round-trips real
  verification).
- **R3 (med)** manual-fire vs reserved kinds — lifting `manual` must not enable `queue`/`stream`
  reserved kinds (explicit-fire bypass only).
- **R4 (med→debt)** in-process SSE backs single-replica only (L11 records multi-replica debt).
- **R5 (high)** #184 churn on hot files (mitigated by L12 sequencing).

## New debt to record on close

- `CRON-NEXT-FIRE-ENGINE` — triggers-core owns a cron iterator; upstream to `@netscript/cron` later.
- `TRIGGERS-SSE-MULTI-REPLICA` — in-process SSE; shared-bus for multi-replica deferred.

## Design checkpoint

Every net-new file traces to a contract route: enabled-state port/store→#9/#10/#2/#3;
manual-dispatcher→#6; webhook-test-delivery→#7; cron engine→#8; subscription port/adapter→#11;
domain `enabled`/`name`→#2/#3 gaps. Layering respected (domain→ports→application/runtime→adapters;
connector presentation reads ports only). No generic utils/helpers folders introduced. Casts: none
new (L10). Closes `TRIGGERS-CONNECTOR-DEFERRED-ROUTES` (arch-debt.md:1566).
