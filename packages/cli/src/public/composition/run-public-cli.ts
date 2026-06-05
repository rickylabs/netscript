import { formatError } from '../../kernel/domain/errors.ts';
import { CliExitError, RemoteError } from '../../kernel/domain/errors/cli-exit-error.ts';
import { createPublicCli, type PublicCliHost } from './create-public-cli.ts';

/** Runtime hooks supplied by the public CLI binary. */
export interface PublicCliRuntime extends PublicCliHost {
  /** Raw CLI arguments. */
  readonly args: readonly string[];

  /** Write an error line. */
  readonly error: (message: string) => void;
}

/** Run the public CLI with consistent error formatting. */
export async function runPublicCli(runtime: PublicCliRuntime): Promise<void> {
  try {
    await createPublicCli(runtime).parse([...runtime.args]);
  } catch (error) {
    const exitError = error instanceof CliExitError
      ? error
      : new RemoteError(1, formatError(error), { cause: error });
    runtime.error(`Error: ${exitError.message}`);
    for (const [key, value] of Object.entries(exitError.context ?? {})) {
      runtime.error(`  ${key}: ${value}`);
    }
    throw exitError;
  }
}
