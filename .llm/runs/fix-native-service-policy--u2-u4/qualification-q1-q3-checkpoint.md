# Q1-Q3 native qualification checkpoint

The four Q1-Q3 owners are source-accepted by root in
[the exact-byte acceptance](root-qualification-q1-q3-source-acceptance.md), after
[scope authorization](root-qualification-scope-authorization.md). This is a draft source checkpoint,
not independent IMPL acceptance, all-gates success, readiness, merge or release.

The TCP probe now owns its native AbortSignal, deadline and connection through settlement. It
preserves the three attempts, two 2000 ms retry delays, query, provider/URI resolution, diagnostic
messages and startup soft failure. Child fixtures retain one stdout consumer through EOF, release
the reader in finally, bound readiness/cancellation/teardown and await status plus stderr. Fixture
and JavaScript --config paths use native fromFileUrl; module import URLs remain URLs.

The source delta is four existing owners, +332/-58. No API/export/configuration/lock/dependency/debt
owner changes. Original seven provider tests, three real subprocess controls, four malformed policy
inputs and U4 health401 oracle remain. Six additional TCP controls separate actual native
loopback EOF/refusal from four explicitly labeled deterministic unit scheduling cases. The latter
restore every builtin and close acquired native sockets; they do not establish an OS timeout claim.

| Owner under packages/ | Lines / cap | SHA256 |
| --- | --- | --- |
| service/src/diagnostics/database-connectivity.ts | 473 / 500 | 854e3c3356065560ebfb5759e1665ef0fc3ee8cecf8c75773d09f5df24147ee6 |
| service/tests/database-connectivity_test.ts | 293 / 360 | f1f8ee2dc7fdd8ce7861edcca412f74b9724cb382bee43529d30d491bfae5f3a |
| service/tests/legacy-abort_test.ts | 199 / 230 | 8781d5d9144250b5554d6e53b84d7b54f54938c5b0f685ee484082d935a56a0c |
| plugin/tests/service/create-plugin-service-auth_test.ts | 204 / 230 | 24cd6d86f27e147f09d71c1afaf9b66f9a0a13fb5c694763f9ea62846db42c28 |

## Actual validation

Raw receipts and failed attempts are retained byte-for-byte behind the
[evidence manifest](evidence/qualification-sol-20261028/manifest.json). Baseline is
815122a889c4ef5bc203a6cd615cab7f8b97a673, exact isolated worktree
C:/Users/ericc/source/repos/netscript-native-service-policy-008, native Deno2.9.7 and the existing
warm cache. Root successfully initialized that exact worktree immediately before dispatch. Installed
NetScript MCP find_guidance/get_doc and the exact offline service lifecycle docs were used.

| Gate | Measured result | Receipt |
| --- | --- | --- |
| Unchanged Q1 | 10 pass / 2 timer-leak failures | [RED](evidence/qualification-sol-20261028/q1-unchanged-red.json) |
| Additional unit tests, unchanged production | 0 / 4 signal-delivery assertion failures | [RED](evidence/qualification-sol-20261028/q1-unit-red.json) |
| Q1 final, DB plus unchanged defineService | 18 / 0 / 0 | [report](evidence/qualification-sol-20261028/q1-final.json) |
| Unchanged Q2 | 0 / 3 stdout-leak failures | [RED](evidence/qualification-sol-20261028/q2-unchanged-red.json) |
| Q2 final | 3 / 0 / 0 | [report](evidence/qualification-sol-20261028/q2-final.json) |
| Unchanged plugin service consumers | 10 / 1 Windows config-path failure | [RED](evidence/qualification-sol-20261028/q3-unchanged-red.json) |
| Plugin service consumers final | 11 / 0 / 0 | [report](evidence/qualification-sol-20261028/q3-green.json) |
| Broad consumers | 26 / 0 / 0 | [report](evidence/qualification-sol-20261028/consumers.json) |
| Whole service | 626 / 3 / 0; 629 total, including six new tests | [report](evidence/qualification-sol-20261028/whole-service.json) |
| Selected types / lint / format | 127 selected each, zero findings; lint/format127 processed, zero drops/refusals | [types](evidence/qualification-sol-20261028/check-final.json), [lint](evidence/qualification-sol-20261028/lint-final.json), [format](evidence/qualification-sol-20261028/fmt-final.json) |
| Public docs | Eight service exports, zero errors | [report](evidence/qualification-sol-20261028/doc-lint-child.json) |
| Quality / direct doctrine / JSR surface audit | Exit0, existing warnings/allowances retained; JSR dry-run subcheck intentionally delegated to the full workspace gate | [quality](evidence/qualification-sol-20261028/quality-scan.receipt.json), [doctrine](evidence/qualification-sol-20261028/doctrine.stdout.log), [JSR](evidence/qualification-sol-20261028/jsr-audit.json) |
| Full workspace publication dry-run | PASS, 79 seconds; scratch removed | [receipt](evidence/qualification-sol-20261028/publish-dry-run.receipt.json) |
| Composite arch:check | FAIL at the separate DB identity prerequisite, before doctrine | [receipt](evidence/qualification-sol-20261028/arch-check.receipt.json) |

Every test command used --cached-only --frozen --check --allow-all --sanitize-ops
--sanitize-resources, with --trace-leaks. The six new DB registrations explicitly set
sanitizeOps/sanitizeResources/sanitizeExit=true. The seven original DB tests, five unchanged
defineService tests, three Q2 tests and eleven Q3 consumers retain their existing shorthand
registrations: ops/resources are enabled by the runner flags; exit sanitization retains Deno's
default, not a newly added per-test option. No selected test owner contains a false sanitizer
override. Whole service and broad consumers use the same runner flags, without altering their
existing registrations. Diagnostic Q4 registrations explicitly set all three options true.

