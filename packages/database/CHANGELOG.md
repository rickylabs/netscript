# Changelog

## Unreleased

- Refuse duplicate PostgreSQL connection-string keys, case variants and aliases, including identical
  repeated values, with credential-safe `PostgresConnectionStringError` reason `duplicate-key`.
  Accept libpq `verify-ca`/`verify-full` TLS mode spellings and canonicalize decimal ports.
- Install immutable plugin SQL migration sidecars before Prisma deployment; add bounded outbox
  `pruneSettled` with primary-key progress and delete-time eligibility checks.

- Add dependency-free PostgreSQL connection-string normalization at
  `@netscript/database/connection-strings/postgres`, preserving explicit TLS modes and refusing
  unsupported settings with `PostgresConnectionStringError`.
- Share quoted ADO.NET tokenization with MSSQL. Malformed segments and unterminated or trailing
  quoted values now throw the public `AdoNetConnectionStringSyntaxError` from
  `@netscript/database/adapters/mssql` instead of being ignored.
- Add raw command relay leases, fenced settlement and normalized checked acceptance metadata with
  PostgreSQL conformance.
- Add the opt-in `./commands/postgres` adapter with safe receipt claims and callback-bound
  audit/outbox writes.
- Preserve the callback transaction-client type in `withTransaction` and expose
  `TransactionClientPort` through `./commands`.
- Add the focused `@netscript/database/commands` transaction-bound command store contract.
- Classify PostgreSQL command failures by Prisma error shape, so lock-timeout and serialization
  failures from a separately loaded `@prisma/client` stay busy or retryable.
