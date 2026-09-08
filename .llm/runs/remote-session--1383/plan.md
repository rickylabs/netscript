# Plan: remote session-verifying `AuthenticatorPort` + native `/session` bearer support (partial PR toward #1383)

Revision 2 (2026-09-08) after coordinator scope review. Supersedes revision 1 in full.

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `remote-session--1383` |
| Branch         | `feat/remote-session-authenticator` (baseline `3330d6f9c`) |
| Phase          | `plan` → hard stop at PLAN-EVAL |
| Target         | `packages/plugin-auth-core` (adapter owner), `plugins/auth` (re-export leaf **and** auth service `session` handler) |
| Archetype      | 2 — Integration (adapter over SDK transport); 5 — Plugin (leaf + service handler) |
| Scope overlays | `SCOPE-service.md` (a plugin service handler changes; consumer is a service authn stage) |

## Archetype

Archetype 2 governs the adapter (auth-core, doctrine verdict Keep, F12). Archetype 5 governs the two
`plugins/auth` changes: the thin `./authenticator` leaf and the minimum `session()` handler change.
ARCHETYPE-5 runtime gates are therefore **required** (a plugin service is touched); see § Fitness Gates.

## Current Doctrine Verdict

`packages/plugin-auth-core` Keep (Archetype 2); `plugins/auth` Keep, thin glue over auth-core (F12).

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | Options/result types first; the factory returns the existing `AuthenticatorPort`. |
| A3 | 80 % path: `withAuthn({ authenticator: createAuthServiceAuthenticator({ serviceName, timeoutMs }) })`. |
| A6 | One shared bearer grammar (`readBearerCredential`) is justified because two private, disagreeing parsers already exist (F20) and both the adapter and the session handler need the same strict form. |
| A7 | `@netscript/sdk` + `createBearerSdkClientContribution`; `SessionResponseSchema`; `AbortSignal.timeout`. No custom fetch, DTO, cache, or error hierarchy. |
| A10 | Discovery name, timeout, transport policy are caller inputs resolved at the composition root. |
| A13 | Verifier unavailability is a thrown boundary error → native redacted 503 (F3). |
| A14 | Baseline regression evidence + real-HTTP acceptance against the native service preserve the contract. |

## Goal

Land #1383 step 3 as a working end state: a service can verify a bearer session through the auth
plugin's typed `GET /session` with **no backend instance, KV handle, or provider secret**, and the
native auth service actually honours that bearer (today it does not, F8/F18).

## Scope

1. `@netscript/plugin-auth-core/authenticator`: `createAuthServiceAuthenticator(options): AuthenticatorPort`,
   `AuthServiceAuthenticatorOptions`, `readBearerCredential(request)`, `REMOTE_SESSION_REJECTIONS`,
   `RemoteSessionVerificationError`.
2. `@netscript/plugin-auth/authenticator`: re-export of exactly those names (thin leaf).
3. Native request propagation + bearer lookup: `plugins/auth/services/src/main.ts` supplies
   `request: currentAuthRequest()` through the **existing** context seam (the `withAuthRequest`
   AsyncLocalStorage bridge that has no reader today, F18); `session()` in
   `plugins/auth/services/src/routers/v1-handlers.ts` passes the strict bearer as `lookup.token`.
   `sessionId`/cookie callers keep working; no new middleware, no second request store.
4. Tests: adapter unit; handler-level precedence/malformed; **real typed-SDK HTTP → native plugin
   service → in-memory kv-oauth** acceptance; fault-injection fixture for outage/malformed/timeout;
   middleware integration; no-backend-dependency guard.
5. README public-surface rows, two reference-page rows, regenerated export corpus and carriers.

## Non-Scope (stays open on #1383 or elsewhere)

