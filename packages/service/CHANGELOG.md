# Changelog

## Unreleased

- **Breaking (0.0.8):** CORS no longer defaults to wildcard access. Configure
  `NETSCRIPT_CORS_ORIGINS='https://app.example,https://admin.example'` for services and plugins, or
  set `cors: { origin: ['https://app.example'] }` in `defineService` / `createPluginService`
  (`.withCors({ origin: ['https://app.example'] })` for builders). Unset origins deny cross-origin
  browser access. Wildcard plus credentials fails `build()`. See the README CORS migration.

- Add bounded decoded command outbox relay lifecycle, finite retry policy and privacy-safe observer
  hooks.

- Add the focused `@netscript/service/commands/testing` atomic memory store and explicit test
  controls.
