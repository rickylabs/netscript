# Research — auth-s7-doctrine-defaults

## Scope

S7 hardening covers `plugins/auth`, `packages/auth-kv-oauth`, and docs/metadata around the auth
plugin surface. Effective archetypes: Archetype 5 for `plugins/auth`, Archetype 2 for
`packages/auth-kv-oauth`, plus `SCOPE-docs` and `SCOPE-service`.

## Current-Branch Findings

- Branch is `feat/prime-time/auth-s7-doctrine-defaults`, based on umbrella tip `6579d4c2`.
- `plugins/auth/deno.json`, `AUTH_PLUGIN_VERSION`, `definePlugin`, `verify-plugin`, and manifest
  tests were already converged on `1.0.0`; only `services/src/main.ts` still used a literal
  `version: '1.0.0'`.
- `startAuthStreamMirror`, `normalizeMirrorOptions`, `AuthStreamMirrorOptions`, and related no-op
  code were already absent from `plugins/auth/streams/producer.ts`. The remaining finding was stale
  `streams/server.ts` module text describing a mirror.
- `plugins/auth/services/src/backend-registry.ts` no longer used `new Uint8Array(32).fill(7)`, but
  it still bypassed `@netscript/auth-kv-oauth`'s required-key behavior by generating random key
  material when `NETSCRIPT_AUTH_KV_OAUTH_TEST_KEY` was absent.
- `plugins/auth/services/src/routers/v1-helpers.ts` still fabricated
  `https://app.example.test${path}` and default `x-forwarded-proto: https` when no service request
  was present.
- `packages/auth-kv-oauth` already had the S3-live refresh codes:
  `refresh_failed` and `refresh_reuse_detected`. Re-grep found no `state_mismatch`,
  `nonce_mismatch`, or `id_token_invalid` members or throw sites on this branch.
- `https://netscript.dev/plugins/auth` does not resolve from this environment. The canonical repo
  root resolves, and the plugin README path resolves on the `feat/prime-time/auth` umbrella branch.

## JSR Surface Scan

- `plugins/auth` export map: `.`, `./public`, `./plugin`, `./contracts`, `./services`, `./streams`,
  `./streams/server`.
- `packages/auth-kv-oauth` export map: `.`, `./providers`, `./store`, `./crypto`, `./cookies`,
  `./flow`, `./backend`, `./errors`.
- `packages/plugin-auth-core` was read for surface context but not modified.

