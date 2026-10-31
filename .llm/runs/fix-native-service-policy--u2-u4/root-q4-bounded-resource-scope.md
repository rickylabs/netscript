# Q4 bounded resource repair decision

Root selects a narrowly scoped NetScript resource adapter because the actual pinned Hono4.13.13
and current main both leave the chunked early-rejection reader unclosed. There is no verified
released native correction to adopt. A future Hono fix plus passing these exact native controls
is the deletion condition for this adapter. No third-party fork/version/dependency edit is selected.

Evidence: original real RPC/OpenAPI tests fail with requestBody leaks; declared-only2/0,
chunked-only0/2, actual locked-reader cancel/release2/0 with instrumentation confined to diagnostic
fixtures. Root read the complete checkpoint attribution/proposal. Client responses and native
listener shutdown are not the owner. A plain raw.body.cancel cannot close a reader held by Hono.

Authorize exactly two existing source owners on top of7cfa593e:

- packages/service/src/primitives/body-limit.ts:112 to at most160 lines.
- packages/service/tests/body-limit_test.ts:254 to at most320 lines.

Hono remains the sole size/framing resolver. If necessary, place its chunked/unknown-length read
behind a zero-prefetch forwarding stream whose underlying native request reader is separately
owned by this primitive. Preserve lazy acquisition/bodyless and declared-length behavior, genuine
transfer framing, native Request method/headers/signal and successful handler body semantics.
Always settle/release the owned reader; cancel an unfinished source on rejection, read failure,
disconnect or downstream failure. Do not cancel an already completed successful request. No
duplicate counting loop, unbounded draining/buffering, Request.clone/tee, eager pre-read, global
monkeypatch, mock transport, test suppression or copied Hono source. Do not broaden the owner set
or silently exceed caps if the minimal adapter cannot meet this contract.

Required meaningful RED-to-GREEN: original whole body-limit tests with all sanitizers explicitly
enabled, both real RPC/OpenAPI413 bodies and CORS, under-limit200, declared/chunked framing,
read-count<=LIMIT+CHUNK, auth401-before413, disabled-limit200, bodyless and invalid maxBytes.
Add bounded actual-native completion/disconnect/error-cleanup controls that establish source
settlement and primary-error/413 ordering; no unit monkeypatch can stand in for native cleanup.
Preserve all earlier failed and diagnostic controls. No body-limit test removal or oracle weakening.

Selected route: straightforward native Sol/xhigh. PLAN-EVAL N/A for this fixed-behavior resource
ownership repair around an unchanged native resolver, no public API or policy choice. Full root
source review and different-vendor independent IMPL remain mandatory. Run owning and broad service/
consumer suites, selected static wrappers with nonempty coverage, native docs/quality/doctrine/JSR
and publication dry-run if production changes. Existing mapped-IPv4 and cold DB prerequisites
stay separate/unwaived; do not fix or skip them in Q4. Return exact source/gates/hashes before
checkpoint/push; this note is implementation scope, not acceptance or release authority.
