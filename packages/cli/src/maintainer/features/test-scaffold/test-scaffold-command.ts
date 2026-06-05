import { outputText } from '../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { runScaffoldTest, type RunScaffoldTestDependencies } from './run-scaffold-test.ts';
import {
  type MaintainerPathResolver,
  type MaintainerPrint,
  resolveOptionPath,
} from '../../presentation/support.ts';

/** Dependencies for the maintainer `test scaffold` command handler. */
export interface TestScaffoldCommandDependencies {
  /** Scaffold-test application service dependencies. */
  readonly runScaffoldTestDependencies: RunScaffoldTestDependencies;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: MaintainerPathResolver;
  /** Print completion lines. */
  readonly print?: MaintainerPrint;
}

function parseFormat(raw: string | undefined): 'pretty' | 'json' | 'ndjson' | undefined {
  if (raw === undefined) return undefined;
  if (raw === 'pretty' || raw === 'json' || raw === 'ndjson') {
    return raw;
  }
  throw new Error('format must be one of: pretty, json, ndjson');
}

/** Create the maintainer `test scaffold` command. */
export function createTestScaffoldCommand(
  dependencies: TestScaffoldCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('scaffold')
    .description('Run one scaffold E2E suite from the local repository')
    .arguments('<fixture:string>')
    .option('--repo-root <path:string>', 'Repository root that owns the e2e:cli task')
    .option('--cleanup', 'Clean up suite-created runtime resources', { default: false })
    .option('--format <format:string>', 'pretty, json, or ndjson')
    .action(async (options, fixture: string): Promise<void> => {
      const result = await runScaffoldTest({
        repoRoot: resolveOptionPath(dependencies.resolvePath, options.repoRoot),
        fixture,
        cleanup: options.cleanup ?? false,
        format: parseFormat(options.format),
      }, dependencies.runScaffoldTestDependencies);

      if (result.stdout.trim().length > 0) {
        print(result.stdout.trimEnd());
      }
      if (result.code !== 0) {
        throw new Error(
          result.stderr || `Scaffold suite ${result.suiteId} failed with exit code ${result.code}.`,
        );
      }
    });
}
