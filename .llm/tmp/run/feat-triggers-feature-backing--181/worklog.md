# #181 Triggers Feature-Backing — worklog.md

Run-id: `feat-triggers-feature-backing--181`

## Design

- **Public surface:** add optional `name`/`enabled` definition authoring fields first; later slices
  export only the locked factories (`createManualDispatcher`, `createWebhookTestDelivery`,
  `computeNextFireTimes`, `createEventSubscription`, `createKvTriggerEnabledStateStore`) as values
  and re-export new port interfaces type-only.
- **Domain vocabulary:** `TriggerDefinitionBase.name?: string`,
  `TriggerDefinitionBase.enabled?: boolean`; later slices add enabled-state overrides,
  manual-fire payload dispatch, signed webhook test delivery, cron next-fire previews, and trigger
  SSE events.
- **Ports:** existing `TriggerEventStorePort`, `TriggerProcessorPort`, and `TriggerIngressPort`;
  later slices add `TriggerEnabledStatePort` and `TriggerEventSubscriptionPort`.
- **Constants:** existing trigger kind/status constants remain authoritative; no new constants in
  Slice 1.
- **Commit slices:** S1 domain fields; S2 enabled-state; S3 manual fire; S4 webhook test delivery;
  S5 schedule preview; S6 event subscription.
- **Deferred scope:** CLI/scaffold and #184 relocation are out of scope; full scaffold runtime and
  e2e-cli-prod gates are deferred per `plan.md`.
- **Contributor path:** core behavior lives under `packages/plugin-triggers-core/src`; connector
  presentation maps ports in `plugins/triggers/services/src/routers/v1.ts` and constructs defaults
  only in `createTriggersServiceContext`.

## Slice 1 — Domain fields `enabled` + `name`

Status: implemented, gated, committed as `a79e13ea`.

Files:
- `packages/plugin-triggers-core/src/domain/trigger-definition.ts`
- `packages/plugin-triggers-core/src/builders/define-webhook.ts`
- `packages/plugin-triggers-core/src/builders/define-scheduled-trigger.ts`
- `packages/plugin-triggers-core/src/builders/define-file-watch.ts`
- `packages/plugin-triggers-core/src/builders/trigger-definition-fields_test.ts`
- `plugins/triggers/services/src/routers/v1.ts`
- `plugins/triggers/services/src/main_test.ts`

Gate evidence:
- `run-deno-check` core: PASS, exit 0, 61 files, `--unstable-kv`.
- `run-deno-check` connector services: PASS, exit 0, 6 files, `--unstable-kv`.
- `run-deno-lint` core: PASS, exit 0, 0 findings.
- `run-deno-lint` connector services: PASS, exit 0, 0 findings.
- `run-deno-fmt` core: PASS, exit 0, 0 findings.
- `run-deno-fmt` connector services: PASS, exit 0, 0 findings.
- `rtk proxy deno task test --unstable-kv packages/plugin-triggers-core/src/builders/trigger-definition-fields_test.ts packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts packages/plugin-triggers-core/src/testing/testing_test.ts`: PASS, exit 0, 7 passed.
- `rtk proxy deno task test --unstable-kv plugins/triggers/services/src/main_test.ts`: PASS, exit 0, 3 passed, 6 steps.
- `deno publish --dry-run --allow-dirty` in `packages/plugin-triggers-core`: PASS, exit 0.
- `deno publish --dry-run --allow-dirty` in `plugins/triggers`: PASS, exit 0; pre-existing
  dynamic-import warnings only.
- `rtk proxy deno task arch:check`: PASS, exit 0, `FAIL=0` with existing warnings.

Notes:
- Initial check wrapper attempts incorrectly passed `-- --unstable-kv`, causing wrapper operator
  errors before code was checked. Reruns used the wrapper correctly; it passes `--unstable-kv` by
  default.

## Slice 2 — Enabled-State Port And KV Adapter

Status: implemented, gated, committed as `a19ca64f`.

