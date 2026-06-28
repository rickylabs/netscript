/**
 * Triggers plugin-owned scaffold CLI entrypoint.
 *
 * This is the published `./scaffold` target the CLI installer invokes over the `--context-json`
 * argv contract. It re-exports the composed {@linkcode scaffold} entrypoint and, when run as the
 * main module, drives it through the shared {@linkcode runScaffoldCli} runner.
 *
 * @module
 */

import { runScaffoldCli } from '@netscript/plugin/scaffold';
import { scaffold } from './src/scaffold/mod.ts';

export { scaffold } from './src/scaffold/mod.ts';

if (import.meta.main) {
  await runScaffoldCli({ entrypoint: scaffold });
}
