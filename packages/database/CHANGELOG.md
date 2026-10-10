# Changelog

## Unreleased

- Add raw command relay leases, fenced settlement and normalized checked acceptance metadata with
  PostgreSQL conformance.
- Add the opt-in `./commands/postgres` adapter with safe receipt claims and callback-bound
  audit/outbox writes.
- Preserve the callback transaction-client type in `withTransaction` and expose
  `TransactionClientPort` through `./commands`.
- Add the focused `@netscript/database/commands` transaction-bound command store contract.
- Classify PostgreSQL command failures by Prisma error shape, so lock-timeout and serialization
  failures from a separately loaded `@prisma/client` stay busy or retryable.