Files:
- `packages/plugin-triggers-core/src/ports/trigger-enabled-state-port.ts`
- `packages/plugin-triggers-core/src/ports/mod.ts`
- `packages/plugin-triggers-core/src/stores/kv-trigger-enabled-state-store.ts`
- `packages/plugin-triggers-core/src/stores/kv-trigger-enabled-state-store_test.ts`
- `packages/plugin-triggers-core/src/stores/mod.ts`
- `packages/plugin-triggers-core/src/testing/memory-trigger-enabled-state-store.ts`
- `packages/plugin-triggers-core/src/testing/mod.ts`
- `packages/plugin-triggers-core/src/public/mod.ts`
- `packages/plugin-triggers-core/src/contracts/v1/triggers.contract.ts`
- `plugins/triggers/services/src/routers/v1-types.ts`
- `plugins/triggers/services/src/routers/v1.ts`
- `plugins/triggers/services/src/main.ts`
- `plugins/triggers/services/src/main_test.ts`

Gate evidence:
- `run-deno-check` core: PASS, exit 0, 65 files, `--unstable-kv`.
- `run-deno-check` connector services: PASS, exit 0, 6 files, `--unstable-kv`.
- `run-deno-lint` core: PASS, exit 0, 0 findings.
- `run-deno-lint` connector services: PASS, exit 0, 0 findings.
- `run-deno-fmt` core: PASS, exit 0, 0 findings after formatting touched files.
- `run-deno-fmt` connector services: PASS, exit 0, 0 findings after formatting touched files.
- `rtk proxy deno task test --unstable-kv packages/plugin-triggers-core/src/stores/kv-trigger-enabled-state-store_test.ts packages/plugin-triggers-core/src/builders/trigger-definition-fields_test.ts packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts`: PASS, exit 0, 4 passed.
- `rtk proxy deno task test --unstable-kv plugins/triggers/services/src/main_test.ts`: PASS, exit 0, 3 passed, 7 steps.
- `deno publish --dry-run --allow-dirty` in `packages/plugin-triggers-core`: PASS, exit 0.
- `deno publish --dry-run --allow-dirty` in `plugins/triggers`: PASS, exit 0; pre-existing
  dynamic-import warnings only.
- `rtk proxy deno task arch:check`: PASS, exit 0, `FAIL=0` with existing warnings.

Notes:
- The `enabled=false` connector smoke exposed that the existing contract used `z.coerce.boolean()`,
  which parses non-empty query strings such as `"false"` as `true`. Slice 2 changed only the triggers
  filter schema to `z.stringbool().optional()` so the already-public `TriggerFilters.enabled?:
  boolean` contract works over HTTP query strings.

## Slice 3 — Manual-Fire Dispatcher

Status: implemented, gated, committed as `6ead7da4`.

Files:
- `packages/plugin-triggers-core/src/runtime/create-manual-dispatcher.ts`
- `packages/plugin-triggers-core/src/runtime/create-manual-dispatcher_test.ts`
- `packages/plugin-triggers-core/src/runtime/mod.ts`
- `packages/plugin-triggers-core/src/public/mod.ts`
- `plugins/triggers/services/src/routers/v1-types.ts`
- `plugins/triggers/services/src/routers/v1.ts`
- `plugins/triggers/services/src/main.ts`
- `plugins/triggers/services/src/main_test.ts`
- `.llm/tmp/run/feat-triggers-feature-backing--181/drift.md`

Gate evidence:
- `run-deno-check` core: PASS, exit 0, 67 files, `--unstable-kv`.
- `run-deno-check` connector services: PASS, exit 0, 6 files, `--unstable-kv`.
- `run-deno-lint` core: PASS, exit 0, 0 findings.
- `run-deno-lint` connector services: PASS, exit 0, 0 findings.
- `run-deno-fmt` core: PASS, exit 0, 0 findings.
- `run-deno-fmt` connector services: PASS, exit 0, 0 findings.
- `rtk proxy deno task test --unstable-kv packages/plugin-triggers-core/src/runtime/create-manual-dispatcher_test.ts packages/plugin-triggers-core/src/stores/kv-trigger-enabled-state-store_test.ts packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts`: PASS, exit 0, 4 passed.
- `rtk proxy deno task test --unstable-kv plugins/triggers/services/src/main_test.ts`: PASS, exit 0, 3 passed, 7 steps.
- `deno publish --dry-run --allow-dirty` in `packages/plugin-triggers-core`: PASS, exit 0.
- `deno publish --dry-run --allow-dirty` in `plugins/triggers`: PASS, exit 0; pre-existing
  dynamic-import warnings only.
- `rtk proxy deno task arch:check`: PASS, exit 0, `FAIL=0` with existing warnings.

Notes:
- `fireTrigger` now resolves the definition by string equality, persists a manual event, processes
  through the configured processor, and maps response status to the contract's `pending | deferred`
  shape.
