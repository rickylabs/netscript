import { join } from '@std/path';

import { validateUniqueName } from '../../../../kernel/adapters/scaffold/workspace-writer.ts';
import { PortAllocator } from '../../../../kernel/adapters/service/port-allocator.ts';
import { ServiceWorkspaceResolver } from '../../../../kernel/adapters/service/workspace-resolver.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ServiceAddPlan, ServiceAddRequest } from '../../../domain/service-add-plan.ts';

/** Dependencies used while planning a service-add flow. */
export interface PlanServiceAddDependencies {
  /** Filesystem used to read project metadata. */
  readonly fs: FileSystemPort;

  /** Service port allocator. */
  readonly portAllocator: PortAllocator;

  /** Existing service resolver. */
  readonly serviceResolver: ServiceWorkspaceResolver;
}

/** Resolve and validate the service-add request before writing files. */
export async function planServiceAdd(
  request: ServiceAddRequest,
  dependencies: PlanServiceAddDependencies,
): Promise<ServiceAddPlan> {
  await validateUniqueName(
    request.projectRoot,
    request.serviceName,
    'service',
    dependencies.fs,
  );

  if (await dependencies.serviceResolver.serviceExists(request.projectRoot, request.serviceName)) {
    throw new ScaffoldValidationError(
      `Service "${request.serviceName}" already exists in appsettings.json.`,
      { serviceName: request.serviceName },
    );
  }

  const projectName = await readProjectName(dependencies.fs, request.projectRoot);
  const allocation = await dependencies.portAllocator.allocate(request.projectRoot, request.port);

  return {
    ...request,
    projectName,
    allocation,
  };
}

async function readProjectName(fs: FileSystemPort, projectRoot: string): Promise<string> {
  const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (await fs.exists(appsettingsPath)) {
    const parsed = JSON.parse(await fs.readFile(appsettingsPath)) as unknown;
    const name = asRecord(asRecord(parsed).NetScript).Name;
    if (typeof name === 'string') {
      return name;
    }
  }
  return projectRoot.split(/[\\/]/).pop() ?? 'app';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
