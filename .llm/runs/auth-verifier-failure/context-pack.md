# Auth verifier failure

Owning issue #2000. Branch fix/auth-verifier-failure; baseline
8ba53bc50ca02aab29e99ba5362728839b8f1713. Coordinator implements a bounded dependency correction for
Cockpit PR93. Mutation surface: packages/service auth middleware/tests/README plus this run; no
sibling products or host resource changes. No version bump or publish.

## Decision / failure contract

Archetype4 public service builder, existing HTTP middleware adapter; no new exported types, classes
or dependency. Explicit AuthnResult rejection stays401. An authenticator throw/rejection returns503
SERVICE_UNAVAILABLE with a fixed safe message; no request reaches its protected handler. Policy
resolution, response application and downstream handlers remain outside that catch. [observed -
doctrine01 A13 and doctrine08 failure boundaries; service AuthnResult; existing auth-middleware.ts
catch; issue2000 live reproduction].

This changes erroneous public failure classification and must be called out at adoption. Consumers
must not erase credentials on503. No proof of published availability or Cockpit adoption until an
exact release is installed and its live outage case re-tested. Existing explicit denial reasons and
authz behavior are unchanged in this slice.

## Verification

Service package tests106 PASS. Scoped run-deno-check/lint/fmt wrappers, --root packages/service
--ext ts,tsx:48 files, zero failed batches/findings. Regressions cover synchronous/asynchronous
verifier failure with redaction/no handler execution/no Set-Cookie; downstream error handler
retains502. Existing suite covers explicit rejection401, accepted principal, response cookies and
anonymous health. Evidence JSON committed beside this file. Independent review pending.

Prior owner productivity authorization governs this reversible code correction. No generator-family
self-certification. Fresh matrix CLI query required before evaluator dispatch; same resumable
independent evaluator is used. Source remains draft until independent review and applicable CI.

Regression evidence: running the new middleware tests against baseline8ba53bc produced exactly3
failures (synchronous throw, asynchronous rejection, direct downstream next rejection),12 passing.
Fixed source restored byte-for-byte in finally. Full corrected package suite106 PASS. Native
publish:dry-run PASS; no publication performed.
