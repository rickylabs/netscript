/** Sagas plugin adapter CLI entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { sagasAdapterPlugin } from './src/adapter/plugin.ts';

/** Sagas adapter CLI entrypoint. */
const cli: PluginCliEntrypoint = createPluginAdapter(sagasAdapterPlugin).toCli();

export default cli;
