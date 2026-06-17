import { outputText } from '../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import type { DbEngineChoice } from '../../../kernel/domain/db-engine.ts';
import type { EditorChoice } from '../../../kernel/domain/scaffold/workspace-config.ts';
import {
  type MaintainerInitDependencies,
  orchestrateMaintainerInit,
} from './orchestrate-maintainer-init.ts';
import { PresetRegistry } from '../../../kernel/application/registries/preset-registry.ts';

const DB_ENGINE_CHOICES: readonly DbEngineChoice[] = [
  'postgres',
  'mysql',
  'mssql',
  'sqlite',
  'none',
];
const EDITOR_CHOICES: readonly EditorChoice[] = ['none', 'zed', 'vscode'];

/** Dependencies for the maintainer `init` command handler. */
export interface MaintainerInitCommandDependencies {
  /** Maintainer init application service dependencies. */
  readonly initDependencies: MaintainerInitDependencies;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

function parseDbEngine(raw: string | undefined): DbEngineChoice | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase() as DbEngineChoice;
  if (!DB_ENGINE_CHOICES.includes(normalized)) {
    throw new Error(`--db must be one of: ${DB_ENGINE_CHOICES.join(', ')}`);
  }
  return normalized;
}

function parseEditor(raw: string | undefined): EditorChoice | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase() as EditorChoice;
  if (!EDITOR_CHOICES.includes(normalized)) {
    throw new Error(`--editor must be one of: ${EDITOR_CHOICES.join(', ')}`);
  }
  return normalized;
}

/** Create the maintainer `init` command. */
export function createMaintainerInitCommand(
  dependencies: MaintainerInitCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('init')
    .description('Scaffold a NetScript workspace from local monorepo sources')
    .arguments('<name:string>')
    .option('--app-name <name:string>', 'Frontend application name (kebab-case)')
    .option('--db <engine:string>', `Database engine (${DB_ENGINE_CHOICES.join(' | ')})`)
    .option('--service [enabled:boolean]', 'Scaffold an example oRPC service', { default: false })
    .option('--service-name <name:string>', 'Example service name')
    .option('--service-port <port:number>', 'Example service port')
    .option('--editor <editor:string>', `Editor config (${EDITOR_CHOICES.join(' | ')})`)
    .option('--no-aspire', 'Skip Aspire orchestration layer')
    .option('--legacy-aspire', 'Generate legacy C# AppHost', { default: false })
    .option('--no-git', 'Skip git init after scaffolding')
    .option('--force', 'Overwrite existing target directory', { default: false })
    .option('--ci', 'Non-interactive mode', { default: false })
    .option('-y, --yes', 'Accept defaults without prompting', { default: false })
    .option('--path <path:string>', 'Target directory for scaffold output')
    .option('--dry-run', 'Preview scaffold plan without writing files', { default: false })
    .option('--json', 'Emit a single machine-readable JSON result', { default: false })
    .option('--from <preset:string>', 'Apply a named scaffold preset')
    .action(async (options, name: string): Promise<void> => {
      if (options.from !== undefined) {
        const presets = new PresetRegistry();
        if (presets.entries().length === 0) {
          throw new Error('no presets registered');
        }
        if (presets.get(options.from) === undefined) {
          throw new Error(`preset "${options.from}" is not registered`);
        }
      }
      const includeService = options.service === true ||
        options.serviceName !== undefined ||
        options.servicePort !== undefined;
      const result = await orchestrateMaintainerInit({
        name,
        appName: options.appName,
        path: options.path,
        editor: parseEditor(options.editor),
        force: options.force ?? false,
        ci: options.ci ?? false,
        yes: options.yes ?? false,
        dryRun: options.dryRun ?? false,
        json: options.json ?? false,
        from: options.from,
        noGit: options.git === false,
        noAspire: options.aspire === false,
        legacyAspire: options.legacyAspire ?? false,
        dbEngine: parseDbEngine(options.db),
        includeExampleService: includeService,
        serviceName: options.serviceName,
        servicePort: options.servicePort,
      }, dependencies.initDependencies);

      if (options.json === true) return;
      print(`Maintainer scaffold root: ${result.init.targetPath}`);
      print(`Monorepo root: ${result.sourceRoot}`);
      if (result.packageSync) {
        print(`Copied ${result.packageSync.packagesCopied} local packages.`);
      }
    });
}
