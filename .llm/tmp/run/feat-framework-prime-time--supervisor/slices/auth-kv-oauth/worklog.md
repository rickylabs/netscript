# Worklog — auth-kv-oauth backend boundary

## Design

- **Public surface:** `createKvOAuthBackend(options): Promise<KvOAuthBackend>` is the primary factory.
  `KvOAuthBackend` is the named superset of `AuthBackendPort` plus `KvOAuthFlow`
  (`signIn`, `handleCallback`, `getSessionId`, `signOut`). Root and subpath exports stay additive.
- **Domain vocabulary:** `KvOAuthBackend`, `KvOAuthPrincipal`, `KvOAuthFetch`,
  `OAuthIssuerProviderConfig`, `OAuthEndpointProviderConfig`, `KvOAuthJsonValidator`.
- **Ports:** consumes `AuthBackendPort` from `@netscript/plugin-auth-core`, `AuthnRequest/AuthnResult`
  from `@netscript/service/auth`, `WatchableKv` from `@netscript/kv`, and oauth4webapi request types.
- **Constants:** existing backend name `kv-oauth`, default cookie `__Host-ns_session`, and existing
  `AUTH_SESSION_STATES` remain unchanged.
- **Commit slices:** single implementation slice for the boundary fix: remove casts and non-null
  assertions, make refresh errors typed, close JSR doc-lint/slow-type issues, add focused tests.
- **Deferred scope:** export-map collapse of flow internals remains deferred to S7; JSR provenance
  remains publish-time/OIDC.
- **Contributor path:** public types live in the root `mod.ts`; backend composition in
  `src/backend.ts`; OAuth flow in `src/flow.ts`; provider invariants in `src/providers.ts`; sealed
  payload validators in `src/store.ts` and `src/backend.ts`.

## Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Backend return boundary | 1a: `KvOAuthBackend extends AuthBackendPort, KvOAuthFlow` | `plugins/auth` consumes interactive methods from the backend object, so narrowing to `AuthBackendPort` would break the current service route handlers. The named interface lets TypeScript structurally verify all port members with no cast. |
| Error taxonomy | 2a for refresh codes; drop oauth4webapi-owned validation codes | Refresh token reuse now throws `KvOAuthError("refresh_reuse_detected")`; token endpoint/rotation/no-token failures throw `KvOAuthError("refresh_failed")`. `state_mismatch`, `nonce_mismatch`, and `id_token_invalid` were removed because oauth4webapi owns those validations and this package does not re-wrap them. `session_not_found` is now thrown by session refresh/revoke operations. |
| Principal refinement | Callback type returns `KvOAuthPrincipal` | `normalizePrincipal` now has to return `Principal & { scheme: "custom" }`, matching `defaultPrincipal`, so no callback cast is needed. |
| custom fetch | `KvOAuthFetch` option boundary | The public option type now matches oauth4webapi discovery and token request custom fetch requirements, so request builders pass it through without casts. |
| Crypto decode | Validator-backed `open()` | Decrypted JSON opens to `unknown` unless a `KvOAuthJsonValidator<T>` is supplied; token/session payload call sites validate shape before returning typed data. |
| Provider invariants | Discriminated provider config | Issuer-discovery and explicit-endpoint providers are separate normalized types; client-secret requirements are encoded by `clientAuthMethod`, removing source `!` assertions. |

## Gate Evidence

| Gate | Result |
| --- | --- |
| Cast scan | PASS — `rg "\bas\s+(unknown\|never\|[A-Za-z_{])" packages/auth-kv-oauth -g '*.ts'` found only import aliases/plain English; no cast expressions remain. |
| Source non-null assertions | PASS — no source non-null assertions remain in `packages/auth-kv-oauth/src`; root example non-null assertions were replaced with `getRequiredEnv`. |
| Scoped check | PASS — `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx --pretty`: 9 files, 0 occurrences. |
| Scoped lint | PASS — `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/auth-kv-oauth --ext ts,tsx --pretty`: 9 files, 0 findings. |
| Scoped fmt | PASS — `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/auth-kv-oauth --ext ts,tsx --pretty`: 9 files, 0 findings. |
| Package tests | PASS — `deno test --unstable-kv --allow-all packages/auth-kv-oauth`: 9 passed, 0 failed. |
| Full export-set doc lint | PASS — `deno doc --lint` over `mod.ts`, `./providers`, `./store`, `./crypto`, `./cookies`, `./flow`, `./backend`, `./errors`: all checked. |
| Publish dry-run | PASS — `rtk proxy deno publish --dry-run --allow-dirty` from `packages/auth-kv-oauth`: success, no slow-type warnings, file list limited to README, deno.json, mod.ts, and `src/**/*.ts`. |
| Dependency stable pin | PASS — `rtk proxy deno task deps:latest --filter @panva/oauth4webapi`: 0 behind / 1 total. |
| Consumer check | BLOCKED by unrelated pre-existing plugin stream schema mismatch: `plugins/auth/streams/schema.ts` imports `AuthStreamSchema` / `AuthStreamSchemaResult`, which are not exported by `packages/plugin-auth-core/src/streams/mod.ts`. No `plugins/auth` files were changed by this slice. |
| Lock hygiene | PASS — `deno.lock` unchanged. |

## Notes

- JSR runtime compatibility is a package-page Settings value according to current JSR docs, not a
  source-controlled `deno.json` marker. This package remains Deno-only in practice because it uses
  Deno KV and `Deno.env`; publish dry-run does not expose a source marker for that score factor.
