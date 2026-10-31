# Research — issue 2390

Baseline: main `e4875a56c13e91503b5f168e6fa6d95b093c5a8a`; live issue and comments read. No existing PR found for 2390, and no orchid-triage comment. NetScript MCP find_guidance followed by search_docs consulted before design; public docs do not cover this exact flow, so existing first-party tests are the implementation authority.

- The issue separates an application-owned incompatible producer singleton collision from unresolved saga lifecycle symptoms. Its application correction uses a receipt-specific stream path, stable identity and persistent epochs. Do not reproduce private application code or attribute that collision to a framework bug.
- #2499 commits replay/state/history atomically. #2510 exposes caller-persisted `initialEpoch`; without it a new stable producer can be acknowledged as an old duplicate. This is an explicitly supported composition requirement, not automatic epoch allocation.
- Native `KvSagaStore` declares `transitionOutbox: unsupported` and rejects commands; only `createPrismaSagaTransitionStore` provides the worker-command capability. A full KV atomic-worker-effect/relay flow cannot be honestly claimed. Preserve this refusal with a regression and run KV's supported receipt/restart path separately, explicitly without atomic worker-command delivery.
- Existing provider harness: `packages/plugin-sagas-core/tests/fixtures/transition-store/provider-fixture.ts` builds a real generated Prisma client outside the workspace using committed-lock mappings. Existing saga relay cohort composes real command relay, worker sink, dispatcher/pool and reference durable-stream server.
- Existing projection atomic and restart tests prove smaller seams, but none chains admission → projected atomic worker intent → relay → receipt publication → stream readback → recorded projection with a restarted producer and processor.
- Reuse `startSagaRunner`, `createSagaDeliveryPublisher`, HTTP router/publisher, `createProjectingSagaStore`, worker dispatcher and public stream factory; no custom engine/producer/runner.
- JSR scan: new tests under `plugins/sagas/tests/` are excluded from publish includes. No exports, dependencies, public types or generated carriers change. Source fixes, if required, trigger renewed surface review.
- Memory consulted: local KV queues need one owning process; cross-process poll can take ~60 seconds. Use persisted state and reconstruct processor/producer resources. RTK is unavailable; use bounded raw commands. PostgreSQL binaries and Docker daemon are unavailable; stage owned native binaries without system mutation.

Symptom attribution is provisional until the integrated fixture runs. Verify merged fixes against their diffs/tests. Historical failures must be reproduced or explicitly unproven.
