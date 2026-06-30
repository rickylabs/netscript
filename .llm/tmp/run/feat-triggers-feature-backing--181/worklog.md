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

Status: implemented, gated, committed as `485959e3`.

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
