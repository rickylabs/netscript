/**
 * @module @netscript/plugin-streams/scaffolding
 *
 * Minimal scaffolding metadata for the streams plugin.
 */

/** Scaffolding descriptor for the streams plugin package. */
export interface StreamsScaffolder {
  /** Plugin package name. */
  readonly pluginName: '@netscript/plugin-streams';
  /** Files that a package-level scaffold should create. */
  readonly files: readonly string[];
  /** Whether item templates are intentionally omitted. */
  readonly itemTemplates: false;
}

/** Minimal scaffolder descriptor for streams plugin packages. */
export const streamsScaffolder: StreamsScaffolder = {
  pluginName: '@netscript/plugin-streams',
  files: [
    'mod.ts',
    'src/public/mod.ts',
    'src/cli/composition/main.ts',
    'src/aspire/mod.ts',
    'src/e2e/mod.ts',
  ],
  itemTemplates: false,
};
