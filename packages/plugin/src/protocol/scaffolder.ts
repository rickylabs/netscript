import type { PluginLogger } from '../domain/mod.ts';

/** Context supplied by the NetScript installer to a plugin-owned scaffolder. */
export interface ScaffolderContext {
  /** Absolute path to the target workspace root. */
  readonly workspaceRoot: string;
  /** Plugin-specific scaffold options passed by the installer. */
  readonly options: Readonly<Record<string, unknown>>;
  /** Whether the scaffolder must report planned changes without writing files. */
  readonly dryRun: boolean;
  /** Logger supplied by the host installer. */
  readonly logger: PluginLogger;
}

/** Result returned by a plugin-owned scaffolder. */
export interface ScaffoldResult {
  /** Whether the scaffolder applied changes, planned changes, skipped work, or failed. */
  readonly status: 'applied' | 'planned' | 'skipped' | 'failed';
  /** Workspace-relative files created or planned by the scaffolder. */
  readonly createdFiles: readonly string[];
  /** Workspace-relative files modified or planned by the scaffolder. */
  readonly modifiedFiles: readonly string[];
  /** Whether database migration or schema files were added or planned. */
  readonly databaseMigrationsAdded: boolean;
}

/** Entrypoint signature implemented by plugin-owned `./scaffold` exports. */
export type PluginScaffoldEntrypoint = (
  context: ScaffolderContext,
) => Promise<ScaffoldResult>;
