import type { CliffyCommand } from "../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
import {
  CACHE_BACKEND_CHOICES,
  type CacheBackendChoice,
} from '../../../kernel/domain/cache-backend.ts';
import { DB_ENGINE_CHOICES, type DbEngineChoice } from '../../../kernel/domain/db-engine.ts';
import type { EditorChoice } from '../../../kernel/domain/scaffold/workspace-config.ts';
import type { InitPipelineContext } from '../../../kernel/application/scaffold/context.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../kernel/application/registries/template-registry.ts';
import { executeInit } from '../../../kernel/application/scaffold/orchestrate-init.ts';
import { PresetRegistry } from '../../../kernel/application/registries/preset-registry.ts';
import type { PromptPort } from '../../../kernel/ports/prompt-port.ts';
import type { ProjectNameResolver } from '../../presentation/support.ts';
import type { InitCommandInput } from './init-input.ts';
import { resolveInteractiveInitInput } from './init-interactive.ts';

const EDITOR_CHOICES: readonly EditorChoice[] = ['none', 'zed', 'vscode'];

/** Dependencies for the public `init` command handler. */
export interface InitCommandDependencies {
  /** Application context for the scaffold pipeline. */
  readonly initContext: InitPipelineContext;
  /** Create the scaffold pipeline context for a parsed init invocation. */
  readonly createInitContext?: (options: { readonly dryRun: boolean }) => InitPipelineContext;
  /** Default name when the command is invoked without an argument. */
  readonly defaultProjectName: ProjectNameResolver;
  /** Prompt adapter used by interactive terminal init. */
  readonly prompt: PromptPort;
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

function cacheBackend(raw: string | undefined): CacheBackendChoice | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase();
  if (!isCacheBackendChoice(normalized)) {
    throw new Error(`--cache-backend must be one of: ${CACHE_BACKEND_CHOICES.join(', ')}`);
  }
  return normalized;
}

function isCacheBackendChoice(value: string): value is CacheBackendChoice {
  return CACHE_BACKEND_CHOICES.some((choice) => choice === value);
}

/** Create the public `init` command. */
export function createInitCommand(
  dependencies: InitCommandDependencies,
): CliffyCommand {
  return new Command()
    .name('init')
    .description('Scaffold a new NetScript workspace')
    .arguments('[name:string]')
    .option('--app-name <name:string>', 'Frontend application name (kebab-case)')
    .option('--db <engine:string>', `Database engine (${DB_ENGINE_CHOICES.join(' | ')})`)
    .option('--service [enabled:boolean]', 'Scaffold an example oRPC service')
    .option('--service-name <name:string>', 'Example service name')
    .option('--model-name <name:string>', 'Prisma model name for the scaffolded CRUD surface')
    .option('--service-port <port:number>', 'Example service port')
    .option('--cache [enabled:boolean]', 'Scaffold a shared cache resource')
    .option(
      '--cache-backend <backend:string>',
      `Shared cache backend (${CACHE_BACKEND_CHOICES.join(' | ')})`,
    )
    .option('--editor <editor:string>', `Editor config (${EDITOR_CHOICES.join(' | ')})`)
    .option('--no-aspire', 'Skip Aspire orchestration layer')
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
      const resolved = await resolveInteractiveInitInput(
        dependencies.prompt,
        options,
        nameArg,
        dependencies.defaultProjectName,
        Deno.stdin.isTerminal(),
      );
      const resolvedOptions = resolved.options;
      const includeService = resolvedOptions.service === true ||
        resolvedOptions.serviceName !== undefined ||
        resolvedOptions.servicePort !== undefined;
      const dryRun = resolvedOptions.dryRun ?? false;
      const initContext = dependencies.createInitContext?.({ dryRun }) ?? dependencies.initContext;
      await executeInit(initContext, {
        name: resolved.name,
        appName: resolvedOptions.appName,
        path: resolvedOptions.path,
        importMode: 'jsr',
        editor: editor(resolvedOptions.editor),
        force: resolvedOptions.force ?? false,
        ci: resolvedOptions.ci ?? false,
        yes: resolvedOptions.yes ?? false,
        dryRun: resolvedOptions.dryRun ?? false,
        json: resolvedOptions.json ?? false,
        from: resolvedOptions.from,
        noGit: resolvedOptions.git === false,
        noAspire: resolvedOptions.aspire === false,
        dbEngine: dbEngine(resolvedOptions.db),
        cache: resolvedOptions.cache,
        cacheBackend: cacheBackend(resolvedOptions.cacheBackend),
        includeExampleService: includeService,
        serviceName: resolvedOptions.serviceName,
        modelName: resolvedOptions.modelName,
        servicePort: resolvedOptions.servicePort,
      });
    });
}
