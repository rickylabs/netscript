/**
 * Internal port for resolving scaffold import specifiers to registry targets.
 */
export interface JsrResolverPort {
  /** Resolve a package import key to a JSR or npm specifier. */
  resolveImport(specifier: string): string;

  /** Resolve many package import keys into an import-map fragment. */
  resolveImports(specifiers: readonly string[]): Record<string, string>;
}
