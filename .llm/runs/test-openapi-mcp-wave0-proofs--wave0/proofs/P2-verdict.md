# P2 verdict — live spec fidelity and size

## Verdict

`FAIL`

D7 requires measured DB and no-DB scaffolds. The independently authorized no-DB branch produced a
valid, attributable live measurement, but the SQLite branch remains blocked by the generated
service's missing `--allow-ffi` permission. Under D7/D12, a blocked or skipped required branch maps
to explicit `FAIL`; this is neither a partial PASS nor `NOT_RUN`.

## Measured no-DB result

The owned healthy `health` service returned a compact 3657-byte OpenAPI 3.1.1 document containing
three operations. Every operationId was a dotted contract path:

- `v1.health.list` — POST `/v1/health/list`
- `v1.health.updateStatus` — POST `/v1/health/updateStatus`
- `v1.health.health.check` — GET `/v1/health/health/check`

Discovery rows measured 73, 89, and 88 compact UTF-8 bytes respectively. Per-operation request,
response, error, and all-schema source/local-dereferenced byte counts and every array/string limit
observation are recorded in `P2-no-db.json`. There were no local, external, or unresolved refs, so
source and locally dereferenced measurements are identical.

The spec declared no non-2xx response for any operation. Each error view is therefore `{}` (2
bytes). No common error envelope is observed or inferred for this no-database template.

The context-blind object-key audit records the observed OpenAPI 3.1/JSON Schema 2020-12 allowlisted
keyword subset—including the present `summary` key—and separately records every non-allowlisted key
with its paths. Because the scan is context-blind, a schema property name matching a standard
keyword can appear as an observed keyword; the evidence states this limitation explicitly. No
measured array exceeded `maxItems=50`; the largest contained 5 items. No measured string exceeded
`maxStringLength=2000`; the longest contained 34 characters. These per-array/per-string limits do
not impose an aggregate cap: the current MCP path has no whole-result byte ceiling.

## Failed DB branch

The DB branch carries forward only the attributed normalized P1 failure: the generated SQLite
service exited 1 and remained unhealthy because its command omitted `--allow-ffi`, required by
`libsql`. It did not yield an attributable live DB spec. Per supervisor direction, it was not rerun,
patched, wrapped, or manually relaunched, and the ambiguous P1 HTTP 200 was not reused.

## Evidence

- `proofs/experiments/p2-measure-live-spec.ts`
- `proofs/evidence/P2-no-db.json`
- `proofs/evidence/P2-no-db-live-spec.json` (retained 3657-byte hash-matched raw spec)
- `proofs/evidence/P2-db-failure.json`
- `proofs/evidence/P2-runtime.json`
- `proofs/evidence/P2-attempts.md`
- `proofs/evidence/P1-runtime.json` (carried DB failure source)

This implementation verdict does not claim #1128 acceptance and does not issue an IMPL-EVAL
disposition. It stops for separate supervisor/Fable review.
