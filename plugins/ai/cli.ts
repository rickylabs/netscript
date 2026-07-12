/** AI plugin adapter CLI entrypoint.
 *
 * @module
 */

import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { parsePluginCliArgs } from '@netscript/plugin/cli';
import { aiAdapterPlugin } from './src/adapter/plugin.ts';

export type {
  PluginCliArgs,
  PluginCliEntrypoint,
  PluginCliResult,
} from '@netscript/plugin/adapter';

/** AI adapter CLI entrypoint. */
const cli: PluginCliEntrypoint = createPluginAdapter(aiAdapterPlugin).toCli();

if (import.meta.main) {
  const result = await cli(parsePluginCliArgs(Deno.args));
  console.log(JSON.stringify(result));
  if (result.code !== 0) Deno.exit(result.code);
}

export default cli;
