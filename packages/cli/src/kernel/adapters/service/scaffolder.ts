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
import { TEMPLATE_KEYS, type TemplateKey } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../templates/template-asset.ts';

/** Creates a complete service workspace under `services/<name>/`. */
export class ServiceScaffolder {
  /** Create a service scaffolder with injected filesystem adapters. */
  constructor(
    private readonly scaffolder: ScaffolderPort,
    private readonly _fs: FileSystemPort,
    private readonly _templateAdapter: TemplatePort,
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
      modelName: options.modelName ?? '',
      projectName: options.projectName,
      servicePort: String(options.servicePort),
    };
    await this.writeGenerated(
      join(serviceDir, SCAFFOLD_FILES.DENO_JSON),
      generateServiceDenoJson({
        projectName: options.projectName,
        serviceName: options.serviceName,
        importMode: options.importMode,
        localBase: options.localBase,
        packagesAsWorkspaceMembers: options.packagesAsWorkspaceMembers,
        hasDatabase: options.hasDatabase,
      }),
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeRendered(
      options.hasDatabase ? TEMPLATE_KEYS.serviceMain : TEMPLATE_KEYS.serviceMainMemory,
      join(srcDir, SCAFFOLD_FILES.MAIN),
      templateVars,
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeRendered(
      TEMPLATE_KEYS.serviceRouter,
      join(srcDir, 'router.ts'),
      templateVars,
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeRendered(
      TEMPLATE_KEYS.serviceRoutersHealth,
      join(routersDir, 'health.ts'),
      templateVars,
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeRendered(
      options.hasDatabase ? TEMPLATE_KEYS.serviceRoutersV1 : TEMPLATE_KEYS.serviceRoutersV1Memory,
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
    template: TemplateKey,
    path: string,
    vars: Record<string, string>,
    force: boolean,
    filesCreated: string[],
    filesSkipped: string[],
  ): Promise<void> {
    const content = renderTemplateAssetSync(template, vars);
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
