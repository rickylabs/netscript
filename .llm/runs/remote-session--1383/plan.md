# Plan: remote session-verifying `AuthenticatorPort` (partial PR toward #1383)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `remote-session--1383` |
| Branch         | `feat/remote-session-authenticator` (baseline `3330d6f9c`) |
| Phase          | `plan` → hard stop at PLAN-EVAL |
| Target         | `packages/plugin-auth-core` (owner) + `plugins/auth` (re-export) |
| Archetype      | 2 — Integration (auth-core adapter over SDK transport); 5 — Plugin for the thin re-export |
| Scope overlays | `SCOPE-service.md` (consumer is a service authn stage); no frontend, no AppHost |

## Archetype

Two archetypes apply; the larger, Archetype 2, governs: the deliverable is an adapter that turns an
external system (the auth plugin's HTTP session endpoint, reached through `@netscript/sdk`) into the
service-owned `AuthenticatorPort`. The `plugins/auth` change is a one-file re-export and keeps the
doctrine verdict "thin glue over auth-core" (research F12). Implementing the adapter inside
`plugins/auth` would be the ARCHETYPE-5 "fat plugin" anti-pattern.

## Current Doctrine Verdict

`packages/plugin-auth-core` Keep (Archetype 2); `plugins/auth` Keep, thin glue (F12).

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | Options/result types are designed first; the factory returns the existing `AuthenticatorPort`. |
| A3 | 80 % path is one call: `withAuthn({ authenticator: createAuthServiceAuthenticator({...}) })`. |
| A7 | Transport is `@netscript/sdk` + `createBearerSdkClientContribution`; validation is the published `SessionResponseSchema`; timeout is `AbortSignal.timeout`. No custom fetch, DTO, or cache. |
| A10 | Discovery name, timeout, transport policy are options resolved at the composition root, not env reads inside the adapter. |
| A13 | Verifier unavailability is a thrown boundary error → native redacted 503 (F3). |
| A14 | Real-HTTP typed-SDK tests + baseline regression evidence preserve the contract. |

## Goal

Land the reusable framework seam #1383 step 3 names: a remote session-verifying `AuthenticatorPort`
that a guarded service can use with **no auth backend instance, no KV/DB handle, and no provider
secret**, verifying every request through the auth plugin's typed `GET /session` contract.

## Scope

- New `@netscript/plugin-auth-core/authenticator` subpath: `createRemoteSessionAuthenticator(options)`,
  `RemoteSessionAuthenticatorOptions`, `RemoteSessionVerificationError`, `REMOTE_SESSION_REJECTIONS`.
- New `@netscript/plugin-auth/authenticator` subpath: `createAuthServiceAuthenticator(options)` — the
  issue-named export — a thin wrapper over the core factory plus type re-exports.
- Tests: unit (port semantics), real-HTTP typed-SDK consumer tests against a contract-implemented
  fixture service, middleware integration (401/503 mapping), no-backend-dependency guard.
- README public-surface tables, both reference pages' sub-path rows, regenerated export corpus.

## Non-Scope (stays open on #1383)

- `PluginServiceConfig.auth`, explicit public opt-out, guard ordering test (#1383 steps 1–2).
- First-party plugin adoption and the auth service's own guarding, including mapping a bearer to
  `lookup.token` on `/session` (#1383 step 4; see OQ3).
- `netscript plugin new` guarded scaffold (#1383 step 5), `scaffold.runtime` gate box.
- Cookie forwarding, interactive sign-in policy, org/tenant authz (#884), test kit (#885), #934, #1384.
- Any release, canary, tag, or version bump. Dependencies stay workspace-source.

## Hidden Scope

- `deno.json` `check` task lists in both packages enumerate entrypoints; the new files must be added or
  `doc-lint`/`check` skip them silently (research jsr scan).
- Generated carrier chain after an export change: `gen:mcp-export-corpus`, and if reference pages
  change, `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`, each with its `--check`
  gate (F13).
- JSDoc example ratchet: every new exported symbol needs a compiling `@example` (F15).
- `import-surface_test.ts` in `plugins/auth` should assert the new subpath resolves.

## Public API (locked shape; names final unless PLAN-EVAL objects)

```ts
// @netscript/plugin-auth-core/authenticator  (src/adapters/mod.ts)
export interface RemoteSessionAuthenticatorOptions {
  /** Aspire discovery name of the auth service (`services__<name>__http__0`). Required. */
  readonly serviceName: string;
  /** Router namespace; defaults to `'auth'` (matches `assemblePluginContractRouter` namespace, F9). */
  readonly routerName?: string;
  /** Discovery protocol; defaults to `'http'` (SDK default). */
  readonly protocol?: 'http' | 'https';
  /** Per-request verification budget in milliseconds; see OQ2 for the default. */
  readonly timeoutMs?: number;
  /** Pass-through to the bearer contribution for non-loopback cleartext transports. */
  readonly allowInsecureTransport?: boolean;
}
export const REMOTE_SESSION_REJECTIONS: Readonly<{
  bearerMissing: 'remote_session_bearer_missing';   // no/malformed Authorization → no remote call
  unauthorized:  'remote_session_unauthorized';     // auth service answered UNAUTHORIZED
  notActive:     'remote_session_not_active';       // authenticated:false, missing session, state≠active
  expired:       'remote_session_expired';          // expiresAt ≤ now or unparsable
}>;
export class RemoteSessionVerificationError extends Error { /* fixed message, `cause`, never the credential */ }
export function createRemoteSessionAuthenticator(
  options: RemoteSessionAuthenticatorOptions,
): AuthenticatorPort;

// @netscript/plugin-auth/authenticator  (src/public/authenticator.ts)
export function createAuthServiceAuthenticator(
  options: RemoteSessionAuthenticatorOptions,   // becomes Partial<'serviceName'> only if OQ1 resolves
): AuthenticatorPort;
export type { RemoteSessionAuthenticatorOptions } ; export { REMOTE_SESSION_REJECTIONS, RemoteSessionVerificationError };
```

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| L1 | Adapter lives in `packages/plugin-auth-core/src/adapters/` and is exported as `./authenticator`; `plugins/auth` only re-exports through `./authenticator`. | F12 verdict + ARCHETYPE-5 fat-plugin rule; auth-core already imports `@netscript/sdk/client` and `@netscript/service/auth` (F5, F10), so no new package edge and no cycle. `adapters` is doctrine folder vocabulary. |
| L2 | Transport = `createServiceClient({ contract: authContract, serviceName, routerName, protocol, contributions: [bearer] })` with `createBearerSdkClientContribution<{ accessToken: string }>({ context: { accessToken: 'required' }, resolveCredential: ({context}) => context.accessToken, responseCache: { mode: 'direct-only' }, allowInsecureTransport })`. | F6/F7: typed SDK seam from #1352; `direct-only` forbids any response cache; discovery is SDK-owned. No custom fetch, no handwritten DTO. |
| L3 | Credential extraction: exactly one `Authorization: Bearer <token>` (single non-empty token, case-insensitive scheme). Anything else → `{ ok:false, reason: bearerMissing }` **before** any remote call. Cookies are never read. | Brief; Cockpit evidence; prevents credential-shape probing against the auth service. |
| L4 | Per request: `client.session(undefined, { context: { accessToken, signal: AbortSignal.timeout(timeoutMs) } })`, then `SessionResponseSchema.parse(result)`. | SDK has no output validation (F6); schema is published by auth-core (F5); `AbortSignal.timeout` is the SDK's documented cancellation seam. |
| L5 | Outcome mapping: (a) defined `UNAUTHORIZED` contract error → `{ ok:false, reason: unauthorized }`; (b) `authenticated:false`, missing `session`, or `state !== 'active'` → `notActive`; (c) `expiresAt` not finite or `≤ Date.now()` → `expired`; (d) any other failure — transport error, discovery miss, timeout/abort, malformed body (`ZodError`), other defined errors such as `AUTH_PROVIDER_ERROR`/`INTERNAL`/`VALIDATION_ERROR` — is **thrown** as `RemoteSessionVerificationError` (with `cause`) so native middleware answers a redacted 503 (F3). | Brief: valid-but-rejected sessions are denials; unavailable/malformed remote is never a credential rejection. Use `safe()`/`isDefinedError` from `@netscript/sdk/client` for (a). |
| L6 | Principal: `{ subject, scopes, roles, scheme: 'custom', claims: { ...session.claims, sessionId: session.id, providerId: session.providerId } }`. | Mirrors `AuthPrincipalMapperPort` output of every backend (F5), so a service sees one principal shape whether identity is verified in-process or remotely. Evaluator: see OQ4. |
| L7 | No state: the factory holds only the client and options; nothing is memoised per request, no last-good principal, no negative cache. | Brief: revocation must be re-observed on every request. |
| L8 | `serviceName` is **required** on the core factory; no discovery default is invented (OQ1). | Brief: no endpoint guessing; the plugin-auth wrapper may add a default once OQ1 is answered. |
| L9 | Error redaction: the thrown error message is fixed text; the credential, the discovered URL query, and the raw response body are never interpolated; `cause` carries the original error for logs. | `logAuthDecision` already logs only `authn.error`; keeps the port safe for other hosts. |
| L10 | PR is partial: body carries `Part of #1383` and the remaining-scope list; **no closing keyword**; milestone `0.0.8`; labels `type:feat`, `area:auth`, `area:plugins`, `area:sdk`, `priority:p0`, one `status:`. Acceptance boxes 3–4 of #1383 are ticked by the coordinator with PR evidence links after merge (mirror is closing-keyword-gated). | netscript-pr skill; close-gate rules. |
| L11 | No release: all deps stay workspace-source; the PR does not justify a canary; nothing is bumped or tagged. | Owner constraint in the brief. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| OQ1 default `serviceName` for `createAuthServiceAuthenticator` (`'auth'` from generator test F9 vs `'auth-api'` in docs) | **must resolve now** — returned to coordinator, not invented | Non-blocking for slices S1–S2 (core requires the name). S3 ships the wrapper with `serviceName` required unless the coordinator confirms `AUTH_PLUGIN_ID`; if confirmed, S3 also fixes the docs example or files a docs-lane note. |
| OQ2 default `timeoutMs` | **must resolve now** — recommendation 10 000 ms (consumer precedent only) | Implemented as one named constant `DEFAULT_REMOTE_SESSION_TIMEOUT_MS`; value is a one-line change. |
| OQ3 auth service `/session` ignores `Authorization: Bearer` (F8) | safe to defer for this PR; **blocking for first-party adoption** | Record in PR body and #1383 comment as a dependency of step 4; candidate fix is in `v1-handlers.ts session()` passing `token` from the bearer header to `getSession`. Not implemented here. |
| OQ4 principal scheme `custom` (L6) vs `bearer` | resolved by L6; evaluator confirm | Changing it is a one-line edit; tests assert the chosen value. |
| Folder name `src/adapters/` vs `src/authenticator/` | resolved (L1) | `adapters` is allowed vocabulary; export key stays `./authenticator`. |
| Where the real-HTTP fixture router lives | resolved | Test-local: `authContractV1.$context<Ctx>()` session handler + `createService({ v1: { auth: {...} } }).withRPC().serve({ port: 0 })` (F14). No shared fixture is added to `./testing` in this PR. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Bearer contribution throws on non-loopback cleartext (container networks) → every request 503 | `allowInsecureTransport` pass-through (L2); README states the transport rule; test covers the throw path. |
| Discovery env missing in a consumer → 503 on every request, looks like an outage | Documented: `services__<name>__http__0` must be wired via a PluginReference; error `cause` names the env key (SDK message, F6). |
| OQ3 makes the seam return `notActive` for valid kv-oauth/workos sessions end to end | Called out in PR body and #1383 comment; conformance is by contract fixture in this PR, backend bearer support is step-4 scope. |
| `ZodError` from `parse` leaks response fragments into logs | L9: wrap in `RemoteSessionVerificationError`; middleware logs only `authn.error`. |
| Export change breaks `docs:exports-drift`, `check:mcp-export-corpus`, `jsdoc-example-compile` | S4 runs the generator chain and reference-page rows; each has a `--check` gate in the validation plan. |
| Scoped wrappers green but `any`/casts slip in | `deno task quality:gate` (scan + arch:check) is a required gate per slice review. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-14 redefining sibling contracts | risk | Import `authContract`, `SessionResponseSchema`, `AUTH_SESSION_STATES`; define nothing parallel. |
| AP-25 ambient `fetch`/`Deno.env` in adapter | risk | Only the SDK client reads discovery env; the adapter reads no env or cookies. |
| Fat plugin (ARCHETYPE-5) | avoid | L1. |
| AP-22 sub-barrel | existing pattern | `src/adapters/mod.ts` mirrors the package's other subpath barrels. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-3 layering, F-5 surface, F-6 JSR, F-7 doc score, F-11 folders, F-14 console, F-15 re-export, F-18 sub-barrel, F-19 scoped runners | yes | `deno task arch:check`, `audit-jsr-package.ts --root` ×2, `doc:lint` ×2, `publish --dry-run` ×2 |
| F-10 test shape | yes | tests co-located as `*_test.ts` next to the adapter (package pattern) |
| Runtime/Aspire | n/a | no service, worker, or AppHost change; real-HTTP tests run an ephemeral fixture only |
| Consumer import validation | yes | `plugins/auth/tests/services/import-surface_test.ts` + middleware integration test |
| Release-gate class (`scaffold.runtime`) | n/a | no scaffold/plugin-scaffold/DB/Aspire generation touched; coordinator may still request it at merge readiness |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `AUTH-BACKEND-ENV-CENTRALIZATION` | none | unrelated |
| new | none expected | If `arch:check` flags `src/adapters/` or the package's undeclared workspace imports (F11), record a debt entry rather than widening scope. |

## Commit Slices (ordered; each proves one thing)

| # | Slice proves | Gate | Files |
| - | ------------ | ---- | ----- |
| S0 | Baseline regression evidence at `3330d6f9c` | `run-deno-test.ts -- --allow-all packages/service/tests/auth/middleware_test.ts packages/plugin-auth-core plugins/auth/tests`; record counts in `worklog.md` | run dir only |
| S1 | Core adapter refuses/denies/throws exactly per L3–L7 (unit + no-backend guard) | `run-deno-test.ts` on the new `_test.ts`; `run-deno-check.ts --root packages/plugin-auth-core --ext ts`; `quality:gate` | `packages/plugin-auth-core/deno.json` (export + check task), `src/adapters/mod.ts`, `src/adapters/remote-session-authenticator.ts`, `src/adapters/remote-session-authenticator_test.ts` |
| S2 | Real HTTP through the typed SDK: fixture auth service on `127.0.0.1:0`, env `services__<fixture>__http__0`; cases: missing/malformed bearer (0 remote calls), active → principal, `authenticated:false`, revoked, expired state, past `expiresAt`, contradictory (`authenticated:true` without session), remote `UNAUTHORIZED` → 401 path, `AUTH_PROVIDER_ERROR` → throw, malformed body → throw, timeout → throw, discovery miss → throw, no retained principal across revocation, error message contains no token; middleware integration `withAuthn` → 401/503/200 | same wrappers + `run-deno-test.ts` on the http test | `src/adapters/remote-session-authenticator.http_test.ts` |
| S3 | `@netscript/plugin-auth/authenticator` re-export resolves and is documented | `run-deno-check.ts --root plugins/auth`; `import-surface_test.ts`; `verify-plugin.ts` unchanged/green; `doc:lint --root plugins/auth` | `plugins/auth/deno.json` (export, check, doc-lint), `src/public/authenticator.ts`, `tests/services/import-surface_test.ts`, `README.md` |
| S4 | Public surface + carriers are consistent | `docs:exports-drift`, `check:mcp-export-corpus`, `docs:jsdoc-examples`, `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `deno publish --dry-run --allow-dirty` in both package dirs, `audit-jsr-package.ts --root` ×2, `doc:lint` ×2 | `packages/plugin-auth-core/README.md`, `docs/site/reference/plugin-auth-core/index.md`, `docs/site/reference/plugin-auth/index.md`, regenerated corpus/assets files, run-dir artifacts |

Target file count < 15. Each slice commits with run-dir updates, pushes, and comments on the draft PR.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | baseline | S0 wrapper run at `3330d6f9c` | all green; counts recorded |
| 2 | check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-auth-core --root plugins/auth --ext ts` | 0 errors |
| 3 | test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin-auth-core plugins/auth/tests packages/service/tests/auth` | baseline + new tests green |
| 4 | lint/fmt | `run-deno-lint.ts` / `run-deno-fmt.ts` with the same roots, `--ext ts` | clean |
| 5 | quality | `deno task quality:gate` | 0 findings; no new `quality-allow` |
| 6 | docs | `deno task doc:lint --root packages/plugin-auth-core --pretty` and `--root plugins/auth` | 0 |
| 7 | publish | `deno publish --dry-run --allow-dirty` in each package dir; `audit-jsr-package.ts --root <pkg> --text` | no slow types; F-gates clean |
| 8 | carriers | `deno task docs:exports-drift`, `check:mcp-export-corpus`, `docs:jsdoc-examples`, `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets` | all `--check` green |
| 9 | deps | `deno task deps:check`; `deno task deps:why @netscript/sdk` (no new edge in `plugins/auth`) | unchanged edges |
| 10 | CI | draft PR `ci` + `code-quality` green; `e2e-cli` per path classification | green |

## Independent evaluation scope (IMPL-EVAL, separate session, non-Anthropic family)

- Re-run rows 2–9 independently; diff the S0 baseline counts against the post-slice run.
- Read the http test and confirm each brief case exists and runs against a real listener (not a
  stubbed `fetch`), that the missing-bearer path makes zero HTTP requests, and that the outage path
  throws before any `ok:false` is produced.
- Confirm no file under `plugins/auth` imports `@netscript/sdk` directly and no new dependency edge
  appears (`deps:why`).
- Confirm the PR body has no closing keyword and lists remaining #1383 scope.

## Remaining #1383 scope after this PR (must appear verbatim in the PR body)

Steps 1, 2, 4, 5; acceptance boxes 1–2 and 5–12 (guard ordering test, negative 401/403 tests,
`scaffold.runtime` gate); docs proof in `explanation/plugin-system.md`, `identity-access/auth.md`,
`how-to/add-authentication.md`; OQ3 bearer mapping on the auth service `/session` route.

## Dependencies

- `@netscript/sdk` 0.0.7 workspace source (F6), `@netscript/plugin-auth-core` contracts (F5),
  `@netscript/service` auth middleware incl. #2001 (F3). No new third-party dependency.

## Drift Watch

- SDK discovery key format or `createServiceClient` option set changes.
- `SessionResponse` schema or `session` route meta changes.
- Middleware 503/401 split (#2001) changes.
- Coordinator answers to OQ1/OQ2/OQ3.
