# S3e proposal: caller AbortSignal stops the workers listener

PREPARATION ONLY. No next native turn is authorized. Base: `b8168c2c9e4352c7354dcd2e47a181f76d986698`,
branch `fix/native-host-policy`, worktree `C:/Users/ericc/source/repos/netscript-native-host-policy-008`.
S3d is root-accepted and pushed; U2's read-only baseline comparison has priority over any runtime
test or model launch in this worktree.

## Decision and footprint

Propose one new focused test owner, `plugins/workers/services/src/service-lifecycle_test.ts`,
target 100–140 lines, cap 180. The accepted conformance owner already has 461 lines; appending the
remaining lifecycle proof there would invite unreadable compression. No production, helper,
permission, configuration, lock, dependency, fixture-PEM or public-export change is proposed.
Prospective U1 footprint becomes 17 owners: the previous 16 plus this test owner. This is a new
root scope decision, not an authorization attributed to the original evaluator.

The existing 8 tests remain exact. Frozen source SHA256:

| Owner | Lines | SHA256 |
| --- | ---: | --- |
| `service_test.ts` | 175 | `789da15ef02bd889bc053b965366d4097457062ffcdfba8e1a16f6ae57e6c08c` |
| `service-test-fixture.ts` | 242 | `6f8c0bc3d59ae4c8847097e8f124664238cde352dc0d7bf2a563dcb48d1408d2` |
| `service-conformance_test.ts` | 461 | `89f89312b14186f5bdcda52ac813d7e306f698c4b39f22390669c26227c8407d` |
| `service.ts` | 136 | `bffb5f4849d7ba70a69d5d5f927bf1550684a5cf341d84247f4c5e33392baa12` |
| `../mod.ts` | 99 | `67d44d87d42f3d72f9d8cf1f63715047ceeedf51c79be70a85954c18b0bb904d` |

## Executable oracle

One parent `Deno.test`, with resource/op/exit sanitizers explicitly enabled, runs two fresh owned
children through the unchanged `createSandbox` HTTP mode. Each uses the existing 30,000ms child
deadline, 32KiB per-stream cap and finite settlement grace. Keep CLI cwd/config and the exact
loopback/scratch permission list unchanged. No process, FFI or sys permission is added.

Both children use the same checked stdin fixture except for presence of `serve.signal`:

1. Inside the cleanup-protected try, set runtime cwd to the exact owned scratch, initialize its
   public Deno KV with `getRawKv({ provider: 'deno-kv', path: scratch + '/owned.sqlite',
   skipServiceDiscovery: true })`, then dynamically import the public
   `@netscript/plugin-workers/service` factory. Use the already compiled minimal typed
   `PluginServiceContext`, synthetic explicit public-policy reason, hostname `127.0.0.1`, port 0,
   `handleSignals: false`, and a caller-owned `AbortController`. No private registry or real data.
2. Require a real successful `/api/v1/workers/describe` HTTP response with its body consumed before
   cancellation. Assert the allocated address is loopback TCP and a positive port.
3. Abort the caller controller. BEFORE any manual `RunningService.stop()`, require
   `Deno.listen({ hostname: '127.0.0.1', port: priorPort })` to succeed and close that probe listener.
   Use a fixed 2,000ms monotonic observation deadline with finite 10ms waits; retry only actual
   `Deno.errors.AddrInUse`. All other errors fail immediately. Expiry throws exactly
   `Error('ABORT_DID_NOT_RELEASE')`. This is bounded observation, not a production retry change.
4. Only after that oracle, stop the native handle idempotently and prove owned raw KV set/get still
   works before test-owned `closeKv()`. Always settle the handle and KV after real failure too;
   preserve the primary error first in any `AggregateError`. Initialization and dynamic import are
   inside this protection. Print a unique final success marker once only after all cleanup.

The signal-present child must exit 0 with exactly one final marker. The signal-omitted child still
aborts its controller but must exit 1 at the intended `ABORT_DID_NOT_RELEASE` oracle, with no success
marker. It must settle its listener/KV in cleanup after that failure. A type, permission, setup,
watchdog, output-cap or cleanup failure does not qualify as this negative. This control does not
mutate product code or weaken the positive's deadline. Preserve both complete bounded outputs.

No endpoint response is left unconsumed on an assertion path. No default host, real OS signal,
network beyond the existing loopback authority, fake clock, private accessor or global hook is used.
`RunningService` has no public completion accessor; successful port rebind before `stop()` is the
observable listener-release proof. This slice does not qualify in-flight draining or legacy main.

## Source authority and gates

MCP `search_docs("ServeOptions signal graceful shutdown")` and exact
`get_doc("pages/orchestration-runtime/how-to/graceful-shutdown")` were consulted during preparation.
The local source is authoritative: `packages/service/src/builder/service-listener.ts` registers an
external abort listener that calls native shutdown and awaits the server, then removes that listener;
the accepted workers factory passes `serve` directly. No new API is guessed.

After the proposed single native turn settles, require all 9 focused tests (the accepted 8 plus this
one), selected 4-owner frozen/cached type check, lint and formatter checks against final source,
normal sanitizers, exact old-source/argv equivalence, original PLAN/debt verdict hashes and all
existing protected config/lock/source guards. Preserve any first RED or timeout. Check the new
owner for casts, `any`, suppressions and unbounded resource paths. Root reads the exact diff and
receipts before acceptance or any checkpoint commit/push/PR update.

## SKILL and proposed launch

Use the current released NetScript Harness/doctrine and existing public agentic suite; route and
architecture authorization remain those already recorded for U1. Use installed NetScript MCP/docs
actively. Proposed ONE WRITE-FIRST native Fable turn, SAME session
`78688d7e-3418-4dde-87c6-44df172768d5`, maximum 300 seconds, ordinary first-party authenticated route,
strict NetScript-only MCP, requested xhigh versus observed effort kept distinct. Write only the new
owner, then the listed gates; do not restart broad research. Rebind the runner to this exact HEAD and
fresh hashes only after root approves this owner/budget and authorizes launch. No launch is included
in this preparation.

## Limits, rollback and remaining work

If the new owner cannot fit readably or a real signal failure appears, retain the actual candidate
and report the precise scope/semantic finding; do not change production or widen authority.
Rollback of the proposed source leaf is deletion of its new test owner, leaving accepted product and
test bytes intact. S3 signal acceptance would still leave in-flight drain, legacy delegation, PORT
policy, full retained workers/streams/consumer suites, S7/publish and independent IMPL gates open.
The numeric workers facade F5 remains the named `DEBT_ACCEPTED` entry, never PASS.

Separate documentation finding: the accepted conformance file's old introductory sentence says
"Nothing here starts a listener or opens KV." Its later accepted HTTP/TLS tests do both. This proposal
does not silently alter that frozen file; a precise later comment-only correction needs root scope.
