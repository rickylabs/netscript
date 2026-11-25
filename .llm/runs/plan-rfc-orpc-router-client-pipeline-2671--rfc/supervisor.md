# Supervisor Record — RFC A (`plan/rfc-orpc-router-client-pipeline-2671`)

- **Run ID:** `plan-rfc-orpc-router-client-pipeline-2671--rfc`
- **Issue:** `https://github.com/rickylabs/netscript/issues/2671`
- **Draft PR:** `https://github.com/rickylabs/netscript/pull/2673`
- **Companion RFC:** PR `#2674` (tracking issue `#2672`)
- **Branch:** `plan/rfc-orpc-router-client-pipeline-2671`
- **Base commit:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (`main`)
- **Milestone:** `0.0.10`
- **Primary deliverable:** `rfcs/0000-orpc-router-client-pipeline.md`
- **Status:** Round-1 fix complete addressing all 6 Fable 5.2 blockers (B1–B6) and advisory items; ready for Round-2 review by Gemini Hydrogen.

## Route & Lane Assignment

| Role | Assigned model / lane | Notes |
| --- | --- | --- |
| Author / research lane | Neon | Drafted RFC A + empirical probes against locked `@orpc/*@1.15.5`; completed Round-1 fixes addressing all 6 Fable 5.2 blockers; zero edits to `packages/`, `plugins/`, `docs/site/`, `.github/`, `deno.json`, or `deno.lock`. |
| Round-1 reviewer | Fable 5.2 | Returned `CHANGES_REQUESTED` (`issuecomment-7170492509`) with 6 blockers (B1–B6, 4 reproduced with counter-probes), warm benchmark verification, and 8 advisory points. |
| Round-2+ reviewer | Gemini Hydrogen | Re-checks Round-1 revision and subsequent rounds per owner routing. |

## Round-1 Blocker Closure Checklist

- [x] **B1:** Unmarked procedures (`meta.access` absent) fail closed with `403 authz.no-matching-rule` (or delegate to procedure-aware fallback), matching `contract-authorizer.ts` verbatim; proven on HTTP, `createRouterClient`, and bare `call()` in Test 1.
- [x] **B2:** All 5 authorizer modes specified (`createContractAuthorizer` pure, contract + `ProcedureAuthorizerPort` fallback, path-based `createScopeAuthorizer`, custom path `AuthorizerPort`, `createContractOverlayAuthorizer`, `authn`-only path guards); non-HTTP `method: 'IN_PROCESS'` / `path: 'orpc://<service>/<proc>'` defined; path-dependent modes fail closed at construction (`ROUTER_CLIENT_PATH_AUTHZ_UNSUPPORTED`); proven in Test 2.
- [x] **B3:** HTTP edge pre-dispatch index explicitly retained (retracting the Round-0 Stage 1 deletion claim); `findInternalGuard`, `claims()`, `retiredPaths`, `procedure_not_found`, `procedure_retired`, and **403-before-413** added to inventory & status/body parity table; v2 migration via native `RPCMatcher` + `OpenAPIMatcher` verified on `2.0.0-beta.53`; proven in Test 3.
- [x] **B4:** Process-wide `WeakSet<Principal>` replaced by scoped `WeakMap<Principal, VerifiedPrincipalRecord>` bound to `(serviceId, serviceName, authenticator, verifiedAtMs, expiresAtMs, requestScope, isRevoked, internalAudience)`; internal audience re-checked against callee `serviceName`; enforced identically on bare `call()`; all 3 attacks proven failing-then-passing + true `AuthenticatorPort`-level single-authn count in Test 4.
- [x] **B5:** Bootstrap clean root ALS snapshot + fail-closed `captureCleanAsyncRootOrThrow` against lazy-import poisoning; `wrapDetachedAsyncIterator` detaching every streaming `next()`/`return()`/`throw()` pull; both proven failing-then-passing in Test 5.
- [x] **B6:** `setCookies`/`responseHeaders` fail-closed without explicit sink; `withRateLimit`-without-`withProcedureRateLimit` fail-closed + public procedure `clientAddress` key partitioning + accurate RFC 0008 relationship; non-listening `service.start()`/`stop()` lifecycle; `withRPC({ rpcRouter })` idempotent wrapping (`WRAPPED_ROUTER_MARKER`) + canonical router binding; all proven in Test 6.
- [x] **Split Stage 1:** Stage 1a (`0.0.10`, decoupled from #2659 & auth move) / Stage 1b (`0.0.11`, gated on B1–B4) / Stage 2 (`0.1.0`, unified `createServiceClient({ transport })` aligned with PR #2674).
- [x] **Benchmark & process fixes:** 2,000/5,000 warm runs + design-complete row; default authenticating path as headline (`5.6×–7.2×`, ~0.17–0.30 ms saved/call); trusted-principal marked off-by-default; static-authenticator qualification stated; front matter milestone updated to `0.0.10`; companion PR `#2674` / tracker `#2672` cited accurately; `orpc-plugin.ts:371`, v2 wording, and input/output aliasing caveats fixed.
