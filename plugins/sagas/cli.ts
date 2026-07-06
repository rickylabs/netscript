/** Sagas plugin adapter CLI entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { sagasAdapterPlugin } from './src/adapter/plugin.ts';

export type {
  PluginCliArgs,
  PluginCliEntrypoint,
  PluginCliResult,
} from '@netscript/plugin/adapter';

/** Sagas adapter CLI entrypoint. */
const cli: PluginCliEntrypoint = createPluginAdapter(sagasAdapterPlugin).toCli();

export default cli;
