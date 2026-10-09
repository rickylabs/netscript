# Changelog

## Unreleased

- Add `createContractAuthorizer(contract, { rawRoutes })`: exact, authentication-required
  declarations for raw routes mounted beside a contract router. Undeclared routes stay denied with
  `authz.no-contract-procedure`.

- Add bounded decoded command outbox relay lifecycle, finite retry policy and privacy-safe observer hooks.

- Add the focused `@netscript/service/commands/testing` atomic memory store and explicit test
  controls.
