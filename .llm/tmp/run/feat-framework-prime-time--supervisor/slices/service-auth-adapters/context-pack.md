# Context Pack — service-auth-adapters

## Current status

Implementation is in progress on branch `feat/prime-time/service-auth-adapters`.

Completed:

- Slice 1 catalog + package scaffolding.
- Slice 2 WorkOS sealed-session authenticator with refresh-cookie emission and node-compat smoke.
- Slice 3 WorkOS JWKS access-token authenticator with signed-token integration tests.

## Invariants

- Both new packages consume `AuthenticatorPort`, `AuthnRequest`, `AuthnResult`, and `Principal` from
  `@netscript/service/auth`.
- No `@netscript/service` public surface changes are in scope.
- `@netscript/auth-better-auth` should not depend on `@netscript/database` unless it imports it
  directly; prefer consumer-passed Prisma clients.
- WorkOS webhook-to-database sync and CLI auth scaffolding are deferred.
- This is not an `e2e-cli-gate` slice.

## Gate notes

- `deps:latest` is the authority for provider version freshness.
- Deno node-compat smoke remains required for WorkOS sealed sessions and better-auth.
- Consumer import validation must be recorded as a named verify item before READY.
