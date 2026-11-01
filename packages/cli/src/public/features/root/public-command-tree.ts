import { createUiApplyCommand } from '../ui/apply/apply-ui-command.ts';
import { createUiInspectCommand } from '../ui/protocol/inspect/inspect-ui-command.ts';
import { createUiRegistryCommand } from '../ui/protocol/registry/ui-registry-command.ts';
import { createUiPresetCommand } from '../ui/protocol/preset/ui-preset-command.ts';
import { createUiBuildCommand } from '../ui/build/build-ui-command.ts';
import { CliCommandRegistry } from '../../composition/cli-command-registry.ts';
import { contractCommand } from '../contracts/contracts-group.ts';
import { createDbCommand } from '../db/db-group.ts';
import { createConfigCommand } from '../config/config-group.ts';
import { createDeployCommand } from '../deploy/deploy-group.ts';
import { createGenerateCommand } from '../generate/generate-group.ts';
import { createInitCommand } from '../init/init-command.ts';
import { createMarketplaceCommand } from '../marketplace/marketplace-group.ts';
import { createPluginCommand } from '../plugins/plugins-group.ts';
import { createServiceCommand } from '../services/services-group.ts';
import { createTokensCommand } from '../tokens/tokens-group.ts';
import { createUiAddCommand } from '../ui/add/add-ui-command.ts';
import { createUiInitCommand } from '../ui/init/init-ui-command.ts';
import { createAgentCommand } from '../agent/agent-group.ts';
import { createUiListCommand } from '../ui/list/list-ui-command.ts';
import { createUiUpdateCommand } from '../ui/update/update-ui-command.ts';
import { createUiMigrateCommand } from '../ui/migrate/migrate-ui-command.ts';
import { createUiRemoveCommand } from '../ui/remove/remove-ui-command.ts';
import {
  createPublicCommandDependencies,
  type PublicCommandDependencies,
} from './public-command-dependencies.ts';
import { CLI_PACKAGE_VERSION } from '../../../kernel/assets/publish-assets.generated.ts';

/** Host services supplied by the binary edge. */
export interface PublicCliHost {
  /** Return the current working directory. */
  readonly cwd: () => string;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: (path?: string) => string;
}

/** Public command tree returned by `createPublicCli`. */
export interface PublicCliCommand {
  /** Parse command-line arguments. */
  readonly parse: (args?: string[]) => Promise<unknown> | unknown;
  /** Return the command version printed by `--version`. */
  readonly getVersion: () => string | undefined;
}

/** Context passed to public command factories. */
export interface PublicCommandContext {
  /** Host services supplied by the binary edge. */
  readonly host: PublicCliHost;
  /** Shared dependencies for public commands. */
  readonly dependencies: PublicCommandDependencies;
}

