/** Workers plugin adapter CLI entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { workersAdapterPlugin } from './src/adapter/plugin.ts';

export type {
  PluginCliArgs,
  PluginCliEntrypoint,
  PluginCliResult,
} from '@netscript/plugin/adapter';

/** Workers adapter CLI entrypoint. */
const cli: PluginCliEntrypoint = createPluginAdapter(workersAdapterPlugin).toCli();

export default cli;
