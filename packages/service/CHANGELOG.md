# Changelog

## Unreleased

- **Breaking (0.0.8, #1382):** `defineService()` now requires `auth: ServiceAuthPolicy` and
  validates it before configuring the builder or starting IO. Missing policy is a type error and
  a runtime `TypeError` for JavaScript callers. Keep native guards as
  `auth: { authn: { authenticator }, authz: { authorizer } }` (authorization is optional).
  For a genuinely public service, migrate the entrypoint explicitly:

  ```diff
  -await defineService(router, { name: 'status' });
  +await defineService(router, {
  +  name: 'status',
  +  auth: { public: true, reason: 'Public status service with no protected operations' },
  +});
  ```

  Reasons must be nonblank; public and guarded fields cannot be mixed. `netscript service add`
  generates remote auth-session verification and a `<service>:access` scope rule when an enabled
  auth plugin is installed. `/api`, including OpenAPI and RPC, requires that scope; `/health`
  remains anonymous. Without auth installed, the generated public reason explains how to protect the
  API. Existing authored services retain their policy and must be migrated explicitly. See the
  README auth policy migration.

- **Breaking (0.0.8):** CORS no longer defaults to wildcard access. Configure
  `NETSCRIPT_CORS_ORIGINS='https://app.example,https://admin.example'` for services and plugins, or
  set `cors: { origin: ['https://app.example'] }` in `defineService` / `createPluginService`
  (`.withCors({ origin: ['https://app.example'] })` for builders). Unset origins deny cross-origin
  browser access. Wildcard plus credentials fails `build()`. See the README CORS migration.

- Add `createContractAuthorizer(contract, { rawRoutes })`: exact, authentication-required
  declarations for raw routes mounted beside a contract router. Undeclared routes stay denied with
  `authz.no-contract-procedure`.

- Add bounded decoded command outbox relay lifecycle, finite retry policy and privacy-safe observer hooks.

- Add the focused `@netscript/service/commands/testing` atomic memory store and explicit test
  controls.
