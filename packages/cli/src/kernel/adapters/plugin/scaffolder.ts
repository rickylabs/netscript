/**
 * @module infra/plugin/scaffolder
 *
 * Plugin workspace scaffolding.
 */

import { dirname, join } from '@std/path';
import {
  PLUGIN_CONFIG_SECTION_MAP,
  type PluginScaffoldOptions,
  type PluginScaffoldResult,
} from '../../domain/plugin-kind.ts';
import { PluginKindRegistry } from '../../application/registries/plugin-kind-registry.ts';
import { PORT_RANGES } from '../../constants/port-ranges.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ScaffolderPort } from '../../ports/template-port.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import {
  generatePluginContracts,
  generatePluginDbSchema,
  generatePluginDenoJson,
  generatePluginMod,
  generatePluginProcessorEntrypoint,
  generatePluginRouter,
  generatePluginSampleFiles,
  generatePluginService,
} from '../../templates/plugins/plugin-generators.ts';

interface AppsettingsPortShape {
  readonly NetScript?: {
    readonly Services?: Record<string, { readonly Port?: unknown }>;
    readonly Plugins?: Record<string, { readonly Port?: unknown }>;
    readonly BackgroundProcessors?: Record<string, { readonly Port?: unknown }>;
    readonly Apps?: Record<string, { readonly Port?: unknown }>;
  };
}

/** Creates a complete plugin workspace under `plugins/<name>/`. */
export class PluginScaffolder {
  /** Create a plugin scaffolder with injected filesystem adapters. */
  constructor(
    private readonly scaffolder: ScaffolderPort,
    private readonly _fs: FileSystemPort,
    private readonly registry: PluginKindRegistry,
  ) {}

