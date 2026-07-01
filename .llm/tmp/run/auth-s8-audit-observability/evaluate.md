# IMPL-EVAL — AS8 Auth Audit Observability

- Slice: AS8
- Branch: `feat/prime-time/auth-s8-audit-observability`
- Base: `main` (`6f1c40f0`)
- Impl commit: `17b27819`
- HEAD: `b38d9607` (plus harness trace commit `2b852e3a` from prior run)
- Run id: `auth-s8-audit-observability`
- Evaluator: OpenHands (`openrouter/qwen/qwen3.7-max`), run `27901147563-1`
- Scope: additive audit telemetry on `packages/plugin-auth-core` (package) + wiring in `plugins/auth` (plugin)

## Verdict

**PASS**

Prior evaluator run (`run-27900718714-1`) computed PASS and reported all 8 gates green but exhausted
its iteration budget before rendering the formal artifact and PR comment, so the harness had no
terminal record. This session independently re-ran the gates below to confirm before rendering the
terminal verdict.

## Gate Results

| # | Gate | Scope | Exit | Outcome |
|---|------|-------|------|---------|
| 1 | `run-deno-check.ts` | `packages/plugin-auth-core` (22 files) | 0 | PASS |
| 2 | `run-deno-check.ts` | `plugins/auth` (29 files) | 0 | PASS |
| 3 | `run-deno-lint.ts`  | `packages/plugin-auth-core` (22 files) | 0 | PASS |
| 4 | `run-deno-lint.ts`  | `plugins/auth` (29 files) | 0 | PASS |
| 5 | `run-deno-fmt.ts`   | `packages/plugin-auth-core` (22 files, ts/tsx) | 0 | PASS |
| 6 | `run-deno-fmt.ts`   | `plugins/auth` (29 files, ts/tsx) | 0 | PASS |
| 7 | `deno test ... telemetry_test.ts --unstable-kv` | core telemetry unit | 0 | PASS (3/3) |
| 8 | `deno test plugins/auth/tests --unstable-kv -A` | auth plugin test surface | 0 | PASS (17/17) |

Notes on Gate 8: the scoped wrapper in the prompt (`deno test plugins/auth/tests --unstable-kv`)
omits permissions. The plugin's own `test` task in `plugins/auth/deno.json` declares
`deno test --unstable-kv --allow-all`, and several suites (scaffold manifest reader,
better-auth service module, debug import-surface) require read/env permissions to import. Re-running
with `-A` per the plugin's own task config yielded 17/17 pass; this is configuration/permission
evidence, not a test defect — consistent with the prior run's green outcome.

## Slow-Types (closes prior-run remaining risk #3)

```
deno doc --lint mod.ts src/config/mod.ts src/contracts/v1/mod.ts src/domain/mod.ts
  src/ports/mod.ts src/presets/mod.ts src/streams/mod.ts src/testing/mod.ts
  src/telemetry/mod.ts
```

From `packages/plugin-auth-core/` (the full 9-entry `exports` map including the new
`./telemetry` barrel which uses `export *`):

- `Checked 9 files`
- Exit: **0** (0 diagnostics)

Confirmed independently. The new telemetry surface (AuthAttributes enum, createAuthTelemetry API,
hashSubject, redactAuthPrincipal) types resolve fully for JSR slow-types; no ambiguous-type
findings.

## Cast Audit

Search of S8-changed files for unsanctioned `as` / `any`:

- `packages/plugin-auth-core/src/telemetry/*.ts` — no `as unknown`/`any`
- `plugins/auth/services/src/routers/v1-handlers.ts`, `v1-types.ts` — no `as unknown`/`any`
- `plugins/auth/streams/producer.ts`, `schema.ts` — only sanctioned `X as CORE_X` import-rename
  bindings (not casts) and documentation prose

D5 traceparent propagation in `plugins/auth/streams/producer.ts` flows through a domain-typed
`SerializedTraceContext` interface, NOT through a cast — matches the sagas exemplar.

Zero-cast policy: **PASS**

## Redaction + D5

Telemetry tests independently verify:

- `hashSubject` produces a 64-char salted HMAC and does not include the raw subject material in
  the output, with salt-dependent divergence.
- `redactAuthPrincipal` removes `accessToken` and nested `refresh_token` claims from the serialized
  principal output while preserving non-secret claims (email, displayName) and counts.
- `createAuthTelemetry.traceOperation` records `AuthSpanNames.ME` span with sanitized
  `SUBJECT_HASH` attribute and `AUDIT_LOG` + `PRINCIPAL_RESOLVED` events, with no raw subject or
  access-token material in the serialized span output.

The auth-service integration test (`auth handlers emit audit-safe telemetry attributes per
operation`) exercises the wired telemetry through a real kv-oauth registry round-trip and asserts
the same redaction properties on the recorded span.

D5 traceparent: persisted as a first-class `traceparent?: string` field on the
`AuthSessionProjectionV1` and `AuthEventV1` event schemas (`streams/schema.ts:37,70`), populated
from the OTel active-span headers or propagated via the explicit `SerializedTraceContext` port.
Not a cast.

## Lock Hygiene

- `deno.lock` diff `origin/main..HEAD`: **0 commits** touched. No churn.
- No junk artifacts or accidental tracked files in the implementation slice.
- `17b27819` (impl) and `b38d9607` (commits.md append) are the only substantive commits; the prior
  evaluator run left `2b852e3a` (harness trace record) which is benign metadata, not source churn.

## Rationale

All 8 scoped gates are green with raw exit 0; the full 9-entry `@netscript/plugin-auth-core`
export map clears `deno doc --lint` independently (closing the only open risk flagged by the
prior run); zero-cast and redaction/D5 properties are asserted by substantive unit and integration
tests; lock hygiene is clean. The implementation is additive and mirrors the sagas + workers
telemetry seam (domain-typed attributes, redaction port, createAuthTelemetry DI seam, durable-event
trace propagation), with no source churn outside the targeted telemetry module surface. Verdict is
`PASS`.
