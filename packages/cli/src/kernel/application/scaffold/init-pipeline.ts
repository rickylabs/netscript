import {
  printFailure,
  printSuccess,
} from '../../adapters/loggers/console-logger.ts';
import { ScaffoldError, ScaffoldGitError } from '../../domain/errors.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { InitPipelineContext } from './context.ts';
import { scaffoldRoot, scaffoldPackagesLocal } from './plan-init.ts';
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

/** Options for the init pipeline renderer side effects. */
export interface InitPipelineRunOptions {
  /** Whether human-readable progress should be suppressed. */
  readonly quiet?: boolean;
}

function human(quiet: boolean | undefined, message: string): void {
  if (!quiet) printSuccess(message);
}

/** Execute the ordered scaffold init phases. */
export async function runInitPipeline(
  context: InitPipelineContext,
  validated: ValidatedInitOptions,
  options: InitPipelineRunOptions = {},
): Promise<readonly ScaffoldResult[]> {
  const phases: ScaffoldResult[] = [];

  try {
    phases.push(await scaffoldRoot(context, validated));
    human(
      options.quiet,
      'Project root (deno.json, netscript.config.ts, .gitignore, README.md)',
    );

    phases.push(await scaffoldPackagesLocal(context, validated));

    phases.push(await scaffoldAspire(context, validated));
    if (!validated.noAspire && validated.legacyAspire) {
      human(options.quiet, 'Aspire orchestration (C# AppHost, ServiceDefaults, configs)');
    } else if (!validated.noAspire) {
      human(options.quiet, 'Aspire orchestration (TypeScript AppHost, .helpers/, package.json)');
    }

    phases.push(await scaffoldDatabase(context, validated));
    if (validated.dbEngine !== 'none') human(options.quiet, `Database workspace (${validated.dbEngine})`);

    phases.push(await scaffoldApp(context, validated));
    human(options.quiet, `Frontend app "${validated.appName}" (Fresh framework)`);

    phases.push(await scaffoldContracts(context, validated));
    if (validated.includeExampleService && validated.serviceName) {
      human(options.quiet, `Contracts (v1 with ${validated.serviceName} stub)`);
    } else {
      human(options.quiet, 'Contracts (v1 stub)');
    }

    phases.push(await scaffoldServices(context, validated));
    if (validated.includeExampleService && validated.serviceName) {
      human(
        options.quiet,
        `Example service "${validated.serviceName}" (oRPC handler on port ${validated.servicePort})`,
      );
    }

    phases.push(await scaffoldPlugins(context, validated));
    human(options.quiet, 'Plugins (empty registry)');

    if (!validated.dryRun) {
      await formatOutput(context, validated.targetPath, phases);
      human(options.quiet, 'Output formatted (deno fmt)');
    }

    if (!validated.noGit && !validated.dryRun) {
      await gitInit(context, validated.targetPath);
      human(options.quiet, 'Git repository initialized');
    }
  } catch (error: unknown) {
    if (!options.quiet) {
      const message = error instanceof Error ? error.message : String(error);
      printFailure(message);
    }
    if (error instanceof ScaffoldError || error instanceof ScaffoldGitError) throw error;
    throw error instanceof Error ? error : new Error(String(error));
  }

  return phases;
}
