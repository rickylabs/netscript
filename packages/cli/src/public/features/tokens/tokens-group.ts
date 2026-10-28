import { Command } from '@cliffy/command';
import { buildAppTokens } from '../../../kernel/application/tokens/build-app-tokens.ts';
import { cleanAppTokens } from '../../../kernel/application/tokens/clean-app-tokens.ts';
import { initAppTokens } from '../../../kernel/application/tokens/init-app-tokens.ts';
import type { AppTokenDependencies } from '../../../kernel/application/tokens/token-files.ts';
import type { CliffyCommand } from '../../../kernel/presentation/command-types.ts';
import { outputText } from '../../../kernel/presentation/output/default-output.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../presentation/support.ts';

/** Token commands reuse the same app selection as the Fresh UI registry commands. */
export interface TokensCommandDependencies extends AppTokenDependencies {
  readonly resolveUiAppRoot: UiAppRootResolver;
  readonly print?: (message: string) => void;
}

interface TokenCommandOptions {
  readonly projectRoot?: string;
  readonly app?: string;
  readonly preset?: string;
  readonly override?: string;
  readonly force?: boolean;
}

/** Create the app-owned token source, build and cleanup commands. */
export function createTokensCommand(dependencies: TokensCommandDependencies): CliffyCommand {
  const print = dependencies.print ?? outputText;
  const root = (options: TokenCommandOptions) =>
    requireUiAppRoot(dependencies.resolveUiAppRoot, {
      projectRoot: options.projectRoot,
      app: options.app,
    });
  const appCommand = (name: string, description: string) =>
    new Command().name(name)
      .description(description)
      .option('--project-root <path:string>', 'Fresh application root directory')
      .option('--app <name:string>', 'Fresh app workspace name');
  const build = appCommand('build', 'Build app token assets with a final semantic alias layer')
    .option('--preset <id:string>', 'Language preset (defaults to app configuration)')
    .option('--override <path:string>', 'Semantic DTCG override relative to the selected app')
    .action(async (options: TokenCommandOptions) => {
      const result = await buildAppTokens({ ...options, root: await root(options) }, dependencies);
      print(`Built ${result.files.length} token assets for ${result.preset}.`);
    });
  const clean = appCommand('clean', 'Remove generated token assets while retaining app sources')
    .action(async (options: TokenCommandOptions) => {
      const files = await cleanAppTokens(await root(options), dependencies);
      print(`Removed ${files.length} generated token assets.`);
    });
  const init = appCommand('init', 'Copy editable DTCG sources and a semantic app override')
    .option('--preset <id:string>', 'Initial language preset (defaults to NS One)')
    .option('--force', 'Replace existing token configuration and sources', { default: false })
    .action(async (options: TokenCommandOptions) => {
      const result = await initAppTokens({ ...options, root: await root(options) }, dependencies);
      print(`Initialized ${result.files.length} token source files for ${result.preset}.`);
      print('Edit tokens/semantic.tokens.json, then run netscript tokens build.');
    });
  return new Command().name('tokens').description('Manage Fresh application design tokens')
    .action(function () {
      this.showHelp();
    })
    .command('build', build).command('clean', clean).command('init', init);
}
