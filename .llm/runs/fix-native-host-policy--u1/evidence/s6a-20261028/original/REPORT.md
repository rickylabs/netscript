# S6a streams native HTTP source gate

Complete for root source review; no checkpoint, push, inference or later S6 application.
Base `816fcf7ea7b20efb398bc0640f5b60f283248c08`, branch `fix/native-host-policy`, native Astra lane.
Authority: `.llm/tmp/root-s6a-authority-20261028.md`; narrow metadata oracle correction is retained
verbatim in `root-oracle-correction.md`. Installed MCP find_guidance and exact native owners were
used; repository wrapper and Deno diagnostic skills applied.

| New owner | Lines/cap | SHA256 |
| --- | ---: | --- |
| `plugins/streams/services/src/tests/test_utils/service-runtime-fixture.ts` |260/300|0a65d36990c3d48d2c69e0790bf39de33a17e22e42a2ae7ca014aab1c8324fb0|
| `plugins/streams/services/src/service-runtime_test.ts` |254/430 (S6a target230-290)|b8f4525306257c6bbd1741b729e244c3ebfebe7fd6f522cdabde22885b31e88e|

Full byte-exact copies: `fixture.final.ts`, `runtime.final.ts`. Actual no-index Git diff:
`source.diff`, SHA3c9c0bcfd2181507f43e9cde5bfaa5dca4b7a5dc5ba07ad2a9c153bf8fafd3db.
`source-proof.json` SHA db806419785b72d6765f9f6075c1e974659414c8dfe2dab7fc9f94155ef51c4c
contains all113 protected matches, owning hashes/line counts, actual gates, child argv and cleanup.
Tracked diff is empty; exactly these two new test owners are pending. No production, helper in
another plugin, legacy, README, facade, manifest, lock, debt or existing test changed.

## Actual outcomes

Final `gates-3/tests.report.json`: **6 passed,0 failed,0 ignored**,8222ms. Four frozen S4 tests plus
the two new sanitized parent tests. Both new tests explicitly enable ops/resources/exit sanitizers.
Fresh approved, allocator-denied, FFI-denied and HTTP children all compile checked/frozen/cached
stdin and settle status, both pipes and stdin. Positive children have exactly one final marker.

- Approved public factory starts a real loopback front and native upstream, serves service-info,
  stops twice and independently rebinds both ports.
- Removing only wildcard allocator grants gets native NotCapable for exact0.0.0.0:owned-preferred-
  upstream-port at @std/net/get_available_port.ts. Removing FFI gets native NotCapable for the exact
  cached LMDB3.5.7 node.napi.node. Both exit1 with no success marker; no compiler, timeout or cleanup
  substitute. Complete stderr and precise paths remain in `gates-3/children/*/child-1-result.json`.
- Real guarded raw stream requests produce missing/wrong401, throwing-authenticator503 and denied-
  scope403. Authenticated PUT201/POST204/read200 bytes equal the direct selected-loopback upstream.
  Authenticator/authorizer receivers and issued principal references retain strict identity.
- Native service-info GET/ is explicitly credentialless200 with auth-call counts unchanged. Raw
  stream protection does not establish whole-host guarding. Health is explicitly anonymous and
  reports healthy memory, durable:false, probe:not-applicable, no dataDir.
- The second real public instance has its own front/upstream ports and memory store, accepts no-
  credential stream traffic, cannot see the first store's data, and remains usable after repeated
  first stop. The final HTTP marker follows successful real rebinds of64622/54272 and64625/54273.
  These are actual captured ports from this run, not fixed fixture port choices.

No native permission expansion or production repair was needed. Child authority matches the
approved cleared environment, scratch-only writes, cache/npm/toolchain reads, loopback plus exact
allocator probes, two hash-verified pinned addon paths, allow-sys and deny-run. Runtime argv has
no allow-all, reload, subprocess grant or alternate hostname. Parent only launches its exact Deno.
Native addon authority is trusted native code, not a claim of OS containment or minimum sys grants.

## Gates, retained failures and cleanup

Final five-file types select5 actual files with0 findings. Lint and fmt process5/5 with0 drops,
refusals or findings. Two-owner quality scan has0 findings and0 allowances. Scoped architecture
report (`gates-2/arch.report.json`) is0fail/5warn/1info: existing README fence count, four existing
default exports and missing architecture documentation; no new test owner is named. Architecture
was not redundantly rerun after the narrowly authorized assertion-only correction.

All earlier failures are retained: `gates/` has three TS7034/TS7005 occurrences from my initially
untyped addon receipt array (no test execution) and the architecture report-writer permission
mistake. The array received an explicit type; the administrative report writer received only its
owned output write grant. `gates-2/` retains5/1/0: the first HTTP expectation incorrectly counted
public metadata root as an authenticated raw route. Root read native registration/build order and
authorized7 authn/4 authz raw-path expectations plus the stronger explicit public-metadata oracle.
The failed runtime source remains `runtime-before-root-oracle-correction.ts`. No count correction
was inferred to authorize a production security change. A proof-reader BOM preparation error is
also recorded; the original protected snapshot was not rewritten.

All3 owned gate profiles were removed empty. All8 new runtime child scratch directories from both
executed runtime attempts were removed empty, including expected permission refusals and the
first HTTP assertion failure. The proof independently re-stats all11 cleanup paths as absent.
All8 child results attest actual status/pipe/stdin settlement; no child deadline or forced kill was
needed. Frozen S4's own stuck/output-cap controls continue to pass unchanged. No temp consumer,
database, data directory, certificate file or external service was created by S6a.

This is the approved **Windows x64** addon qualification fixture and requires explicit DENO_DIR;
it fails closed on other platforms rather than claiming portable native-addon support. Later
CORS/TLS/storage/abort/drain/front-failure/legacy qualification is not applied or claimed. S6b's
proposed empty-allowAnonymous health guard depends on separately accepted native health ordering
integration; this U1 base cannot borrow that behavior. No whole-U1 independent IMPL, package-wide
all-tests, publication, release or merge acceptance is claimed.
