/** AI plugin adapter scaffold entrypoint.
 *
 * @module
 */

import {
  createPluginAdapter,
  type PluginScaffoldEntrypoint,
  runPluginScaffoldCli,
} from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from './src/adapter/plugin.ts';
import { mcpToolScaffolder } from './src/adapter/resources/mod.ts';

export type {
  PluginLogger,
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '@netscript/plugin/adapter';

/** AI adapter scaffold entrypoint. */
const defaultScaffold = createPluginAdapter(aiAdapterPlugin).toScaffold();

/** AI adapter scaffold entrypoint with the opt-in MCP resource. */
const scaffold: PluginScaffoldEntrypoint = (context) => {
  const mcpResources = mcpToolScaffolder.emit({ enabled: context.options.mcp === true });
  if (mcpResources.length === 0) return defaultScaffold(context);
  return createPluginAdapter({
    ...aiAdapterPlugin,
    install: {
      ...aiAdapterPlugin.install,
      starterResources: [
        ...aiAdapterPlugin.install.starterResources,
        { scaffolder: mcpToolScaffolder, input: { enabled: true } },
      ],
    },
  }).toScaffold()(context);
};

export default scaffold;

if (import.meta.main) {
  await runPluginScaffoldCli(scaffold);
}
