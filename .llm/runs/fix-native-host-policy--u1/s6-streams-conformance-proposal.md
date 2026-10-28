# S6 streams runtime qualification proposal

PROPOSAL ONLY, against accepted/pushed S5 `816fcf7ea7b20efb398bc0640f5b60f283248c08`.
No product/test application, listener launch, inference, commit or push was performed for this
proposal. Native Astra remains the selected architecture lane. Root review precedes application.
Recommend authorizing S6a first, then the bounded checkpoints below after each source acceptance.

## Audited native boundaries

The shortest chain is the public `@netscript/plugin-streams/service` factory, native plugin builder,
native front listener, unchanged proxy, and `createStreamsServer` over pinned
`@durable-streams/server` 0.3.9. No application, Aspire, provider, installer or alternate launcher.
Streams owns no Deno KV. Do not transplant the workers synthetic-KV ceremony into these tests.

`service.ts` is 163 lines, SHA256
`3628a4d991e0e717df0c5eb13b6ed3b609ba26fee6eee877d0852c48e88892eb`.
It already forwards auth and serve, adds the actual 6/9/12 protocol defaults, probes storage,
starts a loopback upstream, and installs native upstream stop as a shutdown hook. Its catch awaits
upstream stop and rethrows the original error. Keep this production owner frozen throughout S6.

`startServiceListener` calls real `Deno.serve`, installs the caller signal and platform signal
handlers, and returns `RunningService`. Its coordinator drains HTTP before LIFO shutdown hooks.
`stop()` returns void; hook failures/timeouts become logged reports, not necessarily rejections.
Therefore successful stop settlement alone cannot establish upstream cleanup. Require actual front
and upstream rebind, plus file reopen/replay where applicable. Do not test forced drain timeout as
if it guaranteed upstream closure: native code skips hooks once the drain budget is exhausted.

The native upstream owns Node HTTP, subscriptions, pending long-polls, SSE responses and file store.
Its stop cancels waits/subscriptions, ends SSE, closes HTTP, then closes file storage. Early close
failure can reject before file close. No direct store close or private-field replacement is proposed.
Normal bounded request draining is in scope; forced-timeout repair and general SSE redesign are not.

The pinned `@std/net` 1.0.7 allocator calls `Deno.listen({ port })` without a hostname, including its
ephemeral probe. That transient bind uses `0.0.0.0`; the subsequent upstream explicitly binds
`127.0.0.1`. A purely loopback permission list cannot start this unchanged chain. Preferred ports
are advisory: occupied preferred ports fall back to port zero. Tests must verify the actual expected
upstream using a unique stream payload, not assume the environment value proves its address.

The server module imports LMDB even for memory mode. Locked LMDB is 3.5.7; its native loader probes
package directories and the executable's adjacent prebuild directory before loading the cached
Windows N-API addon. Existing storage-restart tests use `--allow-all` and process termination;
they are preserved, but are not the bounded S6 fixture or proof of native manual cleanup.

Installed MCP `find_guidance`, literal `search_docs`, and `get_doc` for graceful shutdown and streams
were used. Exact repository listener/shutdown/types, plugin composition/CORS/auth, proxy/sanitizer,
durability/bounded-store, native server/loader and current tests were read. The corpus reference
still lists the old streams surface; accepted source is authoritative for the new `./service`.
`rfcs/README.md` is the actual RFC index (not `docs/rfcs`); no streams-host RFC exists there.
RFC0001's borrowed nested identity rule and RFC0002's existing execution-boundary principle agree
with this test-only composition plan; neither authorizes a new runtime or expands this task.

## Exact owner budgets

Paths below are relative to `plugins/streams/`. New test owners are separate from frozen S4.

| Checkpoint | Editable owner | Current | Target / hard cap |
| --- | --- | ---: | ---: |
| S6a | `services/src/tests/test_utils/service-runtime-fixture.ts` | absent | 240-280 / 300 lines |
| S6a, S6b | `services/src/service-runtime_test.ts` | absent | S6a 230-290; final 340-410 / 430 |
| S6c | `services/src/service-tls_test.ts` | absent | 170-200 / 220 |
| S6d, S6e | `services/src/service-lifecycle_test.ts` | absent | S6d 160-210; final 330-400 / 430 |
| S6f | `services/src/service-storage_test.ts` | absent | 180-230 / 260 |
| S6g | `services/src/service-legacy_test.ts` | absent | 170-220 / 250 |
| S6g | `services/src/main.ts` | 137 lines | 35-50 / 55 |
| S6g | `README.md` | 254 lines | add 45-60 / total 314 |

