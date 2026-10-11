import type {
  AspireAuthoredInput,
  AspireGeneratedOutput,
  AspireSurfaceDrift,
} from './aspire-generated-surface.ts';

/** Identity of the installed-plugin registry generation command. */
export const PLUGIN_SURFACE_GENERATOR = 'public.generate.plugins';
/** Wire version of the registry inventory and check report. */
export const PLUGIN_SURFACE_VERSION = 1;
/** An output identifies its specific installed plugin producer. */
export interface PluginGeneratedOutput extends Omit<AspireGeneratedOutput, 'generator'> {
  /** Command and installed package that rendered this registry. */
  readonly generator: string;
}
/** Authored selection authority or selected project source. */
export interface PluginAuthoredInput extends Omit<AspireAuthoredInput, 'generator'> {
  /** Command reading the authority. */
  readonly generator: typeof PLUGIN_SURFACE_GENERATOR;
}
/** Versioned, fail-closed plugin registry parity report. */
export interface PluginSurfaceReport {
  /** Report wire version. */
  readonly version: typeof PLUGIN_SURFACE_VERSION;
  /** Command owning this inspection. */
  readonly generator: typeof PLUGIN_SURFACE_GENERATOR;
  /** Every selected registry output, with expected canonical byte digest. */
  readonly outputs: readonly PluginGeneratedOutput[];
  /** Authored authorities and generator-selected source files. */
  readonly inputs: readonly PluginAuthoredInput[];
  /** Whether bytes and ownership are current, drifted, or uncertifiable. */
  readonly status: 'current' | 'drift' | 'inspection-failure';
  /** Process verdict. */
  readonly exitCode: 0 | 1;
  /** Missing, extra, ownership, byte, or inspection findings. */
  readonly drift: readonly AspireSurfaceDrift[];
}
/** One generator-owned rendered registry before canonical formatting. */
export interface RenderedPluginRegistry {
  /** Declared project-relative registry output path. */
  readonly path: string;
  /** Installed plugin package owning this output. */
  readonly plugin: string;
  /** Shared selector evidence, also reported as authored inputs. */
  readonly sourceFiles: readonly string[];
  /** Rendered bytes, or null when normal generation skips an empty target. */
  readonly content: string | null;
}
/** Byte rendering is distinct from any project write operation. */
export type RenderPluginRegistries = (
  projectRoot: string,
) => Promise<readonly RenderedPluginRegistry[]>;
