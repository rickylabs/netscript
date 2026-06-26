import { loadConfig } from '@netscript/config';
import {
  AstExtractor,
  FilesystemWalker,
  ModuleManifestResolver,
  RegistryEmitter,
} from '@netscript/plugin/sdk';

import {
  findProjectRoot as findDeployProjectRoot,
  loadDeployConfig,
} from '../../../kernel/adapters/config/deploy-config.ts';
import { loadRegisteredPlugins } from '../../../kernel/adapters/config/plugin-registry.ts';
import { createContractScaffolder } from '../../../kernel/adapters/contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../../../kernel/adapters/contracts/templates/contract-template-registry.ts';
import { ContractVersionRegistry } from '../../../kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../kernel/adapters/contracts/workspace-resolver.ts';
import { DatabaseScaffolder } from '../../../kernel/adapters/database/scaffolder.ts';
import { DatabaseWorkspaceMutator } from '../../../kernel/adapters/database/workspace-mutator.ts';
import { resolveManifest } from '../../../kernel/adapters/deploy/commands/manifest-command.ts';
import { DenoProcess } from '../../../kernel/adapters/runtime/process/deno-process.ts';
import { DenoFileSystem } from '../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginRegistryScaffolder } from '../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginScaffolder } from '../../../kernel/adapters/plugin/scaffolder.ts';
import { PluginWorkspaceMutator } from '../../../kernel/adapters/plugin/workspace-mutator.ts';
import { PortAllocator } from '../../../kernel/adapters/service/port-allocator.ts';
import { ServiceScaffolder } from '../../../kernel/adapters/service/scaffolder.ts';
import { ServiceWorkspaceResolver } from '../../../kernel/adapters/service/workspace-resolver.ts';
import { emptyScaffoldResult } from '../../../kernel/application/scaffold/support/helpers.ts';
import { DbEngineRegistry } from '../../../kernel/application/registries/db-engine-registry.ts';
import { PluginKindRegistry } from '../../../kernel/application/registries/plugin-kind-registry.ts';
import { DEFAULT_SERVY_CLI_PATH } from '../../../kernel/constants/windows.ts';
import { JsrImportResolver } from '../../adapters/jsr-import-resolver.ts';
import { ServyCliAdapter } from '../../adapters/servy-cli.ts';
import type { ServiceManifest } from '../../ports/service-manifest-port.ts';
import type { GeneratePluginRegistriesCommandDependencies } from '../generate/plugins/generate-plugin-registries-command.ts';
import type { GenerateRuntimeSchemasCommandDependencies } from '../generate/runtime-schemas/generate-runtime-schemas-command.ts';
import { createPluginDispatchPort } from '../plugins/dispatch/dispatch-plugin-verb.ts';
import type { PluginDispatchPort } from '../plugins/dispatch/plugin-dispatch-port.ts';
import type { DoctorPluginCommandDependencies } from '../plugins/doctor/doctor-plugin-command.ts';
import { doctorPlugin } from '../plugins/doctor/doctor-plugin-use-case.ts';
import {
  createPluginHostLoader,
  type PluginHostLoaderPort,
} from '../plugins/host/plugin-loader.ts';
import type { RemovePluginDependencies } from '../plugins/remove/remove-plugin.ts';
import type { PluginScaffoldDependencies } from '../plugins/scaffold/scaffold-plugin-use-case.ts';
import type { PublicCliHost } from './public-command-tree.ts';