  /** Scaffold the plugin workspace. */
  async scaffold(options: PluginScaffoldOptions): Promise<PluginScaffoldResult> {
    const start = performance.now();
    const filesCreated: string[] = [];
    const directoriesCreated: string[] = [];
    const filesSkipped: string[] = [];
    const provider = this.registry.get(options.kind);
    const usedPorts = await this.getUsedPorts(options.targetPath);
    const port = options.port !== undefined
      ? this.validateRequestedPort(provider.portRangeKey, options.port, usedPorts)
      : this.allocatePort(provider.portRangeKey, usedPorts);
    const servicePort = provider.category === 'plugin'
      ? port
      : this.allocatePort('PLUGIN_API', usedPorts);
    const serviceEntrypoint = provider.defaultServiceEntrypoint;
    const requiresDb = options.requiresDb ?? provider.defaultRequiresDb;
    const includeSamples = options.includeSamples ?? true;

    if (!serviceEntrypoint) {
      throw new ScaffoldValidationError(
        `Plugin kind "${provider.kind}" does not define a service entrypoint.`,
        { kind: provider.kind },
      );
    }

    const pluginDir = join(
      options.targetPath,
      SCAFFOLD_DIRS.PLUGINS,
      options.pluginName,
    );
    const serviceEntryDir = join(pluginDir, dirname(serviceEntrypoint));
    const contractsDir = join(pluginDir, SCAFFOLD_DIRS.CONTRACTS);
    const contractsV1Dir = join(contractsDir, SCAFFOLD_DIRS.V1);
    const databaseDir = join(pluginDir, SCAFFOLD_DIRS.DATABASE);

    await this.createDir(pluginDir, directoriesCreated);
    await this.createDir(serviceEntryDir, directoriesCreated);
    await this.createDir(contractsDir, directoriesCreated);
    await this.createDir(contractsV1Dir, directoriesCreated);
    if (requiresDb) {
      await this.createDir(databaseDir, directoriesCreated);
    }

    if (provider.category === 'background-processor') {
      await this.createDir(join(pluginDir, 'bin'), directoriesCreated);
    }

    const templateOptions = {
      pluginName: options.pluginName,
      projectName: options.projectName,
      importMode: options.importMode,
      localBase: options.localBase,
      port,
      servicePort,
      kind: options.kind,
      requiresDb,
      includeSamples,
    } as const;

    await this.writeGenerated(
      join(pluginDir, SCAFFOLD_FILES.DENO_JSON),
      generatePluginDenoJson(provider, templateOptions),
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeGenerated(
      join(pluginDir, SCAFFOLD_FILES.MOD),
      generatePluginMod(provider, templateOptions),
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeGenerated(
      join(pluginDir, serviceEntrypoint),
      generatePluginService(provider, templateOptions),
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeGenerated(
      join(serviceEntryDir, 'router.ts'),
      generatePluginRouter(provider, templateOptions),
      options.force,
      filesCreated,
      filesSkipped,
    );
    await this.writeGenerated(
      join(contractsV1Dir, SCAFFOLD_FILES.MOD),
      generatePluginContracts(provider, templateOptions),
      options.force,
      filesCreated,
      filesSkipped,
    );
    if (requiresDb) {
      await this.writeGenerated(
        join(databaseDir, 'schema.prisma'),
        generatePluginDbSchema({ pluginName: options.pluginName }),
        options.force,
        filesCreated,
        filesSkipped,
      );
    }

    if (provider.category === 'background-processor') {
      await this.writeGenerated(
        join(pluginDir, provider.defaultEntrypoint),
        generatePluginProcessorEntrypoint(provider, templateOptions),
        options.force,
        filesCreated,
        filesSkipped,
      );
    }

    if (includeSamples) {
      for (const sample of generatePluginSampleFiles(provider, templateOptions)) {
        await this.writeGenerated(
          join(pluginDir, sample.path),
          sample.content,
          options.force,
          filesCreated,
          filesSkipped,
        );
      }
    }

    const scaffoldResult: ScaffoldResult = {
      filesCreated,
      directoriesCreated,
      filesSkipped,
      totalOperations: filesCreated.length + directoriesCreated.length,
      durationMs: performance.now() - start,
    };

    return {
      scaffoldResult,
      pluginDir,
      kind: options.kind,
      port,
      servicePort,
      configSection: PLUGIN_CONFIG_SECTION_MAP[provider.category],
      configKey: options.pluginName,
      serviceConfigKey: provider.category === 'plugin'
        ? options.pluginName
        : `${options.pluginName}-api`,
    };
  }

  private async createDir(path: string, directoriesCreated: string[]): Promise<void> {
    await this.scaffolder.createDir(path);
    directoriesCreated.push(path);
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

  private async getUsedPorts(targetPath: string): Promise<Set<number>> {
    const configPath = join(targetPath, SCAFFOLD_FILES.APPSETTINGS);
    const usedPorts = new Set<number>();

    if (await this._fs.exists(configPath)) {
      const parsed = JSON.parse(await this._fs.readFile(configPath)) as AppsettingsPortShape;
      const netScript = parsed.NetScript;

      this.collectPorts(netScript?.Services, usedPorts);
      this.collectPorts(netScript?.Plugins, usedPorts);
      this.collectPorts(netScript?.BackgroundProcessors, usedPorts);
      this.collectPorts(netScript?.Apps, usedPorts);
    }

    await this.collectManifestPorts(targetPath, usedPorts);

    return usedPorts;
  }

  private collectPorts(
    section: Record<string, { readonly Port?: unknown }> | undefined,
    usedPorts: Set<number>,
  ): void {
    if (!section) return;
    for (const entry of Object.values(section)) {
      if (typeof entry.Port === 'number') {
        usedPorts.add(entry.Port);
      }
    }
  }

  private async collectManifestPorts(targetPath: string, usedPorts: Set<number>): Promise<void> {
    const pluginsRoot = join(targetPath, SCAFFOLD_DIRS.PLUGINS);
    if (!await this._fs.exists(pluginsRoot)) {
      return;
    }

    for (const entry of await this._fs.readDir(pluginsRoot)) {
      if (!entry.isDirectory) {
        continue;
      }

      const manifestPath = join(pluginsRoot, entry.name, SCAFFOLD_FILES.MOD);
      if (!await this._fs.exists(manifestPath)) {
        continue;
      }

      const manifest = await this._fs.readFile(manifestPath);
      const match = /infrastructure:\s*{[\s\S]*?\bport:\s*(\d+)/.exec(manifest) ??
        /service:\s*{[\s\S]*?\bport:\s*(\d+)/.exec(manifest);

      if (!match) {
        continue;
      }

      const port = Number(match[1]);
      if (Number.isInteger(port)) {
        usedPorts.add(port);
      }
    }
  }

  private allocatePort(rangeKey: 'PLUGIN_API' | 'INFRA_PLUGIN', usedPorts: Set<number>): number {
    const range = PORT_RANGES[rangeKey];
    for (let port = range.start; port <= range.end; port++) {
      if (!usedPorts.has(port)) {
        return port;
      }
    }

    throw new ScaffoldValidationError(
      `Plugin port range exhausted for ${rangeKey} (${range.start}-${range.end}).`,
      { rangeKey, start: range.start, end: range.end },
    );
  }

  private validateRequestedPort(
    rangeKey: 'PLUGIN_API' | 'INFRA_PLUGIN',
    port: number,
    usedPorts: Set<number>,
  ): number {
    const range = PORT_RANGES[rangeKey];

    if (!Number.isInteger(port) || port < range.start || port > range.end) {
      throw new ScaffoldValidationError(
        `Port ${port} is outside ${rangeKey} range (${range.start}-${range.end}).`,
        { port, rangeKey, start: range.start, end: range.end },
      );
    }

    if (usedPorts.has(port)) {
      throw new ScaffoldValidationError(
        `Port ${port} is already allocated in appsettings.json.`,
        { port, rangeKey },
      );
    }

    return port;
  }
}
