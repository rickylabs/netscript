import type { DatabaseScaffoldResult, DbEngine } from '../../kernel/domain/db-engine.ts';

/** User request for adding one database workspace to a NetScript project. */
export interface DbAddRequest {
  /** Raw engine name received from the command surface. */
  readonly engine: string;

  /** Config key under `NetScript.Databases`; defaults to the engine name. */
  readonly configKey?: string;

  /** Absolute project root. */
  readonly projectRoot: string;

  /** Whether existing database workspace files may be overwritten. */
  readonly overwrite: boolean;
}

/** Planned database addition with project metadata resolved. */
export interface DbAddPlan {
  /** Database engine identifier. */
  readonly engine: DbEngine;

  /** Config key under `NetScript.Databases`. */
  readonly configKey: string;

  /** Project name used for generated package names and resources. */
  readonly projectName: string;

  /** Absolute project root. */
  readonly projectRoot: string;

  /** Whether existing generated files may be overwritten. */
  readonly overwrite: boolean;
}

/** Result of the public database-add application flow. */
export interface AddDbResult {
  /** Scaffold result for the generated database workspace. */
  readonly scaffold: DatabaseScaffoldResult;

  /** Helper files regenerated under the TypeScript AppHost, when present. */
  readonly appHostHelpers: readonly string[];
}
