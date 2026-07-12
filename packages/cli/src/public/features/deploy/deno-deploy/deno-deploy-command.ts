import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
/**
 * @module commands/deploy/deno-deploy
 *
 * `netscript deploy deno-deploy <op>` — dispatch the Deno Deploy cloud target's
 * operations (`plan`/`up`/`down`/`status`/`logs`).
 *
 * This surface is deliberately thin (R-DEPLOY-2): it maps CLI flags
 * (`--org`/`--app`/`--prod`/`--entrypoint`/`--env-file`/`--dry-run`) onto the
 * resolved target config and delegates to the domain target. All target logic —
 * the unstable-API guard, `deno deploy` argv, production-push refusal — lives in
 * the domain/adapter layers. No `Deno.Command` is issued here (F-CLI-16); the
 * target is composed via `createDenoDeployTarget`.
 */

import { Command } from '@cliffy/command';
import { red } from '@std/fmt/colors';

import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { createDenoDeployTarget } from '../../../../kernel/adapters/deno-deploy/create-deno-deploy-target.ts';
import { resolveDenoDeployTarget } from '../../../../kernel/adapters/config/deploy-config-resolvers.ts';
import type {
  DeployTargetOperation,
  DeployTargetPort,
} from '../../../../kernel/domain/deploy/deploy-target-port.ts';
import type { DenoDeployTargetDefaults } from '../../../../kernel/domain/deploy/deno-deploy-target.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';

/** Dependencies the Deno Deploy command surface needs. */
type DenoDeployCommandDependencies =
  & Pick<
    PublicCommandDependencies,
    'loadConfig' | 'resolveProjectRoot'
  >
  & {
    /** Compose the target implementation. Defaults to the concrete Deno Deploy adapter. */
    readonly createTarget?: (defaults: DenoDeployTargetDefaults) => DeployTargetPort;
  };

/** Flag overrides shared by every Deno Deploy operation. */
interface DenoDeployFlags {
  readonly org?: string;
  readonly app?: string;
  readonly prod?: boolean;
  readonly entrypoint?: string;
  readonly envFile?: string;
  readonly projectRoot?: string;
}

/** Resolve the project root, best-effort config, and dispatch a single op. */
async function dispatch(
  operation: DeployTargetOperation,
  dependencies: DenoDeployCommandDependencies,
  flags: DenoDeployFlags,
): Promise<void> {
  const projectRoot = (await dependencies.resolveProjectRoot(flags.projectRoot)) ?? Deno.cwd();

  // Merge netscript.config.ts `deploy.targets['deno-deploy']` with CLI flags
  // (flags win). Config is optional — flags alone are sufficient.
  let deploySection;
  try {
    const config = await dependencies.loadConfig({ cwd: projectRoot });
    deploySection = config.deploy;
  } catch {
    deploySection = undefined;
  }

  const resolved = resolveDenoDeployTarget(deploySection, {
    org: flags.org,
    app: flags.app,
    prod: flags.prod,
    entrypoint: flags.entrypoint,
    envFile: flags.envFile,
  });

  const target: DeployTargetPort = dependencies.createTarget?.(resolved) ??
    createDenoDeployTarget(resolved);
  const handler = target[operation];
  if (!handler) {
    outputError(red(`✗ Deno Deploy does not support \`${operation}\`.`));
    failDeployCommand('Deploy command failed.');
  }

  try {
    const result = await handler({ projectRoot });
    outputText(result.message);
  } catch (error: unknown) {
    outputError(red(`✗ ${error instanceof Error ? error.message : String(error)}`));
    failDeployCommand('Deploy command failed.');
  }
}

/** Attach the flags shared by every Deno Deploy subcommand. */
function withDenoDeployFlags(
  command: CliffyCommand,
): CliffyCommand {
  return command
    .option('--org <org:string>', 'Deno Deploy organization slug')
    .option('--app <app:string>', 'Deno Deploy application/project name')
    .option('--entrypoint <path:string>', 'Entrypoint module passed to `deno deploy`')
    .option('--env-file <path:string>', 'Env file loaded via --env-file')
    .option('--project-root <dir:string>', 'Project root (defaults to discovered root or cwd)');
}

/** Create the `netscript deploy deno-deploy` command group. */
export function createDenoDeployCommand(
  dependencies: DenoDeployCommandDependencies,
): CliffyCommand {
  const toFlags = (options: Record<string, unknown>): DenoDeployFlags => ({
    org: options.org as string | undefined,
    app: options.app as string | undefined,
    prod: options.prod as boolean | undefined,
    entrypoint: options.entrypoint as string | undefined,
    envFile: options.envFile as string | undefined,
    projectRoot: options.projectRoot as string | undefined,
  });

  const plan = withDenoDeployFlags(
    new Command()
      .name('plan')
      .description('Preflight the project for Deno Deploy (unstable-API guard; no push)'),
  ).action((options) => dispatch('plan', dependencies, toFlags(options)));

  const up = withDenoDeployFlags(
    new Command()
      .name('up')
      .description('Push a deployment (`deno deploy [--prod]`)')
      .option('--prod', 'Push to production')
      .option('--dry-run', 'Preflight only (equivalent to `plan`); do not push'),
  ).action((options) => dispatch(options.dryRun ? 'plan' : 'up', dependencies, toFlags(options)));

  const down = withDenoDeployFlags(
    new Command().name('down').description('Delete the deployment'),
  ).action((options) => dispatch('down', dependencies, toFlags(options)));

  const status = withDenoDeployFlags(
    new Command().name('status').description('Show deployment status'),
  ).action((options) => dispatch('status', dependencies, toFlags(options)));

  const logs = withDenoDeployFlags(
    new Command().name('logs').description('Show deployment logs'),
  ).action((options) => dispatch('logs', dependencies, toFlags(options)));

  return new Command()
    .name('deno-deploy')
    .description('Deploy to Deno Deploy (cloud target)')
    .action(function () {
      this.showHelp();
    })
    .command('plan', plan)
    .command('up', up)
    .command('down', down)
    .command('status', status)
    .command('logs', logs);
}
