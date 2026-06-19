import { outputText } from '../../presentation/output/default-output.ts';
import {
  printBanner,
  printCompletionSuccess,
  printDryRun,
  printNextSteps,
  printStep,
} from '../../adapters/loggers/console-logger.ts';
import type { InitOptions, ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { InitResult } from '../../domain/scaffold/workspace-config.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { InitPipelineContext } from './context.ts';
import { validateOptions } from './validate-init.ts';
import { runInitPipeline } from './init-pipeline.ts';
import { renderInitJson } from '../output/renderers/init-json-renderer.ts';

/** Execute the public init use case. */
export async function executeInit(
  context: InitPipelineContext,
  options: InitOptions,
): Promise<InitResult> {
  const start = performance.now();
  const validated = await validateOptions(context, options);
  const json = options.json === true;

  if (!json) {
    printBanner('NetScript — Scaffold New Project');
    printStep('📁', `Creating project "${validated.name}"...`);
  }

  const phases = await runInitPipeline(context, validated, { quiet: json });
  const durationMs = performance.now() - start;
  const result = createInitResult(phases, durationMs, validated);

  if (json) {
    outputText(JSON.stringify(renderInitJson(result, validated)));
  } else {
    printSummary(phases, durationMs, validated);
  }

  return result;
}

function createInitResult(phases: readonly ScaffoldResult[], durationMs: number, validated: ValidatedInitOptions): InitResult {
  return {
    name: validated.name,
    targetPath: validated.targetPath,
    phases,
    dryRun: validated.dryRun,
    durationMs,
    totalFilesCreated: phases.reduce((sum, phase) => sum + phase.filesCreated.length, 0),
    totalDirectoriesCreated: phases.reduce(
      (sum, phase) => sum + phase.directoriesCreated.length,
      0,
    ),
  };
}

export function printSummary(
  phases: readonly ScaffoldResult[],
  durationMs: number,
  options: ValidatedInitOptions,
): void {
  const totalFiles = phases.reduce((sum, p) => sum + p.filesCreated.length, 0);
  const totalDirs = phases.reduce((sum, p) => sum + p.directoriesCreated.length, 0);
  const duration = (durationMs / 1000).toFixed(1);

  if (options.dryRun) {
    printDryRun(`Would create ${totalFiles} files, ${totalDirs} directories`);
    outputText('');
    outputText('  No files were written. Remove --dry-run to execute.');
    return;
  }

  printCompletionSuccess(`Project scaffolded successfully in ${duration}s`);
  outputText('');
  outputText(`  Created: ${totalFiles} files, ${totalDirs} directories`);

  printNextSteps(initNextSteps(options));
}
function addDatabaseSteps(steps: string[], dbCommand: string): void {
  steps.push(`${dbCommand} init --name init`);
  steps.push(`${dbCommand} generate`);
  steps.push(`${dbCommand} seed`);
}

function databaseEnvVar(dbEngine: ValidatedInitOptions['dbEngine']): string {
  if (dbEngine === 'postgres') return 'POSTGRES_URI';
  if (dbEngine === 'mysql') return 'MYSQL_URI';
  if (dbEngine === 'mssql') return 'MSSQL_URI';
  return 'DATABASE_URL';
}

export function initNextSteps(options: ValidatedInitOptions): string[] {
  const steps: string[] = [`cd ${options.name}`];
  const dbCommand = options.importMode === 'local'
    ? 'deno run -A packages/cli/bin/netscript-dev.ts db'
    : 'netscript db';

  if (!options.noAspire && options.legacyAspire) {
    if (options.dbEngine !== 'none') addDatabaseSteps(steps, dbCommand);
    steps.push('dotnet run --project dotnet/AppHost  # start C# Aspire orchestration');
  } else if (!options.noAspire) {
    steps.push('cd aspire  # TS AppHost lives here, isolated from the Deno workspace');
    steps.push('aspire restore  # download TypeScript AppHost SDK modules (run once)');
    if (options.dbEngine !== 'none') {
      steps.push('cd ..');
      addDatabaseSteps(steps, dbCommand);
      steps.push('cd aspire');
    }
    steps.push('aspire run  # start TypeScript AppHost');
  } else {
    if (options.dbEngine !== 'none') {
      steps.push(`${dbCommand} generate  # generate database client after configuring DATABASE_URL`);
      steps.push(`${dbCommand} seed  # seed after the generated client exists`);
    }
    steps.push(`deno task --cwd apps/${options.appName} dev  # start Fresh dev server`);
  }
  if (options.includeExampleService && options.serviceName) {
    steps.push(`# oRPC service "${options.serviceName}" at http://localhost:${options.servicePort}/rpc`);
  }
  if (options.dbEngine !== 'none') {
    const engineLabel = options.dbEngine.charAt(0).toUpperCase() + options.dbEngine.slice(1);
    if (options.noAspire) {
      const envVar = databaseEnvVar(options.dbEngine);
      steps.push(`# Provision ${engineLabel} yourself and set ${envVar} or DATABASE_URL`);
    } else {
      steps.push(`# ${engineLabel} provisioned by Aspire (see "Databases" in appsettings.json)`);
    }
  }
  return steps;
}
