import {
  addServiceWorkspaceMember,
  regenerateAspireHelpers,
  upsertServiceAppsettingsEntry,
} from '../../../../kernel/adapters/service/workspace-mutator.ts';
import { PortAllocator } from '../../../../kernel/adapters/service/port-allocator.ts';
import { ServiceWorkspaceResolver } from '../../../../kernel/adapters/service/workspace-resolver.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import type { AddServiceResult } from '../../../domain/service-add-plan.ts';
import type { AddServiceInput } from './add-service-input.ts';
import { planServiceAdd } from './plan-service-add.ts';
import { renderService, type RenderServiceDependencies } from './render-service.ts';
import { ServiceClientScaffolder } from '../../../../kernel/adapters/service/client-scaffolder.ts';

/** Dependencies used by the public add-service flow. */
export interface AddServiceDependencies extends RenderServiceDependencies {
  /** Filesystem used for validation and root config mutation. */
  readonly fs: FileSystemPort;

  /** Service port allocator. */
  readonly portAllocator: PortAllocator;

  /** Existing service resolver. */
  readonly serviceResolver: ServiceWorkspaceResolver;

  /** Scaffold writer used by AppHost helper regeneration. */
  readonly scaffolder: ScaffolderPort;

  /** Template renderer used by AppHost helper regeneration. */
  readonly templateAdapter: TemplatePort;

  /** Typed client/query module scaffolder. */
  readonly clientScaffolder?: ServiceClientScaffolder;

  /** Helper regeneration override for tests. */
  readonly regenerateHelpers?: (
    projectRoot: string,
    fs: FileSystemPort,
    scaffolder: ScaffolderPort,
    templateAdapter: TemplatePort,
  ) => Promise<readonly string[]>;
}

/** Add a service workspace, matching contract, and Aspire registration. */
export async function addService(
  request: AddServiceInput,
  dependencies: AddServiceDependencies,
): Promise<AddServiceResult> {
  const plan = await planServiceAdd(request, dependencies);
  const rendered = await renderService(plan, dependencies);

  await upsertServiceAppsettingsEntry(
    plan.projectRoot,
    plan.serviceName,
    rendered.service.configEntry,
    dependencies.fs,
  );
  await addServiceWorkspaceMember(plan.projectRoot, plan.serviceName, dependencies.fs);

  const regenerateHelpers = dependencies.regenerateHelpers ?? regenerateAspireHelpers;
  const helperFiles = await regenerateHelpers(
    plan.projectRoot,
    dependencies.fs,
    dependencies.scaffolder,
    dependencies.templateAdapter,
  );

  if (plan.withClient && !dependencies.clientScaffolder) {
    throw new Error('Typed client scaffolding dependency is required for --with-client.');
  }
  const clientPath = plan.withClient
    ? await dependencies.clientScaffolder!.scaffold(
      plan.projectRoot,
      plan.projectName,
      plan.serviceName,
      plan.overwrite,
    )
    : undefined;

  return {
    ...rendered,
    helperFiles,
    clientPath,
  };
}
