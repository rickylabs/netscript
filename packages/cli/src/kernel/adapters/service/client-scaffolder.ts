import { join } from '@std/path';
import { toPascalCase } from '@std/text';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';
import type { ScaffolderPort } from '../../ports/template-port.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';

/** One fully validated generated service-client module. */
export interface ServiceClientFilePlan {
  /** Manifest service name. */
  readonly serviceName: string;
  /** Generator-owned output path. */
  readonly path: string;
  /** Rendered TypeScript module. */
  readonly content: string;
}

/** Resolve the conventional typed-client path for the first app workspace. */
export async function findServiceClientPath(
  projectRoot: string,
  serviceName: string,
  fs: FileSystemPort,
): Promise<string | undefined> {
  const config = JSON.parse(await fs.readFile(join(projectRoot, 'deno.json'))) as {
    workspace?: string[];
  };
  const appMember = config.workspace?.find((member) => /^(?:\.\/)?apps\/[^/]+$/.test(member));
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

  /** Validate and render `apps/<app>/lib/<service>.ts` without writing it. */
  async plan(
    projectRoot: string,
    projectName: string,
    serviceName: string,
  ): Promise<ServiceClientFilePlan> {
    const path = await findServiceClientPath(projectRoot, serviceName, this.fs);
    if (!path) {
      throw new ScaffoldValidationError(
        'Cannot scaffold a typed client because no ./apps/<name> workspace member was found.',
        { projectRoot },
      );
    }
    const contractPath = join(
      projectRoot,
      'contracts',
      'versions',
      'v1',
      `${serviceName}.contract.ts`,
    );
    const contractExport = `${toPascalCase(serviceName)}ContractV1`;
    if (!await this.fs.exists(contractPath)) {
      throw new ScaffoldValidationError(
        `Cannot generate the service client for "${serviceName}": expected V1 contract at ${contractPath}.`,
        { projectRoot, serviceName, contractPath },
      );
    }
    const contractSource = await this.fs.readFile(contractPath);
    if (!new RegExp(`\\bexport\\s+const\\s+${contractExport}\\b`).test(contractSource)) {
      throw new ScaffoldValidationError(
        `Cannot generate the service client for "${serviceName}": expected ${contractExport} in ${contractPath}.`,
        { projectRoot, serviceName, contractPath, contractExport },
      );
    }
    const content = renderTemplateAssetSync(TEMPLATE_KEYS.appRoutesExamplesServiceLibServiceQuery, {
      name: projectName,
      serviceName,
    });
    return { serviceName, path, content };
  }

  /** Return whether a validated module differs from its owned output. */
  async needsWrite(plan: ServiceClientFilePlan, force: boolean): Promise<boolean> {
    if (force || !await this.fs.exists(plan.path)) return true;
    return await this.fs.readFile(plan.path) !== plan.content;
  }

  /** Write one previously validated module. */
  async write(plan: ServiceClientFilePlan): Promise<void> {
    await this.scaffolder.writeFile(plan.path, plan.content, true);
  }

  /** Validate, render, and reconcile one generated client module. */
  async scaffold(
    projectRoot: string,
    projectName: string,
    serviceName: string,
    force: boolean,
  ): Promise<string> {
    const plan = await this.plan(projectRoot, projectName, serviceName);
    if (await this.needsWrite(plan, force)) await this.write(plan);
    return plan.path;
  }
}
