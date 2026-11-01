# Gate evidence — issue 2187

All TS verdicts below come from the repository structured wrappers. Raw local reports and command receipts remain outside Git because they include environment paths. Digests below bind these public summaries to the captured output; summaries are not run-gate receipts. Broad quality and architecture were also executed through run-gate, with raw receipts retained privately. They attest commands on the S1 working tree, not source-cleanliness or merge readiness.

## Acceptance and additional owner proof

| Requirement | Evidence |
| --- | --- |
| Two modifies seconds apart reach the default handler | tests/file-watch-idempotency_test.ts: three disk-KV cases for missing, partial and null-mtime metadata; actual two-second interval between processing. The real-filesystem case also detects two physical writes two seconds apart through the upstream polling watcher, production adapter and processor, projecting unavailable stat metadata. |
| Same across persisted KV restart | Missing-metadata and same-snapshot tests stop/recreate processor + adapter and close/reopen the same disk database; a persisted sentinel proves the store is retained, and restarted event counter identity is explicitly asserted. |
| True duplicate blocked in flight, eligible after completion | Two production processors with separate disk-KV handles share one database. First handler waits behind a promise; second processor's same-mtime/size observation throws TriggerDeduplicatedError; release permits completion, then the duplicate reaches the handler. The same-snapshot restart test isolates zero completed retention. |
| Distinct missing-metadata events do not share a claim | Two observed events run concurrently through separate processors sharing disk KV. Both handlers enter before release. This isolates the UUID requirement when completed TTL is already zero. |
| Stable key covers trigger/path/kind/mtime/size | Colocated adapter tests change each field independently; same snapshot across adapter restart ignores callback time, contentHash and stableChecks. Zero-byte size is valid. Keys match a bounded namespace/SHA-256 format. |
| Unknown/partial metadata gets per-event identity | Six adapter cases cover absent/null/empty info, size-only, mtime-only and null mtime; each asserts UUID uniqueness within/across restarted adapters despite counter reuse. |
| Long keys and explicit caller policy | A synthetic valid-length path over 2 KiB passes through the production adapter and disk KV with bounded keys. Distinct mtime/size process; explicit positive TTL still rejects a completed duplicate. Separate control observes exact 24-hour webhook/scheduled defaults and explicit file TTL 0/60,000. Existing #2165 definition-key tests run in the full suite. |
| Documentation | docs/site/durable-workflows/triggers.md explains zero completed retention, tuple/UUID keys, override precedence, post-completion eligibility, worker dedup policy and upstream filters. |

## Final local gates

| Gate | Exit | Evidence |
| --- | --- | --- |
| Focused new tests | 0 | 17 passed, 0 failed, 0 ignored before the test placement-only move; all included in broader final suite. |
| Core + plugin runtime regression suite | 0 | 88 passed, 0 failed, 3 Redis-specific cases explicitly ignored because no test Redis endpoint was configured; all disk-KV/new acceptance cases ran. |
| Structured check | 0 | 88 source/test files, unstable KV + frozen graph, zero diagnostics. |
| Structured lint | 0 | 88 files processed, zero findings. |
| Structured format | 0 | 88 files processed, zero findings. |
| Scoped quality scan | 0 | zero findings and zero allowances. |
| Architecture/dependencies | 0 | arch:check includes dependency/reference-lock checks; no failures. Existing advisory warnings retained. |
| JSR audit | 0 | existing ports/runtime cardinality warnings; dry-run passes. No exports/dependencies changed. |
| Package publish dry-run | 0 | Success Dry run complete, normal no-slow-types bar. |
| Broad quality:gate | 1 | Same unsafe-cast finding as untouched main in docs/site/_plugins/markdown-render-fixture.ts:48; root coverage passes. This gate is NOT green. |
| Full-export doc lint | 1 | Same three private-type-ref diagnostics with both original and fixed production: workers-core public/root.ts (2), trigger-core contracts/v1/triggers.contract.ts (1). No missing JSDoc/other findings. This gate is NOT green. |
| Local scaffold.runtime | unrun | Explicitly prohibited by owner. No scaffold output or plugin wiring changed; coordinator controls any required e2e-cli CI label. |

