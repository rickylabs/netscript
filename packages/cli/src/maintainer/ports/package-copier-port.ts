/** Options for copying monorepo packages into a maintainer scaffold. */
export interface CopyLocalPackagesOptions {
  /** Absolute path to the monorepo root. */
  readonly sourceRoot: string;
  /** Absolute path to the scaffold target root. */
  readonly targetPath: string;
  /** Database engines selected for engine-specific package copies. */
  readonly dbEngines?: readonly string[];
  /** Explicit package names to copy. Defaults to the scaffold package set. */
  readonly packageNames?: readonly string[];
  /** Whether package test files should be copied. Defaults to false for scaffolds. */
  readonly includeTests?: boolean;
}

/** Result returned after local monorepo packages are copied. */
export interface CopyLocalPackagesResult {
  /** Directories created, in stable order. */
  readonly directoriesCreated: readonly string[];
  /** Files created, in stable order. */
  readonly filesCreated: readonly string[];
  /** Count of packages copied. */
  readonly packagesCopied: number;
}

/** Port for maintainer-only local package copy operations. */
export interface PackageCopierPort {
  /** Copy selected local packages into a scaffold target. */
  copyLocalPackages(
    options: CopyLocalPackagesOptions,
  ): Promise<CopyLocalPackagesResult>;
}
