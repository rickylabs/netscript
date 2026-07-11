import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { InitPipelineContext } from './context.ts';
import { scaffoldTsAppHost } from './render-ts-apphost.ts';

/** Scaffold the TypeScript Aspire AppHost unless orchestration is disabled. */
export async function scaffoldAspire(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  if (options.noAspire) {
    return {
      filesCreated: [],
      directoriesCreated: [],
      filesSkipped: [],
      totalOperations: 0,
      durationMs: 0,
    };
  }

  return await scaffoldTsAppHost(context, options);
}
