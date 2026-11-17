# R2 drift and review record

2026-11-11 — **independent R1 FAIL preserved:** B1–B3 are material planning gaps.
R2 is authorized to correct them only in adjacent plan/evidence artifacts. All
R1 manifest entries, manifest, original reproducer and actual RED reports remain
unchanged. No independent PASS, model attestation or evaluation reset is invented.

2026-11-11 — **B1 performance impact made explicit:** queryUtils is always
signalled during TanStack execution, so this is not a rare explicit-signal case.
The conservative source design still uses independent requests but now carries
per-API tests and documentation, including separate-key/client two-fetch cost.
queries' existing lack of signal forwarding is explicitly deferred.

2026-11-11 — **B2/B3 gate specificity:** added content LEAK gate/scanner and
explicit Deno sanitizers; source-mutation qualification now requires compiler 0,
semantic RED, exact committed-byte restore and actual restored GREEN with named
receipt paths. Removed actual-GET and restored catch-all mutants, and innocuous
GREEN control, are mandatory. These product controls are planned, not executed.

2026-11-11 — **tooling correction:** the new run-local test initially used an
unmapped bare TanStack import, producing a compiler/process error. It was changed
only within the new test to the SDK's existing npm range, already locked to
5.104.1; no dependency manifest or lock changed. That initial error is not RED
evidence. Final structured controls compile and fail only the two expected
transport-count assertions; no sanitizer disabling or assertion weakening.

No product or architectural debt is introduced. Scope remains the exact same
source repair, planning round R2 only; runtime/resource/consumer/release actions
remain unauthorized and unexecuted.