The whole-service failures are exactly the two unchanged Q4 requestBody leaks and the unchanged
native mapped-IPv4 Windows refusal. All remain failed and unwaived. There was no Linux control,
app/provider/CEF/AppHost/installer launch, expensive CLI E2E, real publication or model/evaluator
dispatch. Independent IMPL is pending on a separate session and vendor family.

Initial failures remain visible: the supplemental test's accessor/value descriptor setup error,
the first Q1 GREEN attempt's late-socket cleanup double-close (17/1), unsupported info flags,
diagnostic import/frozen setup failures and audit-tool UTF16/checkout-line-ending mistakes. Those
audit issues were corrected in the evidence tool; product files and the lock were not changed.
The composite architecture task's reference-lock child printed an npm metadata download attempt
despite the top-level cached/frozen invocation; this is retained, not characterized as an offline
gate. It did not change the lock or dependency owners.

The [final audit](evidence/qualification-sol-20261028/final-audit.json) matches all four accepted
hashes and all25 protected owners against the baseline checkout bytes. It includes U2/U4 source,
tests/docs, builder/types, Q4, mapped-peer, fixtures, debt, config/lock and plan/verdict owners.
The lock uses checkout line endings; the final audit applies git's checkout filters rather than
mistaking raw blob LF for a changed Windows file. Cleanup found no matching fixture process,
diagnostic temporary directory or root package.json. Publication scratch returned to its empty
baseline. Explicit native sanitizers establish the tested operation/resource cleanup limits.

## Q4 attribution and proposed next scope

Q4's two source/test owners remain byte-identical. The original real RPC/OpenAPI controls still
fail0/2 with requestBody leakage. The resource-only trace supplied no allocation stack. The
operation-name filter emitted no matching records and supplies no additional operation attribution.

Separate ignored diagnostics split the original real-listener fixture by framing. They run the
same native service, router and response assertions; successful variants do not replace acceptance.

| Diagnostic | Result | Evidence |
| --- | --- | --- |
| Declared Content-Length only | 2 / 0, no resource leak | [report](evidence/qualification-sol-20261028/q4-declared-only.json) |
| Genuinely chunked only | 0 / 2, same requestBody leak | [report](evidence/qualification-sol-20261028/q4-chunked-only.json) |
| Cancel and release the exact reader acquired by Hono | 2 / 0 | [report](evidence/qualification-sol-20261028/q4-chunked-reader-cleanup.json) |
| Assert exactly one acquired native reader and rawBody.locked=true after413, then cancel/release it | 2 / 0 | [report](evidence/qualification-sol-20261028/q4-chunked-reader-cleanup-asserted.json), [observations](evidence/qualification-sol-20261028/q4-chunked-reader-cleanup-asserted-ownership.jsonl) |

The reader-capture instrumentation exists only in the archived diagnostic source. Its per-instance
getReader decoration records the actual reader used by pinned Hono; it does not mock transport or
replace a product owner. Cancelling that exact reader before running.stop removes the native leak.
Together with the framing split, this attributes the resource to the incoming chunked request body
retained by Hono's early rejection, rather than the client response or listener shutdown.

Pinned [Hono4.13.13 source](https://raw.githubusercontent.com/honojs/hono/v4.13.13/src/middleware/body-limit/index.ts)
acquires rawReader with getReader, then returns onError(c) when size exceeds maxSize without
cancelling or releasing that reader. Its declared-length branch returns without acquiring a
reader. The [cached source extract](evidence/qualification-sol-20261028/q4-hono-pinned-source.ts.txt)
and its graph/source hashes are in the final audit. Root independently inspected
[current main](https://raw.githubusercontent.com/honojs/hono/main/src/middleware/body-limit/index.ts)
and found the same pattern; no newer-version fix is claimed.

Prefer the minimal correction at that upstream reader owner: cancel on oversized rejection and
release the reader in finally on every completion/error, while retaining Hono's sole size resolver,
onError response contract and bounded reads. This requires explicit upstream/dependency scope and
cleanup-error ordering review; it is a proposed repair, not authorized code or a verified fix.
Simply calling c.req.raw.body.cancel() in the current NetScript onError callback cannot own this
reader because the stream is locked. A test fixture monkeypatch is not a product remedy.

If root instead selects a NetScript adapter, bound it to the existing body-limit primitive and test
owners: a lazily acquired, separately cancellable native source behind a zero-prefetch forwarding
stream could let Hono retain the size decision. That candidate remains unimplemented/unproven. It
must prove cancellation with a locked downstream reader, native source settlement, error/413
ordering, genuine client disconnect, header-only rejection and the original LIMIT+CHUNK byte bound;
it must not copy Hono's size loop or cancel successful requests. The original full body-limit owner,
both projections, typed413/CORS, under-limit200, declared/chunked framing, auth401-before413,
bodyless paths, disabled-limit200 and invalid maxBytes remain mandatory gates. Root must select the
narrow remedy and any additional scope before either Q4 owner changes.

The proposed NetScript owner limits remain exactly
packages/service/src/primitives/body-limit.ts112 to at most160 lines and
packages/service/tests/body-limit_test.ts254 to at most320. No builder, listener, CORS, auth,
dependency, lock, public API, new helper owner or test waiver is selected. An upstream Hono change
and its eventual adoption require separate scope; neither is included in this checkpoint.

Selected Q1-Q3 route: straightforward implementation, native gpt-6.1-sol/xhigh. Root recorded
PLAN-EVAL N/A for these fixed-behavior repairs. No evaluator/fallback/paid route was launched.
