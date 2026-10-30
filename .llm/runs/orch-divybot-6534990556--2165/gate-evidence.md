# Gate evidence — #2165

Evidence below is derived from the repository structured wrappers. Raw local reports contain environment paths and are not copied into this public repository. Report hashes bind these summaries to the captured wrapper output; these summaries are not run-gate receipts.

## Acceptance

| Requirement | Evidence |
| --- | --- |
| Restart on persisted KV; next firing of every scheduled trigger processes and its job runs | `scheduled-idempotency_test.ts`: disk and Redis restart tests recreate scheduler, trigger processor, worker pool and worker idempotency store; close/reopen backend; assert previous applied markers still exist; both triggers execute jobs in next minute. |
| Same cron, same instant, both triggers run | disk and Redis concurrent firing tests assert both handlers enqueue and real worker dispatch executes both jobs. |
| Duplicate slot is deduplicated | disk and Redis separate-processor tests change provider timestamps by 123 ms and attempt to 2, assert TriggerDeduplicatedError and one job execution; queue redelivery also skipped by applied store. |
| Real provider semantics | cron adapter test uses real memory cron provider `trigger()` through `fireNow`, real wall-clock delay, repeated manual fire and a second scheduler instance; identical minute identity with differing actual timestamps. |
| Payload fallback and custom key | KV/memory store scope tests and processor definition-key/undefined-fallback tests; existing explicit enqueue action-key test preserved. |

## Commands and results

| Gate | Result |
| --- | --- |
| Structured regression test wrapper | Exit 0; 95 passed, 0 failed, 0 ignored. Includes all trigger-core tests, trigger plugin runtime tests, worker dispatcher suite and all 6 real persisted acceptance cases. |
| Structured check wrapper | Exit 0; 87 source/test files; 0 diagnostics; unstable KV enabled by wrapper default. |
| Structured lint wrapper | Exit 0; 96 files selected and processed, 0 findings. |
| Structured format wrapper | Exit 0; 96 files selected and processed, 0 findings. |
| Scoped quality scanner | Exit 0; no findings or allowances. |
| `deno task arch:check` | Exit 0, including dependency/reference lock checks; no doctrine failures. Existing warnings retained. |
| JSR package audit | Exit 0; existing ports/runtime folder-cardinality warnings and informational slow-types banner classification. |
| Package `publish:dry-run` | Exit 0, `Success Dry run complete`. |
| `deno task quality:gate` | Exit 1 on both untouched baseline and fixed tree: existing unsafe cast at docs/site/_plugins/markdown-render-fixture.ts:48. Root coverage passes. Broad gate is NOT green; independent arch and scoped quality scans pass. |
| Full-export structured documentation lint | Exit 1, 3 private-type-ref diagnostics on both baseline and fixed tree. Same file counts: workers core src/public/root.ts (2), trigger core src/contracts/v1/triggers.contract.ts (1). No missing JSDoc or other diagnostics; gate is NOT green. |
| Local scaffold.runtime | Not run, per explicit owner/coordinator instruction; CI e2e-cli gate belongs to coordinator. |

Commands (from repository root):

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen packages/plugin-triggers-core plugins/triggers/src/runtime plugins/workers/worker/job-dispatcher_test.ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-triggers-core --file plugins/triggers/src/runtime/scheduled-idempotency_test.ts --ext ts,tsx --deno-arg --frozen
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-triggers-core --root plugins/triggers/src/runtime --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-triggers-core --root plugins/triggers/src/runtime --ext ts,tsx
deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin-triggers-core --root plugins/triggers/src/runtime --max-allow 0
deno task arch:check
deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-triggers-core --text
deno task --cwd packages/plugin-triggers-core publish:dry-run
deno task quality:gate
deno task doc:lint --root packages/plugin-triggers-core --pretty
```

Supply NETSCRIPT_TEST_REDIS_URL privately to the test process; all Redis acceptance tests executed locally (none ignored). Redis server had AOF enabled. Deno KV is a disk database, not `:memory:`.

## Negative control

Temporarily restored these four production files from baseline `30c800958dbf512a4951d640f08748703a8b59e3`, leaving regression tests unchanged: cron adapter, TriggerProcessor, KV runtime stores, memory idempotency store. Ran the targeted structured test wrapper over the three changed core test files and plugin scheduled-idempotency test. Restored fixed production bytes in `finally`.

Exit 1; 11 passed, 10 failed, 0 ignored. All failures are assertions; no process/type failure. Failing tests:

- kv trigger payload fallback scopes identical payloads to the trigger
- memory trigger payload fallback scopes identical payloads to the trigger
- TriggerProcessor applies definition keys to claims, handlers and dispatched actions
- redis: two triggers on the same cron and instant both process and run their jobs
- disk: two triggers on the same cron and instant both process and run their jobs
- disk: duplicate scheduled slot across processors deduplicates despite firing jitter and retries
- redis: duplicate scheduled slot across processors deduplicates despite firing jitter and retries
- real cron provider gives repeated fireNow calls and separate processors one minute identity
- disk: scheduled triggers and their worker jobs survive processor restart on persisted KV
- redis: scheduled triggers and their worker jobs survive processor restart on persisted KV

The restart controls reach the worker reuse defect: first-run firing jitter deliberately gives the old payload fallback distinct input per trigger. On reopening the retained worker store, old scheduled_N keys cause skipped jobs in the next minute. Separate same-instant and duplicate-slot tests isolate the other two behaviors.

After restoration, the complete regression suite passed 95/95.

## Raw report digests

| Report | SHA-256 |
| --- | --- |
| regression-tests.json | `93598de6a7e865807be523bc367be6af23e93465f6adf13a35662e9815132673` |
| negative-original.json | `1d778d15e312ef0e5ba66dca33b5b9741e502f62e3145e158684230e75492855` |
| check.json | `acebc3ef077899505ef62dd46d292eb6dff8ddc2f2dd4f379dafae60d19c50b6` |
| lint.json | `036b5b1097d3e2bfe4a42bb535c9e8a79a77d411363a210990647d45ecbd1552` |
| fmt.json | `357623f29fc62ddc494caa822047e3ad8b24bcd1f5a8071a9bc92e360b968274` |
| quality-scoped.json | `10bbe80e70b03662997cd4c516a922dedeaa405aa437d72b3116a37bff8e55b9` |
| arch-final.log | `cf7cc4d47760934784800418b4c1b62237f1d54271465a69860396ef351bb031` |
| publish.log | `18ce9485143488d8d6c8e0cccd9829bf50285a44d86467638c036c828bf1e7c0` |
| doc-lint.json | `47a65373bbd2ce704df859a94f57cab4a437903a8d0ba1d7cd5243c0e6bbdb6c` |
| doc-lint-baseline.json | `4353b59df9b6c769358cb8bf4ca556fc1e5fefdddc15bf03862835ef286b8e95` |
| quality-baseline.log | `4bee553c780142429c273f7bbd9723b496acfde3a512169cca1c6ec9e68f34fd` |
| quality-final.log | `4bee553c780142429c273f7bbd9723b496acfde3a512169cca1c6ec9e68f34fd` |

Independent slice review passed with no blockers (slice-review.md). Review-thread gate: PASS, 0 threads and 0 unanswered at the implementation pass.
