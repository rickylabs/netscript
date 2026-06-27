/**
 * Mode-agnostic workspace and scaffold configuration vocabulary.
 */

import type { DbEngineChoice } from '../db-engine.ts';
import type { CacheBackendChoice } from '../cache-backend.ts';
import type { ScaffoldResult } from '../core-types.ts';

/** Optional editor config scaffolded into the workspace root. */
export type EditorChoice = 'none' | 'zed' | 'vscode';

/** Aggregated result of the full `init` pipeline execution. */
export interface InitResult {
  /** Project name that was scaffolded. */
  readonly name: string;

  /** Absolute path to the scaffolded project. */
  readonly targetPath: string;

  /** Per-phase scaffold results. */
  readonly phases: readonly ScaffoldResult[];

  /** Whether this was a dry-run. */
  readonly dryRun: boolean;

  /** Total scaffold duration in milliseconds. */
  readonly durationMs: number;

  /** Aggregated count of files created across all phases. */
  readonly totalFilesCreated: number;

  /** Aggregated count of directories created across all phases. */
  readonly totalDirectoriesCreated: number;
}

/** Resource type for port allocation. */
export type AllocatableResourceType = 'SERVICE' | 'APP' | 'PLUGIN_API' | 'INFRA_PLUGIN';

/** Workspace member type for `addWorkspaceMember`. */
export type ScaffoldMemberType =
  | 'service'
  | 'app'
  | 'plugin'
  | 'contract'
  | 'package';

/** Answers collected from interactive prompts during `init`. */
export interface InitPromptAnswers {
  /** Project name. */
  readonly name: string;

  /** Application name. */
  readonly appName: string;

  /** Whether to include an example service scaffold. */
  readonly includeExampleService: boolean;

  /** Example service name. */
  readonly serviceName?: string;

  /** Example service port. */
  readonly servicePort?: number;

  /** Database engine selection. */
  readonly dbEngine: DbEngineChoice;

  /** Whether to include a shared cache scaffold. */
  readonly cache: boolean;

  /** Shared cache backend selection. */
  readonly cacheBackend: CacheBackendChoice;

  /** Optional editor-specific config scaffold. */
  readonly editor: EditorChoice;

  /** Final confirmation before scaffolding. */
  readonly confirm: boolean;
}
