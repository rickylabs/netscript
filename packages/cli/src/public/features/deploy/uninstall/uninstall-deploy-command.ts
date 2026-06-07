import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { DeployStepCommand } from '../../../../kernel/presentation/abstracts/deploy-step-command.ts';
import {
  uninstallServiceDeploy,
  type UninstallServiceDeployDependencies,
} from './uninstall-service-deploy.ts';

// deno-lint-ignore no-explicit-any
type AnyCliffyCommand = Command<any, any, any, any, any, any, any, any>;

/** Dependencies for the public `deploy uninstall` command handler. */
export interface DeployUninstallCommandDependencies {
  /** Application dependencies for uninstalling services. */
  readonly uninstallDeployDependencies: UninstallServiceDeployDependencies;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Public `deploy uninstall` command owner. */
export class UninstallDeployCommand extends DeployStepCommand<AnyCliffyCommand> {
  readonly id = 'public.deploy.uninstall';
  protected readonly phase = 'uninstall';

  constructor(private readonly dependencies: DeployUninstallCommandDependencies) {
    super();
  }

  define(): AnyCliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('uninstall')
      .description('Stop and remove services from the Windows service manager')
      .arguments('[service:string]')
      .option('--install-dir <dir:string>', 'Installation directory')
      .option('--deploy-dir <dir:string>', 'Source deployment artifacts directory')
      .option('--no-stop', 'Do not stop services before uninstalling')
      .action(async (options, service?: string): Promise<void> => {
        const result = await uninstallServiceDeploy({
          installDir: options.installDir,
          deployDir: options.deployDir,
          service,
          stopFirst: options.stop !== false,
        }, this.dependencies.uninstallDeployDependencies);

        print(`Uninstalled ${result.uninstalled.length} service(s).`);
        if (result.failed.length > 0) print(`Failed ${result.failed.length} service(s).`);
      });
  }
}

/** Create the public `deploy uninstall` command. */
export function createDeployUninstallCommand(
  dependencies: DeployUninstallCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new UninstallDeployCommand(dependencies).define();
}
