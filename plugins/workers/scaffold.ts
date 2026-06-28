/**
 * Workers plugin-owned scaffold CLI entrypoint.
 *
 * @module
 */

import { runScaffoldCli } from '@netscript/plugin/scaffold';

import { scaffold } from './src/scaffold/mod.ts';

export { scaffold } from './src/scaffold/mod.ts';

if (import.meta.main) {
  await runScaffoldCli(scaffold);
}