/** Dependencies shared by public command groups. */
export interface PublicCommandDependencies {
  /** Filesystem adapter used by scaffold and config flows. */
  readonly fs: DenoFileSystem;
  /** Process adapter used by init and deployment flows. */
  readonly process: DenoProcess;
  /** Template renderer used by scaffold flows. */
  readonly templateAdapter: StringTemplateAdapter;
  /** Scaffold writer used by scaffold flows. */
  readonly scaffolder: Scaffolder;
  /** Plugin kind registry. */
  readonly pluginRegistry: PluginKindRegistry;
  /** Database engine registry. */
  readonly dbRegistry: DbEngineRegistry;
  /** Resolve a project root from an optional flag. */
  readonly resolveProjectRoot: (projectRoot?: string) => Promise<string | undefined>;
  /** Dependencies for public init. */
  readonly initCommandDependencies: {
    readonly defaultProjectName: () => string;
    readonly initContext: {
      readonly scaffolder: Scaffolder;
      readonly fs: DenoFileSystem;
      readonly templateAdapter: StringTemplateAdapter;
      readonly process: DenoProcess;
      readonly jsrResolver: JsrImportResolver;
      readonly cwd: () => string;
      readonly resolveModeFields: () => Record<string, never>;
      readonly packagesAsWorkspaceMembers: () => false;
      readonly scaffoldWorkspacePackages: () => Promise<ReturnType<typeof emptyScaffoldResult>>;
    };
  };
  /** Dependencies for Fresh UI registry installation commands. */
  readonly uiInstallDependencies: {
    readonly fs: DenoFileSystem;
  };
  /** Dependencies for DB lifecycle commands. */
  readonly dbOperationDependencies: { readonly cwd: () => string };
  /** Dependencies for DB add. */
  readonly dbAddDependencies: {
    readonly fs: DenoFileSystem;
    readonly registry: DbEngineRegistry;
    readonly databaseScaffolder: DatabaseScaffolder;
    readonly workspaceMutator: DatabaseWorkspaceMutator;
  };
  /** Dependencies for service add and alias commands. */
  readonly serviceAddDependencies: {
    readonly fs: DenoFileSystem;
    readonly scaffolder: Scaffolder;
    readonly templateAdapter: StringTemplateAdapter;
    readonly portAllocator: PortAllocator;
    readonly serviceResolver: ServiceWorkspaceResolver;
    readonly contractScaffolder: ReturnType<typeof createContractScaffolder>;
    readonly serviceScaffolder: ServiceScaffolder;
  };
  /** Dependencies for plugin add. */
  readonly pluginAddDependencies: {
    readonly fs: DenoFileSystem;
    readonly scaffolder: Scaffolder;
    readonly templateAdapter: StringTemplateAdapter;
    readonly registry: PluginKindRegistry;
    readonly pluginScaffolder: PluginScaffolder;
    readonly registryScaffolder: PluginRegistryScaffolder;
    readonly workspaceMutator: PluginWorkspaceMutator;
  };
  /** Dependencies for host-side plugin loading. */
  readonly pluginHostDependencies: {
    readonly resolveProjectRoot: (projectRoot?: string) => Promise<string | undefined>;
    readonly createLoader: (projectRoot: string) => PluginHostLoaderPort;
  };
  /** Dependencies for plugin CLI dispatch. */
  readonly pluginDispatchDependencies: {
    readonly dispatchPort: PluginDispatchPort;
  };
  /** Dependencies for host-side plugin removal. */
  readonly pluginRemoveDependencies: RemovePluginDependencies;
  /** Dependencies for host-side plugin diagnostics. */
  readonly pluginDoctorDependencies: Pick<DoctorPluginCommandDependencies, 'doctor'>;
  /** Dependencies for plugin package scaffolding. */
  readonly pluginScaffoldDependencies: PluginScaffoldDependencies;
  /** Dependencies for runtime config schema generation. */
  readonly generateRuntimeSchemasCommandDependencies: GenerateRuntimeSchemasCommandDependencies;
  /** Dependencies for plugin registry generation. */
  readonly generatePluginRegistriesCommandDependencies: GeneratePluginRegistriesCommandDependencies;
  /** Dependencies for deploy build. */
  readonly deployBuildDependencies: {
    readonly loadConfig: typeof loadDeployConfig;
  };
  /** Resolve deployment manifests for install/uninstall. */
  readonly manifestPort: {
    readonly resolve: (
      options: { installDir?: string; deployDir?: string },
    ) => Promise<{ manifest: ServiceManifest; manifestDir: string; installDir: string }>;
  };
  /** Windows service adapter for deployment lifecycle commands. */
  readonly windowsServices: ServyCliAdapter;
}

