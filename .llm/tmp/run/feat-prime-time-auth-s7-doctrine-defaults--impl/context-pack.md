# Context Pack — auth-s7-doctrine-defaults

Branch `feat/prime-time/auth-s7-doctrine-defaults` implements the S7 hardening slice.

Completed:

- `plugins/auth/services/src/main.ts` now feeds `AUTH_PLUGIN_VERSION` into `createService`.
- The stream no-op itself was already absent; `streams/server.ts` no longer describes a mirror.
- `plugins/auth/services/src/backend-registry.ts` now requires `NETSCRIPT_AUTH_KV_OAUTH_KEY` for
  real kv-oauth stores. The deterministic fixture key lives only in `createInMemoryKvOAuthRegistry`.
- `plugins/auth/services/src/routers/v1-helpers.ts` no longer fabricates `app.example.test` or
  `x-forwarded-proto: https`; interactive flow requests require captured service request context.
- `plugins/auth/README.md` now documents the export map, backend env vars, streams, and mount usage.
- `plugins/auth/src/public/mod.ts` points metadata documentation to the resolving umbrella branch
  README URL.
- `packages/auth-kv-oauth/src/store.ts` documents `rotateSession`'s `expectedVersionstamp` CAS
  parameter.

Validation is recorded in `worklog.md`. Do not treat this session as IMPL-EVAL; the separate
OpenHands/qwen pass must evaluate the implementation.

