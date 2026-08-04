# Research — fix-sagas-kv-glue-registration--w2-f

## Re-baseline

- Carried-in source: amended GitHub issue #1184 and milestone dispatch brief W2-F.
- Re-derived against `main` @ `2c8865e8c4ec60ef080276d327fc75ab32c0cb85` on 2026-08-04.
- The amended issue has five close-gated Acceptance boxes and a seven-step local verification bar.
- The provided branch is clean and exactly at `origin/main`; no carried implementation exists.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `runtime.stub.ts` emits only the runner import; it never registers a KV adapter. | `plugins/sagas/src/adapter/resources/glue/runtime.stub.ts` |
| 2 | Plugin install reaches the stub through `runtimeGlueScaffolder` and emits `sagas/runtime.ts`. | `plugins/sagas/src/adapter/plugin.ts`; `glue/glue.ts` |
| 3 | Existing resource coverage asserts emitted paths but not emitted runtime contents. | `plugins/sagas/src/adapter/resources/resources.test.ts` |
| 4 | `openSagaRuntimeKv()` delegates to shared `getKv()` unless an explicit saga KV path is set. | `packages/plugin-sagas-core/src/stores/kv-saga-store.ts` |
| 5 | Redis/Garnet auto-detection throws when the `redis` adapter factory is not registered. | `packages/kv/application/shared.ts` |
| 6 | Importing `@netscript/kv/redis` self-registers Redis while the explicit `CACHE_PROVIDER=denokv` branch still selects `deno-kv`. | `packages/kv/redis.ts`; `packages/kv/application/auto-detect.ts` |
| 7 | `scaffold.plugin.json` declares the real background entrypoint as `sagas/runtime.ts` and requires KV. | `plugins/sagas/scaffold.plugin.json` |
| 8 | No AppHost or `scaffold.runtime` process was live at preflight; only protected `aspire mcp start` processes existed. Two unrelated Postgres containers were present and left untouched. | `aspire ps --format Json`; scoped process list; `docker ps` on 2026-08-04 |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all 13 `plugins/sagas/deno.json` exports through the repo doc-lint wrapper.
- Planned public-surface change: none; the touched stub and test are internal adapter resources.
- Baseline risk: doc-lint reports 15 pre-existing `private-type-ref` diagnostics and zero missing
  JSDoc. The change must not alter that count or add an export.
- Slow-type risk: none from the planned string-stub/test edit; targeted package publish dry-run is
  still a required final gate.

## Open questions

- None that force implementation rework. The exact generated saga interaction endpoints and health
  report shape will be discovered from the fresh scaffold and recorded as runtime evidence, without
  widening the source fix.

