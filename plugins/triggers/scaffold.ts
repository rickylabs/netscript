/** Triggers plugin adapter scaffold entrypoint.
 *
 * @module
 */

import {
  createPluginAdapter,
  type PluginScaffoldEntrypoint,
  runPluginScaffoldCli,
} from '@netscript/plugin/adapter';
import { triggersAdapterPlugin } from './src/adapter/plugin.ts';

/** Triggers adapter scaffold entrypoint. */
const scaffold: PluginScaffoldEntrypoint = createPluginAdapter(triggersAdapterPlugin).toScaffold();

export default scaffold;

if (import.meta.main) {
  await runPluginScaffoldCli(scaffold);
}
