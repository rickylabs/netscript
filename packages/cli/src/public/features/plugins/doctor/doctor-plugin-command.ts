/**
 * @module
 *
 * Public `netscript plugin doctor` command.
 *
 * F-9 permissions: host-side diagnostics read project configuration and
 * generated plugin metadata. The public CLI binary requires `--allow-read`.
 */

import { Command } from '@cliffy/command';

import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import type { PluginDoctorInput, PluginDoctorReport } from './doctor-plugin-use-case.ts';

/** Dependencies for the public plugin doctor command. */
export interface DoctorPluginCommandDependencies {
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Run host-side plugin diagnostics. */
  readonly doctor: (input: PluginDoctorInput) => Promise<readonly PluginDoctorReport[]>;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Options accepted by the public plugin doctor command. */
export interface DoctorPluginCommandInput {
  /** Optional project root. */
  readonly projectRoot?: string;
}

/** Create the public `plugin doctor` command. */
export function createDoctorPluginCommand(dependencies: DoctorPluginCommandDependencies): Command {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('doctor')
    .description('Check installed NetScript plugin health')
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (options: DoctorPluginCommandInput): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const reports = await dependencies.doctor({ projectRoot });
      renderDoctorReports(reports, print);
    }) as unknown as Command;
}

function renderDoctorReports(
  reports: readonly PluginDoctorReport[],
  print: (message: string) => void,
): void {
  if (reports.length === 0) {
    print('No plugins configured.');
    return;
  }

  print('Plugin\tStatus\tCheck\tMessage');
  for (const report of reports) {
    for (const check of report.checks) {
      print(
        `${report.pluginName}\t${check.status}\t${check.title}\t${check.message ?? '-'}`,
      );
    }
  }
}
