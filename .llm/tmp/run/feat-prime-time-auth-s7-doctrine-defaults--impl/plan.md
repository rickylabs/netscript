# Plan — auth-s7-doctrine-defaults

## Locked Decisions

- Version single-source reconciles on `AUTH_PLUGIN_VERSION = 1.0.0`, because the current branch had
  already aligned `deno.json`, manifest construction, verify-plugin, and tests to that value.
- `startAuthStreamMirror` remains removed. No future-hook export is kept; the server stream subpath
  documents emit helpers and schema only.
- Production kv-oauth stores require `NETSCRIPT_AUTH_KV_OAUTH_KEY`; only
  `createInMemoryKvOAuthRegistry()` supplies the deterministic fixture key.
- Interactive flow handlers require a captured real service request. Direct tests use
  `plugins/auth/tests/testing/auth-fixtures.ts`.
- Documentation metadata points to the auth README on the current umbrella branch until the plugin
  path exists on `main`.

## Commit Slices

1. Version single-source: update service version to `AUTH_PLUGIN_VERSION`.
2. Legacy/no-op cleanup: correct stale stream mirror module doc after confirming the no-op is absent.
3. Security defaults: require real kv-oauth key and real request context; add focused tests.
4. Docs/metadata: README env/export/mount expansion and manifest documentation URL correction.
5. Kv-oauth surface honesty: re-grep dead enum candidates; add the low-severity `rotateSession`
   CAS JSDoc.

## Gates

- Targeted auth service/stream/manifest tests.
- Targeted auth-kv-oauth tests.
- Scoped `run-deno-check`, `run-deno-lint`, and `run-deno-fmt` for touched roots.
- Full export `deno doc --lint` and `deno publish --dry-run --allow-dirty` for touched packages.
- `verify-plugin.ts`.
- Lock hygiene check.

