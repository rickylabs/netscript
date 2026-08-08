# fix(plugin): `createPluginService` has no auth seam, so every first-party plugin API is unguardable by construction — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** TA-02 · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice", SYNTHESIS §5.3) · **Labels:** `type:fix` `area:plugins` `area:auth` `area:service` `priority:p0` `status:triage` · **Depends on:** none (TA-04 improves the handler-side ergonomics but does not block)

## Summary

`PluginServiceConfig` exposes 16 knobs — cors, logger, openapi, docs, database, middleware, context,
rpc, health, raw routes, startup/shutdown hooks — and **no auth field**. `createPluginService` never
calls `withAuthn` or `withAuthz`. Consequently the five first-party plugin services (auth, workers,
sagas, streams, triggers) and every plugin produced by `netscript plugin new` publish
`/api/rpc/v1/<ns>/*` and `/api/v1/<ns>/*` with no possible guard short of forking the service
entrypoint. The auth plugin is the sharpest case: the service that owns identity is itself
unauthenticated (see TA-03a).

## Evidence

- Corpus: `research/repo-audit/auth.md` §3.1, gaps **G2** and **G8**; SYNTHESIS §2
  ("Plugin-composition failure").
- `packages/plugin/src/service/presentation/create-plugin-service.ts:63-104` — the full
  `PluginServiceConfig` interface; no `auth`, no `authn`, no `authz`, no `principal`.
- `packages/plugin/src/service/presentation/create-plugin-service.ts:137-194` — the fixed chain:
  `createService → withCors → withLogger → withOpenAPI → withDocs → withDatabase → use(middleware)
  → withContext → withRPC → withHealth → withServiceInfo → route → onStartup → onShutdown`. No auth
  stage exists.
- `grep -rn 'withAuthn\|withAuthz' packages plugins` outside `packages/service/` returns **zero**
  matches — no plugin, and no scaffolded service, calls the guard.
- Callers proven unguarded today: `plugins/auth/services/src/main.ts:70-84`,
  `plugins/workers/services/src/main.ts`, `plugins/sagas/services/src/main.ts`,
  `plugins/streams/services/src/main.ts`, `plugins/triggers/services/src/main.ts`, plus
  `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts` (the generator for
  third-party plugins).
- The guard that is missing already exists and is correct: `packages/service/src/auth/auth-middleware.ts:19,22`
  (`DEFAULT_PROTECTED_PREFIXES = ['/api']`, `DEFAULT_ANONYMOUS_PREFIXES = ['/health']`),
  fail-closed authz (`packages/service/src/auth/scope-authorizer.ts:41`).
- No remote session-verifying authenticator exists: the only `AuthenticatorPort` implementations are
  `static-credential`, `trusted-header`, `kv-oauth`, `workos`, `better-auth` (`auth.md` §4.5), so a
  service can only validate the auth plugin's sessions by embedding the backend, its KV/DB handles
  and its provider secrets in-process.

## Current surface

A plugin author has exactly two options: publish an open API, or abandon `createPluginService` and
hand-assemble a `ServiceBuilder` — which discards the "mandated builder order" the factory exists to
enforce (`create-plugin-service.ts:109-112`). `createTrustedHeaderAuthenticator` reads
`x-authenticated-user`/`-scopes`/`-roles` (`packages/service/src/auth/trusted-header-authenticator.ts:20-54`)
but nothing in the repo emits those headers — the receiver exists, the sender does not
(`auth.md` §4.4, gap G14).

## Target contract

1. `PluginServiceConfig` gains `auth?: PluginServiceAuthConfig` carrying `{ authn, authz? }` with the
   same shape `defineService` already accepts (`packages/service/src/presets/define-service.ts:268-273`),
   applied by `createPluginService` **before** `withRPC` so route registration stays inside the guard —
   the ordering `packages/service/src/builder/service-builder-impl.ts:435-436` already guarantees
   (`installAuth()` at `:442` runs before `installDeferredRoutes()` at `:462`).
2. Deny-by-default posture: omitting `auth` is an explicit decision, not a default. The factory
   requires either `auth` or a recorded `auth: 'public'` opt-out, mirroring TA-01 so the framework
   has one rule for both generated and plugin services.
3. `@netscript/plugin-auth` exports `createAuthServiceAuthenticator({ serviceName, ... })` — an
   `AuthenticatorPort` that verifies a request by calling the auth service's `GET /session` over the
   typed client (T1-05 seam), so a guarded service needs no backend, no KV handle and no provider
   secret. This is gap G8 and it is what makes the plugin composable at all.
4. The five first-party plugin services adopt the seam; each declares its own scope rules, and
   `/health` stays anonymous.
5. `netscript plugin new` generates the guarded form.

## Acceptance

- [ ] `PluginServiceConfig.auth` exists and `createPluginService` applies it before `withRPC`.
- [ ] Omitting `auth` requires an explicit recorded public opt-out.
- [ ] `@netscript/plugin-auth` exports a remote session-verifying `AuthenticatorPort`.
- [ ] The remote authenticator needs no backend instance, KV handle, or provider secret.
- [ ] All five first-party plugin services declare an auth configuration or a recorded opt-out.
- [ ] `netscript plugin new` scaffolds a guarded plugin service.
- [ ] Negative test: an unauthenticated `POST /api/rpc/v1/<ns>/*` on a guarded plugin service returns 401.
- [ ] Negative test: an unauthenticated `GET /api/v1/<ns>/*` on a guarded plugin service returns 401.
- [ ] Negative test: a valid principal with an insufficient scope returns 403 on the same routes.
- [ ] Negative test: the guard cannot be bypassed by reordering config fields (order is factory-owned).
- [ ] A guard test fails if a future `createPluginService` change registers RPC routes before authn.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup` green with guarded plugin services.

## Boundaries

- **Do not** build the deny-by-default *frontend procedure gateway* — **#934** owns the generated
  per-procedure route table at `/api/plugins/<mountId>/`, its CSRF/origin checks and its threat
  model. This issue guards the plugin's own service surface; #934 guards the browser-facing
  projection of it. Align the deny-by-default vocabulary with #934, do not implement it here.
- **Do not** define organization/tenant-aware authorization contracts — **#884** owns them; the
  authorizer added here stays scope/role-based and must remain adaptable to #884's model rather than
  competing with it.
- **Do not** build the auth conformance/mocking test kit — **#885** owns it.
- **Do not** fix the auth service's own signout authentication defect — **TA-03a** owns it (this
  issue supplies the seam it consumes).
- **Do not** change plugin discovery's hardcoded factory table — **#1093** owns it.
- **Do not** touch the CLI's hardcoded `localhost:4437` auth session URL — **#1243** owns it.

## Docs/consumer proof

`docs/site/explanation/plugin-system.md` and `docs/site/identity-access/auth.md` must show a plugin
service declaring `auth` and a non-auth plugin verifying sessions through
`createAuthServiceAuthenticator` without embedding a backend. Adoption is proven when a third-party
plugin fixture (not a first-party one) is guarded end to end in a test, and when
`docs/site/identity-access/how-to/add-authentication.md` can state, with a code reference, how to
protect a plugin API — a sentence it cannot write today.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/auth.md` gaps G2/G8/G14; all cited line numbers re-verified against worktree
`fac9e339042c` on 2026-08-08.
