import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { DeployStepCommand } from '../../../../kernel/presentation/abstracts/deploy-step-command.ts';
import {
  installServiceDeploy,
  type InstallServiceDeployDependencies,
} from './install-service-deploy.ts';


/** Dependencies for the public `deploy install` command handler. */
export interface DeployInstallCommandDependencies {
  /** Application dependencies for installing services. */
  readonly installDeployDependencies: InstallServiceDeployDependencies;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Public `deploy install` command owner. */
export class InstallDeployCommand extends DeployStepCommand<CliffyCommand> {
  readonly id = 'public.deploy.install';
  protected readonly phase = 'install';

  constructor(private readonly dependencies: DeployInstallCommandDependencies) {
    super();
  }

  define(): CliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('install')
      .description('Register services with the Windows service manager')
      .arguments('[service:string]')
      .option('--install-dir <dir:string>', 'Installation directory')
      .option('--deploy-dir <dir:string>', 'Source deployment artifacts directory')
      .option('--force', 'Overwrite already-registered services')
      .action(async (options, service?: string): Promise<void> => {
        const result = await installServiceDeploy({
          installDir: options.installDir,
          deployDir: options.deployDir,
          service,
          force: options.force ?? false,
        }, this.dependencies.installDeployDependencies);

        print(`Installed ${result.installed.length} service(s).`);
        if (result.failed.length > 0) print(`Failed ${result.failed.length} service(s).`);
      });
  }
}

/** Create the public `deploy install` command. */
export function createDeployInstallCommand(
  dependencies: DeployInstallCommandDependencies,
): CliffyCommand {
  return new InstallDeployCommand(dependencies).define();
}
