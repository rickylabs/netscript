import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { DATABASE, type DatabaseEngine, PLUGIN } from '../../../domain/extension-axes.ts';
import { createScaffoldCapabilityGates } from '../../gates/scaffold/scaffold-capability-gates.ts';
import { createPluginSuiteBuilder, type PluginSuiteBuilder } from './plugin-suite-builder.ts';

/** Fluent builder for scaffold concern suites. */
export interface ScaffoldSuiteBuilder {
  withOfficialPluginSuite(configure?: (builder: PluginSuiteBuilder) => PluginSuiteBuilder): this;
  buildGates(): GateDefinition[];
}

/** Create the scaffold suite builder. */
export function createScaffoldSuiteBuilder(
  database: DatabaseEngine = DATABASE.POSTGRES,
): ScaffoldSuiteBuilder {
  const gates: GateDefinition[] = [];
  return {
    withOfficialPluginSuite(configure) {
      const pluginBuilder = createPluginSuiteBuilder();
      configure?.(pluginBuilder);
      const state = pluginBuilder.buildState();
      const plugins = state.plugins.length > 0
        ? state.plugins
        : [
          PLUGIN.WORKER,
          PLUGIN.SAGA,
          PLUGIN.TRIGGER,
          PLUGIN.STREAM,
          PLUGIN.AUTH,
          PLUGIN.AI,
        ] as const;
      gates.push(...createScaffoldCapabilityGates({ ...state, plugins: [...plugins] }, database));
      return this;
    },
    buildGates() {
      return [...gates];
    },
  };
}