Eight owners total: six new internal fixture/test files and two existing legacy/documentation owners.
Only the first two belong to initial S6a. Later appends preserve accepted prefixes byte-exact unless
root reviews a concrete exception. No new shared cross-plugin helper. No package manifest, public
facade, production factory, lock, configuration, storage/proxy/native package or debt edits.
No growth of the separate exact21 streams F5 DEBT_ACCEPTED inventory (owner coordinator+rickylabs,
target 2026-11-10); workers22 stays separate. Original plan/evaluator factual errors remain intact;
the actual defaults are 6 methods, 9 allowed headers and 12 exposed headers.

## Fixture and authority proposed for S6a

Use the existing bounded Deno.Command/stdin mechanism, adapted into a streams-owned fixture under
excluded `tests/test_utils`. Preserve checked TS stdin, frozen/cached-only graph, 32 KiB per pipe,
30-second child deadline and 2-second termination settlement. Await child status and both pipes;
kill only the owned child on overflow/deadline. Keep primary failure first, cleanup errors secondary,
and print one final success marker only after all handles/clients/listeners and scratch settle.
Each Deno.test explicitly enables sanitizeOps, sanitizeResources and sanitizeExit.

The parent uses the existing repository test wrapper and portable Deno2.9.7/public cache. It may
launch only that executable and create/read/remove its owned scratch. It needs no native addon.
Each runtime child gets clearEnv, scratch HOME/USERPROFILE/LOCALAPPDATA/TEMP/TMP/XDG roots,
explicit public DENO_DIR/SystemRoot/PATH, no inherited credentials or ambient streams/TLS/CORS keys.
Child working directory becomes scratch before dynamic factory import under cleanup protection.
No `--allow-all`, child subprocess permission, dependency install, reload or global configuration.

Proposed positive runtime argv, in addition to `run --check --frozen --cached-only --ext=ts`:

- `--allow-env`, against the cleared synthetic environment, for native configuration/logging/loaders.
- `--allow-net=127.0.0.1,0.0.0.0:0,0.0.0.0:<owned-preferred-upstream-port>`; the two wildcard entries
  are explicit allocator opt-ins, not a changed upstream hostname. Port values are validated positive
  integers chosen by an owned loopback port-zero listener, closed immediately before startup.
- `--allow-read=<scratch>,<public-DENO_DIR>/npm,<portable-toolchain-directory>` for storage and native
  package/prebuild lookup; `--allow-write=<scratch>` only. Module graph loading retains Deno's normal
  frozen/cached loader semantics; no repository-wide runtime read grant.
- `--allow-ffi=<cache>/npm/registry.npmjs.org/@lmdb/lmdb-win32-x64/3.5.7/node.napi.node,
  <cache>/npm/registry.npmjs.org/@msgpackr-extract/msgpackr-extract-win32-x64/3.0.4/node.napi.node`.
  Validate both existing file paths before dispatch; do not download or substitute ABI binaries.
- `--allow-sys` matches the existing supported streams start task; this proposal does not claim it
  is the minimum runtime syscall set. Keep `--deny-run`. Native FFI remains trusted native code:
  Deno path restrictions are not a containment claim for what that addon itself can do.

These are new fixture permissions needing root scope selection, not inherited workers authority.
The workers fixture remains unchanged. No wildcard hostname beyond exact allocator ports; legacy
front wildcard authority is a separate S6g opt-in. If native startup needs any additional read,
write, FFI, host, executable or graph privilege, retain the exact failure and return before broadening.

S6a's first test has fresh paired children: approved allocator opt-in succeeds; omitting its
wildcard entries reaches the exact native network permission refusal for `0.0.0.0`, with no success
marker. Verify type/operation/endpoint, not just nonzero exit. A separate native-addon-denied child
must retain the actual native loader diagnostic and underlying FFI denial; wrapper text alone is
not a permission pass. If that diagnostic is not inspectable without casts, report the control as
unqualified rather than weakening it. All permission controls use the same factory, valid auth and
explicit port0, and cannot pass on compiler, storage, timeout or unrelated permission failures.

