# Context Pack — service-auth-adapters

## Current status

Implementation is in progress on branch `feat/prime-time/service-auth-adapters`.

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

