import { Command } from '@cliffy/command';

import { buildWindowsDeployment } from './build/build-windows-strategy.ts';
import { createDeployBuildCommand } from './build/build-deploy-command.ts';
import { copyCommand } from './copy/copy-deploy-command.ts';
import { createDeployInstallCommand } from './install/install-deploy-command.ts';
import { logsCommand } from './logs/logs-deploy-command.ts';
import { packageCliCommand } from './package-cli/package-cli-deploy-command.ts';
import { startCommand } from './start/start-deploy-command.ts';
import { statusCommand } from './status/status-deploy-command.ts';
import { stopCommand } from './stop/stop-deploy-command.ts';
import { createDeployUninstallCommand } from './uninstall/uninstall-deploy-command.ts';
import { upgradeCommand } from './upgrade/upgrade-deploy-command.ts';
import { createTargetDeployCommand } from './target/target-deploy-command.ts';
import type { PublicCommandDependencies } from '../root/public-command-dependencies.ts';

/** Create the public deploy command group. */
export function createDeployCommand(
  dependencies: PublicCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new Command()
    .name('deploy')
    .description('Build and manage NetScript Windows Service deployments')
    .action(function () {
      this.showHelp();
    })
    .command(
      'build',
      createDeployBuildCommand({
        buildDeployDependencies: {
          loadConfig: dependencies.deployBuildDependencies.loadConfig,
          buildWindowsDeployment: (config, options) =>
            buildWindowsDeployment(config, {
              ...options,
              skipServices: options.skipServices ? [...options.skipServices] : undefined,
              includeTasks: options.includeTasks ? [...options.includeTasks] : undefined,
              excludeTasks: options.excludeTasks ? [...options.excludeTasks] : undefined,
            }),
        },
      }),
    )
    .command('package-cli', packageCliCommand)
    .command('copy', copyCommand)
    .command(
      'install',
      createDeployInstallCommand({
        installDeployDependencies: {
          manifests: dependencies.manifestPort,
          services: dependencies.windowsServices,
        },
      }),
    )
    .command('start', startCommand)
    .command('stop', stopCommand)
    .command('status', statusCommand)
    .command('logs', logsCommand)
    .command(
      'uninstall',
      createDeployUninstallCommand({
        uninstallDeployDependencies: {
          manifests: dependencies.manifestPort,
          services: dependencies.windowsServices,
        },
      }),
    )
    .command('upgrade', upgradeCommand)
    // Cloud deploy targets (thin router → registry-resolved adapter, R-DEPLOY-2).
    // Added alongside the legacy flat Windows verbs; full convergence is S12/#348.
    .command('docker', createTargetDeployCommand('docker', dependencies))
    .command('compose', createTargetDeployCommand('compose', dependencies));
}