## Executable checkpoints and falsifying controls

**S6a: real plain HTTP and permission boundary (2 new tests; owning total6).** After fixture controls,
start two real factory instances with distinct selected upstream ports and front `127.0.0.1:0`.
Set invalid ambient PORT/STREAMS_PORT to prove explicit0 wins. Guard the raw surface with native
`protect: ['/']`; explicitly allow health paths. Exercise missing/wrong credentials401, throwing
authenticator503, denied principal403, and successful authenticated PUT/POST/GET against a unique
stream path, consuming every response. Native ports record their actual `this`, method/path and
principal object identity. The second explicit-public instance accepts credentialless requests,
has independent data, and stays usable after repeated stop of the first. GET `/` is native service
info, not the upstream root; `/health` is healthy with memory/durable:false/probe:not-applicable
and no dataDir. Fetch the unique data directly from the expected loopback upstream and compare it
with the front response. Rebind each actual front/upstream port after native stop. No fake upstream.

**S6b: CORS and borrowed options (1 appended test; total7).** Fresh-child rows for absent origin,
environment origin snapshot, explicit exact origin, and explicit caller method/header/expose arrays.
Assert real OPTIONS headers and actual stream responses: native default-deny origin when unset;
configured origin only; exact actual 6/9/12 defaults; explicit arrays replace rather than append;
credentials/maxAge only when requested. Change env after construction to prove native snapshot.
Use empty custom allowAnonymous to prove health is guarded; preserve `protect:['/']` for raw paths.
Freeze caller objects/arrays with no casts; compare descriptors/values afterward, record authenticator
and authorizer receiver/principal identities. Source gate verifies exact `auth: options.auth` and
`.serve(options.serve)` and caller array references before native CORS snapshots them. Do not claim
that downstream native arrays retain identity: native CORS deliberately copies them. No fake builder.

**S6c: TLS explicit trust (1 test; total8).** Copy only the existing public test CA/leaf/key constants
into this owner (not the workers test module). Native factory uses inline serve.tls, loopback and
port0; an explicitly CA-trusting Deno.createHttpClient gets native401 and successful real stream
write/read200. An ordinary fresh client must reject the test certificate. No ignoreCertificateErrors,
OS trust edit, generated certificate tool, or exclusive-ambient-trust assertion. Close both clients,
consume/cancel responses, stop, and rebind both ports. Failure is retained, not converted to TLS defer.

**S6d: startup failure ownership (1 table-driven test; total9).** Real owned front blocker held on
127.0.0.1 causes genuine AddrInUse after native upstream start. Assert expected front error class/
endpoint; blocker remains bound; upstream can actually rebind before fixture cleanup. Separately,
a serve.hostname getter throws a caller-owned sentinel at the native listener boundary after
upstream start. Assert strict thrown-object identity and released upstream. This second row proves
primary object preservation, not a fabricated bind failure. Include a credentialed-wildcard CORS
rejection row after upstream start to prove native TypeError cleanup. Failure cleanup cannot call
server.stop directly: no upstream handle was returned. Rebind is the independent oracle. No injected
secondary cleanup rejection or new native coordinator; such a repair needs its own reviewed scope.

**S6e: abort and ordinary drain (2 appended tests; total11).** Abort row consumes a real stream read,
aborts the caller controller, then rebinds BOTH ports before any manual stop, using a fixed2s
monotonic deadline and10ms retries for AddrInUse only. Fresh omitted-signal control must fail exactly
`ABORT_DID_NOT_RELEASE`, then perform real manual cleanup and rebind. For drain, hold a real raw
GET in the authenticator, start two actual stop calls, prove both pending before releasing the gate,
then consume the native200 body, await both stops and rebind both ports. A fresh explicitly labeled
observation-negative row reports exactly `DRAIN_COMPLETED_BEFORE_RELEASE` while native stop and
cleanup remain real. Never leave the auth gate closed on failure. This qualifies a finite request,
not an indefinitely open SSE response or forced-timeout semantics.

