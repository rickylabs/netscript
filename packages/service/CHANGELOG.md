# Changelog

## Unreleased

- **Added:** `AnonymousRequestMatch` and `AnonymousRule` support exact method/path entries in
  `allowAnonymous`, exported from the root and `./auth`. Legacy string prefixes and omitted/empty
  defaults remain; GET and HEAD need separate entries. Invalid exact entries fail before listen.
- **Changed (breaking impact):** Health routes now install after auth. Custom nonempty anonymous
  lists excluding `/health` previously bypassed auth for health GET/HEAD (200); those requests now
  return 401 under a rejecting authenticator. Add `'/health'` to preserve the prefix capability, or
  list GET and HEAD for `/health`, `/health/live` and `/health/ready` explicitly. Default and empty
  lists keep public health. Failed auth construction remains failed on repeated build/serve.

- **Fixed:** Under `withCors()`, every response (RPC, OpenAPI, raw routes, proxied upstreams, health
  and errors) now carries exactly the native service CORS decision: all six access-control headers,
  present or absent, with the union of existing `Vary` tokens preserved. Handler, upstream and
  oRPC-default access-control headers are replaced. Migrate their `exposeHeaders`, `allowHeaders`
  and `allowMethods` declarations to `withCors()`. Services that never call `withCors()` are
  unchanged.

- **Breaking (0.0.8, #1382):** `defineService()` now requires `auth: ServiceAuthPolicy` and
  validates it before configuring the builder or starting IO. Missing policy is a type error and a
  runtime `TypeError` for JavaScript callers. Keep native guards as
  `auth: { authn: { authenticator }, authz: { authorizer } }` (authorization is optional). For a
  genuinely public service, migrate the entrypoint explicitly:

  ```diff
  -await defineService(router, { name: 'status' });
  +await defineService(router, {
  +  name: 'status',
  +  auth: { public: true, reason: 'Public status service with no protected operations' },
  +});
  ```

  Reasons must be nonblank; public and guarded fields cannot be mixed. `netscript service add` and
  auth installation now share the BFF policy: `browserAuthenticator` with
  `createContractAuthorizer(router)`. Discovery (`/api/openapi.json`, `/api/docs`), `/health` and
  contract-declared public demo procedures stay anonymous. Contract-protected REST/RPC procedures
  return 401 without a session, 403 when contract authorization denies it, and 200 when authorized.
  Without enabled auth, the generated public reason explains how to protect the API. Lifecycle
  commands reconcile scaffold-owned opt-outs; existing authored policies remain authoritative.
  `generate aspire` leaves authored inputs unchanged. See the README auth policy migration.

- **Breaking (0.0.8):** CORS no longer defaults to wildcard access. Configure
  `NETSCRIPT_CORS_ORIGINS='https://app.example,https://admin.example'` for services and plugins, or
  set `cors: { origin: ['https://app.example'] }` in `defineService` / `createPluginService`
  (`.withCors({ origin: ['https://app.example'] })` for builders). Unset origins deny cross-origin
  browser access. Wildcard plus credentials fails `build()`. See the README CORS migration.

- Add `createContractAuthorizer(contract, { rawRoutes })`: exact, authentication-required
  declarations for raw routes mounted beside a contract router. Undeclared routes stay denied with
  `authz.no-contract-procedure`.

- Add bounded decoded command outbox relay lifecycle, finite retry policy and privacy-safe observer
  hooks.

- Add the focused `@netscript/service/commands/testing` atomic memory store and explicit test
  controls.
