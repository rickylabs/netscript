import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module public/features/service-list-command
 *
 * `netscript service list` command.
 */

import { Command } from '@cliffy/command';
import { resolve } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { ServiceWorkspaceResolver } from '../../../../kernel/adapters/service/workspace-resolver.ts';
import { findProjectRoot } from '../../../../kernel/adapters/config/deploy-config.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { ListServicesInput } from './list-services-input.ts';

/** `netscript service list` command. */
export const serviceListCommand: Command<any, any, any, any, any, any, any, any> = new Command()
  .name('list')
  .description('List configured NetScript services')
  .option('--project-root <path:string>', 'Project root directory')
  .action(async (options: ListServicesInput): Promise<void> => {
    const projectRoot = options.projectRoot
      ? resolve(options.projectRoot)
      : await findProjectRoot();

    if (!projectRoot) {
      throw new ScaffoldValidationError(
        'Could not find a NetScript project root from the current directory.',
      );
    }

    const resolver = new ServiceWorkspaceResolver(new DenoFileSystem());
    const services = await resolver.discoverServices(projectRoot);

    if (services.length === 0) {
      outputText('No services configured.');
      return;
    }

    outputText('Name\tPort\tEnabled\tWorkdir\tReferences');
    for (const service of services) {
      outputText(
        `${service.name}\t${service.port}\t${service.enabled}\t${service.workdir}\t${
          service.serviceReferences.join(',') || '-'
        }`,
      );
    }
  });
