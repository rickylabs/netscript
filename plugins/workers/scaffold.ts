/** Workers plugin adapter scaffold entrypoint.
 *
 * @module
 */

import {
  createPluginAdapter,
  type PluginScaffoldEntrypoint,
  runPluginScaffoldCli,
} from '@netscript/plugin/adapter';
import { workersAdapterPlugin } from './src/adapter/plugin.ts';

/** Workers adapter scaffold entrypoint. */
const scaffold: PluginScaffoldEntrypoint = createPluginAdapter(workersAdapterPlugin).toScaffold();

export default scaffold;

if (import.meta.main) {
  await runPluginScaffoldCli(scaffold);
}
