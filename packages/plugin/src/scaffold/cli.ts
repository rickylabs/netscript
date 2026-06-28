import type { PluginLogger } from '../domain/mod.ts';
import type {
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '../protocol/mod.ts';

/**
 * Parse CLI arguments using the plugin scaffold `--context-json` contract.
 *
 * @param args - Command-line arguments to parse.
 * @returns Scaffolder context with a no-op logger for CLI execution.
 */
export function parseScaffolderContextArgs(
  args: readonly string[] = Deno.args,
): ScaffolderContext {
  const index = args.indexOf('--context-json');
  if (index < 0 || args[index + 1] === undefined) {
    throw new Error('Missing --context-json.');
  }

  return parseContext(JSON.parse(args[index + 1]));
}

/**
 * Run a plugin scaffold entrypoint from the command line.
 *
 * @param entrypoint - Plugin scaffold entrypoint to execute.
 * @param args - Command-line arguments to parse.
 * @returns Resolves after writing the JSON scaffold result to stdout.
 */
export async function runScaffoldCli(
  entrypoint: PluginScaffoldEntrypoint,
  args: readonly string[] = Deno.args,
): Promise<void> {
  const result = await entrypoint(parseScaffolderContextArgs(args));
  await writeResult(result);
}

function parseContext(value: unknown): ScaffolderContext {
  if (value === null || typeof value !== 'object') {
    throw new Error('Scaffolder context must be an object.');
  }

  const workspaceRoot = Reflect.get(value, 'workspaceRoot');
  const options = Reflect.get(value, 'options');
  const dryRun = Reflect.get(value, 'dryRun');

  if (typeof workspaceRoot !== 'string' || workspaceRoot.length === 0) {
    throw new Error('Scaffolder context requires workspaceRoot.');
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Scaffolder context requires options.');
  }
  if (typeof dryRun !== 'boolean') {
    throw new Error('Scaffolder context requires dryRun.');
  }

  return { workspaceRoot, options, dryRun, logger: noopLogger };
}

function writeResult(result: ScaffoldResult): Promise<void> {
  return Deno.stdout.write(new TextEncoder().encode(`${JSON.stringify(result)}\n`))
    .then(() => undefined);
}

const noopLogger: PluginLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
