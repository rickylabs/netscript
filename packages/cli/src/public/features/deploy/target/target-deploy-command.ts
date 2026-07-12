/**
 * @module public/features/deploy/target/target-deploy-command
 *
 * Thin `deploy <target>` router (Archetype 6 / R-DEPLOY-2, F-DEPLOY-2).
 */

import { Command } from '@cliffy/command';
import type { DeployOperation } from '../../../../kernel/domain/deploy/deploy-target-port.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { createTargetSecretsCommand } from './target-secrets-command.ts';
import { runTargetOperation } from './run-target-operation.ts';

/** Lifecycle verbs the target router exposes; each is routed to the adapter as-is. */
const ROUTED_OPERATIONS: readonly DeployOperation[] = [
  'plan',
  'up',
  'down',
  'status',
  'logs',
  'rollback',
  'secrets',
];

/** Human-readable descriptions for the routed lifecycle verbs. */
const OPERATION_DESCRIPTIONS: Readonly<Record<DeployOperation, string>> = {
  plan: 'Emit or preflight deployment artifacts',
  emit: 'Emit deployment artifacts',
  up: 'Bring the deployment up',
  down: 'Bring the deployment down',
  status: 'Show deployment status',
  logs: 'Show deployment logs',
  rollback: 'Roll the deployment back',
  secrets: 'Reconcile deployment secrets',
};

/**
 * Build a thin `deploy <target>` router command.
 *
 * The router only parses flags and routes to the registry-resolved adapter — it
 * holds **no** target-specific logic (the adapter branches on its own key). Verb
 * subcommands are derived from the adapter's advertised `operations`, so an
 * adapter that omits an op (e.g. `rollback`/`secrets`) never exposes it.
 */
export function createTargetDeployCommand(
  key: string,
  dependencies: PublicCommandDependencies,
  // deno-lint-ignore no-explicit-any -- cliffy's generic command surface is `any` at the router edge.
): Command<any, any, any, any, any, any, any, any> {
  const target = dependencies.deployTargets.get(key);
  const label = target?.label ?? key;
  const group = new Command()
    .name(key)
    .description(`Manage the ${label} deployment target`)
    .action(function () {
      this.showHelp();
    });

  for (const operation of ROUTED_OPERATIONS) {
    if (!target?.operations.includes(operation)) continue;
    if (operation === 'secrets') {
      group.command('secrets', createTargetSecretsCommand(key, dependencies));
      continue;
    }
    group.command(
      operation,
      new Command()
        .description(OPERATION_DESCRIPTIONS[operation])
        .option(
          '--project-root <dir:string>',
          'Project root for the deployment operation',
        )
        .option(
          '--output-dir <dir:string>',
          'Directory for emitted deployment artifacts',
        )
        .option(
          '--environment <name:string>',
          'Deployment environment passed to the target',
        )
        .option(
          '--clear-cache',
          'Clear target deployment state and do not persist new values',
        )
        .option('--non-interactive', 'Run the target in non-interactive mode')
        .action(async (
          options: {
            projectRoot?: string;
            outputDir?: string;
            environment?: string;
            clearCache?: boolean;
            nonInteractive?: boolean;
          },
        ) => {
          await runTargetOperation(dependencies, key, operation, options);
        }),
    );
  }

  return group;
}
