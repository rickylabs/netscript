/**
 * @module public/features/deploy/target/target-deploy-command
 *
 * Thin `deploy <target>` router (Archetype 6 / R-DEPLOY-2, F-DEPLOY-2).
 */

import { Command } from '@cliffy/command';
import { green, red } from '@std/fmt/colors';
import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { DeployOperation } from '../../../../kernel/domain/deploy/deploy-target-port.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';

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
    group.command(
      operation,
      new Command()
        .description(OPERATION_DESCRIPTIONS[operation])
        .option('--project-root <dir:string>', 'Project root for the deployment operation')
        .option('--output-dir <dir:string>', 'Directory for emitted deployment artifacts')
        .action(async (options: { projectRoot?: string; outputDir?: string }) => {
          await runTargetOperation(dependencies, key, operation, options);
        }),
    );
  }

  return group;
}

async function runTargetOperation(
  dependencies: PublicCommandDependencies,
  key: string,
  operation: DeployOperation,
  options: { projectRoot?: string; outputDir?: string },
): Promise<void> {
  const target = dependencies.deployTargets.get(key);
  if (!target || typeof target[operation] !== 'function') {
    outputError(red(`✗ Deploy target '${key}' does not support '${operation}'.`));
    failDeployCommand(`Unsupported deploy operation: ${key} ${operation}`);
  }

  const projectRoot = await dependencies.resolveProjectRoot(options.projectRoot);
  if (!projectRoot) {
    outputError(red('✗ Could not resolve a project root. Pass --project-root.'));
    failDeployCommand('Deploy command failed: project root not found.');
  }

  try {
    const result = await target[operation]!({ projectRoot, outputDir: options.outputDir });
    outputText(green(`✓ ${result.message}`));
  } catch (error: unknown) {
    outputError(red(`✗ ${error instanceof Error ? error.message : String(error)}`));
    failDeployCommand('Deploy command failed.', { cause: error });
  }
}
