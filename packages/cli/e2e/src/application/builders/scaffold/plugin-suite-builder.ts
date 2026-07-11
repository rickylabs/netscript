import type { PluginKind } from '../../../domain/extension-axes.ts';
import type { PluginSuiteState } from './plugin-suite-state.ts';

/** Builder for official plugin flow options. */
export interface PluginSuiteBuilder {
  withOfficial(kind: PluginKind): PluginSuiteBuilder;
  withSamples(enabled?: boolean): PluginSuiteBuilder;
  withAiMcp(enabled?: boolean): PluginSuiteBuilder;
  buildState(): PluginSuiteState;
}

/** Create an official plugin suite builder. */
export function createPluginSuiteBuilder(): PluginSuiteBuilder {
  const plugins: PluginKind[] = [];
  let samples = true;
  let aiMcp = true;
  return {
    withOfficial(kind) {
      plugins.push(kind);
      return this;
    },
    withSamples(enabled = true) {
      samples = enabled;
      return this;
    },
    withAiMcp(enabled = true) {
      aiMcp = enabled;
      return this;
    },
    buildState() {
      return { plugins: [...plugins], samples, aiMcp };
    },
  };
}
