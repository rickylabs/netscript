import { Command } from '@cliffy/command';
import { DB_ENGINE_CHOICES, type DbEngineChoice } from '../../../kernel/domain/db-engine.ts';
import type { EditorChoice } from '../../../kernel/domain/scaffold/workspace-config.ts';
import type { InitPipelineContext } from '../../../kernel/application/scaffold/context.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../kernel/application/registries/template-registry.ts';
import { executeInit } from '../../../kernel/application/scaffold/orchestrate-init.ts';
import { PresetRegistry } from '../../../kernel/application/registries/preset-registry.ts';
import type { ProjectNameResolver } from '../../presentation/support.ts';
import type { InitCommandInput } from './init-input.ts';

const EDITOR_CHOICES: readonly EditorChoice[] = ['none', 'zed', 'vscode'];

/** Dependencies for the public `init` command handler. */
export interface InitCommandDependencies {
  /** Application context for the scaffold pipeline. */
  readonly initContext: InitPipelineContext;
  /** Create the scaffold pipeline context for a parsed init invocation. */
  readonly createInitContext?: (options: { readonly dryRun: boolean }) => InitPipelineContext;
  /** Default name when the command is invoked without an argument. */
  readonly defaultProjectName: ProjectNameResolver;
}

function dbEngine(raw: string | undefined): DbEngineChoice | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase() as DbEngineChoice;
  if (!DB_ENGINE_CHOICES.includes(normalized)) {
    throw new Error(`--db must be one of: ${DB_ENGINE_CHOICES.join(', ')}`);
  }
  return normalized;
}

function editor(raw: string | undefined): EditorChoice | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase() as EditorChoice;
  if (!EDITOR_CHOICES.includes(normalized)) {
    throw new Error(`--editor must be one of: ${EDITOR_CHOICES.join(', ')}`);
  }
  return normalized;
}

/** Create the public `init` command. */
export function createInitCommand(
  dependencies: InitCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new Command()
    .name('init')
    .description('Scaffold a new NetScript workspace')
    .arguments('[name:string]')
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
    .action(async (options: InitCommandInput, nameArg?: string): Promise<void> => {
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
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
      const dryRun = options.dryRun ?? false;
      const initContext = dependencies.createInitContext?.({ dryRun }) ?? dependencies.initContext;
      await executeInit(initContext, {
        name: nameArg ?? dependencies.defaultProjectName(),
        appName: options.appName,
        path: options.path,
        importMode: 'jsr',
        editor: editor(options.editor),
        force: options.force ?? false,
        ci: options.ci ?? false,
        yes: options.yes ?? false,
        dryRun,
        json: options.json ?? false,
        from: options.from,
        noGit: options.git === false,
        noAspire: options.aspire === false,
        legacyAspire: options.legacyAspire ?? false,
        dbEngine: dbEngine(options.db),
        includeExampleService: includeService,
        serviceName: options.serviceName,
        servicePort: options.servicePort,
      });
    });
}
