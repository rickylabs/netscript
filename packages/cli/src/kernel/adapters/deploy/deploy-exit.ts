import { RemoteError } from '../../domain/errors/cli-exit-error.ts';

/** Raise a typed deploy command failure for the binary edge to map to an exit code. */
export function failDeployCommand(
  message: string,
  options: {
    readonly cause?: unknown;
    readonly context?: Readonly<Record<string, unknown>>;
  } = {},
): never {
  throw new RemoteError(1, message, options);
}