/** Create the registry of public command factories. */
export function createPublicCommandRegistry(): CliCommandRegistry<PublicCommandContext> {
  const registry = new CliCommandRegistry<PublicCommandContext>();

  registry.register('agent', {
    id: 'agent',
    create: ({ host, dependencies }) => createAgentCommand(host, dependencies),
  });
  registry.register('config', {
    id: 'config',
    create: ({ dependencies }) => createConfigCommand(dependencies),
  });
  registry.register('deploy', {
    id: 'deploy',
    create: ({ dependencies }) => createDeployCommand(dependencies),
  });
  registry.register('init', {
    id: 'init',
    create: ({ dependencies }) => createInitCommand(dependencies.initCommandDependencies),
  });
  registry.register('contract', {
    id: 'contract',
    create: () => contractCommand,
  });
  registry.register('db', {
    id: 'db',
    create: ({ host, dependencies }) => createDbCommand(host, dependencies),
  });
  registry.register('generate', {
    id: 'generate',
    create: ({ dependencies }) => createGenerateCommand(dependencies),
  });
  registry.register('marketplace', {
    id: 'marketplace',
    create: () => createMarketplaceCommand(),
  });
  registry.register('plugin', {
    id: 'plugin',
    create: ({ dependencies }) => createPluginCommand(dependencies),
  });
  registry.register('service', {
    id: 'service',
    create: ({ dependencies }) => createServiceCommand(dependencies),
  });
  registry.register('tokens', {
    id: 'tokens',
    create: ({ dependencies }) => createTokensCommand(dependencies),
  });
  registry.register('ui:build', {
    id: 'ui:build',
    create: ({ host, dependencies }) =>
      createUiBuildCommand({
        fs: dependencies.fs,
        paths: dependencies.uiRegistryPaths,
        resolvePath: host.resolvePath,
      }),
  });
  registry.register('ui:add', {
    id: 'ui:add',
    create: ({ dependencies }) =>
      createUiAddCommand({
        installDependencies: dependencies.uiInstallDependencies,
        resolveUiAppRoot: dependencies.resolveUiAppRoot,
      }),
  });
  registry.register('ui:apply', {
    id: 'ui:apply',
    create: ({ dependencies }) =>
      createUiApplyCommand({
        installDependencies: dependencies.uiInstallDependencies,
        resolveUiAppRoot: dependencies.resolveUiAppRoot,
      }),
  });
  registry.register('ui:init', {
    id: 'ui:init',
    create: ({ dependencies }) =>
      createUiInitCommand({
        installDependencies: dependencies.uiInstallDependencies,
        resolveUiAppRoot: dependencies.resolveUiAppRoot,
      }),
  });
  for (
    const [id, create] of [
      ['ui:list', createUiListCommand],
      ['ui:update', createUiUpdateCommand],
    ] as const
  ) {
    registry.register(id, {
      id,
      create: ({ dependencies }) =>
        create({
          installDependencies: dependencies.uiInstallDependencies,
          resolveUiAppRoot: dependencies.resolveUiAppRoot,
        }),
    });
  }

  for (const kind of ['view', 'search', 'docs', 'info'] as const) {
    registry.register(`ui:${kind}`, {
      id: `ui:${kind}`,
      create: ({ dependencies }) =>
        createUiInspectCommand(kind, {
          installDependencies: dependencies.uiInstallDependencies,
          resolveUiAppRoot: dependencies.resolveUiAppRoot,
        }),
    });
  }
  registry.register('ui:registry', {
    id: 'ui:registry',
    create: ({ host, dependencies }) =>
      createUiRegistryCommand({
        installDependencies: dependencies.uiInstallDependencies,
        resolveUiAppRoot: dependencies.resolveUiAppRoot,
        resolvePath: host.resolvePath,
      }),
  });
  registry.register('ui:preset', { id: 'ui:preset', create: () => createUiPresetCommand() });
  registry.register('ui:migrate', {
    id: 'ui:migrate',
    create: ({ dependencies }) =>
      createUiMigrateCommand({
        fs: dependencies.uiInstallDependencies.fs,
        formatter: dependencies.uiPageFormatter,
        resolveUiAppRoot: dependencies.resolveUiAppRoot,
      }),
  });

  registry.register('ui:remove', {
    id: 'ui:remove',
    create: ({ dependencies }) =>
      createUiRemoveCommand({
        installDependencies: dependencies.uiInstallDependencies,
        resolveUiAppRoot: dependencies.resolveUiAppRoot,
        writeManifest: dependencies.generateRoutesCommandDependencies.writeManifest,
        formatter: dependencies.uiPageFormatter,
      }),
  });

  return registry;
}

/** Create the public NetScript CLI command tree. */
export function createPublicCommandTree(host: PublicCliHost): PublicCliCommand {
  const dependencies = createPublicCommandDependencies(host);
  const registry = createPublicCommandRegistry();

  return registry.program({
    name: 'netscript',
    version: CLI_PACKAGE_VERSION,
    description: 'NetScript - enterprise-grade polyglot backend framework CLI',
    context: { host, dependencies },
  });
}
