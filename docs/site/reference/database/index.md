---
layout: layouts/base.vto
title: '@netscript/database'
---

# `@netscript/database`

Database adapter contracts, Prisma driver adapters, JSON extensions, tracing and schema tooling for
NetScript. Use it to connect Prisma to PostgreSQL, SQL Server or MySQL, generate Zod schemas, run
migrations, and persist command receipts and outbox rows.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/database` | `./mod.ts` | Root surface: [ports](#ports), PostgreSQL adapter, JSON helpers, instrumentation toggle ([root extras](#root-extras)). |
| `@netscript/database/ports` | `./ports/mod.ts` | [Adapter contracts and shared types](#ports). |
| `@netscript/database/adapters` | `./adapters/mod.ts` | [PostgreSQL adapter](#adapters) (default driver surface). |
| `@netscript/database/adapters/postgres` | `./adapters/postgres.adapter.ts` | [PostgreSQL driver adapter](#postgresql-adapter). |
| `@netscript/database/adapters/mssql` | `./adapters/mssql.adapter.ts` | [SQL Server driver adapter](#sql-server-adapter). |
| `@netscript/database/adapters/mysql` | `./adapters/mysql.adapter.ts` | [MySQL driver adapter](#mysql-adapter). |
| `@netscript/database/connection-strings/postgres` | `./connection-strings/postgres.ts` | [Dependency-free PostgreSQL connection-string normalization](#postgresql-connection-strings). |
| `@netscript/database/extensions` | `./extensions/mod.ts` | [Prisma JSON serialization extensions](#extensions). |
| `@netscript/database/scripts` | `./scripts/mod.ts` | [Prisma/Zod codegen and migration runners](#scripts). |
| `@netscript/database/tracing` | `./prisma-tracing.ts` | [Prisma OpenTelemetry tracing helpers](#tracing). |
| `@netscript/database/commands` | `./commands.ts` | [Bound command port and logical rows](#command-persistence). |
| `@netscript/database/commands/postgres` | `./commands-postgres.ts` | [Callback-bound PostgreSQL command store](#postgresql-command-adapter). |
| `@netscript/database/testing` | `./testing/mod.ts` | [Mock adapter and shared port contract tests](#testing). |

## Ports

Provider-agnostic adapter contracts, exported from the root and from `@netscript/database/ports`.

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

Root-only symbols beyond the port contracts and the PostgreSQL adapter.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `enableInstrumentation` | function | `function enableInstrumentation(): boolean` | Enable Prisma OTEL instrumentation for database tracing. Call before creating any Prisma clients; only active when `OTEL_DENO=true`. |
| `withTransaction` | function | `function withTransaction(client, fn, options): Promise` | Execute operations within a transaction. |
| `parseConnectionString` | function | `function parseConnectionString(connectionString)` | Parse a database connection string. |
| `buildPostgresConnectionString` | function | `function buildPostgresConnectionString(parts): string` | Build a PostgreSQL connection string from parts. |
| `buildMssqlConnectionString` | function | `function buildMssqlConnectionString(parts): string` | Build a SQL Server connection string from parts. |
| `jsonUtils` | const | `const jsonUtils` | JSON serialization utilities for manual use. |
| `registerJsonFields` | function | `function registerJsonFields(model, fields): void` | Register additional JSON fields for a model at runtime. |

## Adapters

The default PostgreSQL driver surface, exported from `@netscript/database/adapters` and re-exported
from the root.

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

Exported from `@netscript/database/extensions`. Prisma extensions that handle JSON serialization
across SQL databases.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `sqlJsonExtension` | function | `function sqlJsonExtension(Prisma, options): ReturnType` | Create a Prisma extension that automatically handles JSON serialization. |
| `mysqlJsonExtension` | function | `function mysqlJsonExtension(Prisma, options): ReturnType` | Create a Prisma extension for MySQL JSON serialization. |
| `registerJsonFields` | function | `function registerJsonFields(model, fields): void` | Register additional JSON fields for a model at runtime. |
| `jsonUtils` | const | `const jsonUtils` | JSON serialization utilities for manual use. |
| `SqlJsonExtensionOptions` | interface | `interface SqlJsonExtensionOptions` | Options for creating the SQL JSON extension. |
| `PrismaExtensionConfig` | interface | `interface PrismaExtensionConfig` | Prisma extension configuration generated by SQL JSON helpers. |
| `PrismaQueryContext` | interface | `interface PrismaQueryContext` | Query context passed by Prisma to extension handlers. |
| `JsonField` | type alias | `type JsonField` | JSON field values. |
| `JsonFieldConfig` | type alias | `type JsonFieldConfig` | Configuration for JSON fields per model. |
| `PrismaQueryHandler` | type alias | `type PrismaQueryHandler` | Query handler used by Prisma extension configuration. |
| `SqlDatabaseType` | type alias | `type SqlDatabaseType` | Supported database types for JSON handling. |

## Scripts

Exported from `@netscript/database/scripts`. Each codegen and migration runner has a `*Cli` variant
for command-line use.

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

Exported from `@netscript/database/testing`. A mock adapter, the shared port contract test suite,
and the port types they reference.

| Symbol                           | Kind       | Signature                                                          | Description                                                  |
| -------------------------------- | ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `createMockDatabaseAdapter`      | function   | `function createMockDatabaseAdapter(options): MockDatabaseAdapter` | Create a new mock database adapter.                          |
| `MockDatabaseAdapter`            | class      | `class MockDatabaseAdapter`                                        | In-memory database adapter used by port contract tests.      |
| `runDatabaseAdapterContract`     | function   | `function runDatabaseAdapterContract(options): void`               | Register the shared database adapter contract tests.         |
| `DatabaseAdapterContractOptions` | interface  | `interface DatabaseAdapterContractOptions`                         | Options for `runDatabaseAdapterContract`.                    |
| `DatabaseAdapter`                | interface  | `interface DatabaseAdapter`                                        | Generic database adapter interface (re-exported from ports). |
| `DatabaseConnectionStatus`       | interface  | `interface DatabaseConnectionStatus`                               | Database connection status (re-exported from ports).         |
| `DatabaseProvider`               | type alias | `type DatabaseProvider`                                            | Database provider types (re-exported from ports).            |

## Command persistence

`@netscript/database/commands` exports `createCommandStoreCapabilities`, `CommandStoreCapabilities`,
`CommandTransactionRequest`, `CommandStorePort`, `CommandTransaction`, `ReceiptClaim`,
`ReceiptClaimResult`, `ReceiptCompletion`, `StoredCommandReceipt`, `CommandReceiptRow`,
`StoredCommandAudit` and `StoredCommandOutbox`.

- The raw port has no service dependency.
- All side-record methods share the provider callback's business handle. The provider must
  construct that binding and invoke work at most once.
- Capability metadata alone does not certify atomicity.
- Busy is terminal until rollback.

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
migrations and connections. The fixture in `packages/database/tests/fixtures/command-store/`
provides the schema, SQL checks/indexes and explicit bridge. The bridge excludes and hides nested
transaction and root lifecycle methods.

Every claim, completion, audit and outbox insert uses that same callback. Receipt claims use
`ON CONFLICT DO NOTHING RETURNING` and one indexed winner read. Claim wait must be 1–60,000
milliseconds; PostgreSQL's unbounded zero setting is refused. Successful claims restore local lock
timeout; busy causes rollback with no later side query. A locally claimed receipt must be complete
before commit. Serialization/deadlock failures are retryable without callback retries. Cooperative
cancellation checks framework boundaries and the finite provider timeout bounds in-flight work. Raw
diagnostics stay in the trusted cause.

Package import and construction run no DDL and have no queue dependency.

### Command outbox relay

The raw `CommandOutboxRelayStore` contains no decoded payload, service, worker or queue type.
`createPostgresCommandOutboxRelayStore` uses the consumer-owned migration and true transaction
callback. It claims due unpublished/nonterminal rows with bounded SKIP LOCKED leases; publication
and release fence the live token and expiry. Publication and normalized acceptance identity/time
share one CAS write. The consumer must apply the incremental acceptance migration;
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
| `bindPostgresCommandOutbox`   | function  | Binds the outbox append SQL to a live callback client without a nested transaction. |
| `PostgresCommandOutboxWriter` | interface | Detached outbox-only append boundary.                                                                 |

Atomic producers such as the saga transition store bind this writer inside their existing physical
transaction. Root/lifecycle handles are refused. The consumer owns the callback lifetime and
migration; import and construction perform no I/O or DDL.
