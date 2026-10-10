import { dirname, join } from '@std/path';
import { TEMPLATE_KEYS } from '../../../packages/cli/src/kernel/assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../packages/cli/src/kernel/adapters/templates/template-asset.ts';

const SERVICE_VARS = {
  projectName: 'my-app',
  serviceName: 'users',
  entityName: 'users',
  servicePort: '3001',
};

/** Materialize the real scaffold dependencies for the layered service documentation fences. */
export async function materializeServiceScaffoldSupport(pageRoot: string): Promise<void> {
  const modules = [
    ['contracts/versions/v1/users.contract.ts', TEMPLATE_KEYS.serviceContractMemory],
    ['services/users/src/application/users.ts', TEMPLATE_KEYS.serviceApplicationEntityMemory],
    ['services/users/src/domain/users.ts', TEMPLATE_KEYS.serviceDomainEntityMemory],
    [
      'services/users/src/adapters/memory-users-repository.ts',
      TEMPLATE_KEYS.serviceMemoryRepository,
    ],
    ['services/users/src/routers/health.ts', TEMPLATE_KEYS.serviceRoutersHealth],
  ] as const;
  for (const [path, template] of modules) {
    const target = join(pageRoot, path);
    await Deno.mkdir(dirname(target), { recursive: true });
    await Deno.writeTextFile(target, renderTemplateAssetSync(template, SERVICE_VARS));
  }
}

/** The shared users contract comes from the exact generator used by the CLI. */
export function renderUsersContractSupport(): string {
  return renderTemplateAssetSync(TEMPLATE_KEYS.serviceContractMemory, SERVICE_VARS);
}
