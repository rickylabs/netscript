# Research — remote-session--1383

## Re-baseline

- Carried-in sources: issue #1383 body (filed 2026-08-08 against `fac9e339042c`); Cockpit consumer
  code (`atelier-cockpit/services/cockpit-api/src/{auth-session-reader,session-authenticator}.ts`,
  `tests/session-authenticator_test.ts`) — **reference only**, never a framework acceptance proof.
- Re-derived against `main` @ `3330d6f9c` (2026-09-07). HEAD `4adb5ef95` adds only this run dir.
- What changed vs the carried-in material:
  - #1383 evidence still holds: `createPluginService` has no `auth` field (F1). Nothing in the repo
    exports `createAuthServiceAuthenticator` (F2).
  - PR #2001 (`64e6c4c74`, unpublished) already makes a **thrown** authenticator error a redacted
    `503 SERVICE_UNAVAILABLE` and a returned rejection a `401` (F3). The Cockpit "throw on outage"
    behaviour therefore maps onto native handling without new middleware work.
  - The sibling repos named in the brief (eis-chat AGENTS/config, RFC0005/0010, ledgerline design docs)
    are **not present** under `/home/agent/repos` or anywhere reachable (only stale `/tmp/ledgerline-*`
    logs). Family-reference reading was not possible; see `drift.md`.
  - The `aspireify` skill is not in the generated consumer bundle; `aspire`, `aspire-init`,
    `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment` were read. Conclusion: this slice
    needs **no AppHost edit** — discovery is an env-var read at call time (F9).

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| F1 | `createPluginService` config has no auth stage; `withRPC` at `packages/plugin/src/service/presentation/create-plugin-service.ts:175`; `defineService` accepts `auth?: { authn: AuthnOptions; authz?: AuthzOptions }` (`packages/service/src/presets/define-service.ts:137-142`). | `grep -n auth packages/plugin/src/service/presentation/create-plugin-service.ts` |
| F2 | No remote session authenticator exists anywhere in `packages/`, `plugins/`, or `docs/site`. | `grep -rn createAuthServiceAuthenticator packages plugins docs/site` → 0 hits |
| F3 | `createAuthnMiddleware` (`packages/service/src/auth/auth-middleware.ts:47-70`): authenticator **throw/reject** → log `authn.error`, respond `503 {error:'SERVICE_UNAVAILABLE', message:'Authentication service unavailable'}`; `ok:false` → `401 {error:'UNAUTHORIZED', message:<reason>}`. Regression tests: `packages/service/tests/auth/middleware_test.ts:22` ("authn verifier … is redacted 503, not invalid credentials"), `:89` (401), `:104`, `:173`. | `sed -n 47,70p packages/service/src/auth/auth-middleware.ts` |
| F4 | `AuthenticatorPort.authenticate(AuthnRequest) → AuthnResult`; `AuthnRequest` exposes `header()`, `headers()`, `cookie()`, `method`, `path`; `Principal.scheme ∈ api-key/bearer/trusted-header/custom`, docs say adapter packages use `custom` + claims bag. | `deno doc --unstable-kv --filter Principal packages/service/src/auth/mod.ts` |
| F5 | `@netscript/plugin-auth-core` already owns: `createBearerSdkClientContribution` (`src/sdk/bearer-contribution.ts`, imports `@netscript/sdk/client`), `authContract` v1 with `session: GET /session, meta authentication:'required', input SessionInput?, output SessionResponse {authenticated, session?}` and `SessionResponseSchema` (`src/contracts/v1/auth.contract.ts`), `AUTH_SESSION_STATES`, `AuthenticatorPort/AuthnRequest/AuthnResult/Principal` re-exported from `@netscript/service/auth` (`src/domain/mod.ts`). Backend principal mappers all emit `scheme:'custom'` with `claims.sessionId` (`packages/auth-kv-oauth/src/backend.ts:246-256`, workos, better-auth). | `deno doc --unstable-kv packages/plugin-auth-core/src/contracts/v1/mod.ts --filter SessionResponse` |
| F6 | SDK: `createServiceClient({contract, serviceName, routerName?, protocol?, apiPath='/api/rpc', apiVersion='v1', contributions})`; `port`/`timeout` options are **deprecated no-ops**; per-call `context.signal` is the cancellation seam (`packages/sdk/src/client/service-client.ts:83-104`, `ServiceClientContext.signal`). Discovery `getServiceUrl(serviceName, protocol)` reads `services__<name>__<protocol>__0` **at call time** inside `resolveTransport` (`http-client-link.ts:219-221`; `discovery/service-url.ts:96-120`) and throws if missing. The client performs **no output validation** (`grep outputSchema packages/sdk/src/client` → 0). Defined contract errors surface via `safe()` / `isDefinedError` (`@netscript/sdk/client`, docs `services-sdk/sdk.md` § Safe error narrowing). | `deno doc --unstable-kv --filter CreateServiceClientOptions packages/sdk/src/client/mod.ts` |
| F7 | Bearer contribution: emits `authorization: Bearer <cred>` only for `optional`/`required` procedures, **throws** if `required` and credential absent, **throws** on non-local cleartext unless `allowInsecureTransport`, `responseCache` is caller-selected (`direct-only` available). | `packages/plugin-auth-core/src/sdk/bearer-contribution.ts:66-101` |
| F8 | **Independently reproduced by the coordinator at baseline:** `coordinator-bearer-probe.json` (`directAuthenticated:true, bearerAuthenticated:false, cookieAuthenticated:true, defectReproduced:true`, in-memory kv-oauth handler fixture, not HTTP). Auth service `session` handler (`plugins/auth/services/src/routers/v1-handlers.ts:238-286`) calls `backend.sessions.getSession({ sessionId: input?.sessionId, request })`, returns `{authenticated:false}` when no active session, throws `AUTH_PROVIDER_ERROR` (502) on backend failure. It never maps `Authorization: Bearer` to `lookup.token`. Backends resolve `sessionId ?? token ?? cookie('__Host-ns_session')` (kv-oauth `backend.ts:174-181`, workos `workos-backend.ts:79-82`, better-auth via request headers). The auth service itself is built with `createPluginService` and has **no `withAuthn`** (`plugins/auth/services/src/main.ts:70-84`). | `sed -n 238,286p plugins/auth/services/src/routers/v1-handlers.ts` |
| F9 | Generated AppHost wires a plugin reference as `services__<pluginKey>__http__0`; for the auth plugin the key is `auth` (`packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts:409`, `:221`). Docs example uses `serviceName: 'auth-api'` + `routerName: 'auth'` (`docs/site/identity-access/how-to/add-authentication.md:290-296`); the Cockpit consumer used `serviceName: 'auth'`. Manifest service name is `auth-api` (`plugins/auth/src/constants.ts`), service registers `name: 'auth'` (`main.ts:72`). Router is assembled as `{version:'v1', namespace:'auth'}` (`plugins/auth/services/src/router.ts`), so the RPC path is `/api/rpc/v1/auth/*` and `routerName: 'auth'` is correct regardless. | see paths |
| F10 | Dependency edges (source imports, workspace-resolved): `plugin-auth → {plugin-auth-core, plugin, service, kv, auth-*, plugin-streams-core, telemetry}`; `plugin-auth-core → {sdk, service, contracts, plugin, plugin-streams-core, telemetry}`; `sdk → {contracts, fresh, kv, plugin-streams-core, service, telemetry}`; `fresh → {ai, kv, plugin-streams-core, sdk, telemetry}`; `service`, `contracts`, `kv`, `queue`, `ai` import no `@netscript/*` sibling that reaches auth. **No package in `sdk`'s transitive graph imports `plugin-auth` or `plugin-auth-core`, so adding an SDK-backed authenticator to the auth connector creates no cycle** (and auth-core already carries the `sdk` edge today). | `grep -rhn "from '@netscript/[a-z-]*" packages/<pkg>/src -o \| sort \| uniq -c` per package |
| F11 | `packages/plugin-auth-core/deno.json` `imports` declares only `plugin-streams-core`, `@orpc/*`, `@std/assert`, `zod`; `sdk`/`service`/`contracts`/`plugin`/`telemetry` resolve through the workspace. Pre-existing; publish dry-run is the gate that proves it. | `cat packages/plugin-auth-core/deno.json` |
| F12 | Doctrine verdict: `packages/plugin-auth-core` = Archetype 2, **Keep**; `plugins/auth` = Archetype 5, **Keep — remain thin glue over auth-core** (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:45,58`). ARCHETYPE-5 lists "fat plugin owning what core should own" as the top anti-pattern. | see file |
| F13 | Export-surface carriers: `docs:exports-drift` maps both packages in `entrypoints-only` mode (`.llm/tools/docs/check-exports-drift.ts:160-181`), so a new `exports` key must appear on `docs/site/reference/plugin-auth-core/index.md` § Sub-path exports and `docs/site/reference/plugin-auth/index.md` § Sub-path exports. `check:mcp-export-corpus` reads `packages` + `plugins` exports (`generate-export-surface-corpus.ts:7`), so the gzip corpus must be regenerated. CI quality gates include `mcp-export-corpus`, `agent-docs-prose`, `assets-barrel`, `publish-assets`, `publish-dry-run`, `jsdoc-example-compile` (`.github/workflows/ci.yml:365-442`); `code-quality.yml` runs `quality-scan`, `arch-check`, `doc-lint`, `public-doc-lint`. | `grep -n "run-gate.ts --gate" .github/workflows/ci.yml` |
| F14 | Real-HTTP test precedent without a backend: `packages/plugin-auth-core/src/sdk/bearer-contribution_test.ts:209-300` sets `services__<name>__http__0` and drives `createServiceClient`; `createService(router).withRPC().serve({ port: 0 })` returns `RunningService { app, addr:{hostname,port}, stop() }` (`packages/service/src/types.ts:36-45,168-176`). `createInMemoryKvOAuthRegistry` exists for handler-level tests (`plugins/auth/tests/services/auth-service_test.ts`). | see paths |
| F15 | JSDoc example ratchet floors are coordinator-owned (`JSDOC_EXAMPLE_RATCHET.minimumExamples: 349`, `.llm/tools/docs/jsdoc-example-policy.ts:21-28`); new exported symbols need compiling `@example` blocks or they fail `jsdoc-example-compile`. | see file |
| F16 | `find_guidance` (filesystem corpus over `docs/site`, run locally through `packages/mcp` flows) routed the intent to `identity-access/how-to/add-authentication` § typed service-client, `services-sdk/sdk` § Typed request contributions / Typed bearer credentials, and `explanation/contracts`; no page describes a remote verifier, confirming this is a new seam rather than an existing API. | rerun: `createFindGuidanceFlow(new FilesystemDocsCorpus({root:'docs/site'}))` |

| F17 | Coordinator baseline receipt `baseline-auth-tests.json`: `deno test --allow-all --unstable-kv plugins/auth/tests/services` at `3330d6f9c` → exit 0, 10 passed / 0 failed (raw `deno test`, tap reporter — exploratory evidence; S0 re-records it through `run-deno-test.ts`). | `cat .llm/runs/remote-session--1383/baseline-auth-tests.json` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/plugin-auth-core/deno.json` exports (10 subpaths) and
  `plugins/auth/deno.json` exports (9 subpaths). Both packages carry `isolatedDeclarations`-safe,
  explicitly annotated exports today; neither is on the slow-types carve-out list.
- Planned additions: one subpath per package (`./authenticator`), one factory function, one options
  interface, one error class, one rejection-reason constant group. Slow-type risks: the factory's
  return type must be annotated `AuthenticatorPort`; the constants group must be typed
  `Readonly<{...}>` (mirror `AUTH_SESSION_STATES`). `deno.json` `check`/`doc-lint` task lists enumerate
  entrypoints and must include the new file or the doc-lint gate silently skips it.
- Score risks: every new entrypoint needs `@module` + one compiling `@example`; README public-surface
  tables and the two reference pages must list the subpath (F13).

## Open questions (carried into `plan.md` § Open-Decision Sweep)

- OQ1 Default discovery `serviceName` for the plugin-auth wrapper: `auth` (generator evidence) vs
  `auth-api` (docs example). Not invented; returned to the coordinator.
- OQ2 Default per-call timeout value. Only consumer precedent (Cockpit 10 s) exists.
- OQ3 The auth service `session` route never honours `Authorization: Bearer` (F8). The remote
  authenticator is correct by contract, but end-to-end usefulness against kv-oauth/workos requires the
  auth service to map a bearer to `lookup.token`. That is issue-step-4 / auth-service scope, not this
  PR; returned as an explicit dependency.
- OQ4 Principal scheme for the remotely verified identity: `custom` + `claims.sessionId` (framework
  mapper convention, F5) vs `bearer` (Cockpit). Plan locks `custom`; evaluator should confirm.
