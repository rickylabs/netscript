#!/usr/bin/env -S deno run --allow-all
/**
 * Binary entry for the NetScript CLI E2E validation suite.
 *
 * @module
 */

import { createCliProgram } from './src/presentation/cli/cli-program.ts';
import { createDefaultRunner } from './src/create-default-runner.ts';

if (import.meta.main) {
  await createCliProgram(createDefaultRunner).parse(Deno.args);
}
