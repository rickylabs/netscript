# Drift — auth-s7-doctrine-defaults

## Minor Drift

- **Version decision differed from the dispatch default.** The prompt allowed defaulting to manifest
  `0.1.0` if ambiguous, but the current branch had already converged `plugins/auth` on `1.0.0`
  across `deno.json`, `AUTH_PLUGIN_VERSION`, `definePlugin`, verify-plugin, and tests. S7 kept
  `1.0.0` and removed the remaining service literal.
- **No-op stream mirror was already removed.** S7 only corrected the stale `streams/server.ts`
  module doc.
- **Kv-oauth dead enum candidates were already pruned.** Required re-grep found no
  `state_mismatch`, `nonce_mismatch`, or `id_token_invalid` members or throw sites. S3-live
  `refresh_failed` and `refresh_reuse_detected` remain.
- **Documentation URL timing.** `https://netscript.dev/plugins/auth` did not resolve, and the plugin
  README path is not on `main` yet. The manifest uses the resolving umbrella branch URL:
  `https://github.com/rickylabs/netscript/tree/feat/prime-time/auth/plugins/auth#readme`.
- **Optional kv-oauth surface items deferred.** `rotateSession` CAS JSDoc was handled. Per-preset
  `TenantOAuthProviderOptions` tightening and deep-subpath export collapse were deferred to avoid
  expanding this last hardening slice beyond the non-overlapping sweep.
- **Publish dry-run residual warning.** `plugins/auth` dry-run passes with no slow types and an
  intended file list, but Deno warns that the env-driven direct-start bootstrap dynamic import is
  unanalyzable at publish time. This is pre-existing service-entry behavior shared by sibling
  plugin services.

