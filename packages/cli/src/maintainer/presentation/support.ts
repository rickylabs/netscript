import { ScaffoldValidationError } from '../../kernel/domain/errors.ts';

/** Resolve a path from the current maintainer host environment. */
export type MaintainerPathResolver = (path?: string) => string;

/** Return the current working directory for maintainer commands. */
export type MaintainerCwd = () => string;

/** Print one maintainer command output line. */
export type MaintainerPrint = (message: string) => void;

/** Resolve a path-like option, defaulting to the current working directory. */
export function resolveOptionPath(
  resolvePath: MaintainerPathResolver,
  path?: string,
): string {
  return resolvePath(path ?? '.');
}

/** Require a named string option. */
export function requireString(name: string, value: string | undefined): string {
  if (!value) {
    throw new ScaffoldValidationError(`Missing required option: ${name}`);
  }
  return value;
}
