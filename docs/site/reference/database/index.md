---
layout: layouts/base.vto
title: "@netscript/database"
---

# `@netscript/database`

Database adapter contracts, Prisma driver helpers, tracing, and schema tooling for
NetScript packages. This page is generated from the package's public surface with
`deno doc` (US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The root entrypoint (`@netscript/database`) re-exports the port contracts, the PostgreSQL
adapter, the JSON extension helpers, and the OTEL instrumentation toggle. The remaining
sub-path exports carry the per-driver adapters, the Prisma extensions, the schema/codegen
scripts, the tracing surface, and the test contract harness:

- [`@netscript/database/ports`](#ports) — adapter contracts and shared types.
- [`@netscript/database/adapters`](#adapters) — PostgreSQL adapter (default driver surface).
- [`@netscript/database/adapters/postgres`](#postgresql-adapter) — PostgreSQL driver adapter.
- [`@netscript/database/adapters/mssql`](#sql-server-adapter) — SQL Server driver adapter.
- [`@netscript/database/adapters/mysql`](#mysql-adapter) — MySQL driver adapter.
- [`@netscript/database/extensions`](#extensions) — Prisma JSON serialization extensions.
- [`@netscript/database/scripts`](#scripts) — Prisma/Zod codegen and migration runners.
- [`@netscript/database/tracing`](#tracing) — Prisma OpenTelemetry tracing helpers.
- [`@netscript/database/testing`](#testing) — mock adapter and shared port contract tests.

## Ports

Exported from the root (`@netscript/database`) and from `@netscript/database/ports`. These
are the provider-agnostic adapter contracts.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `DatabaseAdapter` | interface | `interface DatabaseAdapter` | Generic database adapter interface. |
| `DatabaseAdapterFactory` | interface | `interface DatabaseAdapterFactory` | Factory for creating database adapters. |
| `DatabaseConnectionOptions` | interface | `interface DatabaseConnectionOptions` | Database connection options. |
| `DatabaseConnectionStatus` | interface | `interface DatabaseConnectionStatus` | Database connection status. |
| `SharedDatabaseConfig` | interface | `interface SharedDatabaseConfig` | Configuration for the shared database instance. |
| `TransactionOptions` | interface | `interface TransactionOptions` | Transaction options. |
| `DatabaseProvider` | type alias | `type DatabaseProvider` | Database provider types. |
| `IsolationLevel` | type alias | `type IsolationLevel` | Transaction isolation levels. |

## Root extras

Additional symbols re-exported from the root entrypoint (`@netscript/database`) beyond the
port contracts and the PostgreSQL adapter.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `enableInstrumentation` | function | `function enableInstrumentation(): boolean` | Enable Prisma OTEL instrumentation for database tracing. Call before creating any Prisma clients; only active when `OTEL_DENO=true`. |
| `withTransaction` | function | `function withTransaction(client, fn, options): Promise` | Execute operations within a transaction. |
| `parseConnectionString` | function | `function parseConnectionString(connectionString)` | Parse a database connection string. |
| `buildPostgresConnectionString` | function | `function buildPostgresConnectionString(parts): string` | Build a PostgreSQL connection string from parts. |
| `buildMssqlConnectionString` | function | `function buildMssqlConnectionString(parts): string` | Build a SQL Server connection string from parts. |
| `jsonUtils` | variable | `const jsonUtils` | JSON serialization utilities for manual use. |
| `registerJsonFields` | function | `function registerJsonFields(model, fields): void` | Register additional JSON fields for a model at runtime. |

## Adapters

Exported from `@netscript/database/adapters` (and re-exported from the root). This is the
default PostgreSQL driver surface.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createPostgresAdapter` | function | `function createPostgresAdapter(options): PostgresAdapter` | Create a PostgreSQL adapter. |
| `PostgresAdapter` | class | `class PostgresAdapter` | PostgreSQL adapter. |
| `PostgresConnectionOptions` | interface | `interface PostgresConnectionOptions` | PostgreSQL-specific connection options. |

### PostgreSQL adapter

Exported from `@netscript/database/adapters/postgres`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createPostgresAdapter` | function | `function createPostgresAdapter(options): PostgresAdapter` | Create a PostgreSQL adapter. |
| `PostgresAdapter` | class | `class PostgresAdapter` | PostgreSQL adapter. |
| `PostgresDriverAdapter` | interface | `interface PostgresDriverAdapter` | Public structural type returned by PostgreSQL driver adapter factories. |
| `PostgresConnectionOptions` | interface | `interface PostgresConnectionOptions` | PostgreSQL-specific connection options. |

### SQL Server adapter

Exported from `@netscript/database/adapters/mssql`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createMssqlAdapter` | function | `function createMssqlAdapter(options): MssqlAdapter` | Create a SQL Server adapter. |
| `MssqlAdapter` | class | `class MssqlAdapter` | SQL Server adapter. |
| `MssqlDriverAdapter` | interface | `interface MssqlDriverAdapter` | Public structural type returned by SQL Server driver adapter factories. |
| `MssqlAdapterConfig` | interface | `interface MssqlAdapterConfig` | Configuration object for `@prisma/adapter-mssql`. |
| `MssqlConnectionOptions` | interface | `interface MssqlConnectionOptions` | MSSQL-specific connection options. |
| `MssqlIsolationLevel` | type alias | `type MssqlIsolationLevel` | SQL Server isolation levels (includes Snapshot). |
| `parseAdoNetConnectionString` | function | `function parseAdoNetConnectionString(connectionString): MssqlAdapterConfig` | Parse an ADO.NET connection string into a config object for `@prisma/adapter-mssql`. |
| `getMssqlConfig` | function | `function getMssqlConfig(env): MssqlAdapterConfig` | Get MSSQL adapter configuration from environment. |
| `getMssqlConfigFromEnv` | function | `function getMssqlConfigFromEnv(env)` | Get MSSQL configuration from structured environment variables. |

### MySQL adapter

Exported from `@netscript/database/adapters/mysql`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createMysqlAdapter` | function | `function createMysqlAdapter(options): MysqlAdapter` | Create a MySQL adapter. |
| `MysqlAdapter` | class | `class MysqlAdapter` | MySQL adapter. |
| `MysqlDriverAdapter` | interface | `interface MysqlDriverAdapter` | Public structural type returned by MySQL driver adapter factories. |
| `MysqlAdapterConfig` | interface | `interface MysqlAdapterConfig` | Configuration object for `@netscript/prisma-adapter-mysql`. |
| `MysqlConnectionOptions` | interface | `interface MysqlConnectionOptions` | MySQL-specific connection options. |
| `parseMysqlConnectionString` | function | `function parseMysqlConnectionString(connectionString): MysqlAdapterConfig` | Parse a MySQL connection URI into adapter config. |
| `buildMysqlConnectionString` | function | `function buildMysqlConnectionString(parts): string` | Build a MySQL connection string from parts. |
| `getMysqlConfig` | function | `function getMysqlConfig(env): MysqlAdapterConfig` | Get MySQL adapter configuration from environment. |
| `getMysqlConfigFromEnv` | function | `function getMysqlConfigFromEnv(env)` | Get MySQL configuration from structured environment variables. |

## Extensions

Exported from `@netscript/database/extensions`. Prisma extensions that automatically handle
JSON serialization across SQL databases.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `sqlJsonExtension` | function | `function sqlJsonExtension(Prisma, options): ReturnType` | Create a Prisma extension that automatically handles JSON serialization. |
| `mysqlJsonExtension` | function | `function mysqlJsonExtension(Prisma, options): ReturnType` | Create a Prisma extension for MySQL JSON serialization. |
| `registerJsonFields` | function | `function registerJsonFields(model, fields): void` | Register additional JSON fields for a model at runtime. |
| `jsonUtils` | variable | `const jsonUtils` | JSON serialization utilities for manual use. |
| `SqlJsonExtensionOptions` | interface | `interface SqlJsonExtensionOptions` | Options for creating the SQL JSON extension. |
| `PrismaExtensionConfig` | interface | `interface PrismaExtensionConfig` | Prisma extension configuration generated by SQL JSON helpers. |
| `PrismaQueryContext` | interface | `interface PrismaQueryContext` | Query context passed by Prisma to extension handlers. |
| `JsonField` | type alias | `type JsonField` | JSON field values. |
| `JsonFieldConfig` | type alias | `type JsonFieldConfig` | Configuration for JSON fields per model. |
| `PrismaQueryHandler` | type alias | `type PrismaQueryHandler` | Query handler used by Prisma extension configuration. |
| `SqlDatabaseType` | type alias | `type SqlDatabaseType` | Supported database types for JSON handling. |

## Scripts

Exported from `@netscript/database/scripts`. Codegen and migration runners (each ships a
`*Cli` runner for command-line use).

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `generateZodSchemas` | function | `async function generateZodSchemas(options): Promise` | Generate Zod schemas from Prisma models. |
| `generateZodSchemasCli` | function | `async function generateZodSchemasCli(options): Promise` | CLI runner for Zod generation. |
| `fixZodImports` | function | `async function fixZodImports(zodOutputDir, options): Promise` | Fix relative imports in generated Zod files by adding `.ts` extensions. |
| `runFixZodImports` | function | `async function runFixZodImports(zodOutputDir, options): Promise` | CLI runner for fix-zod-imports. |
| `patchPrismaClient` | function | `async function patchPrismaClient(generatedDir, options): Promise` | Patch a Prisma-generated directory for isomorphic imports. |
| `runPatchPrismaClient` | function | `async function runPatchPrismaClient(generatedDir, options): Promise` | CLI runner: patch a single generated directory and log a summary. |
| `runMigration` | function | `async function runMigration(options): Promise` | Run a Prisma migration. |
| `runMigrationCli` | function | `async function runMigrationCli(options): Promise` | CLI runner for migrations. |
| `GenerateZodOptions` | interface | `interface GenerateZodOptions` | Options for Prisma Zod schema generation. |
| `FixZodImportsOptions` | interface | `interface FixZodImportsOptions` | Options for generated Zod schema post-processing. |
| `FixZodImportsResult` | interface | `interface FixZodImportsResult` | Summary of generated Zod schema post-processing changes. |
| `PatchPrismaClientOptions` | interface | `interface PatchPrismaClientOptions` | Options for Prisma client patching. |
| `PatchPrismaClientResult` | interface | `interface PatchPrismaClientResult` | Summary of Prisma client patching changes. |
| `MigrationOptions` | interface | `interface MigrationOptions` | Prisma migration options. |

## Tracing

Exported from `@netscript/database/tracing`. Prisma OpenTelemetry tracing helpers and the
structural span/tracer shapes they consume.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `enablePrismaTracing` | function | `function enablePrismaTracing(config): void` | Enable Prisma OTEL tracing. |
| `disablePrismaTracing` | function | `function disablePrismaTracing(): void` | Disable Prisma OTEL tracing. |
| `isPrismaTracingEnabled` | function | `function isPrismaTracingEnabled(): boolean` | Check whether Prisma OTEL tracing is currently enabled. |
| `PrismaTracingConfig` | interface | `interface PrismaTracingConfig` | Configuration for Prisma OpenTelemetry tracing. |
| `PrismaTracingProvider` | interface | `interface PrismaTracingProvider` | Tracer provider shape accepted by `enablePrismaTracing`. |
| `PrismaTracingTracer` | interface | `interface PrismaTracingTracer` | Minimum OpenTelemetry tracer shape used by Prisma tracing helpers. |
| `PrismaTracingSpan` | interface | `interface PrismaTracingSpan` | Minimum OpenTelemetry span shape used by Prisma tracing helpers. |
| `PrismaTracingSpanContext` | interface | `interface PrismaTracingSpanContext` | Span context fields used by Prisma tracing propagation. |
| `PrismaTracingSpanLink` | interface | `interface PrismaTracingSpanLink` | Span link shape consumed by Prisma tracing helpers. |

## Testing

Exported from `@netscript/database/testing`. A mock adapter and the shared port contract
test suite, plus the port types they reference.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createMockDatabaseAdapter` | function | `function createMockDatabaseAdapter(options): MockDatabaseAdapter` | Create a new mock database adapter. |
| `MockDatabaseAdapter` | class | `class MockDatabaseAdapter` | In-memory database adapter used by port contract tests. |
| `runDatabaseAdapterContract` | function | `function runDatabaseAdapterContract(options): void` | Register the shared database adapter contract tests. |
| `DatabaseAdapterContractOptions` | interface | `interface DatabaseAdapterContractOptions` | Options for `runDatabaseAdapterContract`. |
| `DatabaseAdapter` | interface | `interface DatabaseAdapter` | Generic database adapter interface (re-exported from ports). |
| `DatabaseConnectionStatus` | interface | `interface DatabaseConnectionStatus` | Database connection status (re-exported from ports). |
| `DatabaseProvider` | type alias | `type DatabaseProvider` | Database provider types (re-exported from ports). |

## Sub-path exports

The following entrypoints are published alongside the root export. Their symbols are
documented in the sections above.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/database` | `./mod.ts` | Root surface: ports, PostgreSQL adapter, JSON helpers, instrumentation toggle. |
| `@netscript/database/ports` | `./ports/mod.ts` | Adapter contracts and shared types. |
| `@netscript/database/adapters` | `./adapters/mod.ts` | PostgreSQL adapter (default driver surface). |
| `@netscript/database/adapters/postgres` | `./adapters/postgres.adapter.ts` | PostgreSQL driver adapter. |
| `@netscript/database/adapters/mssql` | `./adapters/mssql.adapter.ts` | SQL Server driver adapter. |
| `@netscript/database/adapters/mysql` | `./adapters/mysql.adapter.ts` | MySQL driver adapter. |
| `@netscript/database/extensions` | `./extensions/mod.ts` | Prisma JSON serialization extensions. |
| `@netscript/database/scripts` | `./scripts/mod.ts` | Prisma/Zod codegen and migration runners. |
| `@netscript/database/tracing` | `./prisma-tracing.ts` | Prisma OpenTelemetry tracing helpers. |
| `@netscript/database/testing` | `./testing/mod.ts` | Mock adapter and shared port contract tests. |

---

Back to the [reference overview](/reference/).
