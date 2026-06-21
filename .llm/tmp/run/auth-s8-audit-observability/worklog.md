# AS8 — Auth Audit Observability — worklog.md

## Design

### Public surface

- `@netscript/plugin-auth-core/telemetry`
  - `AuthAttributes`, `AuthSpanNames`, `AuthSpanEvents`, `AuthOutcome`, `AuthErrorCode`.
  - `hashSubject(subject, salt)` and `redactAuthPrincipal(principal, salt)`.
  - `createAuthTelemetry(options)` plus typed operation recorder APIs.
- Existing auth stream event/session contracts gain additive `traceparent` / `tracestate` fields.

### Domain vocabulary

- Auth operations: `signin`, `callback`, `signout`, `session`, `me`.
- Audit-safe subject identity: `auth.subject_hash`, never raw `Principal.subject`.
- Outcome taxonomy: success, unauthenticated, bad credentials, session expired, provider error,
  callback invalid.
- Error taxonomy: `AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`, `AUTH_PROVIDER_ERROR`,
  `AUTH_CALLBACK_INVALID`.

### Ports

- Reuse `@netscript/telemetry` tracer/context primitives.
- Reuse existing `AuthBackendPort`, `InteractiveFlowPort`, `AuthSessionStorePort`, and auth stream
  producer seams.
- No backend adapter instrumentation; the service owns the telemetry wrapper.

### Constants

- `AuthAttributes`, `AuthSpanNames`, `AuthSpanEvents`, `AuthOutcome`, `AuthErrorCode`.
- Logger sensitive fragments extended for `sessionid`, `accesstoken`, `refreshtoken`, `jwttoken`.

### Commit slices

1. Auth telemetry contract and redaction in `packages/plugin-auth-core`.
2. Auth service handler instrumentation and audit-safe outcome mapping.
3. Durable stream trace propagation and tests.
4. Harness artifacts, gates, commit, explicit refspec push.

### Deferred scope

- `packages/service/src/auth/auth-middleware.ts` remains out of scope per plan D7.
- Backend packages remain pure; no telemetry dependency is added to backend adapters.

### Contributor path

- Add new auth span names/outcomes in `packages/plugin-auth-core/src/telemetry/attributes.ts`.
- Add operation behavior through `createAuthTelemetry()` recorder methods in
  `packages/plugin-auth-core/src/telemetry/instrumentation.ts`.
- Wire handler-specific audit metadata in `plugins/auth/services/src/routers/v1-handlers.ts`.

## Implementation

| Step | Evidence |
| --- | --- |
| Telemetry contract | Added `packages/plugin-auth-core/src/telemetry/{attributes,redaction,instrumentation,mod}.ts` and exported `./telemetry`. |
| Redaction | `hashSubject()` uses salted HMAC-SHA-256; `redactAuthPrincipal()` hashes subjects and strips token-bearing claims. |
| Service seam | `createAuthTelemetry()` is created in `plugins/auth/services/src/main.ts` from `NETSCRIPT_AUTH_AUDIT_SALT` / appsettings and injected into handler context. |
| Handler spans | `signin`, `callback`, `signout`, `session`, and `me` now run through `traceAuth(...)`, parented from `ctx.traceHeaders`. |
| Durable propagation | Auth stream emit helpers persist `traceparent` / `tracestate` on lifecycle events and session records. |

## Gate Evidence

| Gate | Result |
| --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-auth-core --ext ts,tsx` | PASS: filesSelected=22, failedBatches=0, findings=0 |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx` | PASS: filesSelected=29, failedBatches=0, findings=0 |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-auth-core --ext ts,tsx` | PASS: filesSelected=22, findings=0 |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/auth --ext ts,tsx` | PASS: filesSelected=29, findings=0 |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-auth-core --ext ts,tsx` | PASS: filesSelected=22, findings=0 |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/auth --ext ts,tsx` | PASS: filesSelected=29, findings=0 |
| `deno task check` from `packages/plugin-auth-core` | PASS |
| `deno task test` from `packages/plugin-auth-core` | PASS: 26 passed, 0 failed |
| `deno task check` from `plugins/auth` | PASS |
| `deno task test` from `plugins/auth` | PASS: 17 passed, 0 failed |
| `deno task check` from repo root | PASS: filesSelected=1730, batches=15, failedBatches=0 |
| `deno doc --lint` full `packages/plugin-auth-core` export set | PASS: 9 files checked |
| `.llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-auth-core --text` | PASS exit 0; dry-run OK; one helper banner warning line only |
| `deno task publish:dry-run` from `packages/plugin-auth-core` | PASS: dry run complete |
| Forbidden cast scan | PASS: no `any` / `as unknown as` matches in changed implementation/test scope |
| Lock hygiene | PASS: `deno.lock` unchanged |

