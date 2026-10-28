import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { installUiRegistryItems } from '../registry.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../presentation/support.ts';
import { installUiRegistry } from '../../../../kernel/application/ui/v2/install-registry.ts';
import type { UiRegistryDependencies } from '../../../../kernel/application/ui/v2/registry-client.ts';
import { reportScaffold, reportUiRegistry } from './add-ui-output.ts';
import type { UiAddCommandInput } from './add-ui-input.ts';
import {
  scaffoldUiIsland,
  scaffoldUiPage,
  type UiGeneratedFileRole,
} from '../../../../kernel/application/ui/page/web-scaffold.ts';
/** Semantic roles emitted by the public data-screen scaffold. */
export const UI_DATA_SCREEN_FILE_ROLES = [
  'page',
  'query-loader',
  'island',
  'route-registration',
  'navigation-registration',
] as const satisfies readonly UiGeneratedFileRole[];

const DATA_SCREEN_HELP = `Data-screen roles: ${
  UI_DATA_SCREEN_FILE_ROLES.join(', ')
}. New island output uses routes/**/(_islands)/; existing top-level islands remain compatible.`;

/** Dependencies for the public `ui:add` command handler. */
export interface UiAddCommandDependencies {
  /** Application dependencies for installing Fresh UI registry files. */
  readonly installDependencies: UiRegistryDependencies;
  /** Resolve the Fresh application root from flags or environment. */
  readonly resolveUiAppRoot: UiAppRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the public `ui:add <item|collection>` command. */
export function createUiAddCommand(
  dependencies: UiAddCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('ui:add')
    .description(
      `Scaffold a Fresh data screen or copy an app-owned UI registry item. ${DATA_SCREEN_HELP}`,
    )
    .example(
      'Data-screen triad',
      'netscript ui:add page incidents --island\nCreates one data-screen unit: typed page route + colocated hydrating island + query loader. Use it when a route will load data and hydrate an interactive region.',
    )
    .example(
      'Registry item',
      'netscript ui:add data-table\nUse a registry item when the route already exists and you only need an app-owned component and its styles.',
    )
    .arguments('<kind:string> [name:string]')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--app <name:string>', 'Fresh app workspace name')
    .option('--registry-root <path:string>', 'Fresh UI package root override')
    .option('--theme <name:string>', 'Theme registry item (defaults to the official theme)')
    .option('--diff', 'Show local and registry differences without writing files')
    .option('--json', 'Emit structured registry results')
    .option('--force', 'Overwrite existing copied UI or scaffold files', { default: false })
    .option(
      '--dry-run',
      'For page and island scaffolds, report the complete file plan without writing it',
      { default: false },
    )
    .option('--route <id:string>', "Override the generated page's typed route id")
    .option(
      '--island',
      'For page scaffolds, add the colocated hydrating island and query-loader parts of the triad',
      { default: false },
    )
    .option(
      '--nav [label:string]',
      'For page scaffolds, link the page in the top bar (navigation.ts), optionally with a label; top-level pages are linked by default',
    )
    .option('--no-nav', 'For page scaffolds, do not link the page in the top bar')
    .option(
      '--query',
      'For island scaffolds, generate a QueryIsland-based surface for contract-derived queries',
      { default: false },
    )
    .option(
      '--client <service:string>',
      'Select the generated service query client for a data-bound page or island',
    )
    .action(async (options: UiAddCommandInput, kind: string, name?: string): Promise<void> => {
      const projectRoot = await requireUiAppRoot(
        dependencies.resolveUiAppRoot,
        { projectRoot: options.projectRoot, app: options.app },
      );
      if (kind === 'page') {
        if (!name) throw new Error('ui:add page requires <path>.');
        const result = await scaffoldUiPage({
          projectRoot,
          path: name,
          route: options.route,
          island: options.island,
          client: options.client,
          nav: options.nav,
          force: options.force,
          dryRun: options.dryRun,
        }, dependencies.installDependencies.fs);
        reportScaffold(result, options.dryRun ?? false, print);
        return;
      }
      if (options.nav !== undefined) {
        throw new Error('--nav and --no-nav are supported only for page scaffolds.');
      }
      if (kind === 'island') {
        if (!name) throw new Error('ui:add island requires <Name>.');
        const result = await scaffoldUiIsland({
          projectRoot,
          name,
          query: options.query,
          client: options.client,
          force: options.force,
          dryRun: options.dryRun,
        }, dependencies.installDependencies.fs);
        reportScaffold(result, options.dryRun ?? false, print);
        return;
      }
      if (options.dryRun) {
        throw new Error('--dry-run is supported only for page and island scaffolds.');
      }
      if (name) throw new Error('Registry installation accepts one item reference.');
      if (options.registryRoot) {
        if (options.diff) {
          throw new Error('--diff requires a JSON registry rather than a legacy module override.');
        }
        const result = await installUiRegistryItems({
          projectRoot,
          registryRoot: options.registryRoot,
          names: [kind],
          overwrite: options.force ?? false,
          theme: options.theme,
        }, dependencies.installDependencies);
        print(`Installed ${result.installedItems.length} Fresh UI registry items.`);
        print(`Copied ${result.copiedFiles.length} files.`);
        return;
      }
      const result = await installUiRegistry({
        root: projectRoot,
        names: [kind],
        force: options.force,
        theme: options.theme,
        diff: options.diff,
      }, dependencies.installDependencies);
      reportUiRegistry(result, options, print);
    });
}
