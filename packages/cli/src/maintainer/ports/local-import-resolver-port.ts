/** Maintainer-only resolver for local monorepo import-map specifiers. */
export interface LocalImportResolverPort {
  /** Resolve a package import key using a local monorepo base path. */
  resolveImport(specifier: string, localBase?: string): string;

  /** Resolve many package import keys using a local monorepo base path. */
  resolveImports(
    specifiers: readonly string[],
    localBase?: string,
  ): Record<string, string>;

  /** Resolve all known local package and external dependency imports. */
  resolveAllImports(localBase?: string): Record<string, string>;
}
