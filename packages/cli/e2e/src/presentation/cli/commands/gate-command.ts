import { RemoteError } from '../../../../../src/kernel/domain/errors/cli-exit-error.ts';
import { Command } from '@cliffy/command';
import { mapRunOptions, type RawRunOptions } from '../options/run-options.ts';
import { resolveGateId, resolveSuite } from '../suites/registry.ts';
import type { CliRunnerFactory } from '../cli-command-contracts.ts';

/** `gate` command for executing one suite gate. */
export function createGateCommand(createRunner: CliRunnerFactory) {
  return new Command()
    .name('gate')
    .description('Run a single gate from a suite')
    .arguments('<suite:string> <gate:string>')
    .option('--repo <path:string>', 'NetScript repo root')
    .option('--cli <path:string>', 'CLI entrypoint')
    .option('--smoke-root <path:string>', 'Generated project parent directory')
    .option('--name <name:string>', 'Generated project name')
    .option('--format <format:string>', 'pretty, json, or ndjson', { default: 'pretty' })
    .option('--cleanup', 'Remove suite-created Docker containers', { default: false })
    .action(async (raw: RawRunOptions, suiteId: string, gateId: string) => {
      const overrides = mapRunOptions(raw);
      const suite = resolveSuite(suiteId, overrides);
      const resolvedGateId = resolveGateId(suite, gateId);
      const options = { ...suite.defaultOptions, ...overrides };
      const report = await createRunner(options).run(suite, {
        suiteId: suite.id,
        gateId: resolvedGateId,
        options,
      });
      if (!report.ok) throw new RemoteError(1, 'CLI E2E gate failed');
    });
}
