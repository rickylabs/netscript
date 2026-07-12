import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { outputJson, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { listDeployTargets } from './list-deploy-targets.ts';

/** Create `deploy list` target discovery. */
export function createListDeployTargetsCommand(
  dependencies: PublicCommandDependencies,
): CliffyCommand {
  return new Command().name('list').description('List registered deploy targets and operations')
    .option('--json', 'Emit machine-readable target descriptors')
    .action((options: { json?: boolean }) => {
      const targets = listDeployTargets(dependencies.deployTargets);
      if (options.json) outputJson(targets);
      else {
        for (const target of targets) {
          outputText(`${target.key}\t${target.operations.join(',')}\t${target.label}`);
        }
      }
    });
}
