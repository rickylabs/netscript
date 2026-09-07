# Worklog: remote session-verifying AuthenticatorPort + native `/session` bearer support (#1383 partial)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `remote-session--1383` |
| Branch         | `feat/remote-session-authenticator` @ baseline `3330d6f9c` |
| Archetype      | 2 — Integration (auth-core adapter); 5 — Plugin (leaf + `session()` handler) |
| Scope overlays | `SCOPE-service.md` |

## PLAN-EVAL: SELECTED (hard stop)

Reason: public-contract decision on a shared, security-sensitive authentication boundary across two
packages plus a change to the auth plugin service's session handler. Complex-row authority: milestone
coordinator (`coordinator-dispatch.json`). Plan author: Fable 5.1 (Anthropic). Plan evaluator: different
vendor family and session (`muse_spark_1_3@max → grok_4_6@high`). No implementation file may exist
before `plan-eval.md` reads `PASS`.

Implementation generator (per coordinator): Astra medium. IMPL-EVAL identity is resolved at dispatch
from a fresh `agentic:matrix --tier complex --impl-evaluator` relative to Astra's family and session.

## Design

### Public Surface

- `@netscript/plugin-auth-core/authenticator`: `createAuthServiceAuthenticator(options): AuthenticatorPort`,
  `AuthServiceAuthenticatorOptions`, `readBearerCredential(request)`, `REMOTE_SESSION_REJECTIONS`,
  `RemoteSessionVerificationError`.
- `@netscript/plugin-auth/authenticator`: the same five names re-exported; nothing added.
- No new public surface on the auth service; handlers receive `context.request` through the existing bridge and `GET /session` gains bearer resolution (behaviour only).

### Domain Vocabulary (imported, none redefined)

- `AuthenticatorPort`, `AuthnRequest`, `AuthnResult`, `Principal` — `@netscript/service/auth`.
- `authContract`, `SessionResponse`, `SessionResponseSchema`, `AUTH_SESSION_STATES` —
  `@netscript/plugin-auth-core/contracts/v1`.
- `AuthSessionLookup.token` — `@netscript/plugin-auth-core/ports` (already "id, token, or request-derived").
- `AuthServiceAuthenticatorOptions` — new, options only (`plan.md` § Public API).

### Ports

- Implemented: `AuthenticatorPort`. Composed: SDK `ServiceClient<AuthContract>` via
  `createServiceClient`; `createBearerSdkClientContribution`. Consumed by the handler change:
  `AuthSessionStorePort.getSession` with `token`. No new port.

### Constants

- `REMOTE_SESSION_REJECTIONS` = `{ bearerMissing, unauthorized, notActive, expired }` (typed `Readonly<{…}>`).
- `DEFAULT_AUTH_ROUTER_NAME = 'auth'` (router namespace, F9 — not a discovery default).
- Error codes: `'discovery' | 'transport' | 'timeout' | 'malformed_response' | 'remote_error'`.
- Bearer context key `accessToken`.
- `timeoutMs` bounds: integer, `1 … 2_147_483_647`.

### Commit Slices

See `plan.md` § Commit Slices: S0 baseline evidence, S1 core adapter + unit tests, S2 request propagation + native
`session()` bearer support with real-HTTP precedence/isolation tests, S3 real-HTTP acceptance (native service +
in-memory kv-oauth) + fault fixture + middleware integration, S4 plugin leaf, S5 carriers.

### Deferred Scope

- `plan.md` § Non-Scope; notably the request-blind `me`/`signout` bridge (F18) and #1383 steps 1–2, 4–5.

### Contributor Path

