# Drift — auth-kv-oauth backend boundary

## 2026-06-20 — behavioral drift: refresh failures now throw typed errors

- Severity: significant
- Files: `packages/auth-kv-oauth/src/backend.ts`
- Plan/request delta: the legacy implementation returned `{ ok: false, reason: "kv_oauth_refresh_failed" }`
  from `authenticate()` when refresh token reuse or token endpoint refresh failed.
- Implemented behavior: refresh token reuse deletes the session and throws
  `KvOAuthError("refresh_reuse_detected")`; token endpoint/rotation/no-token failures throw
  `KvOAuthError("refresh_failed")`.
- Rationale: the slice explicitly required declared refresh taxonomy codes to be real and mappable by
  upstream error handling instead of declared-but-dead. Tests now assert both typed codes.

## 2026-06-20 — consumer check blocked by unrelated stream-schema mismatch

- Severity: minor
- File: `plugins/auth/streams/schema.ts`
- Evidence: `deno check --unstable-kv plugins/auth/services/src/backend-registry.ts
  plugins/auth/services/src/routers/v1-types.ts plugins/auth/services/src/routers/v1-handlers.ts`
  failed because `AuthStreamSchema` and `AuthStreamSchemaResult` are not exported by
  `packages/plugin-auth-core/src/streams/mod.ts`.
- Scope decision: no fix applied. This slice is restricted to `packages/auth-kv-oauth`; no
  `plugins/auth` files were changed.

## 2026-06-20 — JSR runtime compatibility is not source-controllable

- Severity: minor
- File: `packages/auth-kv-oauth/deno.json`
- Evidence: JSR docs state runtime compatibility is set from the package page Settings, not by a
  `deno.json` or `jsr.json` field. `deno publish --dry-run` accepts the package and emits no
  runtime-compat warning.
- Scope decision: no unsupported metadata added. The package remains Deno-oriented by API usage
  (`Deno.env`, Deno KV through `@netscript/kv`).
