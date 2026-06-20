# @netscript/auth-better-auth

better-auth integration helpers for NetScript services.

This is an Archetype-2 Integration package with a schema-generation mechanic for better-auth Prisma
models. It consumes the authentication port from `@netscript/service/auth` and wraps better-auth's
first-party Prisma adapter over a consumer-owned Prisma client.

## Required permissions

- `--allow-net` for provider callbacks or better-auth plugins that call external services.
