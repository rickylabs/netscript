/** Sagas plugin adapter scaffold entrypoint.
 *
 * @module
 */

import {
  createPluginAdapter,
  type PluginScaffoldEntrypoint,
  runPluginScaffoldCli,
} from '@netscript/plugin/adapter';
import { sagasAdapterPlugin } from './src/adapter/plugin.ts';

/** Sagas adapter scaffold entrypoint. */
const scaffold: PluginScaffoldEntrypoint = createPluginAdapter(sagasAdapterPlugin).toScaffold();

export default scaffold;

if (import.meta.main) {
  await runPluginScaffoldCli(scaffold);
}
