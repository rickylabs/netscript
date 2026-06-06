import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { DEFAULT_DEPLOY_OUTPUT_DIR } from '../../../../kernel/constants/runtime.ts';
import { DeployStepCommand } from '../../../../kernel/presentation/abstracts/deploy-step-command.ts';
import { buildDeploy, type BuildDeployDependencies } from './build-deploy.ts';
import { parseList } from '../../../presentation/support.ts';

// deno-lint-ignore no-explicit-any
type AnyCliffyCommand = Command<any, any, any, any, any, any, any, any>;

/** Dependencies for the public `deploy build` command handler. */
export interface DeployBuildCommandDependencies {
  /** Application dependencies for deployment builds. */
  readonly buildDeployDependencies: BuildDeployDependencies;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Public `deploy build` command owner. */
export class BuildDeployCommand extends DeployStepCommand<AnyCliffyCommand> {
  readonly id = 'public.deploy.build';
  protected readonly phase = 'build';

  constructor(private readonly dependencies: DeployBuildCommandDependencies) {
    super();
  }

  define(): AnyCliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('build')
      .description('Compile services and generate deployment artifacts')
      .option('-o, --output-dir <dir:string>', 'Root output directory', {
        default: DEFAULT_DEPLOY_OUTPUT_DIR,
      })
      .option('--no-parallel', 'Compile services sequentially')
      .option('--max-concurrency <n:integer>', 'Maximum simultaneous compiles', { default: 4 })
      .option('--skip-compile', 'Skip binary compilation')
      .option('--no-cli', 'Skip building netscript-cli.exe')
      .option('--force-runtime-config', 'Overwrite runtime config override files')
      .option('--skip <services:string>', 'Comma-separated service names to exclude')
      .option('--no-env-file', 'Skip generating the .env file')
      .option('--include-tasks <paths:string>', 'Comma-separated extra task files or directories')
      .option('--exclude-tasks <names:string>', 'Comma-separated task file names to exclude')
      .option('--no-tasks', 'Skip copying task script files')
      .option('--ci', 'Non-interactive mode')
      .option('--fail-on-drift', 'Fail if remote runtime config is newer')
      .option('--keep-runtime <strategy:string>', 'Runtime conflict strategy: local or remote')
      .option('-v, --verbose', 'Print detailed build progress')
      .action(async (options): Promise<void> => {
        const keepRuntime = options.keepRuntime;
        if (keepRuntime !== undefined && keepRuntime !== 'local' && keepRuntime !== 'remote') {
          throw new Error(`--keep-runtime must be "local" or "remote", got "${keepRuntime}"`);
        }
        await buildDeploy({
          deployDir: options.outputDir,
          options: {
            parallel: options.parallel !== false,
            maxConcurrency: options.maxConcurrency,
            skipCompile: options.skipCompile ?? false,
            includeCli: options.cli !== false,
            forceRuntimeConfig: options.forceRuntimeConfig ?? false,
            skipServices: parseList(options.skip),
            generateEnvFile: options.envFile !== false ? undefined : false,
            copyTasks: options.tasks !== false,
            includeTasks: parseList(options.includeTasks),
            excludeTasks: parseList(options.excludeTasks),
            ci: options.ci ?? false,
            failOnDrift: options.failOnDrift ?? false,
            keepRuntime,
            verbose: options.verbose ?? false,
          },
        }, this.dependencies.buildDeployDependencies);
        print('Deployment artifacts generated.');
      });
  }
}

/** Create the public `deploy build` command. */
export function createDeployBuildCommand(
  dependencies: DeployBuildCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new BuildDeployCommand(dependencies).define();
}