- `drift.md` records the local branded-id cast needed by the default manual event-id factory; the
  package has no public `TriggerEventId` constructor and ingress already uses the same edge pattern.

## Slice 4 — Webhook Test Delivery

Status: implemented, gated, committed as `3ef180f7`.

Files:
- `packages/plugin-triggers-core/src/runtime/create-webhook-test-delivery.ts`
- `packages/plugin-triggers-core/src/runtime/create-webhook-test-delivery_test.ts`
- `packages/plugin-triggers-core/src/runtime/mod.ts`
- `packages/plugin-triggers-core/src/public/mod.ts`
- `plugins/triggers/services/src/routers/v1-types.ts`
- `plugins/triggers/services/src/routers/v1.ts`
- `plugins/triggers/services/src/main.ts`
- `plugins/triggers/services/src/main_test.ts`
- `.llm/tmp/run/feat-triggers-feature-backing--181/drift.md`

Gate evidence:
- `run-deno-check` core: PASS, exit 0, 69 files, `--unstable-kv`.
- `run-deno-check` connector services: PASS, exit 0, 6 files, `--unstable-kv`.
- `run-deno-lint` core: PASS, exit 0, 0 findings.
- `run-deno-lint` connector services: PASS, exit 0, 0 findings.
- `run-deno-fmt` core: PASS, exit 0, 0 findings.
- `run-deno-fmt` connector services: PASS, exit 0, 0 findings.
- `rtk proxy deno task test --unstable-kv packages/plugin-triggers-core/src/runtime/create-webhook-test-delivery_test.ts packages/plugin-triggers-core/src/runtime/create-manual-dispatcher_test.ts packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts`: PASS, exit 0, 4 passed.
- `rtk proxy deno task test --unstable-kv plugins/triggers/services/src/main_test.ts`: PASS, exit 0, 4 passed, 7 steps.
- `deno publish --dry-run --allow-dirty` in `packages/plugin-triggers-core`: PASS, exit 0.
- `deno publish --dry-run --allow-dirty` in `plugins/triggers`: PASS, exit 0; pre-existing
  dynamic-import warnings only.
- `rtk proxy deno task arch:check`: PASS, exit 0, `FAIL=0` with existing warnings.

Notes:
- `testWebhook` now resolves the webhook definition, signs a synthetic JSON request with
  `x-hub-signature-256`, sends it through `TriggerIngressPort.accept`, and maps the ingress result
  to the trigger-fire response contract.
- `createTriggersServiceContext` constructs the default helper from the existing ingress and
  `Deno.env` secret lookup only; the service assembly remains unchanged.

## Slice 5 — Cron Next-Fire Preview

Status: implemented, gated, committed as `e710297f`.

Files:
- `packages/plugin-triggers-core/src/runtime/compute-next-fire-times.ts`
- `packages/plugin-triggers-core/src/runtime/compute-next-fire-times_test.ts`
- `packages/plugin-triggers-core/src/runtime/mod.ts`
- `packages/plugin-triggers-core/src/public/mod.ts`
- `plugins/triggers/services/src/routers/v1.ts`
- `plugins/triggers/services/src/main_test.ts`
- `.llm/harness/debt/arch-debt.md`

Gate evidence:
- `run-deno-check` core: PASS, exit 0, 71 files, `--unstable-kv`.
- `run-deno-check` connector services: PASS, exit 0, 6 files, `--unstable-kv`.
- `run-deno-lint` core: PASS, exit 0, 0 findings.
- `run-deno-lint` connector services: PASS, exit 0, 0 findings.
- `run-deno-fmt` core: PASS, exit 0, 0 findings after formatting the new cron file.
- `run-deno-fmt` connector services: PASS, exit 0, 0 findings.
- `rtk proxy deno task test --unstable-kv packages/plugin-triggers-core/src/runtime/compute-next-fire-times_test.ts packages/plugin-triggers-core/src/runtime/create-webhook-test-delivery_test.ts packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts`: PASS, exit 0, 11 passed.
- `rtk proxy deno task test --unstable-kv plugins/triggers/services/src/main_test.ts`: PASS, exit 0, 4 passed, 8 steps.
- `deno publish --dry-run --allow-dirty` in `packages/plugin-triggers-core`: PASS, exit 0.
- `deno publish --dry-run --allow-dirty` in `plugins/triggers`: PASS, exit 0; pre-existing
  dynamic-import warnings only.
