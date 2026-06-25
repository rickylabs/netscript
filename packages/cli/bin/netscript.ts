#!/usr/bin/env -S deno run --allow-all
import { outputError } from '../src/kernel/presentation/output/default-output.ts';
import { resolve } from '@std/path';
import { formatError } from '../src/kernel/domain/errors.ts';
import { CliExitError } from '../src/kernel/domain/errors/cli-exit-error.ts';
import { runPublicCli } from '../src/public/composition/run-public-cli.ts';

/**
 * Run the public NetScript CLI binary entry.
 */
export async function runNetscriptCli(args: readonly string[] = Deno.args): Promise<void> {
  try {
    await runPublicCli({
      args,
      cwd: () => Deno.cwd(),
      resolvePath: (path) => resolve(Deno.cwd(), path ?? '.'),
      error: outputError,
    });
  } catch (error) {
    if (!(error instanceof CliExitError)) {
      outputError(`Error: ${formatError(error)}`);
    }
    Deno.exit(error instanceof CliExitError ? error.exitCode : 1);
  }
}

if (import.meta.main) {
  await runNetscriptCli();
}
