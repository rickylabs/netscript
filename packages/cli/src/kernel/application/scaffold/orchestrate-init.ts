import { outputText } from '../../presentation/output/default-output.ts';
import { ScaffoldError, ScaffoldGitError } from '../../domain/errors.ts';
import {
  printBanner,
  printCompletionSuccess,
  printDryRun,
  printFailure,
  printNextSteps,
  printStep,
  printSuccess,
} from '../../adapters/loggers/console-logger.ts';
import type { InitOptions, ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { InitResult } from '../../domain/scaffold/workspace-config.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { InitPipelineContext } from './context.ts';
import { validateOptions } from './validate-init.ts';
import { scaffoldPackagesLocal, scaffoldRoot } from './plan-init.ts';
import {
  scaffoldContracts,
  scaffoldDatabase,
  scaffoldPlugins,
  scaffoldServices,
} from './workspace-init.ts';
import { scaffoldAspire } from './render-init.ts';
import { scaffoldApp } from './writers/write-init.ts';
import { formatOutput } from './post-scripts-init.ts';
import { gitInit } from './git-init.ts';

export async function executeInit(
  context: InitPipelineContext,
  options: InitOptions,
): Promise<InitResult> {
  const start = performance.now();
  const validated = await validateOptions(context, options);

  // Show banner
  printBanner('NetScript — Scaffold New Project');
  printStep('📁', `Creating project "${validated.name}"...`);

  // Execute phases, collecting results
  const phases: ScaffoldResult[] = [];

  try {
    phases.push(await scaffoldRoot(context, validated));
    printSuccess(
      'Project root (deno.json, netscript.config.ts, .gitignore, README.md)',
    );

    phases.push(await scaffoldPackagesLocal(context, validated));

    phases.push(await scaffoldAspire(context, validated));
    if (!validated.noAspire && validated.legacyAspire) {
      printSuccess('Aspire orchestration (C# AppHost, ServiceDefaults, configs)');
    } else if (!validated.noAspire) {
      printSuccess('Aspire orchestration (TypeScript AppHost, .helpers/, package.json)');
    }

    phases.push(await scaffoldDatabase(context, validated));
    if (validated.dbEngine !== 'none') {
      printSuccess(`Database workspace (${validated.dbEngine})`);
    }

    phases.push(await scaffoldApp(context, validated));
    printSuccess(
      `Frontend app "${validated.appName}" (Fresh framework)`,
    );

    phases.push(await scaffoldContracts(context, validated));
    if (validated.includeExampleService && validated.serviceName) {
      printSuccess(`Contracts (v1 with ${validated.serviceName} stub)`);
    } else {
      printSuccess('Contracts (v1 stub)');
    }

    phases.push(await scaffoldServices(context, validated));
    if (validated.includeExampleService && validated.serviceName) {
      printSuccess(
        `Example service "${validated.serviceName}" (oRPC handler on port ${validated.servicePort})`,
      );
    }

    phases.push(await scaffoldPlugins(context, validated));
    printSuccess('Plugins (empty registry)');

    // Format all generated files with `deno fmt` so that line endings,
    // indentation, and quote style are normalised by the official formatter
    // rather than being patched manually in generators or the scaffolder.
    if (!validated.dryRun) {
      await formatOutput(context, validated.targetPath, phases);
      printSuccess('Output formatted (deno fmt)');
    }

    if (!validated.noGit && !validated.dryRun) {
      await gitInit(context, validated.targetPath);
      printSuccess('Git repository initialized');
    }
  } catch (error: unknown) {
    if (
      error instanceof ScaffoldError ||
      error instanceof ScaffoldGitError
    ) {
      printFailure(error.message);
      throw error;
    }
    const wrapped = error instanceof Error ? error : new Error(String(error));
    printFailure(wrapped.message);
    throw wrapped;
  }

  const durationMs = performance.now() - start;
  printSummary(phases, durationMs, validated);

  return {
    name: validated.name,
    targetPath: validated.targetPath,
    phases,
    dryRun: validated.dryRun,
    durationMs,
    totalFilesCreated: phases.reduce(
      (sum, p) => sum + p.filesCreated.length,
      0,
    ),
    totalDirectoriesCreated: phases.reduce(
      (sum, p) => sum + p.directoriesCreated.length,
      0,
    ),
  };
}

export function printSummary(
  phases: readonly ScaffoldResult[],
  durationMs: number,
  options: ValidatedInitOptions,
): void {
  const totalFiles = phases.reduce(
    (sum, p) => sum + p.filesCreated.length,
    0,
  );
  const totalDirs = phases.reduce(
    (sum, p) => sum + p.directoriesCreated.length,
    0,
  );
  const duration = (durationMs / 1000).toFixed(1);

  if (options.dryRun) {
    printDryRun(
      `Would create ${totalFiles} files, ${totalDirs} directories`,
    );
    outputText('');
    outputText('  No files were written. Remove --dry-run to execute.');
    return;
  }

  printCompletionSuccess(
    `Project scaffolded successfully in ${duration}s`,
  );
  outputText('');
  outputText(`  Created: ${totalFiles} files, ${totalDirs} directories`);

  printNextSteps(initNextSteps(options));
}

/** Build the post-init commands shown to scaffold users. */
export function initNextSteps(options: ValidatedInitOptions): string[] {
  const steps: string[] = [`cd ${options.name}`];
  const dbCommand = options.importMode === 'local'
    ? 'deno run -A packages/cli/bin/netscript-dev.ts db'
    : 'netscript db';

  if (!options.noAspire && options.legacyAspire) {
    if (options.dbEngine !== 'none') {
      steps.push(`${dbCommand} init --name init`);
      steps.push(`${dbCommand} generate`);
      steps.push(`${dbCommand} seed`);
    }
    steps.push('dotnet run --project dotnet/AppHost  # start C# Aspire orchestration');
  } else if (!options.noAspire) {
    steps.push('cd aspire  # TS AppHost lives here, isolated from the Deno workspace');
    steps.push('aspire restore  # download TypeScript AppHost SDK modules (run once)');
    if (options.dbEngine !== 'none') {
      steps.push('cd ..');
      steps.push(`${dbCommand} init --name init`);
      steps.push(`${dbCommand} generate`);
      steps.push(`${dbCommand} seed`);
      steps.push('cd aspire');
    }
    steps.push('aspire run  # start TypeScript AppHost');
  } else {
    if (options.dbEngine !== 'none') {
      steps.push(
        `${dbCommand} generate  # generate database client after configuring DATABASE_URL`,
      );
      steps.push(`${dbCommand} seed  # seed after the generated client exists`);
    }
    steps.push(`deno task --cwd apps/${options.appName} dev  # start Fresh dev server`);
  }
  if (options.includeExampleService && options.serviceName) {
    steps.push(
      `# oRPC service "${options.serviceName}" at http://localhost:${options.servicePort}/rpc`,
    );
  }
  if (options.dbEngine !== 'none') {
    const engineLabel = options.dbEngine.charAt(0).toUpperCase() + options.dbEngine.slice(1);
    steps.push(
      `# ${engineLabel} provisioned by Aspire (see "Databases" in appsettings.json)`,
    );
  }
  return steps;
}
