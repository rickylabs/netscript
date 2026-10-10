import type { PluginCompositionDiagnostic } from '../../domain/mod.ts';
import type { PluginContributions } from './plugin-contributions.ts';
import type { PluginManifest } from './plugin-manifest.ts';

/** Root plugin composition that passed `validatePluginComposition`. */
export interface PluginComposition {
  /** Composed plugin manifests, in input order. */
  readonly plugins: readonly PluginManifest[];
  /**
   * Collection axes merged across every plugin.
   *
   * Single-valued axes (`aspire`, `doctor`) are plugin-owned module paths and are not merged; read
   * them from each entry of `plugins`.
   */
  readonly contributions: PluginContributions;
}

/** Result of validating a root plugin composition. */
export type PluginCompositionResult =
  | {
    /** The composition is valid. */
    readonly ok: true;
    /** The validated composition. */
    readonly composition: PluginComposition;
  }
  | {
    /** The composition is invalid. */
    readonly ok: false;
    /** Every failure found, in manifest order. */
    readonly diagnostics: readonly PluginCompositionDiagnostic[];
  };
