# AS3 Generator Brief — `plugins/auth` unified oRPC service

You are a WSL Codex implementation subagent in a NetScript harness run. You implement; a separate
OpenHands session evaluates. **Production/enterprise bar: no stubs, no silent no-ops, real oRPC
handlers wired to real backends, real tests, gates green.** Work only in this worktree.

## Worktree / branch (already set up by the supervisor)

- CWD worktree: `/home/codex/repos/netscript-pt-auth-plugin-service`
- Branch: `feat/prime-time/auth-plugin-service`, HEAD at the auth umbrella tip `6bc168e0`
  (off `feat/prime-time/auth`). Upstream is intentionally UNSET (push.default→umbrella landmine).
- This branch ALREADY contains everything AS3 builds on: `packages/plugin-auth-core/` (AS1),
  `packages/auth-workos/` + `packages/auth-better-auth/` (AS2a), `packages/auth-kv-oauth/` (AS2b).

## What this slice is (and is NOT)

**IS:** the `plugins/auth` plugin **shell + the unified oRPC service** — the ONE HTTP surface for auth
(it supersedes the per-adapter mounts that AS2a/AS2b deliberately removed, and absorbs the dropped
kv-oauth `mountKvOAuthHandler`). It implements the AS1 `authContract` v1 (`signin`/`callback`/
`signout`/`session`/`me`) over a backend resolved through the AS1 selection seam.

**IS NOT (do NOT build these — they are later slices; building them is an out-of-scope failure):**

- **AS4** — streams runtime (`plugins/auth/streams/`, `auth.token.refreshed`/`session.revoked`/
  `oidc.completed` producers). Do NOT add a streams producer. (The AS1 stream *schema* already exists
  in `plugin-auth-core/streams`; you do not wire a producer.)
- **AS5** — CLI (`src/cli/`), `database/auth.prisma`, `src/scaffolding/`, `src/aspire/`, registry
  generators, and any `@netscript/cli` edit. Do NOT touch `@netscript/cli`. Do NOT add scaffold files.
- **AS6** — `src/e2e/` probes/gates and the `scaffold.runtime` smoke. Do NOT add e2e probes.

Keep AS3 to the plugin manifest + the `services/` oRPC layer + the backend-selection wiring + unit/
integration tests for that service. A minimal `src/plugin/mod.ts` + `src/public/mod.ts` + `src/constants.ts`
manifest surface is in scope (mirror sagas) but only as needed for a valid plugin + passing manifest test.

## Read first (cheapest path to correctness)

1. `AGENTS.md` and `.agents/skills/netscript-doctrine` (ARCHETYPE-5 plugin).
2. **Precedent — `plugins/sagas/` (read the service layer closely; mirror its shape):**
   - `plugins/sagas/mod.ts`, `plugins/sagas/contracts.ts`, `plugins/sagas/deno.json`,
     `plugins/sagas/package.json`, `plugins/sagas/verify-plugin.ts` — manifest + export shape.
   - `plugins/sagas/services/mod.ts`, `services/src/main.ts`, `services/src/init.ts`,
     `services/src/router.ts`, `services/src/saga-registry.ts`,
     `services/src/routers/{health,v1,v1-handlers,v1-helpers,v1-types}.ts` — the oRPC router +
     DI/registry + handler pattern you will mirror for auth.
   - `plugins/sagas/src/plugin/mod.ts`, `src/public/mod.ts`, `src/constants.ts` — manifest internals.
   - `plugins/sagas/tests/public/manifest_test.ts`, `tests/services/publish-message_test.ts` — test shape.
3. **The AS1 contract + seam you implement against (consume, never redefine):**
   - `packages/plugin-auth-core/src/contracts/v1/mod.ts` — `authContract` / `authContractV1` and the
     `Signin|Callback|Signout|Session{Input,Response}` + `Me|AuthSession|AuthUser Response` schemas/types.
     Your router implements THESE procedures: **`signin`, `callback`, `signout`, `session`, `me`**.
   - `packages/plugin-auth-core/src/ports/mod.ts` — `AuthBackendPort` (name/providers/sessions/crypto/
     principalMapper/authenticate), and the selection seam: **`createAuthBackendRegistry(...)`**,
     **`resolveBackend(name?, ...)`**, `AuthBackendRegistry = Map<string, AuthBackendPort>`,
     `DEFAULT_AUTH_BACKEND_NAME`, `AuthBackendNotFoundError`.
   - `packages/plugin-auth-core/src/config/mod.ts` — backend-selection + cookie/session config schema.
   - `packages/plugin-auth-core/src/domain/mod.ts` — `AuthSession`/`AuthUser`/`Account`/
     `AuthSessionPrincipalMapping` + the `@netscript/service/auth` `Principal`/`AuthnRequest`/`AuthnResult`
     re-exports. `packages/plugin-auth-core/src/testing/mod.ts` — reuse any conformance/fixture helpers.
