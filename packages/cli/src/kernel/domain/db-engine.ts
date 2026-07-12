/**
 * Database engine vocabulary shared by CLI command modes.
 */

import type { ScaffoldResult } from './core-types.ts';
import type { PackageSourceMode } from './scaffold/scaffold-options.ts';

export type { ScaffoldResult } from './core-types.ts';
export type { PackageSourceMode } from './scaffold/scaffold-options.ts';

/** Database engines that have scaffolded workspace support. */
export type DbEngine = 'postgres' | 'mysql' | 'mssql' | 'sqlite';

/** Database engine selection accepted by init, including the no-database option. */
export type DbEngineChoice = DbEngine | 'none';

/** Ordered database engine choices accepted by init. */
export const DB_ENGINE_CHOICES: readonly DbEngineChoice[] = [
  'postgres',
  'mysql',
  'mssql',
  'sqlite',
  'none',
] as const;

/** Prisma provider names corresponding to each supported database engine. */
export type PrismaProvider = 'postgresql' | 'mysql' | 'sqlserver' | 'sqlite';

/** Script and task capabilities that differ by database engine. */
export interface EngineCapabilities {
  /** Whether the engine workspace should run Zod schema generation. */
  readonly hasZodGeneration: boolean;

  /** Whether the engine workspace supports `prisma format`. */
  readonly hasPrismaFormat: boolean;

  /** Prisma-generated file that exports `PrismaClient`. */
  readonly clientEntrypoint: 'client.server.ts';
}

/** Immutable per-engine knowledge used by scaffolding and command execution. */
export interface DbEngineProvider {
  /** CLI engine identifier. */
  readonly engine: DbEngine;
  /** Prisma schema provider identifier. */
  readonly prismaProvider: PrismaProvider;
  /** Human-readable engine name. */
  readonly displayName: string;
  /** Directory name under `database/`. */
  readonly dirName: string;
  /** Aspire TypeScript SDK builder method for the engine. */
  readonly aspireMethod: string;
  /** Whether the engine supports Aspire container mode. */
  readonly supportsContainerMode: boolean;
  /** Default container image tag, or `null` when the engine has no container. */
  readonly defaultImageTag: string | null;
  /** Engine-specific generated task/script capabilities. */
  readonly capabilities: EngineCapabilities;
}

/** Options for creating a complete `database/<engine>/` workspace. */
export interface DatabaseScaffoldOptions {
  /** Project name used for generated package names and DB resource names. */
  readonly projectName: string;
  /** Absolute target workspace root. */
  readonly targetPath: string;
  /** Database engine to scaffold. */
  readonly engine: DbEngine;
  /** Config key under `NetScript.Databases`; defaults to the engine name. */
  readonly configKey?: string;
  /** Prisma domain model name to emit in the base schema. */
  readonly modelName?: string;
  /** Import mode for generated package imports. */
  readonly importMode: PackageSourceMode;
  /** Local import base path when `importMode` is `'local'`. */
  readonly localBase?: string;
  /** Whether existing generated files may be overwritten. */
  readonly overwrite?: boolean;
}

/** Result of creating a database workspace. */
export interface DatabaseScaffoldResult {
  /** Underlying scaffold file and directory result. */
  readonly scaffoldResult: ScaffoldResult;
  /** Absolute workspace directory for the engine. */
  readonly workspaceDir: string;
  /** Config key written or resolved for this database. */
  readonly configKey: string;
  /** Database resource name used by Aspire. */
  readonly databaseName: string;
}

/** Database discovered from project configuration. */
export interface DiscoveredDatabase {
  /** Config key under `NetScript.Databases`. */
  readonly configKey: string;
  /** Resolved CLI engine identifier. */
  readonly engine: DbEngine;
  /** Concrete database resource name. */
  readonly databaseName: string;
  /** Workspace directory relative to the project root. */
  readonly workspaceDir: string;
  /** Whether the database is enabled in configuration. */
  readonly enabled: boolean;
}

/** Resolved database operation target. */
export type ResolvedTarget =
  | { readonly kind: 'single'; readonly database: DiscoveredDatabase }
  | { readonly kind: 'all'; readonly databases: readonly DiscoveredDatabase[] };

/** Database operations supported by the CLI command family. */
export type DbOperation =
  | 'generate'
  | 'init'
  | 'migrate'
  | 'seed'
  | 'studio'
  | 'introspect'
  | 'reset'
  | 'status'
  | 'deploy'
  | 'validate'
  | 'resolve-applied'
  | 'resolve-rolled-back';

/** Request passed to the database operation runner. */
export interface DbOperationRequest {
  /** Operation to execute. */
  readonly operation: DbOperation;
  /** Resolved operation target. */
  readonly target: ResolvedTarget;
  /** Optional migration name for migration creation. */
  readonly migrationName?: string;
  /** Absolute project root. */
  readonly projectRoot: string;
}
