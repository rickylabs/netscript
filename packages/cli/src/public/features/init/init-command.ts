import { AGENT_HOSTS } from '../agent/init/init-agent-input.ts';
import { Command } from '@cliffy/command';
import type { CliffyCommand } from '../../../kernel/presentation/command-types.ts';
import { CACHE_BACKEND_CHOICES } from '../../../kernel/domain/cache-backend.ts';
import { DB_ENGINE_CHOICES } from '../../../kernel/domain/db-engine.ts';
import { EDITOR_CHOICES } from '../../../kernel/domain/scaffold/workspace-config.ts';
import type { InitCommandInput } from './init-input.ts';
import { type InitCommandDependencies, runInitCommand } from './run-init-command.ts';

export type { InitCommandDependencies } from './run-init-command.ts';

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
    .option(
      '--service-port <port:number>',
      'Pin the example service to this Aspire host port (weakens `aspire start --isolated`). Omit to let Aspire assign one.',
    )
    .option('--cache [enabled:boolean]', 'Scaffold a shared cache resource')
    .option(
      '--cache-backend <backend:string>',
      `Shared cache backend (${CACHE_BACKEND_CHOICES.join(' | ')})`,
    )
    .option('--editor <editor:string>', `Editor config (${EDITOR_CHOICES.join(' | ')})`)
    .option('--no-agent', 'Skip MCP configuration, agent skills, and guidance installation')
    .option(
      '--host <host:string>',
      `Agent host (${[...AGENT_HOSTS, 'all'].join(' | ')}); inferred when omitted`,
    )
    .option('--with-docs', 'Opt in to offline agent documentation; ignored with --no-agent')
    .option('--no-aspire', 'Skip Aspire orchestration layer')
    .option('--no-git', 'Skip git init after scaffolding')
    .option('--force', 'Overwrite existing target directory', { default: false })
    .option('--ci', 'Non-interactive mode', { default: false })
    .option('--non-interactive', 'Run without prompting', { default: false })
    .option('-y, --yes', 'Accept defaults without prompting', { default: false })
    .option('--path <path:string>', 'Target directory for scaffold output')
    .option('--dry-run', 'Preview scaffold plan without writing files', { default: false })
    .option('--json', 'Emit a single machine-readable JSON result', { default: false })
    .option('--from <preset:string>', 'Apply a named scaffold preset')
    .option('--preset <code:string>', 'UI preset code, theme/preset JSON URL, or token preset id')
    .action((options: InitCommandInput, nameArg?: string): Promise<void> =>
      runInitCommand(dependencies, options, nameArg, Deno.stdin.isTerminal())
    );
}
