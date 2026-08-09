import { deriveDefaultAppName } from '../../../../../src/kernel/domain/scaffold/app-name.ts';
import type { RunContext } from '../../../domain/run-context.ts';

/** Resolve the generated Fresh app name from the same rule used by public init. */
export function generatedAppName(context: RunContext): string {
  return deriveDefaultAppName(context.request.options.projectName);
}
