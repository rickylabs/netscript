/**
 * Stable code identifying why a root plugin composition is invalid.
 *
 * - `duplicate-plugin`: two manifests share a `name`.
 * - `unknown-contribution-key`: a manifest declares a contribution key the manifest model does not define.
 * - `invalid-contribution`: a known contribution axis holds a value of the wrong shape.
 * - `duplicate-contribution`: one contribution identity is declared twice, within a plugin or across
 *   plugins on a root-owned axis.
 * - `missing-dependency`: a declared dependency is not in the composition.
 * - `dependency-version-mismatch`: the composed dependency version does not satisfy the declared range.
 * - `invalid-version`: a plugin version or dependency range is not valid semver.
 */
export type PluginCompositionDiagnosticCode =
  | 'duplicate-plugin'
  | 'unknown-contribution-key'
  | 'invalid-contribution'
  | 'duplicate-contribution'
  | 'missing-dependency'
  | 'dependency-version-mismatch'
  | 'invalid-version';

/** Structured diagnostic describing one plugin composition failure. */
export interface PluginCompositionDiagnostic {
  /** Stable failure code. */
  readonly code: PluginCompositionDiagnosticCode;
  /** Name of the plugin manifest that carries the failing declaration. */
  readonly plugin: string;
  /** Human-readable explanation naming the plugin, axis, and identity involved. */
  readonly message: string;
  /** Contribution key involved, when the failure concerns a contribution. */
  readonly axis?: string;
  /** Contribution identity or dependency name involved. */
  readonly identity?: string;
  /** Plugin that already owns the conflicting identity, for duplicates. */
  readonly conflictsWith?: string;
}
