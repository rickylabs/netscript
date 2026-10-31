/** A context-checked, versioned source edit; user code is never evaluated. */
export interface VariantSourceEdit {
  readonly before: string;
  readonly after: string;
}

/** One shipped 0.0.8 component's structural migration. */
export interface VariantFileMigration {
  readonly file: string;
  readonly edits: readonly VariantSourceEdit[];
}

/** Pure per-file migration result, before any filesystem mutation. */
export interface VariantMigrationResult {
  readonly content: string;
  readonly diagnostics: readonly string[];
}

/** A proposed app-owned file change. */
export interface VariantFileChange {
  readonly path: string;
  readonly before: string;
  readonly after: string;
}

/** Result of a whole-app preflight or application. */
export interface VariantMigrationReport {
  readonly changed: readonly string[];
  readonly dryRun: boolean;
}
