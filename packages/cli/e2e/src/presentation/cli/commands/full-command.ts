import { RemoteError } from '../../../../../src/kernel/domain/errors/cli-exit-error.ts';
import { Command } from '@cliffy/command';
import { SCAFFOLD } from '../../../domain/cli-surface.ts';
import { mapRunOptions, type RawRunOptions } from '../options/run-options.ts';
import { resolveSuite } from '../suites/registry.ts';
import type { CliRunnerFactory } from '../cli-command-contracts.ts';

/** `full` command for executing the merge-readiness runtime suite. */
export function createFullCommand(createRunner: CliRunnerFactory) {
  return new Command()
    .name('full')
    .description('Run the full CLI E2E merge-readiness suite')
    .option('--repo <path:string>', 'NetScript repo root')
    .option('--cli <path:string>', 'CLI entrypoint')
    .option('--smoke-root <path:string>', 'Generated project parent directory')
    .option('--name <name:string>', 'Generated project name')
    .option('--db <engine:string>', 'Database engine: postgres, mysql, or sqlite', {
      default: 'postgres',
    })
    .option('--source <mode:string>', 'Package source: auto, starter, local, or jsr', {
      default: 'local',
    })
    .option('--plugins <list:string>', 'Comma-separated plugin kinds')
    .option('--samples', 'Include generated samples', { default: true })
    .option('--no-samples', 'Skip generated samples')
    .option('--cleanup', 'Stop Aspire and remove suite-created Docker containers', {
      default: true,
    })
    .option('--format <format:string>', 'pretty, json, or ndjson', { default: 'ndjson' })
    .option('--report <path:string>', 'Write final JSON report')
    .option('--log-file <path:string>', 'Append NDJSON event log')
    .action(async (raw: RawRunOptions) => {
      const overrides = mapRunOptions(raw);
      const suite = resolveSuite(SCAFFOLD.RUNTIME, overrides);
      const options = { ...suite.defaultOptions, ...overrides };
      const report = await createRunner(options).run(suite, { suiteId: suite.id, options });
      if (!report.ok) throw new RemoteError(1, 'CLI E2E full suite failed');
    });
}
