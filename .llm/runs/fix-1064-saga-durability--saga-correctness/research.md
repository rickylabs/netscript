# Research — fix-1064-saga-durability--saga-correctness

## Re-baseline

- Carried-in source: issues #1064, #1065, #1066; draft PR #1075; supervisor addenda.
- Re-derived against `origin/main` @ `f663fe0e4` and branch HEAD `60f5f2e66` on 2026-08-03.
- No production implementation was carried in; the branch contains only its seeded empty commit.

## Findings

| # | Finding                                                                                                                                                                                                                                                                          | How to verify                                                                                                                                                                                                            |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | Real Redis 7 and Garnet 1.1.1 complete registry `set`/`list`, direct `KvSagaStore.save`, and the auto-detected durable runtime publish path. The originally reported infinite wait was not reproduced.                                                                           | Owned containers `netscript-saga-1075-redis` on 46379 and `netscript-saga-1075-garnet` on 46380; scratch probes in ignored `.llm/tmp/repro-1064-*.ts`.                                                                   |
| 2 | The Redis adapter nevertheless violates the atomic compare-and-set contract: 16 concurrent `KvSagaStore.save(..., expectedVersion=1)` calls all fulfilled against one version-1 record; exactly one may commit. `WATCH` state is shared by the adapter's one command connection. | `timeout 20s deno run --allow-env --allow-net --allow-read .llm/tmp/repro-1064-concurrent-cas.ts` exits 1 with `fulfilled: 16, rejected: 0`. Inspect `packages/kv/adapters/redis.adapter.ts` and its connection manager. |
| 3 | `packages/kv/tests/` has no real Redis adapter contract coverage. Acceptance requires a real server, `kv.list`, and bounded save completion/failure evidence.                                                                                                                    | `rg -n "RedisKvAdapter                                                                                                                                                                                                   |
| 4 | Default compensation is dropped before the existing missing-compensator error can run: `SagaBusBridge.publish` delegates to `SagaEngine.publish`, whose `handle()` result and cascade ledger are discarded.                                                                      | `.llm/tmp/repro-1065-default-compensation.ts` prints `publishResolved: true, compensationCalls: 0`; inspect `saga-engine.ts` and `saga-bus-bridge.ts`.                                                                   |
| 5 | `dispatchCascaded` has no exhaustive default branch, and compensation-handler cascades are not redispatched. Both are silent-drop risks.                                                                                                                                         | Inspect the cascade switch and `#compensate` in `packages/plugin-sagas-core/src/runtime/saga-bus-bridge.ts`.                                                                                                             |
| 6 | Correlation rules are never used for initial instance selection. Both resolvers prefer explicit key, then `message.id`, then a saga/type default.                                                                                                                                | `packages/plugin-sagas-core/src/runtime/saga-engine.ts`; `.llm/tmp/repro-1066-correlation.ts`.                                                                                                                           |
| 7 | Pre-fix two-workflow reproduction genuinely fails: distinct extractor values produce one shared instance and one rejected concurrent publish. The opposite failure also occurs: two messages for one extractor value but distinct ids create two instances, each at count 1.     | Run `.llm/tmp/repro-1066-correlation.ts` against the pre-fix engine.                                                                                                                                                     |
| 8 | The supervisor-named `docs/site/capabilities/durable-sagas.md` does not exist. The canonical capability page is `docs/site/durable-workflows/sagas.md`; tutorial compensation guidance disagrees with that page.                                                                 | `rg -n "cap:durable-sagas                                                                                                                                                                                                |
| 9 | `RedisKvAdapter` is Archetype 2 Integration (verdict: Refactor/audit adapters); saga core is Archetype 3 Runtime; `plugins/sagas` is Archetype 5 Thin Plugin (verdict: Keep).                                                                                                    | Doctrine §6 and §10 plus harness archetype profiles.                                                                                                                                                                     |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/kv/mod.ts`, `packages/plugin-sagas-core/mod.ts` and export maps via
  `deno doc --unstable-kv`.
- Planned public surface: no new exported contract is required. Redis atomic serialization stays
  adapter-internal; correlation resolution stays engine-internal; the default compensator can use
  the existing `SagaCompensator`, `SagaClockPort`, and runtime option contracts.
- Slow-type / surface risks: none if no new export is introduced. Any implementation pressure to
  export a clock adapter or change `SagaEngineHandleResult` is a drift trigger and requires
  re-evaluation before editing the surface.

## Open questions

- None that force implementation rework. Exact test placement will follow existing package
  conventions; the real-Redis test may skip with an explicit prerequisite outside the dedicated
  integration invocation, but the slice evidence must execute it against the owned container.
