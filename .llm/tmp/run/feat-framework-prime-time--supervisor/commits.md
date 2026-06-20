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
