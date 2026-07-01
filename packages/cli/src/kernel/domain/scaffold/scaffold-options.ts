/**
 * @module domain/scaffold-options
 *
 * Shared scaffold option vocabulary.
 */

import type { DbEngineChoice } from '../db-engine.ts';
import type { CacheBackendChoice } from '../cache-backend.ts';
import type { EditorChoice } from './workspace-config.ts';

/** Legacy scaffold import mode. */
export type PackageSourceMode = 'jsr' | 'local';

/** Raw options received from the CLI `init` command before validation. */
export interface InitOptions {
  /** Project name in kebab-case. */
  readonly name: string;

  /** Application name override. */
  readonly appName?: string;

  /** Target directory. */
  readonly path?: string;

  /** Import mode for NetScript packages. */
  readonly importMode: PackageSourceMode;

  /** Optional editor-specific root config to scaffold. */
  readonly editor?: EditorChoice;

  /** Base path for local imports. */
  readonly localBase?: string;

  /** Absolute path to the NetScript monorepo root. */
  readonly sourceRoot?: string;

  /** Overwrite an existing target directory without prompting. */
  readonly force: boolean;

  /** Skip all interactive prompts. */
  readonly ci: boolean;

  /** Accept all default values without prompting. */
  readonly yes: boolean;

  /** Preview the scaffold plan without writing files. */
  readonly dryRun: boolean;

  /** Emit a single machine-readable init result object. */
  readonly json?: boolean;

  /** Named scaffold preset to apply before generation. */
  readonly from?: string;

  /** Skip `git init` after scaffolding. */
  readonly noGit: boolean;

  /** Skip Aspire orchestration layer. */
  readonly noAspire: boolean;

  /** Generate legacy C# AppHost instead of TypeScript-only AppHost. */
  readonly legacyAspire: boolean;

  /** Database engine to scaffold. */
  readonly dbEngine?: DbEngineChoice;

  /** Scaffold an example oRPC service. */
  readonly includeExampleService?: boolean;

  /** Example service name. */
  readonly serviceName?: string;

  /** Prisma domain model name override. */
  readonly modelName?: string;

  /** Example service port. */
  readonly servicePort?: number;

  /** Whether to scaffold a shared cache resource. */
  readonly cache?: boolean;

  /** Shared cache backend to scaffold. */
  readonly cacheBackend?: CacheBackendChoice;
}

/** Validated init options with all defaults resolved. */
export interface ValidatedInitOptions extends
  Required<
    Pick<
      InitOptions,
      | 'name'
      | 'force'
      | 'ci'
      | 'dryRun'
      | 'noGit'
      | 'noAspire'
      | 'legacyAspire'
    >
  > {
  /** Validated application name. */
  readonly appName: string;

  /** Absolute path to the target directory. */
  readonly targetPath: string;

  /** Resolved import mode. */
  readonly importMode: PackageSourceMode;

  /** Resolved editor config choice. */
  readonly editor: EditorChoice;

  /** Base path for local imports. */
  readonly localBase?: string;

  /** Absolute path to the NetScript monorepo root. */
  readonly sourceRoot?: string;

  /** Resolved database engine. */
  readonly dbEngine: DbEngineChoice;

  /** Whether to scaffold a shared cache resource. */
  readonly cache: boolean;

  /** Resolved shared cache backend. */
  readonly cacheBackend: CacheBackendChoice;

  /** Whether to scaffold an example oRPC service. */
  readonly includeExampleService: boolean;

  /** Resolved example service name. */
  readonly serviceName?: string;

  /** Resolved Prisma domain model name. */
  readonly modelName: string;

  /** Resolved example service port. */
  readonly servicePort?: number;
}

/** Options for the root workspace `deno.json` generator. */
export interface WorkspaceDenoJsonOptions {
  /** Project name used in task paths. */
  readonly name: string;

  /** Application name used in dev task. */
  readonly appName: string;

  /** Workspace member paths to include. */
  readonly workspaceMembers: readonly string[];

  /** Import mode for resolving NetScript packages. */
  readonly importMode: PackageSourceMode;

  /** Base path for local imports. */
  readonly localBase?: string;

  /** Whether copied packages are emitted as workspace members. */
  readonly packagesAsWorkspaceMembers?: boolean;

  /** Database engines selected for this scaffold. */
  readonly dbEngines?: readonly string[];
}

/** Options for the `netscript.config.ts` generator. */
export interface NetScriptConfigGenOptions {
  /** Project name. */
  readonly name: string;

  /** Import mode for the `defineConfig` import specifier. */
  readonly importMode: PackageSourceMode;

  /** Base path for local imports. */
  readonly localBase?: string;
}

/** Options for a sub-package `deno.json` generator. */
export interface PackageDenoJsonOptions {
  /** Package name. */
  readonly packageName: string;

  /** Import mode for resolving dependencies. */
  readonly importMode: PackageSourceMode;

  /** Base path for local imports. */
  readonly localBase?: string;

  /** Additional imports to include. */
  readonly imports?: Readonly<Record<string, string>>;
}

/** Options for the Aspire scaffold phase. */
export interface AspireScaffoldOptions {
  /** Project name. */
  readonly name: string;

  /** Import mode for NuGet reference resolution. */
  readonly importMode: PackageSourceMode;

  /** Local base path for local NuGet references. */
  readonly localBase?: string;

  /** Application name. */
  readonly appName: string;

  /** Application port. */
  readonly appPort: number;
}

/** Options for the Fresh app scaffold phase. */
export interface AppScaffoldOptions {
  /** Project name used in scoped package names. */
  readonly projectName: string;

  /** Application name. */
  readonly appName: string;

  /** Import mode for NetScript package references. */
  readonly importMode: PackageSourceMode;

  /** Local base path for local mode. */
  readonly localBase?: string;
}
