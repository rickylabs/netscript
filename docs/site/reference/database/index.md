---
layout: layouts/base.vto
title: '@netscript/database'
---

# `@netscript/database`

Database adapter contracts, Prisma driver helpers, tracing, and schema tooling for NetScript
packages. This page is written against the package's public surface reported by `deno doc`. For the
full index of packages and plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/database`) re-exports the port contracts, the PostgreSQL adapter,
the JSON extension helpers, and the OTEL instrumentation toggle. The remaining sub-path exports
carry the per-driver adapters, the Prisma extensions, the schema/codegen scripts, the tracing
surface, and the test contract harness:

- [`@netscript/database/commands`](#command-persistence) — bound command transactions and logical
  rows.
- [`@netscript/database/ports`](#ports) — adapter contracts and shared types.
- [`@netscript/database/adapters`](#adapters) — PostgreSQL adapter (default driver surface).
- [`@netscript/database/adapters/postgres`](#postgresql-adapter) — PostgreSQL driver adapter.
- [`@netscript/database/connection-strings/postgres`](#postgresql-connection-strings) —
  dependency-free connection-string normalization.
- [`@netscript/database/adapters/mssql`](#sql-server-adapter) — SQL Server driver adapter.
- [`@netscript/database/adapters/mysql`](#mysql-adapter) — MySQL driver adapter.
- [`@netscript/database/extensions`](#extensions) — Prisma JSON serialization extensions.
- [`@netscript/database/scripts`](#scripts) — Prisma/Zod codegen and migration runners.
- [`@netscript/database/tracing`](#tracing) — Prisma OpenTelemetry tracing helpers.
- [`@netscript/database/testing`](#testing) — mock adapter and shared port contract tests.

## Ports

Exported from the root (`@netscript/database`) and from `@netscript/database/ports`. These are the
provider-agnostic adapter contracts.

| Symbol                      | Kind       | Signature                             | Description                                     |
| --------------------------- | ---------- | ------------------------------------- | ----------------------------------------------- |
| `DatabaseAdapter`           | interface  | `interface DatabaseAdapter`           | Generic database adapter interface.             |
| `DatabaseAdapterFactory`    | interface  | `interface DatabaseAdapterFactory`    | Factory for creating database adapters.         |
| `DatabaseConnectionOptions` | interface  | `interface DatabaseConnectionOptions` | Database connection options.                    |
| `DatabaseConnectionStatus`  | interface  | `interface DatabaseConnectionStatus`  | Database connection status.                     |
| `SharedDatabaseConfig`      | interface  | `interface SharedDatabaseConfig`      | Configuration for the shared database instance. |
| `TransactionOptions`        | interface  | `interface TransactionOptions`        | Transaction options.                            |
| `DatabaseProvider`          | type alias | `type DatabaseProvider`               | Database provider types.                        |
| `IsolationLevel`            | type alias | `type IsolationLevel`                 | Transaction isolation levels.                   |

## Root extras

Additional symbols re-exported from the root entrypoint (`@netscript/database`) beyond the port
contracts and the PostgreSQL adapter.

| Symbol                          | Kind     | Signature                                                | Description                                                                                                                          |
| ------------------------------- | -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `enableInstrumentation`         | function | `function enableInstrumentation(): boolean`              | Enable Prisma OTEL instrumentation for database tracing. Call before creating any Prisma clients; only active when `OTEL_DENO=true`. |
| `withTransaction`               | function | `function withTransaction(client, fn, options): Promise` | Execute operations within a transaction.                                                                                             |
| `parseConnectionString`         | function | `function parseConnectionString(connectionString)`       | Parse a database connection string.                                                                                                  |
| `buildPostgresConnectionString` | function | `function buildPostgresConnectionString(parts): string`  | Build a PostgreSQL connection string from parts.                                                                                     |
| `buildMssqlConnectionString`    | function | `function buildMssqlConnectionString(parts): string`     | Build a SQL Server connection string from parts.                                                                                     |
| `jsonUtils`                     | variable | `const jsonUtils`                                        | JSON serialization utilities for manual use.                                                                                         |
| `registerJsonFields`            | function | `function registerJsonFields(model, fields): void`       | Register additional JSON fields for a model at runtime.                                                                              |

## Adapters

Exported from `@netscript/database/adapters` (and re-exported from the root). This is the default
PostgreSQL driver surface.

| Symbol                      | Kind      | Signature                                                  | Description                             |
| --------------------------- | --------- | ---------------------------------------------------------- | --------------------------------------- |
| `createPostgresAdapter`     | function  | `function createPostgresAdapter(options): PostgresAdapter` | Create a PostgreSQL adapter.            |
| `PostgresAdapter`           | class     | `class PostgresAdapter`                                    | PostgreSQL adapter.                     |
| `PostgresConnectionOptions` | interface | `interface PostgresConnectionOptions`                      | PostgreSQL-specific connection options. |

### PostgreSQL adapter

Exported from `@netscript/database/adapters/postgres`.

| Symbol                      | Kind      | Signature                                                  | Description                                                             |
| --------------------------- | --------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `createPostgresAdapter`     | function  | `function createPostgresAdapter(options): PostgresAdapter` | Create a PostgreSQL adapter.                                            |
| `PostgresAdapter`           | class     | `class PostgresAdapter`                                    | PostgreSQL adapter.                                                     |
| `PostgresDriverAdapter`     | interface | `interface PostgresDriverAdapter`                          | Public structural type returned by PostgreSQL driver adapter factories. |
| `PostgresConnectionOptions` | interface | `interface PostgresConnectionOptions`                      | PostgreSQL-specific connection options.                                 |

### PostgreSQL connection strings

Exported from `@netscript/database/connection-strings/postgres`, without loading a database driver.
`normalizePostgresConnectionString` preserves PostgreSQL URIs byte-for-byte and translates Npgsql
key/value strings, including explicit TLS modes and encoded credentials. Unsupported settings and
malformed input throw `PostgresConnectionStringError` with a typed
`PostgresConnectionStringErrorReason`: `unsupported-key`, `unsupported-value`, or `invalid-format`.
Certificate settings and `SSL Mode=Allow` are refused. Generated Postgres modules and Prisma config
inline this maintained implementation; their environment wrapper trims whitespace before conversion.

### SQL Server adapter

Exported from `@netscript/database/adapters/mssql`.

Malformed input to `parseAdoNetConnectionString` throws the exported
`AdoNetConnectionStringSyntaxError`; its message does not include connection values.

| Symbol                        | Kind       | Signature                                                                    | Description                                                                          |
| ----------------------------- | ---------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `createMssqlAdapter`          | function   | `function createMssqlAdapter(options): MssqlAdapter`                         | Create a SQL Server adapter.                                                         |
| `MssqlAdapter`                | class      | `class MssqlAdapter`                                                         | SQL Server adapter.                                                                  |
| `MssqlDriverAdapter`          | interface  | `interface MssqlDriverAdapter`                                               | Public structural type returned by SQL Server driver adapter factories.              |
| `MssqlAdapterConfig`          | interface  | `interface MssqlAdapterConfig`                                               | Configuration object for `@prisma/adapter-mssql`.                                    |
| `MssqlConnectionOptions`      | interface  | `interface MssqlConnectionOptions`                                           | MSSQL-specific connection options.                                                   |
| `MssqlIsolationLevel`         | type alias | `type MssqlIsolationLevel`                                                   | SQL Server isolation levels (includes Snapshot).                                     |
| `parseAdoNetConnectionString` | function   | `function parseAdoNetConnectionString(connectionString): MssqlAdapterConfig` | Parse an ADO.NET connection string into a config object for `@prisma/adapter-mssql`. |
| `getMssqlConfig`              | function   | `function getMssqlConfig(env): MssqlAdapterConfig`                           | Get MSSQL adapter configuration from environment.                                    |
| `getMssqlConfigFromEnv`       | function   | `function getMssqlConfigFromEnv(env)`                                        | Get MSSQL configuration from structured environment variables.                       |

### MySQL adapter

Exported from `@netscript/database/adapters/mysql`.

| Symbol                       | Kind      | Signature                                                                   | Description                                                        |
| ---------------------------- | --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `createMysqlAdapter`         | function  | `function createMysqlAdapter(options): MysqlAdapter`                        | Create a MySQL adapter.                                            |
| `MysqlAdapter`               | class     | `class MysqlAdapter`                                                        | MySQL adapter.                                                     |
| `MysqlDriverAdapter`         | interface | `interface MysqlDriverAdapter`                                              | Public structural type returned by MySQL driver adapter factories. |
| `MysqlAdapterConfig`         | interface | `interface MysqlAdapterConfig`                                              | Configuration object for `@netscript/prisma-adapter-mysql`.        |
| `MysqlConnectionOptions`     | interface | `interface MysqlConnectionOptions`                                          | MySQL-specific connection options.                                 |
| `parseMysqlConnectionString` | function  | `function parseMysqlConnectionString(connectionString): MysqlAdapterConfig` | Parse a MySQL connection URI into adapter config.                  |
| `buildMysqlConnectionString` | function  | `function buildMysqlConnectionString(parts): string`                        | Build a MySQL connection string from parts.                        |
| `getMysqlConfig`             | function  | `function getMysqlConfig(env): MysqlAdapterConfig`                          | Get MySQL adapter configuration from environment.                  |
| `getMysqlConfigFromEnv`      | function  | `function getMysqlConfigFromEnv(env)`                                       | Get MySQL configuration from structured environment variables.     |

## Extensions

Exported from `@netscript/database/extensions`. Prisma extensions that automatically handle JSON
serialization across SQL databases.

| Symbol                    | Kind       | Signature                                                  | Description                                                              |
| ------------------------- | ---------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `sqlJsonExtension`        | function   | `function sqlJsonExtension(Prisma, options): ReturnType`   | Create a Prisma extension that automatically handles JSON serialization. |
| `mysqlJsonExtension`      | function   | `function mysqlJsonExtension(Prisma, options): ReturnType` | Create a Prisma extension for MySQL JSON serialization.                  |
| `registerJsonFields`      | function   | `function registerJsonFields(model, fields): void`         | Register additional JSON fields for a model at runtime.                  |
| `jsonUtils`               | variable   | `const jsonUtils`                                          | JSON serialization utilities for manual use.                             |
| `SqlJsonExtensionOptions` | interface  | `interface SqlJsonExtensionOptions`                        | Options for creating the SQL JSON extension.                             |
| `PrismaExtensionConfig`   | interface  | `interface PrismaExtensionConfig`                          | Prisma extension configuration generated by SQL JSON helpers.            |
| `PrismaQueryContext`      | interface  | `interface PrismaQueryContext`                             | Query context passed by Prisma to extension handlers.                    |
| `JsonField`               | type alias | `type JsonField`                                           | JSON field values.                                                       |
| `JsonFieldConfig`         | type alias | `type JsonFieldConfig`                                     | Configuration for JSON fields per model.                                 |
| `PrismaQueryHandler`      | type alias | `type PrismaQueryHandler`                                  | Query handler used by Prisma extension configuration.                    |
| `SqlDatabaseType`         | type alias | `type SqlDatabaseType`                                     | Supported database types for JSON handling.                              |

## Scripts

Exported from `@netscript/database/scripts`. Codegen and migration runners (each ships a `*Cli`
runner for command-line use).

| Symbol                     | Kind      | Signature                                                             | Description                                                             |
| -------------------------- | --------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `generateZodSchemas`       | function  | `async function generateZodSchemas(options): Promise`                 | Generate Zod schemas from Prisma models.                                |
| `generateZodSchemasCli`    | function  | `async function generateZodSchemasCli(options): Promise`              | CLI runner for Zod generation.                                          |
| `fixZodImports`            | function  | `async function fixZodImports(zodOutputDir, options): Promise`        | Fix relative imports in generated Zod files by adding `.ts` extensions. |
| `runFixZodImports`         | function  | `async function runFixZodImports(zodOutputDir, options): Promise`     | CLI runner for fix-zod-imports.                                         |
| `patchPrismaClient`        | function  | `async function patchPrismaClient(generatedDir, options): Promise`    | Patch a Prisma-generated directory for isomorphic imports.              |
| `runPatchPrismaClient`     | function  | `async function runPatchPrismaClient(generatedDir, options): Promise` | CLI runner: patch a single generated directory and log a summary.       |
| `runMigration`             | function  | `async function runMigration(options): Promise`                       | Run a Prisma migration.                                                 |
| `runMigrationCli`          | function  | `async function runMigrationCli(options): Promise`                    | CLI runner for migrations.                                              |
| `GenerateZodOptions`       | interface | `interface GenerateZodOptions`                                        | Options for Prisma Zod schema generation.                               |
| `FixZodImportsOptions`     | interface | `interface FixZodImportsOptions`                                      | Options for generated Zod schema post-processing.                       |
| `FixZodImportsResult`      | interface | `interface FixZodImportsResult`                                       | Summary of generated Zod schema post-processing changes.                |
| `PatchPrismaClientOptions` | interface | `interface PatchPrismaClientOptions`                                  | Options for Prisma client patching.                                     |
| `PatchPrismaClientResult`  | interface | `interface PatchPrismaClientResult`                                   | Summary of Prisma client patching changes.                              |
| `MigrationOptions`         | interface | `interface MigrationOptions`                                          | Prisma migration options.                                               |

## Tracing

Exported from `@netscript/database/tracing`. Prisma OpenTelemetry tracing helpers and the structural
span/tracer shapes they consume.

| Symbol                     | Kind      | Signature                                    | Description                                                        |
| -------------------------- | --------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `enablePrismaTracing`      | function  | `function enablePrismaTracing(config): void` | Enable Prisma OTEL tracing.                                        |
| `disablePrismaTracing`     | function  | `function disablePrismaTracing(): void`      | Disable Prisma OTEL tracing.                                       |
| `isPrismaTracingEnabled`   | function  | `function isPrismaTracingEnabled(): boolean` | Check whether Prisma OTEL tracing is currently enabled.            |
| `PrismaTracingConfig`      | interface | `interface PrismaTracingConfig`              | Configuration for Prisma OpenTelemetry tracing.                    |
| `PrismaTracingProvider`    | interface | `interface PrismaTracingProvider`            | Tracer provider shape accepted by `enablePrismaTracing`.           |
| `PrismaTracingTracer`      | interface | `interface PrismaTracingTracer`              | Minimum OpenTelemetry tracer shape used by Prisma tracing helpers. |
| `PrismaTracingSpan`        | interface | `interface PrismaTracingSpan`                | Minimum OpenTelemetry span shape used by Prisma tracing helpers.   |
| `PrismaTracingSpanContext` | interface | `interface PrismaTracingSpanContext`         | Span context fields used by Prisma tracing propagation.            |
| `PrismaTracingSpanLink`    | interface | `interface PrismaTracingSpanLink`            | Span link shape consumed by Prisma tracing helpers.                |

## Testing

Exported from `@netscript/database/testing`. A mock adapter and the shared port contract test suite,
plus the port types they reference.

| Symbol                           | Kind       | Signature                                                          | Description                                                  |
| -------------------------------- | ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `createMockDatabaseAdapter`      | function   | `function createMockDatabaseAdapter(options): MockDatabaseAdapter` | Create a new mock database adapter.                          |
| `MockDatabaseAdapter`            | class      | `class MockDatabaseAdapter`                                        | In-memory database adapter used by port contract tests.      |
| `runDatabaseAdapterContract`     | function   | `function runDatabaseAdapterContract(options): void`               | Register the shared database adapter contract tests.         |
| `DatabaseAdapterContractOptions` | interface  | `interface DatabaseAdapterContractOptions`                         | Options for `runDatabaseAdapterContract`.                    |
| `DatabaseAdapter`                | interface  | `interface DatabaseAdapter`                                        | Generic database adapter interface (re-exported from ports). |
| `DatabaseConnectionStatus`       | interface  | `interface DatabaseConnectionStatus`                               | Database connection status (re-exported from ports).         |
| `DatabaseProvider`               | type alias | `type DatabaseProvider`                                            | Database provider types (re-exported from ports).            |

## Sub-path exports

The following entrypoints are published alongside the root export. Their symbols are documented in
the sections above.

| Export                                  | Entrypoint                       | Purpose                                                                        |
| --------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------ |
| `@netscript/database`                   | `./mod.ts`                       | Root surface: ports, PostgreSQL adapter, JSON helpers, instrumentation toggle. |
| `@netscript/database/ports`             | `./ports/mod.ts`                 | Adapter contracts and shared types.                                            |
| `@netscript/database/adapters`          | `./adapters/mod.ts`              | PostgreSQL adapter (default driver surface).                                   |
| `@netscript/database/adapters/postgres` | `./adapters/postgres.adapter.ts` | PostgreSQL driver adapter.                                                     |
| `@netscript/database/adapters/mssql`    | `./adapters/mssql.adapter.ts`    | SQL Server driver adapter.                                                     |
| `@netscript/database/adapters/mysql`    | `./adapters/mysql.adapter.ts`    | MySQL driver adapter.                                                          |
| `@netscript/database/extensions`        | `./extensions/mod.ts`            | Prisma JSON serialization extensions.                                          |
| `@netscript/database/scripts`           | `./scripts/mod.ts`               | Prisma/Zod codegen and migration runners.                                      |
| `@netscript/database/tracing`           | `./prisma-tracing.ts`            | Prisma OpenTelemetry tracing helpers.                                          |
| `@netscript/database/commands/postgres` | `./commands-postgres.ts`         | Callback-bound PostgreSQL command store.                                       |
| `@netscript/database/commands`          | `./commands.ts`                  | Bound command port and logical rows.                                           |
| `@netscript/database/testing`           | `./testing/mod.ts`               | Mock adapter and shared port contract tests.                                   |

Connection-string utility:

| Export                                            | Entrypoint                         | Purpose                                   |
| ------------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| `@netscript/database/connection-strings/postgres` | `./connection-strings/postgres.ts` | Dependency-free PostgreSQL normalization. |

---

Back to the [reference overview](/reference/).

## Command persistence

`@netscript/database/commands` exports `createCommandStoreCapabilities`, `CommandStoreCapabilities`,
`CommandTransactionRequest`, `CommandStorePort`, `CommandTransaction`, `ReceiptClaim`,
`ReceiptClaimResult`, `ReceiptCompletion`, `StoredCommandReceipt`, `CommandReceiptRow`,
`StoredCommandAudit` and `StoredCommandOutbox`. The raw port has no service dependency. All
side-record methods share the provider callback's business handle. The provider must construct that
binding and invoke work at most once; capability metadata alone does not certify atomicity. Busy is
terminal until rollback.

`CommandStoreError` is the exported raw provider failure class, with `CommandStoreFailure` carrying
bounded store phase/retryability, cancellation or receipt corruption. It has no dependency on
service errors. Its JSON form omits cause, message and stack; adapters keep driver-specific codes
and messages solely in the trusted cause and preserve arbitrary callback errors.

### PostgreSQL command adapter

`@netscript/database/commands` also exports `TransactionClientPort<TTx>`. `withTransaction`
preserves this callback type independently of the root type without a root-client assertion.

`@netscript/database/commands/postgres` exports `createPostgresCommandStore`,
`PostgresCommandStoreOptions` and `PostgresCommandClient`. Supply the consumer's generated callback
bridge and a finite `transactionTimeoutMs`. The consumer owns Prisma models, generated client,
migrations and connections. The reviewed fixture in
`packages/database/tests/fixtures/command-store/` provides the schema, SQL checks/indexes and
explicit bridge; CLI generation remains RFC stage 8. The bridge excludes and hides nested
transaction and root lifecycle methods.

Every claim, completion, audit and outbox insert uses that same callback. Receipt claims use
`ON CONFLICT DO NOTHING RETURNING` and one indexed winner read. Claim wait must be 1–60,000
milliseconds; PostgreSQL's unbounded zero setting is refused. Successful claims restore local lock
timeout; busy causes rollback with no later side query. A locally claimed receipt must be complete
before commit. Serialization/deadlock failures are retryable without callback retries. Cooperative
cancellation checks framework boundaries and the finite provider timeout bounds in-flight work. Raw
diagnostics stay in the trusted cause.

The isolated native provider command is `bash .llm/tools/command-postgres-conformance.sh`. Its
dedicated CI workflow runs Deno 2.9.5 and exercises the real generated-client lock/fault matrix. A
skipped provider suite is not provider conformance evidence. Package import/construction runs no DDL
and has no queue dependency.

### Command outbox relay

The raw `CommandOutboxRelayStore` contains no decoded payload, service, worker or queue type.
`createPostgresCommandOutboxRelayStore` uses the consumer-owned migration and true transaction
callback. It claims due unpublished/nonterminal rows with bounded SKIP LOCKED leases; publication
and release fence the live token and expiry. Publication and normalized acceptance identity/time
share one CAS write. The consumer must apply the reviewed incremental acceptance migration;
framework code never runs DDL. Retry/terminal rows retain stable IDs. Sink acceptance precedes
settlement, so crashes redeliver and downstream operations must remain idempotent.

| Symbol                                  | Kind       | Signature                                                                                | Description                                             |
| --------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `COMMAND_RELAY_FAILURE_CLASSES`         | const      | `readonly tuple`                                                                         | Six closed persistence failure classes.                 |
| `CommandRelayFailureClass`              | type alias | `type CommandRelayFailureClass`                                                          | Finite failure vocabulary.                              |
| `ClaimedCommandOutboxRow`               | type alias | `type ClaimedCommandOutboxRow`                                                           | Raw leased outbox row.                                  |
| `CommandOutboxAcceptance`               | type alias | `type CommandOutboxAcceptance`                                                           | Checked normalized identity and time.                   |
| `CommandOutboxClaim`                    | type alias | `type CommandOutboxClaim`                                                                | Bounded explicit clock and generation request.          |
| `CommandOutboxPublication`              | type alias | `type CommandOutboxPublication`                                                          | One live-token publication and receipt write.           |
| `CommandOutboxRelease`                  | type alias | `type CommandOutboxRelease`                                                              | Retry or retained terminal state.                       |
| `CommandOutboxRelayStore`               | interface  | `interface CommandOutboxRelayStore`                                                      | Raw claim/mark/release port.                            |
| `createPostgresCommandOutboxRelayStore` | function   | `function createPostgresCommandOutboxRelayStore(root, options): CommandOutboxRelayStore` | Callback-bound PostgreSQL lease and settlement adapter. |

### Bound PostgreSQL command writer

| Symbol                        | Kind      | Description                                                                                           |
| ----------------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `bindPostgresCommandOutbox`   | function  | Binds the existing reviewed outbox append SQL to a live callback client without a nested transaction. |
| `PostgresCommandOutboxWriter` | interface | Detached outbox-only append boundary.                                                                 |

Atomic producers such as the saga transition store bind this writer inside their existing physical
transaction. Root/lifecycle handles are refused. The consumer owns the callback lifetime and
migration; import and construction perform no I/O or DDL.
