/**
 * @module infra/service/scaffolder
 *
 * Service workspace scaffolding.
 */

import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../ports/template-port.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import { generateServiceDenoJson } from '../../templates/service/generate-service-deno-json.ts';
import type { ServiceScaffoldOptions, ServiceScaffoldResult } from '../../domain/service-shape.ts';
import { readTemplateAsset } from '../templates/template-asset.ts';

const SERVICE_MAIN_TEMPLATE = new URL(
  '../../assets/service/main.ts.template',
  import.meta.url,
);
const SERVICE_ROUTER_TEMPLATE = new URL(
  '../../assets/service/router.ts.template',
  import.meta.url,
);
const SERVICE_HEALTH_ROUTER_TEMPLATE = new URL(
  '../../assets/service/routers/health.ts.template',
  import.meta.url,
);
const SERVICE_V1_ROUTER_TEMPLATE = new URL(
  '../../assets/service/routers/v1.ts.template',
  import.meta.url,
);

/** Creates a complete service workspace under `services/<name>/`. */
export class ServiceScaffolder {
  /** Create a service scaffolder with injected filesystem adapters. */
  constructor(
    private readonly scaffolder: ScaffolderPort,
    private readonly _fs: FileSystemPort,
    private readonly templateAdapter: TemplatePort,
  ) {}

  /**
   * Scaffold the service workspace.
   *
   * @param options - Service scaffold options
   * @returns Service-specific scaffold result
   */
  async scaffold(options: ServiceScaffoldOptions): Promise<ServiceScaffoldResult> {
    const start = performance.now();
    const filesCreated: string[] = [];
    const directoriesCreated: string[] = [];
    const filesSkipped: string[] = [];

    const serviceDir = join(
      options.targetPath,
      SCAFFOLD_DIRS.SERVICES,
      options.serviceName,
    );
    const srcDir = join(serviceDir, 'src');
    const routersDir = join(srcDir, 'routers');

    await this.createDir(serviceDir, directoriesCreated);
    await this.createDir(srcDir, directoriesCreated);
    await this.createDir(routersDir, directoriesCreated);

    const templateVars = {
      serviceName: options.serviceName,
      projectName: options.projectName,
      servicePort: String(options.servicePort),
    };
    const [
      serviceMainTemplate,
      serviceRouterTemplate,
      serviceHealthRouterTemplate,
      serviceV1RouterTemplate,
    ] = await Promise.all([
      readTemplateAsset(SERVICE_MAIN_TEMPLATE),
      readTemplateAsset(SERVICE_ROUTER_TEMPLATE),
      readTemplateAsset(SERVICE_HEALTH_ROUTER_TEMPLATE),
      readTemplateAsset(SERVICE_V1_ROUTER_TEMPLATE),
    ]);

    await this.writeGenerated(
      join(serviceDir, SCAFFOLD_FILES.DENO_JSON),
      generateServiceDenoJson({
        projectName: options.projectName,
        serviceName: options.serviceName,
        importMode: options.importMode,
        localBase: options.localBase,
        packagesAsWorkspaceMembers: options.packagesAsWorkspaceMembers,
      }),
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeRendered(
      serviceMainTemplate,
      join(srcDir, SCAFFOLD_FILES.MAIN),
      templateVars,
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeRendered(
      serviceRouterTemplate,
      join(srcDir, 'router.ts'),
      templateVars,
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeRendered(
      serviceHealthRouterTemplate,
      join(routersDir, 'health.ts'),
      templateVars,
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeRendered(
      serviceV1RouterTemplate,
      join(routersDir, 'v1.ts'),
      templateVars,
      options.force,
      filesCreated,
      filesSkipped,
    );

    const scaffoldResult: ScaffoldResult = {
      filesCreated,
      directoriesCreated,
      filesSkipped,
      totalOperations: filesCreated.length + directoriesCreated.length,
      durationMs: performance.now() - start,
    };

    return {
      scaffoldResult,
      serviceDir,
      port: options.servicePort,
      configEntry: {
        Enabled: true,
        Runtime: 'deno',
        Port: options.servicePort,
        Entrypoint: 'src/main.ts',
        Workdir: `${SCAFFOLD_DIRS.SERVICES}/${options.serviceName}`,
        ...(options.serviceReferences?.length
          ? { ServiceReferences: [...options.serviceReferences] }
          : {}),
      },
    };
  }

  private async createDir(path: string, directoriesCreated: string[]): Promise<void> {
    await this.scaffolder.createDir(path);
    directoriesCreated.push(path);
  }

  private async writeRendered(
    template: string,
    path: string,
    vars: Record<string, string>,
    force: boolean,
    filesCreated: string[],
    filesSkipped: string[],
  ): Promise<void> {
    const content = await this.templateAdapter.render(template, vars);
    await this.writeGenerated(path, content, force, filesCreated, filesSkipped);
  }

  private async writeGenerated(
    path: string,
    content: string,
    force: boolean,
    filesCreated: string[],
    filesSkipped: string[],
  ): Promise<void> {
    if (await this.scaffolder.writeFile(path, content, force)) {
      filesCreated.push(path);
    } else {
      filesSkipped.push(path);
    }
  }
}
