import { join } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { GenerateAspireDependencies } from '../../generate/aspire/generate-aspire.ts';
import { generateAspire } from '../../generate/aspire/generate-aspire.ts';

/** Dependencies for service graph mutations. */
export interface MutateServiceConfigDependencies extends GenerateAspireDependencies {
  readonly fs: FileSystemPort;
}

/** Add or remove a service reference and regenerate Aspire helpers. */
export async function mutateServiceReference(
  dependencies: MutateServiceConfigDependencies,
  projectRoot: string,
  caller: string,
  callee: string,
  operation: 'add' | 'remove',
): Promise<readonly string[]> {
  return await mutateServices(dependencies, projectRoot, (services) => {
    const source = requireService(services, caller);
    requireService(services, callee);
    const references = new Set(Array.isArray(source.ServiceReferences) ? source.ServiceReferences : []);
    operation === 'add' ? references.add(callee) : references.delete(callee);
    source.ServiceReferences = [...references].sort();
  });
}

/** Update service port/enabled fields and regenerate Aspire helpers. */
export async function setServiceConfig(
  dependencies: MutateServiceConfigDependencies,
  projectRoot: string,
  name: string,
  patch: { readonly port?: number; readonly enabled?: boolean },
): Promise<readonly string[]> {
  if (patch.port === undefined && patch.enabled === undefined) {
    throw new Error('service set requires --port or --enabled');
  }
  return await mutateServices(dependencies, projectRoot, (services) => {
    const service = requireService(services, name);
    if (patch.port !== undefined) service.Port = patch.port;
    if (patch.enabled !== undefined) service.Enabled = patch.enabled;
  });
}

type MutableService = Record<string, unknown> & {
  Port?: number;
  Enabled?: boolean;
  ServiceReferences?: string[];
};

async function mutateServices(
  dependencies: MutateServiceConfigDependencies,
  projectRoot: string,
  mutate: (services: Record<string, MutableService>) => void,
): Promise<readonly string[]> {
  const path = join(projectRoot, 'appsettings.json');
  const document = JSON.parse(await dependencies.fs.readFile(path)) as {
    NetScript?: { Services?: Record<string, MutableService> };
  };
  const services = document.NetScript?.Services;
  if (!services) throw new Error('NetScript.Services is missing from appsettings.json');
  mutate(services);
  await dependencies.fs.writeFile(path, `${JSON.stringify(document, null, 2)}\n`);
  return (await generateAspire({ projectRoot }, dependencies)).helperFiles;
}

function requireService(services: Record<string, MutableService>, name: string): MutableService {
  const service = services[name];
  if (!service) throw new Error(`Service '${name}' is not registered in appsettings.json`);
  return service;
}
