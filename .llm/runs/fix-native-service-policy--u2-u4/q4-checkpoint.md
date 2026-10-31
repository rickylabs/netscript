# Q4 native body ownership checkpoint

Root accepted the exact two-owner resource repair after source/native-control review and an
independent29-hash audit. [Source acceptance](root-q4-source-acceptance.md) follows
[bounded scope](root-q4-bounded-resource-scope.md) and the
[three-line handler-entry correction](root-q4-review-correction.md). Independent IMPL, readiness,
merge and release remain pending; the mapped-IPv4 Windows and cold DB gates remain unwaived.

The adapter adds lazy, zero-prefetch ownership of Hono's native chunked/unknown-length source.
Hono remains the sole size/framing/413 resolver. Bodyless and declared-length requests retain the
original resolver path. Native Request method/headers/signal are preserved. Completed readers are
released; unfinished readers are cancelled and released without replacing413 or a primary failure.
There is no clone/tee, drain/counting loop, third-party fork, dependency change or public API change.
Delete the adapter after adopting an upstream ownership correction that passes these controls.

Two existing owners changed, +109/-1:

| Owner under packages/service/ | Lines / cap | SHA256 |
| --- | --- | --- |
| src/primitives/body-limit.ts |152 /160|cf570dcb7a4a65f19e9ee992f3c2273879f567b710990d045c5a462941cc82b1|
| tests/body-limit_test.ts |322 /322|c056cb621def1fa3ce4e032a60a1353eba2f3c4bcf9432647a7d9febdaa935a0|

All12 original tests/assertions remain. Existing native RPC/OpenAPI fixtures additionally assert
chunked under-limit200, CORS on chunked413 and actual incoming-reader release. Two new native
socket/fetch controls explicitly enable all three sanitizers: partial-upload disconnect asserts
zero handler entries; completed chunked input asserts one entry and exact primary Error/503.
The counter is an explicit correction to the earlier, insufficient error-inequality inference.

The [byte-audited manifest](evidence/q4-sol-20261028/manifest.json) retains original RED, all failed
implementation attempts, original broad receipts and the final test-only correction. Earlier
handoffs are historical; this acceptance/correction supersedes their pending status and any claim
that error inequality alone independently proved zero entries. Twenty-seven protected owners,
including Q1-Q3, U2/U4, mapped-peer, config/lock/debt and plan/verdict files, match baseline7cfa593e.

| Gate | Actual result | Receipt |
| --- | --- | --- |
| Original whole owner RED |10 pass /2 requestBody leaks /0 ignored|[report](evidence/q4-sol-20261028/owning-unchanged-red.json)|
| New controls, unchanged production RED |12 /2 /0|[report](evidence/q4-sol-20261028/owning-controls-red.json)|
| Final corrected owning |14 /0 /0|[report](evidence/q4-sol-20261028/correction-owning.json)|
| Final changed-test types/lint/format |1 selected and processed,0 findings/drops/refusals|[types](evidence/q4-sol-20261028/correction-check.json), [lint](evidence/q4-sol-20261028/correction-lint.json), [format](evidence/q4-sol-20261028/correction-fmt.json)|
| Whole service, same final production bytes |630 /1 /0; only mapped-IPv4 Windows refusal|[report](evidence/q4-sol-20261028/whole-service.json)|
| Broad consumers |26 /0 /0|[report](evidence/q4-sol-20261028/consumers.json)|
| Service types/lint/format |126 selected each,0 findings/drops/refusals|[types](evidence/q4-sol-20261028/check.json), [lint](evidence/q4-sol-20261028/lint.json), [format](evidence/q4-sol-20261028/fmt.json)|
| Public docs |8 exports,0 diagnostics|[report](evidence/q4-sol-20261028/doc-lint-child.json)|
| Quality/direct doctrine/JSR surface |Exit0, existing warnings/allowances retained|[quality](evidence/q4-sol-20261028/quality-scan.receipt.json), [doctrine](evidence/q4-sol-20261028/doctrine.process.json), [JSR](evidence/q4-sol-20261028/jsr-audit.json)|
| Full workspace publication dry-run |PASS;81 seconds, scratch removed|[receipt](evidence/q4-sol-20261028/publish-dry-run.receipt.json), [cleanup](evidence/q4-sol-20261028/cleanup.json)|
| Composite arch:check |FAIL at separate cold DB identity prerequisite before doctrine|[receipt](evidence/q4-sol-20261028/arch-check.receipt.json)|

Every test invocation enabled ops/resources sanitizers plus trace-leaks with cached/frozen/check.
The two new registrations explicitly set sanitizeOps/sanitizeResources/sanitizeExit=true; original
shorthand registrations retain their settings and Deno's exit-sanitization default. Root explicitly
retained broad/publication receipts for the unchanged production bytes after the three-line
test-only strengthening; no redundant rerun occurred. The nested architecture metadata-fetch attempt
is retained; no lock/dependency owner changed. No Linux platform claim or gate waiver is inferred.

The retained failed attempts include the overly broad native-lock assertion and unsupported
immediate abort-signal timing assertion, plus the initial formatted fixture cap overrun. Their
corrections did not remove original controls. No evaluator/model/app/AppHost/CEF/installer,
expensive CLI E2E, merge or real publication was launched. This is a root-accepted draft checkpoint,
not independent IMPL certification or all-gates success.
