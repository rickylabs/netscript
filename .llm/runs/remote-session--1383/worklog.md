# Worklog: remote session-verifying AuthenticatorPort (#1383 partial)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `remote-session--1383` |
| Branch         | `feat/remote-session-authenticator` @ baseline `3330d6f9c` |
| Archetype      | 2 — Integration (auth-core), 5 — Plugin (re-export) |
| Scope overlays | `SCOPE-service.md` |

## PLAN-EVAL: SELECTED (hard stop)

Reason: public-contract decision on a shared, security-sensitive authentication boundary spanning two
packages, with three unresolved decisions (OQ1–OQ3) that a wrong answer would force rework on.
Complex-row authority: milestone coordinator (`coordinator-dispatch.json`). Route:
`muse_spark_1_3@max → grok_4_6@high`, separate session, non-Anthropic family. No implementation
file may be created before `plan-eval.md` reads `PASS`.

## Design

### Public Surface

- `@netscript/plugin-auth-core/authenticator` → `createRemoteSessionAuthenticator(options): AuthenticatorPort`,
  `RemoteSessionAuthenticatorOptions`, `REMOTE_SESSION_REJECTIONS`, `RemoteSessionVerificationError`.
- `@netscript/plugin-auth/authenticator` → `createAuthServiceAuthenticator(options): AuthenticatorPort`
  plus the three re-exports above.

### Domain Vocabulary (all imported, none redefined)

- `AuthenticatorPort`, `AuthnRequest`, `AuthnResult`, `Principal` — `@netscript/service/auth`
  (already re-exported by auth-core `domain`).
- `authContract`, `SessionResponse`, `SessionResponseSchema`, `AUTH_SESSION_STATES` —
  `@netscript/plugin-auth-core/contracts/v1`.
- `RemoteSessionAuthenticatorOptions` — new, options only (see `plan.md` § Public API).

### Ports

- Consumed: `AuthenticatorPort` (implemented), SDK `ServiceClient<AuthContract>` (composed via
  `createServiceClient`), `createBearerSdkClientContribution` (composed). No new port is declared;
  the SDK client is the external-system seam and the tests exercise it over real HTTP.

### Constants

- `REMOTE_SESSION_REJECTIONS` = `{ bearerMissing, unauthorized, notActive, expired }` (typed
  `Readonly<{...}>`, mirrors `AUTH_SESSION_STATES`).
- `DEFAULT_REMOTE_SESSION_ROUTER_NAME = 'auth'` (F9).
- `DEFAULT_REMOTE_SESSION_TIMEOUT_MS` — value per OQ2.
- Bearer context key `accessToken` (contribution context `{ accessToken: 'required' }`).

### Commit Slices

See `plan.md` § Commit Slices (S0 baseline evidence, S1 core adapter + unit tests, S2 real-HTTP
typed-SDK tests + middleware integration, S3 plugin-auth re-export, S4 surface carriers).

### Deferred Scope

- Everything in `plan.md` § Non-Scope; notably OQ3 (auth service bearer → `lookup.token`) and the
  factory/adoption/scaffold steps of #1383.

### Contributor Path

A contributor adding another remote verifier (for example a `/me`-based identity reader) copies
`packages/plugin-auth-core/src/adapters/remote-session-authenticator.ts`: build the SDK client with the
published contract and the bearer contribution, validate with the published response schema, map to
`AuthnResult`, and throw `RemoteSessionVerificationError` for anything that is not a definite
rejection. Export it from `src/adapters/mod.ts`, add the entrypoint to `deno.json` `check`, and add
the sub-path row to the reference page.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| ---------- | ----- | ---- | ----- |
| 2026-09-07 23:46 | — | bootstrap | run dir created by coordinator (brief, matrix receipts, dispatch record) |
| 2026-09-08 | — | research | skills, issue #1383, auth-core/sdk/service surfaces, Cockpit reference, generator evidence read; `find_guidance` run locally over `docs/site` |
| 2026-09-08 | — | plan | `plan.md`, this Design checkpoint, `context-pack.md`, `drift.md` written; **no implementation** |
| 2026-09-08 00:09 | S0 (partial, coordinator) | baseline | `baseline-auth-tests.json` (plugins/auth services tests: 10 pass at baseline, raw `deno test`) and `coordinator-bearer-probe.{ts,json}` (OQ3 reproduced: bearer → `authenticated:false`, cookie/direct → `true`) written by the coordinator; S0 still owes wrapper-sourced receipts for `packages/service/tests/auth` and `packages/plugin-auth-core` |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Adapter in auth-core, re-export in plugin-auth | thin-glue verdict; no new dependency edge; no cycle | doctrine 10; research F10/F12 |
| Throw on unavailable/malformed, deny on rejected | native 503/401 split | PR #2001, F3 |
| `direct-only` response cache, no memoisation | revocation must be re-observed | brief; F7 |
| `serviceName` required in core | no discovery guessing | brief; OQ1 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Sibling family-reference repos unavailable | minor | yes |
| `aspireify` skill absent from consumer bundle | minor | yes |
| Docs `serviceName: 'auth-api'` vs generator `services__auth__http__0` | significant (OQ1) | yes |
| Auth service `/session` ignores bearer (OQ3) | significant (adoption dependency) | yes |

## Gate Results

Not run — planning only. S0 will populate the static-gate table with baseline counts before S1.

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
| Aspire/runtime | `N/A` | — | no service/AppHost change |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| `plugins/auth` import surface, middleware integration test | `NOT_RUN` | — | S2/S3 |

## Handoff Notes

- PLAN-EVAL: start with `plan.md` § Open-Decision Sweep (OQ1–OQ4) and § Locked Decisions L5/L6; spot-check
  research F8 (auth service ignores bearer) and F9 (discovery key) against the tree.
- The plan deliberately does not answer OQ1/OQ2 with invented defaults; the coordinator owns them.
