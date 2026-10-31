# Q4 source handoff for root review

The two original requestBody leaks are resolved in actual native owning and broad runs. Return for
root source review before any commit/push. Base remains7cfa593e198ade668d531d2bdafa336ff6ca5709;
scope authority root-q4-bounded-resource-scope.md SHA256
6676a2e4cf932d903dfba69c40a719b5e2c4317c87abf49d21b728bd08381dd0.

Exactly two existing product owners changed, +106/-1:

| Owner | Lines / cap | SHA256 |
| --- | --- | --- |
| packages/service/src/primitives/body-limit.ts |152 /160|cf570dcb7a4a65f19e9ee992f3c2273879f567b710990d045c5a462941cc82b1|
| packages/service/tests/body-limit_test.ts |319 /320|8733cdf505357dc7c5ac0c6004bad0162d813dbc2cf8db218694a15e8f43a636|

[Complete diff](two-owner.diff), [source hashes](source-hashes.json), [protected audit](final-audit.json).
All27 protected owners match baseline checkout bytes, including all four Q1-Q3 owners, U2/U4,
mapped-peer control, fixtures, config/lock, debt, plans and verdicts. No API/export/dependency,
configuration, new helper owner, third-party fork, production monkeypatch or test waiver.

The adapter only adds ownership to the source Hono reads for chunked/unknown-length requests.
Bodyless and declared-length requests call the same native resolver directly. Header presence
selects ownership eligibility; Hono still resolves all framing/size/413 outcomes. No byte counting
or draining loop was added. A zero-high-water-mark forwarding stream lazily acquires the original
native reader on pull, preserving method/headers and explicitly following the native request
signal. Finally cancels an unfinished acquired source and releases its reader. Completed sources
are released without cancellation. Cleanup rejection does not replace the selected Hono413 or
primary read/downstream error. The comment records removal when upstream owns its rejected reader.

All12 original tests and their assertions remain. Native RPC/OpenAPI fixtures additionally cover
chunked under-limit200, CORS on chunked413, and release of the captured actual incoming source
reader. Two new native controls use a real Deno listener and socket/fetch: mid-upload disconnect
cannot reach the handler and settles through error cleanup; a completed chunked body reaches the
handler intact and preserves the exact thrown primary Error object and503 response. No mocked
transport or builtin override is used. Both new registrations explicitly set all three sanitizers.

| Gate | Actual result | Evidence |
| --- | --- | --- |
| Original full owning RED |10 pass /2 requestBody failures /0 ignored|[report](owning-unchanged-red.json)|
| New controls, unchanged production RED |12 /2 /0, same two leaks|[report](owning-controls-red.json)|
| Final owning GREEN |14 /0 /0|[report](owning-final-green.json)|
| Whole service |630 /1 /0,631 total; only unchanged mapped-IPv4 Windows refusal|[report](whole-service.json)|
| Broad consumers |26 /0 /0|[report](consumers.json)|
| Types / lint / format |126 selected each; lint/fmt126 processed,0 drops/refusals,0 findings|[types](check.json), [lint](lint.json), [format](fmt.json)|
| Public documentation |8 exports,0 diagnostics|[report](doc-lint-child.json)|
| Quality / direct doctrine / JSR surface |Exit0; existing warnings/allowances retained; JSR dry-run subcheck delegated to whole-workspace publication gate|[quality](quality-scan.receipt.json), [doctrine](doctrine.process.json), [JSR](jsr-audit.json)|
| Full workspace publication dry-run |PASS,81 seconds; scratch removed|[receipt](publish-dry-run.receipt.json), [cleanup](cleanup.json)|
| Composite arch:check |FAIL, separate DB identity prerequisite before doctrine|[receipt](arch-check.receipt.json)|

Every native test invocation used --cached-only --frozen --check --allow-all --sanitize-ops
--sanitize-resources --trace-leaks. Original shorthand registrations retain their options and
Deno's exit-sanitization default; the two new registrations set sanitizeOps/sanitizeResources/
sanitizeExit=true explicitly. The unchanged mapped-IPv4 and DB gates remain open and unwaived.
No Linux result, all-gates acceptance, independent evaluation, readiness or release is claimed.

Retained failed implementation attempts: owning-green.json reports an added lock assertion that
incorrectly included declared-length handler readers; it was narrowed to the adapter-owned native
chunked source. owning-final.json reports an added assertion that assumed AbortSignal.aborted
was already true inside the native body-read error callback; its timing assumption was incorrect
and it was removed. The actual disconnect/error control remains, with native sanitizer coverage.
The first formatted test draft exceeded its cap; normal fixture setup was simplified and the final
formatted owner is319 lines. No original assertion was removed. Earlier Q1-Q3 evidence remains
unchanged in its committed checkpoint. The architecture task again printed a nested npm metadata
fetch attempt; its failure remains retained, and no lock/dependency owner changed.

Root must review this complete diff and actual gates before any checkpoint. Independent IMPL
remains a separate session/vendor-family gate. No evaluator/provider/app/AppHost/CEF/installer,
expensive CLI E2E or real publication was launched.