- `PluginServiceConfig.auth`, explicit public opt-out, guard-ordering test (#1383 steps 1–2).
- First-party adoption, `netscript plugin new` guarded scaffold, `scaffold.runtime` box (#1383 4–5).
- `signout` (#1384) and `me` handler code is **not** changed. Because request propagation happens at
  the shared context seam, both handlers start receiving the request they were written for; #1384's
  defect (trusting `input.sessionId`) is neither fixed nor widened, and no `me`/`signout` behaviour is
  claimed or tested beyond the existing round-trip test staying green.
- Cookie forwarding by the adapter, interactive sign-in policy, provider policy, #884, #885, #934.
- Any release, canary, tag, version bump, or live-IdP claim. Dependencies stay workspace-source.

## Hidden Scope

- `deno.json` `check`/`doc-lint` task lists enumerate entrypoints in both packages; add the new files.
- Generated carriers after an export change: `gen:mcp-export-corpus`; if reference pages change,
  `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`, each with its `--check` gate (F13).
- JSDoc example ratchet: every new exported symbol needs a compiling `@example` (F15).
- Test handle ownership: tests construct their own `MemoryKvAdapter` and `await kv.close()` (F19);
  every served fixture is stopped in `finally`. Deno sanitizers stay on.

## Public API (locked)

```ts
// @netscript/plugin-auth-core/authenticator  → src/adapters/mod.ts
export interface AuthServiceAuthenticatorOptions {
  /** Aspire discovery name (`services__<name>__http__0`). Required, non-empty after trim. */
  readonly serviceName: string;
  /** Per-request verification budget in ms. Required; finite integer, 1 ≤ ms ≤ 2_147_483_647 (`AbortSignal.timeout` range). */
  readonly timeoutMs: number;
  /** Router namespace; defaults to `'auth'` = `assemblePluginContractRouter` namespace (F9). Not a discovery guess. */
  readonly routerName?: string;
  /** Discovery protocol passed to the SDK; SDK default `'http'`. */
  readonly protocol?: 'http' | 'https';
  /** Pass-through to `createBearerSdkClientContribution` for non-loopback cleartext. */
  readonly allowInsecureTransport?: boolean;
}
export const REMOTE_SESSION_REJECTIONS: Readonly<{
  bearerMissing: 'remote_session_bearer_missing';   // no strict `Authorization: Bearer <token>` → no remote call
  unauthorized:  'remote_session_unauthorized';     // auth service answered defined UNAUTHORIZED
  notActive:     'remote_session_not_active';       // authenticated:false | no session | state ≠ active
  expired:       'remote_session_expired';          // expiresAt not finite or ≤ now
}>;
/** Strict grammar: exactly `Bearer` (case-insensitive) + one run of whitespace + one non-empty token with no whitespace. */
export function readBearerCredential(request: Pick<AuthnRequest, 'header'>): string | undefined;
export class RemoteSessionVerificationError extends Error {
  readonly code: 'discovery' | 'transport' | 'timeout' | 'malformed_response' | 'remote_error';
  readonly procedurePath: 'session';
  toJSON(): { code; procedurePath };   // no cause, no message interpolation, no body, no credential
}
export function createAuthServiceAuthenticator(options: AuthServiceAuthenticatorOptions): AuthenticatorPort;

// @netscript/plugin-auth/authenticator → src/public/authenticator.ts : `export { … } from '@netscript/plugin-auth-core/authenticator'` (same names, nothing added)
```

Construction validates `serviceName` (string, non-empty after trim) and `timeoutMs` (finite integer in
the range above) and throws a `TypeError` naming the option — no custom transport, no defaults.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| L1 | Adapter and shared bearer reader live in `packages/plugin-auth-core/src/adapters/`, exported as `./authenticator`; `plugins/auth` re-exports the same names through `./authenticator`. One factory, named `createAuthServiceAuthenticator` as #1383 requests. | F12 thin-glue verdict; auth-core already carries the `sdk` and `service` edges (F5, F10) — no new edge, no cycle; a second differently named factory was ceremony. |
| L2 | Transport = `createServiceClient({ contract: authContract, serviceName, routerName, protocol, contributions: [bearer] })`, `bearer = createBearerSdkClientContribution<{ accessToken: string }>({ context: { accessToken: 'required' }, resolveCredential: ({ context }) => context.accessToken, responseCache: { mode: 'direct-only' }, allowInsecureTransport })`. | F6/F7: the #1352 seam; `direct-only` forbids any cache. |
| L3 | Credential extraction uses `readBearerCredential`; anything that is not the strict form → `{ ok:false, reason: bearerMissing }` **before** any remote call. Cookies are never read by the adapter. | Brief; one grammar shared with the service handler (A6). |
| L4 | Per request: `client.session(undefined, { context: { accessToken, signal: AbortSignal.timeout(timeoutMs) } })` then `SessionResponseSchema.parse(...)`. | SDK has no output validation (F6); schema is auth-core's (F5). |
| L5 | Outcome mapping: defined `UNAUTHORIZED` → `unauthorized`; `authenticated:false` / no session / `state !== 'active'` → `notActive`; `expiresAt` not finite or `≤ Date.now()` → `expired`; **everything else throws** `RemoteSessionVerificationError` (`discovery` = SDK discovery error, `timeout` = abort/`TimeoutError`, `malformed_response` = schema failure, `remote_error` = any other defined error incl. `AUTH_PROVIDER_ERROR`/`INTERNAL`/`VALIDATION_ERROR`, `transport` = anything else) so native middleware answers 503 (F3). `safe()`/`isDefinedError` from `@netscript/sdk/client` do the narrowing. | Brief; #2001. |
| L6 | Principal = `{ subject: session.subject, scopes: session.scopes, roles: session.roles, scheme: 'bearer', claims: session.claims }`. **No `sessionId`, no `providerId`, no token.** | In kv-oauth the session id *is* the bearer credential (coordinator probe); adding it to `claims` would put the credential where request logs/audit can read it. `scheme: 'bearer'` is the service port's own value for bearer-verified identities (F4). `session.claims` is forwarded unchanged: it is the auth service's published, provider-normalized claim bag already returned by `GET /session` to the bearer holder, so forwarding adds no exposure; the adapter never adds claims of its own. |
| L7 | No state: the factory holds the client and options only; no memoised principal, no negative cache. | Revocation is re-observed per request. |
| L8 | `serviceName` and `timeoutMs` are **required** and validated at construction (see § Public API). No framework default is chosen in this PR; a convenience default is a separable later decision. | Coordinator direction; avoids picking `auth` vs `auth-api` (F9) and an arbitrary timeout. |
| L9 | Errors: one class mirroring the SDK's redacted-diagnostic shape (F21): fixed message, stable `code`, `procedurePath`, `toJSON()` limited to those fields, **no `cause`**, no response body, no URL, no credential. The class exists only because the SDK's contribution error codes do not cover transport/verification. | Coordinator direction; safe for any host that serialises errors. |
| L10 | PR is partial: `Part of #1383`, remaining-scope list, **no closing keyword**; milestone `0.0.8`; labels `type:feat`, `area:auth`, `area:plugins`, `area:sdk`, `priority:p0`, one `status:`. #1383 boxes 3–4 are ticked by the coordinator with evidence links post-merge. | netscript-pr rules. |
| L11 | No release: workspace-source deps, no bump, no tag, no canary claim, no live-IdP PASS inferred from in-memory kv-oauth. | Owner constraint. |
| L12 | **Native request propagation + bearer lookup (minimum):** (a) `main.ts` context factory becomes `() => ({ registry, telemetry, request: currentAuthRequest() })` — the existing bridge, read at the existing seam, per-request isolated by `AsyncLocalStorage`; (b) `session()` calls `backend.sessions.getSession({ sessionId: input?.sessionId, token: readBearerCredential(authnRequest), request: authnRequest })` where `authnRequest = toAuthnRequest(context.request, input?.sessionId)`. No other handler code changes. | F18 + coordinator `coordinator-http-context-probe.json` (with the bridge read: direct/cookie true over HTTP, bearer still false); F22: `token` is contract-conformant; credential precedence is backend-specific as L13 records. A token-only change cannot fix a missing `context.request`. |
| L13 | Credential precedence on `/session` (documented + tested): KV-OAuth: explicit `input.sessionId` › strict bearer › cookie; WorkOS: strict bearer › cookie (its store does not consume `sessionId`); better-auth keeps its own request-header resolution (`request` wins, `token` unused) per F22. A malformed/ambiguous `Authorization` header contributes **no** token (never an error) and resolution falls through; a bearer that names no session yields `authenticated:false`, never 401. | Preserves existing cookie/direct callers; matches the contract's `authenticated:false` posture. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Discovery default, timeout default | closed — required inputs (L8) | separable later convenience |
| Bearer reaching the session lookup | closed — in scope (L12/L13) | proven by S3 against the native service |
| Principal claims exposure | closed (L6) | evaluator: confirm forwarding `session.claims` unchanged is acceptable |
| Request propagation seam | closed — existing bridge read at the existing context factory (L12) | coordinator `coordinator-request-context.md`; no new middleware or store |
| Folder `src/adapters/`, export key `./authenticator` | closed | allowed vocabulary; mirrors existing subpath barrels |

No open decision would force rework if deferred.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Bearer contribution throws on non-loopback cleartext → 503 storm | `allowInsecureTransport` pass-through; README states the rule; test covers the throw → 503 path. |
| Discovery env absent → 503 on every request | `code: 'discovery'`; README names `services__<name>__http__0` and the PluginReference that wires it. |
| Propagating the request at the shared seam changes `session`/`me`/`signout` from request-blind to request-aware over HTTP | Intended for `session` and tested explicitly; `me`/`signout` code untouched, existing handler round-trip tests do not prove their HTTP behavior; no resolution of #1384 is claimed. Stated in the PR body. |
| Handler test leaks the KV expiration timer (F19) | Tests own the adapter and close it; served fixtures stopped in `finally`; sanitizers on. |
| In-memory kv-oauth mistaken for provider proof | Every acceptance test and the PR body say "in-memory kv-oauth, no IdP". |
| Export change breaks carriers | S5 runs the generator chain; each `--check` gate in the validation plan. |
| `any`/casts slip past scoped wrappers | `deno task quality:gate` required per slice. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-14 redefining sibling contracts | avoid | import `authContract`, `SessionResponseSchema`, `AUTH_SESSION_STATES`; nothing parallel |
| AP-25 ambient `fetch`/`Deno.env` in adapter | avoid | only the SDK reads discovery env; adapter reads no env/cookies |
| Fat plugin (ARCHETYPE-5) | avoid | adapter in core; leaf re-exports; handler change is minimal |
| Duplicate bearer parsers (F20) | resolve locally | one exported reader used by adapter and handler; the two private parsers are **not** touched (out of scope) |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-3/5/6/7/11/14/15/18/19 | yes | `deno task arch:check`, `audit-jsr-package.ts --root` ×2, `doc:lint` ×2, `deno publish --dry-run --allow-dirty` ×2 |
| F-10 test shape | yes | `*_test.ts` co-located (auth-core) and under `plugins/auth/tests/services` (plugin) |
| Runtime/Aspire validation (ARCHETYPE-5, plugin service touched) | **required** | S3: native `createPluginService` auth service served on an ephemeral port, in-memory kv-oauth, typed SDK client — no Aspire session, no IdP; classification stated as such |
| Consumer import validation | yes | `import-surface_test.ts`, middleware integration test |
| Release-gate class (`scaffold.runtime`) | not triggered by this change class (no scaffold output, DB wiring, or Aspire helper change) | coordinator may still require it at merge readiness; not claimed |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| new: request bridge unread for `me`/`signout` (F18) | none in this PR | surfaced in `drift.md`; coordinator owns the follow-up placement |
| `AUTH-BACKEND-ENV-CENTRALIZATION` | none | unrelated |

## Commit Slices (ordered)

| # | Slice proves | Gate | Files |
| - | ------------ | ---- | ----- |
| S0 | Baseline regression evidence at `3330d6f9c` via wrappers (`packages/service/tests/auth`, `packages/plugin-auth-core`, `plugins/auth/tests`) | `run-deno-test.ts`; counts into `worklog.md` (coordinator's raw receipt is exploratory) | run dir only |
| S1 | Core adapter refuses/denies/throws per L3–L7, options validated per L8, error redacted per L9; no-backend/no-ambient guard | `run-deno-test.ts` on the unit test; `run-deno-check.ts --root packages/plugin-auth-core --ext ts`; `quality:gate` | `packages/plugin-auth-core/deno.json` (export + `check` task), `src/adapters/mod.ts`, `src/adapters/bearer-credential.ts`, `src/adapters/auth-service-authenticator.ts`, `src/adapters/auth-service-authenticator_test.ts` |
| S2 | Native request propagation and strict-bearer lookup with precedence L13, **over real HTTP** against the native plugin service (caller-owned `MemoryKvAdapter` via `await using`, listener stopped in `finally`): sessionId only; bearer only; cookie only; sessionId+bearer differing → sessionId; bearer+cookie differing → bearer; malformed (`Bearer`, `Basic x`, `Bearer a b`, empty) → falls through to cookie or `authenticated:false`; lowercase bearer scheme is accepted; bogus bearer → `authenticated:false`; **per-request isolation**: two concurrent requests with different cookies/bearers each resolve their own session and never each other's; existing handler round-trip test still green | `run-deno-test.ts` on `plugins/auth/tests/services`; `run-deno-check.ts --root plugins/auth` | `plugins/auth/services/src/main.ts`, `plugins/auth/services/src/routers/v1-handlers.ts`, `plugins/auth/tests/services/session-credentials-http_test.ts` |
| S3 | **Acceptance over real HTTP:** typed SDK (`createAuthServiceAuthenticator`) → native auth plugin service (`createPluginService(router, { middleware: [withAuthRequest], context: () => ({ registry, request: currentAuthRequest() }) }).serve({ port: 0 })`) → in-memory kv-oauth: active session → `ok:true` principal per L6 (no `sessionId` claim, no token in `JSON.stringify`); bogus bearer → `ok:false notActive` (401 via middleware); revoked after `signout` → `notActive`, re-read each request (no retained principal); expired session → `expired`; missing/malformed header → 0 HTTP requests; `allowInsecureTransport` untouched on loopback. **Fault injection** (contract-implemented fixture router, clearly labelled, because the native service cannot emit these): `authenticated:true` without session, `state:'revoked'`, past `expiresAt`, defined `UNAUTHORIZED` → 401, `AUTH_PROVIDER_ERROR` → throw/503, malformed body → throw/503, hang → timeout → throw/503, discovery env missing → throw/503, error `toJSON()` contains no token/body. Middleware integration: `createService({}, …).withAuthn({ authenticator }).build()` → `/health` 200 without remote call, guarded path 401/503/… as above | `run-deno-test.ts` on the http test (sanitizers on; every listener and KV adapter closed) | `packages/plugin-auth-core/src/adapters/auth-service-authenticator.http_test.ts` (imports the plugin service by relative path exactly as `bearer-contribution_test.ts` already imports siblings) |
| S4 | `@netscript/plugin-auth/authenticator` leaf resolves and is documented; manifest verification unchanged | `run-deno-check.ts --root plugins/auth`; `import-surface_test.ts`; `verify-plugin.ts`; `doc:lint --root plugins/auth` | `plugins/auth/deno.json` (export, `check`, `doc-lint`), `src/public/authenticator.ts`, `tests/services/import-surface_test.ts`, `README.md` |
| S5 | Surface + carriers consistent | `docs:exports-drift`, `check:mcp-export-corpus`, `docs:jsdoc-examples`, `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `deno publish --dry-run --allow-dirty` ×2, `audit-jsr-package.ts` ×2, `doc:lint` ×2 | `packages/plugin-auth-core/README.md`, `docs/site/reference/plugin-auth-core/index.md`, `docs/site/reference/plugin-auth/index.md`, regenerated corpus/asset files, run-dir artifacts |

Product files touched: 14 (+ generated carriers). Each slice commits with run-dir updates, pushes, and
comments on the draft PR; the Tier-A supervisor reviews before each sign-off commit.

## Validation Plan

| Order | Gate | Command or check | Expected |
| ----- | ---- | ---------------- | -------- |
| 1 | baseline | S0 wrapper runs at `3330d6f9c` | green; counts recorded |
| 2 | check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-auth-core --root plugins/auth --ext ts` | 0 errors |
| 3 | test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/plugin-auth-core plugins/auth/tests packages/service/tests/auth` | baseline + new green, no leaked handles |
| 4 | lint/fmt | `run-deno-lint.ts` / `run-deno-fmt.ts`, same roots, `--ext ts` | clean |
| 5 | quality | `deno task quality:gate` | 0 findings, no new `quality-allow` |
| 6 | docs | `deno task doc:lint --root packages/plugin-auth-core --pretty`; same for `plugins/auth` | 0 |
| 7 | publish | `deno publish --dry-run --allow-dirty` in each package dir; `audit-jsr-package.ts --root <pkg> --text` | no slow types; F-gates clean |
| 8 | carriers | `docs:exports-drift`, `check:mcp-export-corpus`, `docs:jsdoc-examples`, `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets` | green |
| 9 | deps | `deno task deps:check`; `deno task deps:why @netscript/sdk` | no new edge in `plugins/auth` (leaf imports only auth-core) |
| 10 | CI | draft PR `ci` + `code-quality` green; `e2e-cli` per path classification, not force-skipped | green |

## Evaluation routing (recorded, not self-certified)

- **PLAN-EVAL:** this plan was authored by Fable 5.1 (Anthropic). The plan evaluator must be a
  different vendor family and session — matrix `plan_evaluation`: `muse_spark_1_3@max → grok_4_6@high`.
- **IMPL-EVAL:** the implementation generator is the coordinator's **Astra medium** lane, not this
  planner. The implementation evaluator must be resolved at dispatch from a **fresh**
  `deno task agentic:matrix --tier complex --impl-evaluator` relative to Astra's vendor family and
  session, not by the "non-Anthropic" shorthand. Record requested/observed identity in `worklog.md`.
- No product implementation before `plan-eval.md` = `PASS`.

## Independent implementation-evaluation scope

- Re-run validation rows 2–9; diff S0 baseline counts against post-slice counts.
- Confirm S3 acceptance runs against the **native** plugin service (not only the fault fixture), that
  the missing-bearer path makes zero HTTP requests, that a revoked session is re-read per request, and
  that `JSON.stringify(principal)` and `JSON.stringify(error)` contain neither the session id used as
  bearer nor any response body.
- Confirm `plugins/auth` gains no direct `@netscript/sdk` import edge, the `me`/`signout` handler diffs are empty, and the only `main.ts` change is the `request: currentAuthRequest()` field.
- Confirm the PR body has no closing keyword, lists remaining #1383 scope, and labels the runtime
  evidence as in-memory kv-oauth without IdP.

## Remaining #1383 scope after this PR (verbatim in the PR body)

Steps 1, 2, 4, 5; acceptance boxes 1–2 and 5–12; docs proof in `explanation/plugin-system.md`,
`identity-access/auth.md`, `how-to/add-authentication.md`; a convenience discovery/timeout default;
any `me`/`signout` behaviour claims now that they receive the request (not asserted here).

## Dependencies

- `@netscript/sdk`, `@netscript/plugin-auth-core`, `@netscript/service` (#2001) — workspace source. No
  new third-party dependency.

## Drift Watch

- SDK discovery key format or `createServiceClient` options; `SessionResponse` schema or `session` meta;
  #2001 401/503 split; backend `getSession` precedence order (F22).
