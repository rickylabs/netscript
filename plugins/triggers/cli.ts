/** Triggers plugin adapter CLI entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { triggersAdapterPlugin } from './src/adapter/plugin.ts';

export type {
  PluginCliArgs,
  PluginCliEntrypoint,
  PluginCliResult,
} from '@netscript/plugin/adapter';

/** Triggers adapter CLI entrypoint. */
const cli: PluginCliEntrypoint = createPluginAdapter(triggersAdapterPlugin).toCli();

export default cli;