4. **The three backend entry points you compose:**
   - `packages/auth-kv-oauth/mod.ts` — `createKvOAuthBackend(opts)` → `AuthBackendPort`, **and the flow
     primitives `createKvOAuthFlow(opts)` → `KvOAuthFlow` (signIn / handleCallback → `KvOAuthCallbackResult`
     / signOut / getSessionId)** plus `providers`, cookie helpers (`buildCookieHeader`/`clearCookieHeader`/
     `deriveHttps`/`parseCookieHeader`). kv-oauth is the REFERENCE full interactive-flow backend.
   - `packages/auth-workos/mod.ts` — `createWorkosBackend(...)` → `AuthBackendPort` (IdP-managed:
     real WorkOS sealed-session + JWKS; some session sub-ports throw `AuthBackendOperationUnsupportedError`).
   - `packages/auth-better-auth/mod.ts` — `createBetterAuthBackend(...)` → `AuthBackendPort` (wraps
     better-auth's own prismaAdapter; IdP-managed semantics).
5. Program plan AS3 bullet + resolved open-questions:
   `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-plugin/program-plan.md` (§AS3,
   Open-Q #3 single-active backend, Open-Q #4 kv-oauth HTTP→AS3).

## Scope — build `plugins/auth/` (additive; touch nothing outside it)

Mirror `plugins/sagas` structurally. Build:

- **Plugin manifest:** `plugins/auth/deno.json` (name e.g. `@netscript/plugin-auth`, version
  `0.0.1-alpha.0`, MIT, strict compilerOptions, export map, `check`/`test`/`publish:dry-run` tasks,
  `publish.include`), `package.json` if the sagas precedent has one, `mod.ts` (public manifest re-export),
  `contracts.ts` (re-export the AS1 `authContract` — do NOT define a new contract), `verify-plugin.ts`,
  `src/plugin/mod.ts`, `src/public/mod.ts`, `src/constants.ts`. Match how `plugins/sagas` declares its
  imports for `@netscript/plugin-sagas-core`, `@orpc/server`, `@netscript/service`, etc. — use the SAME
  specifier style (`@netscript/plugin-auth-core` → `../../packages/plugin-auth-core/mod.ts` and subpaths;
  the three backends similarly). Confirm exact specifiers against `plugins/sagas/deno.json`; do not invent.
- **oRPC service (`plugins/auth/services/`):** mirror `plugins/sagas/services/`:
  - `services/src/router.ts` — `os.router({ v1: { health, auth: os.prefix('/v1/auth').router(authV1) } })`.
  - `services/src/routers/health.ts` — health/ping (copy the sagas shape).
  - `services/src/routers/v1.ts` + `v1-handlers.ts` + `v1-types.ts` + `v1-helpers.ts` — implement the
    **5 `authContract` procedures** as real oRPC handlers over the **resolved active backend**:
    - `signin` — begin the auth flow. For kv-oauth: drive `KvOAuthFlow.signIn` (build authorize URL +
      PKCE/state/nonce txn + `__Host-` cookie) and return the redirect target per `SigninResponseSchema`.
      For an IdP-managed active backend: drive its equivalent begin-flow.
    - `callback` — complete the flow. For kv-oauth: `KvOAuthFlow.handleCallback` → session + sealed-token
      KV write + `setCookies`; map to `CallbackResponseSchema`. For IdP-managed: its callback equivalent.
    - `session` — look up the current session via the backend (`authenticate`/`sessions.getSession`),
      return `SessionResponseSchema` (or unauthenticated per the schema's shape).
    - `me` — resolve the `Principal`/`AuthUser` for the current session → `MeResponseSchema`.
    - `signout` — revoke session (`sessions.revokeSession`) + clear cookie (`clearCookieHeader`) →
      `SignoutResponseSchema`.
  - `services/src/init.ts` + a **backend-registry module** (mirror `saga-registry.ts`): construct the
    `AuthBackendRegistry` from the available backend factories, choose the **single active** backend from
    `NETSCRIPT_AUTH_BACKEND` (`workos|better-auth|kv-oauth`, validated via the AS1 config schema), and
    expose it to handlers via `resolveBackend(...)`. Backend construction reads provider creds / crypto key
    from env per each backend's documented options. Inject the resolved backend into the handlers (mirror
    how sagas injects its registry/runtime — do not use module-global mutable singletons if sagas doesn't).
  - `services/src/main.ts` + `services/mod.ts` — service entry mirroring sagas.
- **Key design point — heterogeneous interactive flows (resolve against the real backend code):**
  `AuthBackendPort` is uniform for `authenticate`/`sessions`/`providers`, but the interactive
  **signin/callback redirect dance differs per backend**. kv-oauth exposes explicit
  `createKvOAuthFlow` primitives; the IdP-managed backends handle it through their SDKs. Because v1 is
  **single-active backend per app** (user-locked), your handlers resolve ONE active backend and drive its
  flow. Implement kv-oauth as the fully-wired reference path; wire workos/better-auth signin/callback to
  whatever their packages actually expose (read their mod.ts/source — do not assume). Where an active
  backend genuinely cannot service a procedure, surface a typed oRPC error (map
  `AuthBackendOperationUnsupportedError` → a clean contract-level error), NOT a silent no-op or a throw
  that 500s opaquely.
- **README.md** for the plugin: purpose, the `/auth/*` surface, backend selection via
  `NETSCRIPT_AUTH_BACKEND`, MIT.

## Tests (real, mirror sagas test shape)

- `tests/public/manifest_test.ts` — the plugin manifest is valid (mirror sagas).
- `tests/services/*_test.ts` — oRPC handler integration tests against the resolved backend. Use the
  kv-oauth backend with a stubbed authorization server (the `packages/auth-kv-oauth` tests already stub an
  AS — reuse that approach) to exercise `signin` → `callback` → `session`/`me` → `signout` round-trip,
  plus a backend-selection test (env picks the active backend; unknown name → `AuthBackendNotFoundError`),
  plus the unsupported-operation → typed-error mapping. If `plugin-auth-core/src/testing` has a fixture
  backend, prefer it for the selection/error-mapping tests.
- A consumer-import / type check proving the manifest + service export surface resolves.

## Gates (run all; capture verbatim exit codes; all must be 0)

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root plugins/auth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root plugins/auth --ext ts,tsx
deno test --unstable-kv --allow-all plugins/auth
deno check --unstable-kv plugins/auth/mod.ts
# plugin manifest + doctor (find the exact tasks the way sagas runs them):
deno task --filter @netscript/plugin-auth check   # or the plugin's own deno.json check task
# plugin doctor — run it the same way the sagas plugin is doctored (read how, mirror it)
```

Mirror exactly how `plugins/sagas` is checked/tested/doctored — find its `deno.json` tasks and the repo's
plugin-doctor invocation and use the auth equivalents. Doc-lint the full export map if the plugin publishes.

## Boundaries (do NOT cross — boundary violations fail IMPL-EVAL)

- Edit ONLY under `plugins/auth/`. Do NOT touch `@netscript/cli`, `packages/aspire/src/public/mod.ts`,
  `scaffold-versions.ts`, root `deno.json` workspace/catalog, version pins (LD-8), or any of the AS1/AS2
  packages. The plugin auto-joins the workspace via the `plugins/*` glob.
- Do NOT redefine the oRPC contract, the ports, or the config schema — import them from
  `@netscript/plugin-auth-core`.
- Do NOT build AS4/AS5/AS6 surfaces (streams producer, CLI, prisma, scaffolding, aspire, e2e probes).
- `deno.lock` may gain the new plugin's workspace entry — expected; do NOT hand-edit it, do NOT
  `deno cache --reload`, do NOT delete it.

## Commit / push / done

- ONE cohesive commit (or a small dependency-ordered series). Subject:
  `feat(plugin-auth): unified /auth/* oRPC service composing auth backends (AS3)`.
  Body: note single-active-backend-per-app v1, the per-backend interactive-flow wiring, and that
  streams/CLI/DB/scaffold/e2e are deferred to AS4–AS6.
- **Stage ONLY your work** — `git add plugins/auth` (and `deno.lock` if it legitimately changed). The
  worktree has PRE-EXISTING openhands CRLF drift under `.llm/tmp/run/openhands/**` that is NOT yours;
  do NOT stage it, do NOT `git add -A`/`git add .`. Leave it dirty; the supervisor expects it.
- Before committing: `export MSYS_NO_PATHCONV=1`.
- Push with an EXPLICIT refspec (never a bare `git push`):
  `git push origin HEAD:refs/heads/feat/prime-time/auth-plugin-service`
- You push via SSH and are GitHub-API-blind: do NOT open a PR or comment, do NOT embed any token — the
  supervisor mirrors the PR, dispatches IMPL-EVAL, and merges.
- When done, print: files touched, the gate exit-code table (verbatim), the commit SHA, clean
  `git status`, and the push result.

## Definition of done

`plugins/auth/` exists as a valid ARCHETYPE-5 plugin whose `services/` layer implements the AS1
`authContract` v1 (`signin`/`callback`/`signout`/`session`/`me`) as real oRPC handlers over a
single active backend resolved through `createAuthBackendRegistry`/`resolveBackend` and selected by
`NETSCRIPT_AUTH_BACKEND`; kv-oauth fully wired via `createKvOAuthFlow`; unsupported ops surfaced as typed
errors; manifest + service tests green; all gates exit 0; one commit pushed by explicit refspec. No CLI,
no DB, no scaffold, no aspire, no streams producer, no e2e probes, no token embedded.
