#!/usr/bin/env -S deno run --allow-all
import { dirname, fromFileUrl, resolve } from '@std/path';
import { createLocalContributorCli } from '../src/local/composition/create-local-contributor-cli.ts';
import { formatError } from '../src/kernel/domain/errors.ts';
import { CliExitError } from '../src/kernel/domain/errors/cli-exit-error.ts';
import { outputError } from '../src/kernel/presentation/output/default-output.ts';

if (import.meta.main) {
  try {
    const sourceRoot = resolve(dirname(fromFileUrl(import.meta.url)), '../../..');
    await createLocalContributorCli({
      cwd: () => Deno.cwd(),
      sourceRoot: () => sourceRoot,
      resolvePath: (path) => resolve(Deno.cwd(), path ?? '.'),
    }).parse(Deno.args);
  } catch (error) {
    const message = error instanceof CliExitError ? error.message : formatError(error);
    outputError(`Error: ${message}`);
    if (error instanceof CliExitError) {
      for (const [key, value] of Object.entries(error.context ?? {})) {
        outputError(`  ${key}: ${value}`);
      }
    }
    Deno.exit(error instanceof CliExitError ? error.exitCode : 1);
  }
}
