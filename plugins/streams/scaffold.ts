/**
 * Streams plugin-owned scaffold CLI entrypoint.
 *
 * @module
 */

export { scaffold } from './src/scaffold/mod.ts';
import { runScaffoldCli } from './src/scaffold/mod.ts';

if (import.meta.main) {
  await runScaffoldCli();
}
