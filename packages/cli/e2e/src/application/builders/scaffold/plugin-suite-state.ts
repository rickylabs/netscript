import type { PluginKind } from '../../../domain/extension-axes.ts';

/** Official plugin suite options. */
export interface PluginSuiteState {
  plugins: PluginKind[];
  samples: boolean;
}
