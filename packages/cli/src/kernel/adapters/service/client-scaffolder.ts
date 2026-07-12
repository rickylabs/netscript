import { join } from '@std/path';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';
import type { ScaffolderPort } from '../../ports/template-port.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';

/** Resolve the conventional typed-client path for the first app workspace. */
export async function findServiceClientPath(
  projectRoot: string,
  serviceName: string,
  fs: FileSystemPort,
): Promise<string | undefined> {
  const config = JSON.parse(await fs.readFile(join(projectRoot, 'deno.json'))) as {
    workspace?: string[];
  };
  const appMember = config.workspace?.find((member) => /^\.\/apps\/[^/]+$/.test(member));
  return appMember
    ? join(projectRoot, appMember.replace(/^\.\//, ''), 'lib', `${serviceName}.ts`)
    : undefined;
}

/** Scaffold typed SDK and query helpers for a newly added service. */
export class ServiceClientScaffolder {
  /** Create a client scaffolder backed by the shared scaffold writer. */
  constructor(
    private readonly scaffolder: ScaffolderPort,
    private readonly fs: FileSystemPort,
  ) {}

  /** Write `apps/<app>/lib/<service>.ts` from the canonical example client asset. */
  async scaffold(
    projectRoot: string,
    projectName: string,
    serviceName: string,
    force: boolean,
  ): Promise<string> {
    const path = await findServiceClientPath(projectRoot, serviceName, this.fs);
    if (!path) {
      throw new ScaffoldValidationError(
        'Cannot scaffold a typed client because no ./apps/<name> workspace member was found.',
        { projectRoot },
      );
    }
    const content = renderTemplateAssetSync(TEMPLATE_KEYS.appLibExampleService, {
      name: projectName,
      serviceName,
    });
    await this.scaffolder.writeFile(path, content, force);
    return path;
  }
}