To add another remote verifier, copy `packages/plugin-auth-core/src/adapters/auth-service-authenticator.ts`:
build the SDK client with the published contract and bearer contribution, validate with the published
response schema, map to `AuthnResult`, throw `RemoteSessionVerificationError` for anything that is not a
definite rejection, export from `src/adapters/mod.ts`, add the entrypoint to `deno.json` `check`, add the
reference-page row. To make another auth route honour a bearer, use `context.request` (now propagated for every handler) and pass `readBearerCredential(...)` as `token`, as `session()` does.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| ---------- | ----- | ---- | ----- |
| 2026-09-07 23:46 | — | bootstrap | run dir created by coordinator |
| 2026-09-08 00:09 | S0 (partial, coordinator) | baseline | `baseline-auth-tests.json` (10 pass, raw `deno test`, exploratory); `coordinator-bearer-probe.{ts,json}` (handler level: direct/cookie true, bearer false; probe process retained a handle — exit 143, not a test) |
| 2026-09-08 | — | plan rev 1 | rejected by coordinator scope review (7 points) |
| 2026-09-08 22:15 | — | research add | `planner-http-session-probe.{ts,json,log}`: native service over real HTTP + typed SDK: direct true, cookie false, bearer false, bogus bearer false; listener stopped, exited via `Deno.exit` — evidence, not a test |
| 2026-09-08 | — | plan rev 2 | all seven review points addressed; **no implementation** |
| 2026-09-08 22:20 | — | plan rev 2.1 | folded coordinator `coordinator-request-context.md` + `coordinator-http-context-probe.json` (bridge read at context seam → cookie true, bearer false) and `coordinator-probe-cleanup.md` (`await using` KV ownership); L12/S2 updated |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| One core factory `createAuthServiceAuthenticator`, plugin leaf re-exports | issue name; thin glue; no new edge | #1383, F10/F12 |
| `serviceName`/`timeoutMs` required, validated | no framework default invented | coordinator review 3 |
| Principal `scheme:'bearer'`, no `sessionId`/`providerId` claims | session id is the bearer in kv-oauth | coordinator review 4; F6 |
| Redacted error, no `cause`, `toJSON` limited | mirror SDK redaction shape | F21; review 5 |
| `main.ts` context factory reads `currentAuthRequest()`; `session()` passes strict bearer as `token` | request never reached handlers; bearer never reached the lookup | F8/F18/F22; review 1; `coordinator-request-context.md` |
| `me`/`signout` untouched | #1384 ownership | review 1 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Rev-1 false claim that sibling references were missing | minor | yes (corrected) |
| Docs `auth-api` vs generator `services__auth__http__0` | minor now (no default chosen) | yes |
| Request bridge unread → all handlers request-blind over HTTP | significant (fixed at the seam by L12) | yes |
| In-memory KV expiration timer retained by probes | minor (test-ownership rule) | yes |

## Gate Results

Not run — planning only. S0 populates baseline counts before S1.

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| check/test/lint/fmt | `plan.md` § Validation Plan rows 2–4 | `NOT_RUN` | after PLAN-EVAL PASS |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-3/5/6/7/11/14/15/18/19 | `NOT_RUN` | — | rows 5–8 |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Native plugin service over HTTP + in-memory kv-oauth (ARCHETYPE-5 runtime, no Aspire session, no IdP) | `NOT_RUN` | S3 | required because a plugin service handler changes |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| `plugins/auth` import surface, middleware integration | `NOT_RUN` | S3/S4 | — |

## Handoff Notes

- PLAN-EVAL: start at `plan.md` L6/L9/L12/L13 and the S3 test list; spot-check F18 by grepping
  `currentAuthRequest` call sites and rerunning `planner-http-session-probe.ts` (it stops its own listener).

## Coordinator full baseline receipt

At product source3330d6f9c (run-only head4e8bc5ed9), structured run-deno-test wrapper over packages/plugin-auth-core, plugins/auth/tests and packages/service/tests/auth completed exit0:97 passed,0 failed,0 ignored. Receipt baseline-full-auth-tests.json. This completes the scoped baseline measurement; it is not new remote-verifier acceptance or independent plan PASS. No product files changed.

## First implementation slice

Independent plan PASS retained; evaluator ses_f82065586ffeLljGd8IO7l8SLt, source4c020c538, wrapperexit0. Fresh implementation matrix selects the coordinator Astra medium. Implemented strict bearer reader, main request propagation and native session lookup; real HTTP native-router/SDK test proves valid/invalid bearer, cookie compatibility and revocation re-observation with owned cleanup. Scoped check:71files,1batch,0failed; tests:12passed,0failed. Receipts slice-check.json/slice-tests.json. Factory, fault matrix, carriers and IMPL-EVAL remain pending; not merge-ready. S2 prerequisite implemented before the full S1 adapter because it is required for a real successful verifier call. No release action.

## 2026-09-08 — Core verifier and public leaf implementation checkpoint

Implemented the native SDK-backed remote session authenticator, explicit discovery/timeout policy, schema validation, active/expiry checks, unchanged native claims and redacted verifier errors. Added the thin plugin public leaf and identity import test. The real native HTTP test exercises this factory before and after backend revocation.

[observed - factory-public-tests.json] Focused wrapper: 16 passed, zero failed/ignored; denied environment/network permissions prove missing/malformed bearer does not attempt discovery or transport. Missing discovery is a thrown redacted transport error, not credential denial. Initial incorrect claim-absence assertion retained in factory-initial-claim-failure.json; corrected to native claim equality as the reviewed plan requires.

Remaining: fault-injected remote error/malformed/timeout and middleware status cases, credential precedence/concurrency coverage, docs/generated carriers, full gates and independent implementation review. No merge-readiness, consumer installed-artifact, release or live IdP claim.

## 2026-09-08 — HTTP fault boundary checkpoint

[observed - factory-fault-tests.json] Five adapter tests pass with sanitizers enabled, including the contract-implemented HTTP fault fixture: UNAUTHORIZED maps to denial; AUTH_PROVIDER_ERROR throws a redacted remote error; authenticated-without-session denies; a deliberately held handler times out and its owned pending promise/listener are released in finally. Public ORPCError is used in the fixture because the auth implementer's typed error factory does not expose these entries precisely. Native positive acceptance remains separate. Malformed wire data, middleware status integration and remaining plan gates are still pending.
