import type { ValidatedInitOptions } from '../../../domain/scaffold/scaffold-options.ts';
import type { InitResult } from '../../../domain/scaffold/workspace-config.ts';
import type { JsonObject, JsonValue } from '../../../domain/core-types.ts';
import { initNextSteps } from '../../scaffold/init-orchestrator.ts';

/** Stable JSON shape emitted by `netscript init --json`. */
export interface InitJsonOutput extends JsonObject {
  readonly command: 'init';
  readonly project: JsonObject;
  readonly totals: JsonObject;
  readonly phases: readonly JsonObject[];
  readonly plugins: readonly string[];
  readonly aspire: JsonObject;
  readonly nextSteps: readonly string[];
}

/** Render an init result as a machine-readable JSON object. */
export function renderInitJson(
  result: InitResult,
  options: ValidatedInitOptions,
): InitJsonOutput {
  return {
    command: 'init',
    project: {
      name: result.name,
      appName: options.appName,
      targetPath: result.targetPath,
      dryRun: result.dryRun,
      importMode: options.importMode,
      database: options.dbEngine,
    },
    totals: {
      filesCreated: result.totalFilesCreated,
      directoriesCreated: result.totalDirectoriesCreated,
      durationMs: Math.round(result.durationMs),
    },
    phases: result.phases.map((phase): JsonObject => ({
      filesCreated: phase.filesCreated.length,
      directoriesCreated: phase.directoriesCreated.length,
      filesSkipped: phase.filesSkipped.length,
      totalOperations: phase.totalOperations,
    })),
    plugins: [],
    aspire: {
      enabled: !options.noAspire,
      resourceCount: aspireResourceCount(options),
    },
    nextSteps: initNextSteps(options),
  };
}

function aspireResourceCount(options: ValidatedInitOptions): JsonValue {
  if (options.noAspire) return 0;
  let count = 1;
  if (options.dbEngine !== 'none') count += 1;
  if (options.includeExampleService) count += 1;
  return count;
}
