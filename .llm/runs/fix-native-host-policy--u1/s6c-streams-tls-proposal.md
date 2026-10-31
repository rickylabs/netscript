# S6c: explicit-trust TLS through the native streams factory

Proposal only, against accepted/pushed S6a `1ef664b9270835e2c5133fc514c879044f1b28ea`.
Implement one new unconditional test owner after root review:
`plugins/streams/services/src/service-tls_test.ts`, target180-210 lines, hard cap220.
No helper, production, facade, configuration, lock, debt or existing-test edit. The runtime fixture
stays byte-exact294 lines (`227414514886bd42086b3e814bd3e4822cdd7e64125b847e6edf453fac927f9c`);
the256-line runtime owner and all113 previously protected bindings remain frozen.

S6b is deferred for the separately owned native CORS/health integration. This changes the immediate
owning-suite target to **seven** tests: original four S4, two S6a, one S6c. The older proposal's
eight-test count included S6b and is retained as history, not reused as an actual result.

## Existing native seams and fixture

- Installed MCP `find_guidance` returned the services TLS section: `ServeOptions.tls` takes inline
  PEM contents, and the native listener hands cert/key to `Deno.serve`. Audited current
  `packages/service/src/builder/service-listener.ts` confirms that exact branch and native shutdown.
- Current streams `startStreamsService` passes `options.serve` unchanged to native `.serve()`.
  Its upstream remains HTTP on127.0.0.1; the native shutdown hook awaits upstream.stop. Therefore
  the test must exercise actual front HTTPS and direct loopback HTTP, then rebind both old ports.
- Reuse `createRuntimeSandbox('tls')` unchanged. Its actual cache/native-package discovery,
  cleared synthetic profile, checked/frozen/cached stdin,30s child/2s settlement and32KiB pipes
  already support this test. No certificate file or new read/network/FFI/run/sys authority is needed.
- Copy only the three **public test-only** PEM constants from
  `plugins/workers/services/src/service-conformance_test.ts:312` through340 into the new owner.
  Never import that `_test.ts`, execute its registrations or create a cross-plugin shared helper.
  Preserve the public-test provenance comment and compare copied PEM contents with that source.
- The retained `.llm/tmp/u1-s3/tls/out/receipt.json` and committed S3d evidence identify ephemeral
  ECDSA P-256/SHA256 material,127.0.0.1 IP-SAN,serverAuth and validity2026-10-26 through2036-10-25
  for the leaf (CA through2036-10-26). Actual workers explicit-CA HTTPS401/200 and ordinary-client
  rejection already passed. No generator, key store, installer, openssl or new dependency runs.
  This provenance is not a claim that the proposed streams TLS test has already passed.

## Concrete executable oracle

One `Deno.test` explicitly enables sanitizeResources,sanitizeOps,sanitizeExit. Parent creates the
existing sandbox and selects one owned upstream port by temporarily binding127.0.0.1:0, records
its positive port and closes that selection listener. Run one fresh child through the existing
fixture with the owning streams package cwd and that one preferred-port entry. Assert child code0
and an exactly-once final marker after cleanup. No OS conditional, ignored test or capability skip.

The checked child imports public types only at top level. Scratch/env setup, dynamic public factory
import, native clients and all listener-producing work are inside primary-first cleanup protection:

1. Change cwd to owned scratch; set STREAMS_INTERNAL_PORT to the selected port. Retain invalid
   ambient PORT/STREAMS_PORT values as the existing explicit-port0 precedence control. Supply a
   typed custom authenticator with the same allowed synthetic header/principal pattern as S6a;
   `protect:['/']` guards the raw stream path. No health or metadata security assertion is added.
2. Start the public factory with `serve:{hostname:'127.0.0.1',port:0,handleSignals:false,
   tls:{cert:leaf,key:leafKey}}`. Retain the native handle immediately; assert positive port,
   loopback hostname and tcp transport. Use a fresh unique `/v1/stream/s6c-<uuid>` raw stream path.
3. Create a native `Deno.createHttpClient({caCerts:[testCA]})` and retain it immediately. The named
   request init uses `RequestInit & {client:Deno.HttpClient}`, the already-qualified workers seam
   for the workspace DOM typing; no cast, any, suppression or private fetch replacement.
4. Through actual HTTPS, consume the anonymous response and assert native401/missing-credential.
   A credentialed PUT creates the stream with a fixed UTF8 prefix (201), POST appends a fixed
   suffix (204), and GET with `?offset=-1` returns200 and exactly the expected bytes. Consume every
   response body before asserting. Fetch the same path directly over upstream HTTP; require200
   and byte-for-byte identity with both the expected payload and the front response.
5. Create a second **fresh default-CA** client with `{}`. Send the same credentialed HTTPS GET to
   the same live endpoint. Require rejection with TypeError and a certificate-related native
   message (`/certificate/i`); retain actual name/message in the receipt. An unexpected response
   is consumed/cancelled before failing. This request must not increment the authenticator count.
   Any different failure (setup/permission/network/timeout/type) is retained, not accepted as a
   trust negative or weakened to a generic fetch rejection.
6. Use the original CA-trusting client again after the rejection; require200 and unchanged bytes.
   This brackets the negative with successful traffic to the same listener. No exclusive ambient
   trust-isolation claim: caCerts adds explicit trust, it does not replace every native trust root.
7. Close both clients before native stop so pooled HTTP/TLS connections cannot obstruct teardown.
   Await the actual handle.stop twice. Rebind and close **both** actual front and selected upstream
   ports with native Deno.listen. Print the two released ports and actual default-CA rejection,
   then the final marker, only after successful cleanup.

Failure cleanup also closes every retained client, awaits the retained native stop and attempts
both known-port rebinds. Preserve the primary error first, aggregate only when cleanup adds a
failure, and never print a success marker after any failure. The fixture's own cleanup remains
responsible for the synthetic scratch and owned child status/stdout/stderr/stdin settlement.
Native stop resolving by itself is not evidence that the upstream listener closed.

## Gates after authorization

- Owning seven tests with the same Windows Deno2.9.7 and warm public cache, ordinary frozen/cached
  policy and explicit sanitizers. No reload, runtime app, external provider or OS signal launch.
- Nonempty selected six-file types/lint/fmt: new TLS owner, frozen runtime fixture/runtime test,
  S4 service_test.ts, production service.ts and public services/mod.ts. New-owner quality0 with
  zero allowances. Hard cap220 after canonical formatting; return before expanding if it cannot fit.
- All115 protected bindings match: old113 plus the accepted S6a two owners. Exact PEM source copy
  and current test-only validity/SAN provenance remain reviewable; preserve original failures.
- Raw child arguments, synthetic environment, selected native manifests/byte hashes, response and
  certificate-error receipts, native rebinds, process/pipe settlement and verified absent scratch
  accompany the complete source diff. Any extra permission or actual native failure returns to root
  before widening scope; no factory/native-host repair is authorized by this test slice.
- No composite architecture rerun or broader architecture PASS. Current scoped report remains
  0fail/5warn/1info. Linux qualification remains pending the separately selected genuine CI path.

Root reads the complete source and actual results before any S6c checkpoint. CORS/health, startup
failure ownership, drain/abort, persistent storage, legacy delegation, S7 and independent IMPL
remain separate. This proposal authorizes no test implementation or new model invocation itself.
