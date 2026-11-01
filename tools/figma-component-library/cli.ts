import { parseArgs } from 'jsr:@std/cli@1/parse-args';
import type { LibraryInput } from './src/contract.ts';
import { defaultLibraryInput } from './src/default-sources.ts';
import { generateLibrary } from './src/generate.ts';
import { resolveInventory } from './src/inventory.ts';
import { serializeLibrary, validateLibrary } from './src/validate-library.ts';
import { codeConnectFiles } from './src/code-connect.ts';
import { writePublication } from './src/publication.ts';

const HELP = `Figma component library (repository tooling)
  inventory
  generate --output <new-directory> [--items button,input]
  verify --library <library.json>
  connect --library <library.json> --receipt <receipt.json> --output <new-directory> [--dry-run]
Full generation rejects all source gaps before output. Selections are explicitly partial.
Live editor/MCP and publication require separate native evidence.`;

/** Parse command intent; all input/receipt validation precedes publication effects. */
export async function runLibraryCommand(
  args: readonly string[],
  sources: LibraryInput = defaultLibraryInput(),
  signal: AbortSignal = new AbortController().signal,
): Promise<Readonly<Record<string, unknown>>> {
  const flags = parseArgs([...args], {
    string: ['output', 'items', 'library', 'receipt'],
    boolean: ['dry-run', 'help'],
    unknown: (argument) => {
      if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`);
      return true;
    },
  });
  if (flags.help) return { ok: true, help: HELP };
  if (flags._.length !== 1) throw new Error(HELP);
  const command = flags._[0];
  const allowed: Readonly<Record<string, readonly string[]>> = {
    inventory: [],
    generate: ['output', 'items'],
    verify: ['library'],
    connect: ['library', 'receipt', 'output', 'dry-run'],
  };
  if (typeof command !== 'string' || !Object.hasOwn(allowed, command)) {
    throw new Error(`Unknown command: ${String(command)}\n${HELP}`);
  }
  for (const name of ['output', 'items', 'library', 'receipt', 'dry-run']) {
    if (flags[name] !== undefined && flags[name] !== false && !allowed[command].includes(name)) {
      throw new Error(`${command} does not accept --${name}`);
    }
  }
  const items = flags.items === undefined
    ? undefined
    : flags.items.split(',').map((name) => name.trim());
  if (command === 'inventory') {
    const inventory = resolveInventory(sources);
    const sourceFailures: { item: string; message: string }[] = [];
    for (const item of inventory.coverage.available) {
      try {
        generateLibrary(sources, { items: [item] });
      } catch (error) {
        sourceFailures.push({
          item,
          message: error instanceof Error ? error.message : 'Source validation failed',
        });
      }
    }
    return { ok: sourceFailures.length === 0, coverage: inventory.coverage, sourceFailures };
  }
  if (command === 'generate') {
    if (!flags.output) throw new Error('generate requires --output');
    const bundle = generateLibrary(sources, { items });
    await writePublication(flags.output, { 'library.json': serializeLibrary(bundle) }, signal);
    return {
      ok: true,
      coverage: bundle.coverage,
      variants: bundle.components.reduce((count, c) => count + c.variants.length, 0),
    };
  }
  if (command !== 'verify' && command !== 'connect') {
    throw new Error(`Unknown command: ${String(command)}\n${HELP}`);
  }
  if (!flags.library) throw new Error(`${command} requires --library`);
  const input: unknown = JSON.parse(await Deno.readTextFile(flags.library));
  const bundle = validateLibrary(input, sources);
  if (command === 'verify') return { ok: true, coverage: bundle.coverage };
  if (!flags.receipt || !flags.output) throw new Error('connect requires --receipt and --output');
  const receipt: unknown = JSON.parse(await Deno.readTextFile(flags.receipt));
  const files = await codeConnectFiles(bundle, receipt, sources, { dryRun: flags['dry-run'] });
  await writePublication(flags.output, files, signal);
  return {
    ok: true,
    dryRun: flags['dry-run'],
    coverage: bundle.coverage,
    files: Object.keys(files).sort(),
  };
}

if (import.meta.main) {
  try {
    const result = await runLibraryCommand(Deno.args);
    console.log(serializeLibrary(result));
    if (!result.ok) Deno.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Component-library command failed');
    Deno.exitCode = 1;
  }
}