/** Build the public command dependency graph for one CLI invocation. */
export function createPublicCommandDependencies(
  host: PublicCliHost,
): PublicCommandDependencies {
  const fs = new DenoFileSystem();
  const process = new DenoProcess();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const pluginRegistry = new PluginKindRegistry();
  const dbRegistry = new DbEngineRegistry();
  const resolveProjectRoot = async (projectRoot?: string) =>
    projectRoot ? host.resolvePath(projectRoot) : await findDeployProjectRoot(host.cwd()) ??
      undefined;
  const createHostLoader = (projectRoot: string) =>
    createPluginHostLoader({
      projectRoot,
      configLoader: {
        load: async (projectRoot) => await loadConfig({ cwd: projectRoot }),
      },
      manifestResolver: new ModuleManifestResolver({ projectRoot }),
      walker: new FilesystemWalker(),
      extractor: new AstExtractor(),
      emitter: new RegistryEmitter(),
      fs,
    });
  const serviceAddDependencies = {
    fs,
    scaffolder,
    templateAdapter,
    portAllocator: new PortAllocator(fs),
    serviceResolver: new ServiceWorkspaceResolver(fs),
    contractScaffolder: createContractScaffolder({
      scaffolder,
      templateAdapter,
      templateRegistry: new DefaultContractTemplateRegistry(),
      versionRegistry: new ContractVersionRegistry(fs),
      workspaceResolver: new ContractWorkspaceResolver(fs),
    }),
    serviceScaffolder: new ServiceScaffolder(scaffolder, fs, templateAdapter),
  };

  return {
    fs,
    process,
    templateAdapter,
    scaffolder,
    pluginRegistry,
    dbRegistry,
    resolveProjectRoot,
    initCommandDependencies: {
      defaultProjectName: () => host.cwd().split(/[/\\]/).pop() ?? 'my-app',
      initContext: {
        scaffolder,
        fs,
        templateAdapter,
        process,
        jsrResolver: new JsrImportResolver(),
        cwd: host.cwd,
        resolveModeFields: () => ({}),
        packagesAsWorkspaceMembers: () => false,
        scaffoldWorkspacePackages: () => Promise.resolve(emptyScaffoldResult()),
      },
    },
    uiInstallDependencies: { fs },
    dbOperationDependencies: { cwd: host.cwd },
    dbAddDependencies: {
      fs,
      registry: dbRegistry,
      databaseScaffolder: new DatabaseScaffolder(scaffolder, fs, templateAdapter, dbRegistry),
      workspaceMutator: new DatabaseWorkspaceMutator(fs, scaffolder, templateAdapter),
    },
    serviceAddDependencies,
    pluginAddDependencies: {
      fs,
      scaffolder,
      templateAdapter,
      registry: pluginRegistry,
      pluginScaffolder: new PluginScaffolder(scaffolder, fs, pluginRegistry),
      registryScaffolder: new PluginRegistryScaffolder(scaffolder),
      workspaceMutator: new PluginWorkspaceMutator(fs),
    },
    pluginHostDependencies: {
      resolveProjectRoot,
      createLoader: createHostLoader,
    },
    pluginDispatchDependencies: {
      dispatchPort: createPluginDispatchPort(process),
    },
    pluginRemoveDependencies: {
      fs,
      workspaceMutator: new PluginWorkspaceMutator(fs),
      dispatchPort: createPluginDispatchPort(process),
      processRunner: process,
    },
    pluginDoctorDependencies: {
      doctor: async (input) =>
        await doctorPlugin(input, {
          fs,
          loadConfig,
        }),
    },
    pluginScaffoldDependencies: {
      fs,
    },
    generateRuntimeSchemasCommandDependencies: {
      resolveProjectRoot,
      generateConfigSchemaDependencies: { fs },
      createRequest: async (projectRoot) => {
        const config = await loadConfig({ cwd: projectRoot });
        const registered = await loadRegisteredPlugins(projectRoot, config);
        return {
          plugins: Object.values(registered).map((plugin) => ({
            pluginName: plugin.name,
            schemas: plugin.runtimeConfig?.schemas ?? [],
          })),
          runtimeConfigPaths: config.runtimeConfig?.paths ?? {},
        };
      },
    },
    generatePluginRegistriesCommandDependencies: {
      resolveProjectRoot,
      walker: new FilesystemWalker(),
      extractor: new AstExtractor(),
      emitter: new RegistryEmitter(),
      fs,
    },
    deployBuildDependencies: { loadConfig: loadDeployConfig },
    manifestPort: {
      async resolve(options) {
        const resolved = await resolveManifest(options);
        return {
          ...resolved,
          manifest: resolved.manifest as unknown as ServiceManifest,
        };
      },
    },
    windowsServices: new ServyCliAdapter({
      servyCliPath: DEFAULT_SERVY_CLI_PATH,
      process,
    }),
  };
}
