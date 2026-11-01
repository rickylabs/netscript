# S3c WRITE-FIRST - PLAIN HTTP workers only

## SKILL
Use the established U1 architecture harness, current agentic native Claude suite and strict
NetScript MCP only. SAME actual session78688d7e-3418-4dde-87c6-44df172768d5, actual native
Fable5.1/xhigh requested. Root approved the precise two-owner plain HTTP scope below and requires
the additional last-listener KV oracle. One450s WRITE-FIRST turn after final root runner review.
Basee79a4c9c393860b1cff777dc99983e9fe3c48f95. WRITE the source group FIRST from the exact native
seams below; no metadata/plan/doc/research navigation or extra prerequisite probes before writing.
Original architecture PLAN/debt verdicts and all remaining U1/S3 obligations remain unchanged.
No broad recrawl: APIs below are source-verified. The real permission closure remains an actual
fixture prerequisite, not a claimed PASS; fail/report if a named permission is insufficient.

## Exact two owners/budgets

- Extend services/src/service-conformance_test.ts by target140-180lines/cap190added; current171
  becomes target311-351/cap361 for this checkpoint, eventual ownercap480 retained. Existing two
  runtime/type tests and fixture strings unchanged; original separate175line4testowner frozen.
- Existing service-test-fixture.ts208lines: opt-in HTTP-runtime stdin mode only, target+25-50,
  cap300. Default denied mode AND existing compiler mode remain byte-equivalent. No new helper,
  test data path, public export/options, production factory/router, config/dependency/lock owner.

New mode is explicit test-owned authority: cleared same env/profile, owned scratch SQLite path
bound BEFORE product imports, DENO_DIR public existing cache, no inherited Redis/discovery/provider
URLs/credentials/TLS file env. Never pass -A to the runtime child. Proposed exact permission set:
`run --check --frozen --cached-only --ext=ts --unstable-kv --allow-env --allow-net=127.0.0.1
--allow-read=<exact own scratch> --allow-write=<same> --deny-run --deny-ffi --deny-sys -`.
Use an explicit mode/guard so HTTP cannot be accidentally combined with old optionalcheck mode;
HTTP itself is always checked. Existing watchdog/capture/grace/settlement preserved; HTTP call
may explicitly select30000ms via existing deadlineMs, without changing10000msdefault or grace.
Source-only test permission allowlist is NOT OS confinement or denied-wire proof. No broadening
if native import/runtime requires another capability: preserve exact denial for root disposition.

## WRITE this one behavioral group first

Run one checked TS stdin child through new mode; use public factory and public nativeKV only.
Set owned KV path/empty profile before imports, initialize owned shared DenoKV before starting
factory. No Redis registration/auto-discovery/DB client/executor/job dispatch/private app. Test:

1. Guarded real HTTP on127.0.0.1/port0/handleSignalsfalse. Context.env.PORT='not-a-port' proves
   explicit0 bypasses host port fallback. Actual addr.hostname/transport and allocatedpositive
   port; consume every response. Correct public endpoint is GET /api/v1/workers/describe.
2. Missing/wrong synthetic credential401, authenticator throw503, authorizerdeny403, valid200.
   Annotate custom ports with public AuthenticatorPort/AuthorizerPort/AuthnResult types, no casts.
   Capture that each method receives the ORIGINAL port object as `this`; authorizer must receive
   the EXACT same Principal reference returned by authenticator, with method/path/claim values.
   Context is onlyenv.PORT; do NOT claim caller ctx becomes RPC context. Native source passes
   c.set('principal',result.principal) and authorizer.authorize({principal,...}) directly.
3. Start a separate public-posture factory with its own port0/options, no credential200. Stop
   first twice, show second still serves and shared owned rawKV still reads/writes; factory must
   not close it. Rebind stopped firstport with native Deno.listen then immediatelyclose it.
4. Explicitly stop BOTH native handles idempotently, then prove rawKV set/get STILL works BEFORE
   test-owned closeKv: shutdown of the last listener cannot claim shared KV ownership. Preserve
   the second-handle-after-first-stop oracle as well. Consume/cancel every owned response and close
   any explicit loopback client; stop handles, rebind/close the first listener's exact prior port,
   and test KV after both stops, all before closeKv. Error-safe finally settles both handles before
   public closeKv, retaining any primary assertion error first if cleanup also fails. Unique marker
   ONLY after all assertions AND settled cleanup; parent asserts code0. Explicit three sanitizers.

No patch/stub of Deno.serve/native host, fake principal/context, private import, as/any/suppression.
Public handles expose only app/addr/stop, NOT original ServeOptions. Runtime proves original port/
principal references and listener address/unchanged calleroptions effects; exact auth/cors/serve
pass-through is retained factory-source evidence, not invented stronger runtime object exposure.
Signal abort/inflight drain/TLS/legacy/other retained gates remain named later; don't claim them here.

## Exact already-verified native seams (copy/use, no reread loops)

Native cast-free context constructor already compiled:
```ts
const context: PluginServiceContext = {
  db: { getClient: () => Promise.reject(new Error('fixture DB must not run')) },
  contracts: {}, kv: {}, logger: {}, env: { PORT: 'not-a-port' },
};
```
Public @netscript/kv exports getRawKv/getKv/closeKv/SharedKvConfig. SharedKvConfig accepts provider,
path, skipServiceDiscovery. Use getRawKv({provider:'deno-kv',path:ownedPath,skipServiceDiscovery:true});
it initializes shared getKv first, and subsequent native runtime getKv() reuses that singleton.
The explicit provider+path branch never calls environment discovery; parent scratch already exists.
Close only test-owned singleton AFTER bothlisteners, never add production closeKv.

Native public Principal has subject/scopes/roles/scheme/claims; AuthnResult is {ok:true,principal}
or {ok:false,reason}. Annotated method return types narrow without `as const`. AuthnRequest exposes
header(name), headers(), cookie(name), method,path. AuthzRequest exposes principal,method,path,rawPath.
Native authenticator throw maps503/SERVICE_UNAVAILABLE; returned failure401; authorizer deny403.
Source call sites: packages/service/src/auth/auth-middleware.ts. Do not copy middleware into tests.
Native RunningService is {app,addr:{hostname,port,transport},stop():Promise<void>}; no finished accessor.
ServeOptions includes port/hostname/signal/drainTimeoutMs/handleSignals/tls. Stop is native drain.
Native factory directly passes auth:options.auth,cors:options.cors and .serve(options.serve), owns
native globalKV runtime and retains postlisten microtask. No provider/model/settings/package change.
Endpoint/procedure evidence: unchanged services/src/describe-route_test.ts confirms the path and
capabilities object; that existing evidence is in-memory, NOT this pending real-network test.

## Narrow gates then STOP

Original4 + existing2 + newplain group with explicit sanitizers; selected3owner types/lint/fmt;
old6oracle/body/fixture/defaultargv equivalence; protected actualworking bytes rootconfig/sevenlocks,
original verdicts/publicexports unchanged. Retain raw firstfailures, no warmup/optout/timer waiver.
No wholeworkers/scaffold/publish/AppHost/CEF/provider/MSI/TLS/streams/legacy or code outside2owners.
Root must read actual source/gates before checkpoint; no selfsignoff/commit/push/auto continuation.