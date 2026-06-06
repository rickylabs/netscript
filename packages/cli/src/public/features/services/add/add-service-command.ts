import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { addService, type AddServiceDependencies } from './add-service.ts';
import {
  parseList,
  type ProjectRootResolver,
  requireProjectRoot,
  requireString,
} from '../../../presentation/support.ts';
import type { AddServiceCommandInput } from './add-service-input.ts';

/** Dependencies for the public `service add` command handler. */
export interface ServiceAddCommandDependencies {
  /** Application dependencies for adding a service workspace. */
  readonly addServiceDependencies: AddServiceDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the public `service add` command. */
export function createServiceAddCommand(
  dependencies: ServiceAddCommandDependencies,
) : Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('add')
    .description('Add a service workspace, v1 contract, and Aspire registration')
    .option('--name <name:string>', 'Service name (kebab-case)')
    .option('--port <port:number>', 'Service port override')
    .option('--refs <refs:string>', 'Comma-separated service references')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--force', 'Overwrite generated files if they already exist', { default: false })
    .action(async (options: AddServiceCommandInput): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const serviceName = requireString('--name', options.name);
      const result = await addService({
        serviceName,
        port: options.port,
        serviceReferences: parseList(options.refs),
        projectRoot,
        overwrite: options.force ?? false,
      }, dependencies.addServiceDependencies);

      print(`Added service "${serviceName}" on port ${result.service.port}.`);
      print(`Created ${result.contract.scaffoldResult.filesCreated.length} contract files.`);
      print(`Created ${result.service.scaffoldResult.filesCreated.length} service files.`);
      print(`Regenerated ${result.helperFiles.length} Aspire helper files.`);
    });
}