Commands, repository root:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen packages/plugin-triggers-core plugins/triggers/src/runtime
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-triggers-core --ext ts,tsx --deno-arg --frozen
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-triggers-core --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-triggers-core --ext ts,tsx
deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin-triggers-core --max-allow 0
deno task quality:gate
deno task arch:check
deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-triggers-core
deno task --cwd packages/plugin-triggers-core publish:dry-run
deno task doc:lint --root packages/plugin-triggers-core
```

## Negative controls

Compared to `7907293f3dad3aeb557923809ddcd3435adae151`, restoring original production bytes while keeping all tests:

| Reverted scope | Exit | Passed | Failed | What this isolates |
| --- | --- | --- | --- | --- |
| Both adapter and TTL | 1 | 2 | 15 | All seven identity cases and all eight regression behavior cases fail. Original second-modify and same-snapshot completed/restart drops reproduced. |
| Adapter only | 1 | 9 | 8 | All seven identity cases plus concurrent distinct missing-metadata changes fail. Sequential observations still succeed under fixed zero TTL, as expected. |
| TTL only | 1 | 15 | 2 | Same-snapshot post-completion and same-snapshot persisted restart fail. |

All failures are identity/concurrency assertions or the expected semantic TriggerDeduplicatedError from an event that must be eligible. No type, process, timeout, or setup failures. Controls for long paths/different snapshots/explicit TTL and other-kind defaults pass on all versions. Concurrent true-duplicate rejection passes on original and fixed; its combined test fails only at post-completion eligibility when TTL is reverted.

Fixed production bytes were restored in finally and the broader final suite passed. Negative controls used the exact same test content before its placement-only move from src/runtime to tests/; all imports are public package subpaths, so relocation changes no behavior.

## Captured output digests

| Report | SHA-256 |
| --- | --- |
| regression-tests.json | `ccc9caf8cb443ee2f24a0f28a73d3397cf5e20a3f88f35ccd403c68b086cda36` |
| negative-both.json | `bc13ef2d1f03ad064b69116becb1f5e623e54b91ddbd0c48b06b8cc0fee4f63a` |
| negative-adapter.json | `ac1b703f9822d0036e19c72e87aaabb8a6655045db34cd9f59e9cc16bc6b73d4` |
| negative-ttl.json | `a02e1f887217e5ed2c66fef62e701b72a05c9e39430bef85f316a0d2180fc590` |
| scoped-check.json | `3987208e9d98f2f9b2101270ef9712c50ffd307eefc7ca53d60b78763ca7fb6d` |
| scoped-lint.json | `4a9dd4025815178a70efa9c3dee0eb860d4d0bd28e3df248147224b28849fcf8` |
| scoped-fmt.json | `9b0b0fccb2b22572b2ba4097d17648844b8e30445c75715582bbe8a1472e3dcf` |
| scoped-quality.json | `bf3a8440d12855a066233fb7edc8a8a8bacec4463eb43b59899dbd2b6e24aa17` |
| jsr-audit.json | `15964209d4fd57f4680c9cbd8565e7f8614a96ea1466aa6ce2ada61ab3819e44` |
| quality-receipt.json | `05f96df0bc4ec7a493d8f6efa731a8d8485736d64f6e1f4cdbe32b7e8dbd314f` |
| arch-receipt.json | `2d434253a34533be042b768c4612461ae796a93247d55385a2571cd68167f9ad` |
| publish.log | `1aee9973035cc153a0ad68b49718d15cf8cf5c60440a7688568e338dfc646c9a` |
| doc-lint.log | `9cb0fa7d8205f7b257ed818174c0679955178922d64d02e5e0c667fb1ee551aa` |
| baseline-doc-lint.log | `074a17d057aac8fc453754c09fa579901a25d8676216b63856eeed147a4ce4e6` |
| baseline-quality.log | `4bee553c780142429c273f7bbd9723b496acfde3a512169cca1c6ec9e68f34fd` |
