import {
  GENERATED_SURFACE_VERSION,
  type GeneratedSurfaceDrift,
  type GeneratedSurfaceInput,
  type GeneratedSurfaceOutput,
} from './generated-surface.ts';

/** Identity of the installed-plugin registry generation command. */
export const PLUGIN_SURFACE_GENERATOR = 'public.generate.plugins';
/** Wire version of the registry inventory and check report. */
export const PLUGIN_SURFACE_VERSION = GENERATED_SURFACE_VERSION;
/** An output identifies its specific installed plugin producer. */
export type PluginGeneratedOutput = GeneratedSurfaceOutput;
/** Authored selection authority or selected project source. */
export type PluginAuthoredInput = GeneratedSurfaceInput<typeof PLUGIN_SURFACE_GENERATOR>;
/** Installed producer, including immutable published versions with no registry manifest. */
export interface PluginSurfaceProducer {
  /** Command and installed package identity. */
  readonly generator: string;
  /** Installed package version declaration. */
  readonly version: string;
  /** Paths selected for generation; empty producers remain visible. */
  readonly outputs: readonly string[];
}
/** Rendered selection and its complete producer inventory. */
export interface RenderedPluginSurface {
  /** Every installed producer. */
  readonly producers: readonly PluginSurfaceProducer[];
  /** Rendered target bytes. */
  readonly registries: readonly RenderedPluginRegistry[];
}
/** Versioned, fail-closed plugin registry parity report. */
export interface PluginSurfaceReport {
  /** Report wire version. */
  readonly version: typeof PLUGIN_SURFACE_VERSION;
  /** Command owning this inspection. */
  readonly generator: typeof PLUGIN_SURFACE_GENERATOR;
  /** Every selected installed producer, including zero-output producers. */
  readonly producers: readonly PluginSurfaceProducer[];
  /** Every selected registry output, with expected canonical byte digest. */
  readonly outputs: readonly PluginGeneratedOutput[];
  /** Authored authorities and generator-selected source files. */
  readonly inputs: readonly PluginAuthoredInput[];
  /** Whether bytes and ownership are current, drifted, or uncertifiable. */
  readonly status: 'current' | 'drift' | 'inspection-failure';
  /** Process verdict. */
  readonly exitCode: 0 | 1;
  /** Missing, extra, ownership, byte, or inspection findings. */
  readonly drift: readonly GeneratedSurfaceDrift[];
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
) => Promise<RenderedPluginSurface>;
