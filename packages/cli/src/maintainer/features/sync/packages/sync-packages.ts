import type { DbEngine } from '../../../../kernel/domain/db-engine.ts';
import type {
  CopyLocalPackagesResult,
  PackageCopierPort,
} from '../../../ports/package-copier-port.ts';

/** Request for syncing monorepo packages into a maintainer scaffold. */
export interface SyncPackagesRequest {
  /** Absolute path to the monorepo root. */
  readonly sourceRoot: string;
  /** Absolute path to the scaffold target root. */
  readonly targetPath: string;
  /** Concrete database engines that need extra local packages. */
  readonly dbEngines?: readonly DbEngine[];
  /** Explicit package names to copy. Defaults to the scaffold package set. */
  readonly packageNames?: readonly string[];
  /** Whether package test files should be copied. Defaults to false for scaffolds. */
  readonly includeTests?: boolean;
}

/** Dependencies used by the maintainer package sync flow. */
export interface SyncPackagesDependencies {
  /** Package copier adapter. */
  readonly packageCopier: PackageCopierPort;
}

/** Copy local workspace packages into a maintainer scaffold target. */
export function syncPackages(
  request: SyncPackagesRequest,
  dependencies: SyncPackagesDependencies,
): Promise<CopyLocalPackagesResult> {
  return dependencies.packageCopier.copyLocalPackages({
    sourceRoot: request.sourceRoot,
    targetPath: request.targetPath,
    dbEngines: request.dbEngines,
    packageNames: request.packageNames,
    includeTests: request.includeTests,
  });
}
