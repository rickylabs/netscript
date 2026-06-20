# Commits — feat-framework-prime-time--supervisor

(append one line per slice commit: `- <sha>: <message>`)

- aa03b4f7: merge: sagas-durable-store (#74) into framework-prime-time [IMPL-EVAL PASS, foundation]
- (umbrella) merge: service-graceful-shutdown (#78) [IMPL-EVAL PASS]
- (umbrella) merge: worker-applied-keys-dedup (#79) [IMPL-EVAL PASS]
- 59c586fd: merge: rbp-dlq-contract (#80) [IMPL-EVAL PASS] — umbrella tip after blocker merges
- 5c4a4587: (umbrella tip prior to #75) — base for sagas-idempotency-e2e rebase
- 9b3bde45: merge --no-ff: sagas-idempotency-e2e (#75) [IMPL-EVAL PASS, run 27859243308] — durable applied-key reservation on #74 seam, 46 tests, clean lock
- df93baec: chore(harness): supervisor bookkeeping — #75 merged, #76/#77 re-rebased+re-eval, Track-3 PLAN-EVAL PASS
- 47e6cd48: merge --no-ff: sagas-telemetry-spans (#76) [IMPL-EVAL PASS, run 27860143991] — OTel saga.handle spans + W3C propagation, integrates #75 applied-key guard inside span, 54 tests, lock untouched
- 79f5840d: merge --no-ff: service-auth-seam (#77) [IMPL-EVAL PASS, run 27860144008] — two-port auth seam, composes with #78 graceful-shutdown, 58 service tests, zero new deps, lock untouched — BLOCKER BATCH COMPLETE (all 7 Wave-A slices merged)
- 3989e557: eval(track-2): service-auth-adapters plan PASS (cycle 1, run 27860702043, minimax-m3) — Plan-Gate ratified; 2 self-applied in-place fixes; node-compat + isolated-declarations as non-blocking impl follow-ups [OpenHands commit, synced to local umbrella]
- 695f34bb: chore(openhands): record run trace 27860702043-1 [OpenHands commit, no lock churn]
- 4e1e7a94: docs(harness): Track-4 auth-kv-oauth plan — research + plan + API + plan-meta [PLAN-EVAL dispatched on #73, minimax-m3]
- 2e543a74: squash-merge: service-auth-adapters (#83) [Track-2, IMPL-EVAL PASS cycle 1, run 27867455720, qwen3.7-max, no findings] — @netscript/auth-workos + @netscript/auth-better-auth; real WorkOS sealed-session + JWKS authenticators; better-auth wraps own prismaAdapter; ports consumed not redefined; catalog law + lock hygiene clean
- 04897c4f: squash-merge: sagas-prisma-store (#84) [Track-3, IMPL-EVAL PASS cycle 1, run 27867781018, qwen3.7-max] — PrismaSagaStore durable SagaStorePort, byte-exact KV version-mismatch parity, additive back-compat (zero-arg still KV-default), dispose wired into service+supervisor stop, NETSCRIPT_SAGA_STORE/--saga-store-backend flow-through; sole E2E database.init fail is pre-existing on base (reproduced on base), not a regression
