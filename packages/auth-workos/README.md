# @netscript/auth-workos

WorkOS AuthKit authenticators for NetScript services.

This is an Archetype-2 Integration package. It consumes the authentication port from
`@netscript/service/auth` and maps verified WorkOS sessions or access tokens into NetScript
principals.

## Required permissions

- `--allow-net` when using the access-token JWKS authenticator.