- `rtk proxy deno task arch:check`: PASS, exit 0, `FAIL=0` with existing warnings plus the
  `plugin-triggers-core/src/runtime` 13-child warning introduced by this new runtime file.

Notes:
- `previewSchedule` now resolves scheduled definitions, calls `computeNextFireTimes`, and maps
  `{ triggerId, nextFireAt, timezone, persistent }`.
- Core table coverage includes the locked eight cases: spring-forward skip, fall-back duplicate,
  Asia/Tokyo, omitted `from`, `persistent: false`, leap day, invalid cron typed error, and
  every-N-minutes interval baseline.
- `CRON-NEXT-FIRE-ENGINE` is recorded in `.llm/harness/debt/arch-debt.md`.

## Slice 6 — Event Subscription / SSE

Status: implemented, gated, ready to commit.

Files:
- `packages/plugin-triggers-core/src/ports/trigger-event-subscription-port.ts`
- `packages/plugin-triggers-core/src/ports/mod.ts`
- `packages/plugin-triggers-core/src/runtime/create-event-subscription.ts`
- `packages/plugin-triggers-core/src/runtime/create-event-subscription_test.ts`
- `packages/plugin-triggers-core/src/runtime/create-trigger-ingress.ts`
- `packages/plugin-triggers-core/src/runtime/trigger-processor.ts`
- `packages/plugin-triggers-core/src/runtime/mod.ts`
- `packages/plugin-triggers-core/src/public/mod.ts`
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts`
- `plugins/triggers/services/src/routers/v1-types.ts`
- `plugins/triggers/services/src/routers/v1.ts`
- `plugins/triggers/services/src/main.ts`
- `plugins/triggers/services/src/main_test.ts`
- `.llm/harness/debt/arch-debt.md`

Gate evidence:
- `run-deno-check` core: PASS, exit 0, 74 files, `--unstable-kv`.
- `run-deno-check` plugin triggers: PASS, exit 0, 65 files, `--unstable-kv`.
- `run-deno-lint` core: PASS, exit 0, 0 findings.
- `run-deno-lint` plugin triggers: PASS, exit 0, 0 findings after replacing the unavailable
  generator stub.
- `run-deno-fmt` core: PASS, exit 0, 0 findings.
- `run-deno-fmt` plugin triggers: PASS, exit 0, 0 findings after formatting touched connector files.
- `rtk proxy deno task test --unstable-kv packages/plugin-triggers-core/src/runtime/create-event-subscription_test.ts packages/plugin-triggers-core/src/runtime/compute-next-fire-times_test.ts packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts`: PASS, exit 0, 11 passed.
- `rtk proxy deno task test --unstable-kv plugins/triggers/services/src/main_test.ts`: PASS, exit 0, 4 passed, 9 steps.
- `deno publish --dry-run --allow-dirty` in `packages/plugin-triggers-core`: PASS, exit 0.
- `deno publish --dry-run --allow-dirty` in `plugins/triggers`: PASS, exit 0; pre-existing
  dynamic-import warnings only.
- `rtk proxy deno task arch:check`: PASS, exit 0, `FAIL=0` with existing warnings plus new warnings
  for `plugins/triggers/services/src/main.ts` exceeding 500 lines and
  `plugin-triggers-core/src/runtime` exceeding the immediate-child cap.

Notes:
- Added `TriggerEventSubscriptionPort` and `createEventSubscription`; public root exports the
  factory as a value and port types via `export type`.
- Ingress publishes `trigger:accepted` and terminal lifecycle messages; the processor publishes
  `trigger:started`; the connector maps subscription messages to `TriggerSSEEvent`.
- `TRIGGERS-SSE-MULTI-REPLICA` is recorded as open debt and
  `TRIGGERS-CONNECTOR-DEFERRED-ROUTES` is closed in `.llm/harness/debt/arch-debt.md`.

## Final Summary

Status: implementation complete through Slice 6; final commit pending.

Per-slice commits:
- Slice 1: `a79e13ea`
- Slice 2: `a19ca64f`
- Slice 3: `6ead7da4`
- Slice 4: `3ef180f7`
- Slice 5: `e710297f`
- Slice 6: pending

Debt:
- Opened `CRON-NEXT-FIRE-ENGINE`.
- Opened `TRIGGERS-SSE-MULTI-REPLICA`.
- Closed `TRIGGERS-CONNECTOR-DEFERRED-ROUTES`.
