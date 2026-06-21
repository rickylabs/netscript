# Worklog — auth-s7-doctrine-defaults

## Design

- **Public surface:** `@netscript/plugin-auth` root and subpaths stay stable. `./streams/server`
  remains a separate server-side emit-helper entrypoint distinct from browser-safe `./streams`.
- **Domain vocabulary:** `AUTH_PLUGIN_VERSION`, `auth.*` event names, single-active backend names
  (`kv-oauth`, `workos`, `better-auth`), and `NETSCRIPT_AUTH_KV_OAUTH_KEY`.
- **Ports:** existing auth backend registry, `AuthBackendPort`, `InteractiveFlowPort`, KV store, and
  service request context.
- **Constants:** version is single-sourced through `AUTH_PLUGIN_VERSION = 1.0.0`.
- **Commit slices:** version, stream-doc cleanup, security defaults, docs/metadata, kv-oauth CAS
  surface doc.
- **Deferred scope:** per-preset `TenantOAuthProviderOptions` tightening and deep-subpath collapse
  are deferred; required dead-enum prune was already present on branch after S3.
- **Contributor path:** new auth backend changes start in `packages/plugin-auth-core` ports, then
  backend adapter packages, then `plugins/auth/services/src/backend-registry.ts`; stream projection
  changes start in `plugins/auth/streams/schema.ts` and `producer.ts`.

## Decisions

| Item | Decision | Evidence |
| ---- | -------- | -------- |
| Version value | Keep `1.0.0` and route service version through `AUTH_PLUGIN_VERSION`. | Current branch already had `deno.json`, `definePlugin`, manifest tests, and verify-plugin on `1.0.0`. |
| Stream mirror | Remove/keep-as-absent; only stale docs changed. | `rg` found no `startAuthStreamMirror`/satellites on branch; `producer.ts` only contains emit helpers. |
| Kv-oauth enum prune | No code prune needed. | `rg` found no `state_mismatch`, `nonce_mismatch`, or `id_token_invalid`; `refresh_failed` and `refresh_reuse_detected` are live. |
| Documentation URL | Use umbrella branch README URL. | `netscript.dev` did not resolve; GitHub umbrella README URL returned HTTP 200. |

## Gate Evidence

| Gate | Result |
| ---- | ------ |
| `deno test --unstable-kv --allow-all plugins/auth/tests/services/auth-service_test.ts plugins/auth/tests/streams/streams_test.ts plugins/auth/tests/public/manifest_test.ts` | PASS, 11 tests. |
| `deno test --unstable-kv --allow-all packages/auth-kv-oauth/tests/auth_kv_oauth_test.ts` | PASS, 9 tests. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx` | PASS, 29 files, 0 occurrences. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx` | PASS, 9 files, 0 occurrences. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/auth --ext ts,tsx` | PASS, 29 files, 0 occurrences. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/auth-kv-oauth --ext ts,tsx` | PASS, 9 files, 0 occurrences. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/auth --ext ts,tsx` | PASS, 29 files, 0 findings. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/auth-kv-oauth --ext ts,tsx` | PASS, 9 files, 0 findings. |
| `deno doc --lint mod.ts src/public/mod.ts src/plugin/mod.ts contracts.ts services/src/main.ts streams/mod.ts streams/server.ts` in `plugins/auth` | PASS, checked 7 files. Deno emitted existing npm `@types/node` resolution warnings, no doc-lint issues. |
| `deno doc --lint mod.ts src/providers.ts src/store.ts src/crypto.ts src/cookies.ts src/flow.ts src/backend.ts src/errors.ts` in `packages/auth-kv-oauth` | PASS, checked 8 files. |
| `rtk proxy deno publish --dry-run --allow-dirty` in `plugins/auth` | PASS, no slow-type warnings, file list scoped to intended package files. Existing warning: env-driven `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` dynamic import is unanalyzable at publish time. |
| `rtk proxy deno publish --dry-run --allow-dirty` in `packages/auth-kv-oauth` | PASS, no slow-type warnings, clean file list. |
| `deno run --allow-read plugins/auth/verify-plugin.ts` | PASS, `ok: true`, manifest version `1.0.0`, 0 findings. |
| `rtk git diff -- deno.lock` | PASS, empty diff. |

