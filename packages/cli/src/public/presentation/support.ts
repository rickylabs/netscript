import { outputText } from '../../kernel/presentation/output/default-output.ts';
import { ScaffoldValidationError } from '../../kernel/domain/errors.ts';
import type { UiAppRootInput } from '../../kernel/application/ui/resolve-ui-app-root.ts';

/** Resolves a command project root without binding presentation to host APIs. */
export type ProjectRootResolver = (projectRoot?: string) => Promise<string | undefined>;

/** Resolves a UI command to an explicit or inferred Fresh application root. */
export type UiAppRootResolver = (input: UiAppRootInput) => Promise<string | undefined>;

/** Resolves a display-safe default project name for `init`. */
export type ProjectNameResolver = () => string;

/** Resolve or fail when a command needs a project root. */
export async function requireProjectRoot(
  resolveProjectRoot: ProjectRootResolver,
  projectRoot?: string,
): Promise<string> {
  const resolved = await resolveProjectRoot(projectRoot);
  if (!resolved) {
    throw new ScaffoldValidationError(
      'Could not find a NetScript project root from the current directory.',
    );
  }
  return resolved;
}

/** Resolve or fail when a UI command needs a Fresh application root. */
export async function requireUiAppRoot(
  resolveUiAppRoot: UiAppRootResolver,
  input: UiAppRootInput,
): Promise<string> {
  const resolved = await resolveUiAppRoot(input);
  if (!resolved) {
    throw new ScaffoldValidationError(
      'Could not find a NetScript workspace root from the current directory.',
    );
  }
  return resolved;
}

/** Parse a comma-separated list flag into trimmed values. */
export function parseList(raw: string | undefined): readonly string[] {
  return raw ? raw.split(',').map((value) => value.trim()).filter(Boolean) : [];
}

/** Require a named string option. */
export function requireString(name: string, value: string | undefined): string {
  if (!value) {
    throw new ScaffoldValidationError(`Missing required option: ${name}`);
  }
  return value;
}

/** Print one line for each item in a list. */
export function printLines(lines: readonly string[]): void {
  for (const line of lines) outputText(line);
}