**S6f: factory storage ownership (2 tests; total13).** Use owned scratch storage in fresh writer and
reader children. PUT+POST real bytes through the factory front, consume responses, native stop,
rebind both ports and exit cleanly; a fresh child on the same file directory must replay exact bytes
and offset. The memory control uses fresh processes and gets404. This exercises the public factory,
not direct store mutation, and proves orderly restart only. File health is file/durable:true/probe:
passed with dataDir absent. Fail-fast rows for empty, missing and regular-file dataDir must reject
with the exact existing storage diagnostic and never serve a memory fallback. Permission-denied
write uses an explicit deny child, not unreliable Windows mode bits. No claim of power-loss safety,
no concurrent file owners, no RSS workload and no global KV closure. Parent removes the complete
owned directory only after child status/pipes settle on success or failure.

**S6g: legacy delegation and documented authority (2 tests; total15).** Last production edit shrinks
main.ts to a start-on-import call to the public factory, retaining its exact #1383 public reason,
`cors:{origin:'*'}`, no serve override, and no import.meta.main guard/new export. Factory defaults
already supply the exact6/9/12 legacy arrays; do not duplicate them in main. This is an explicit
shortening of the original proposal, not a change to default values. Legacy has no context argument
and no exported stop handle; do not claim the workers default-context seam exists here.

For the legacy success child use known owned front/upstream ports, PORT precedence over an invalid
STREAMS_PORT, and a separate explicit `0.0.0.0:<owned-front-port>` permission. Temporarily wrap
Deno.addSignalListener/removeSignalListener only to delegate unchanged, record registration/removal,
and retain the actual native callback.
Import the real legacy public `./services`, prove public stream HTTP and wildcard CORS, then invoke
the captured native SIGINT callback directly. Verify both old ports rebind, file data reopens in a
fresh child, and native callbacks are removed before restoring the observer. This is native handler
registration/manual invocation evidence, not delivery of an OS signal. No new launcher or exported
lifecycle escape hatch. The observer is test-only and requires explicit root acceptance with S6g.
If rejected, keep legacy successful-start qualification pending rather than substitute process kill
as graceful cleanup proof. Owned-child kill remains only a failed-fixture containment fallback.

Fresh no-front-wildcard-permission child must get the precise native front NotCapable refusal and
still release the already-started loopback upstream. A separate missing PORT/STREAMS_PORT row gets
the exact legacy missing-port error. Assert no endpoint/setup/compiler/timeout substitution. README
adds a checked guarded factory recipe with `protect:['/']`, legacy side-effect/wildcard distinction,
caller/native shutdown ownership, storage and permission block, including allocator/native-addon
requirements. It does not claim guarded adoption is complete or change generated scaffolding.

## Gates and stop rule

At every checkpoint run frozen S4 plus all accepted new owning tests, selected nonempty type/lint/fmt
through repository wrappers, quality:scan/arch:check with raw counts and no new allowances, and
protected byte/hash checks against the S5 receipt plus newly accepted prefixes. Include fixture and
all touched/current test owners in static selection; source factory/facade stay in selected types.
Every new parent test explicitly sanitizes operations/resources/exit. Keep genuine negative and
setup failures. Save raw argv, test counts, child codes/markers, deadlines and cleanup receipts in
new ignored per-checkpoint folders; remove all owned scratch/profile/temporary consumers on both
outcomes. Never print secrets or private model reasoning. No inference is part of these checkpoints.

At S6g additionally compile the exact README recipe, run production doc-lint and exact21 native
identity inventory, and run unchanged retained main/proxy/durability/SSE/bounded-storage suites.
The historical process/RSS suites and full publication/clean-consumer/verify-plugin gates remain
explicit S7 gates; do not say all streams tests passed from the 15 owning tests. Record any unchanged
baseline failure separately; no unrelated repair, test skip, lock refresh or suppressed sanitizer.

Frozen S4:382lines/SHA d4b383c13f6f30dfa40de4842dd680cb33819321485de7e90dec7f2620d44678.
Legacy baseline:137lines/SHA4e7b9fc48b83b197f11286a78e0f2d16f4bc90413bf48c801ae8252093c4d72e.
README baseline:254lines/SHA41082b5452157c9529ccbfcc67435dc96c6b7bfabf752f04e7319271ff5145d8.
All workers owners and all other streams/native owners stay protected. Actual native failure,
unsettled child, unknown upstream port, extra permission requirement, changed runtime behavior or
cap overflow means preserve evidence and return to root; no production patch inside S6.
