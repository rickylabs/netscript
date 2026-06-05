import { LocalProjectFiles } from './adapters/local-project-files.ts';
import { generateSagaRegistry } from './registry-generator.ts';

interface Args {
  readonly projectRoot: string;
  readonly roots?: readonly string[];
  readonly manifestPath?: string;
  readonly registryPath?: string;
}

if (import.meta.main) {
  const args = parseArgs(Deno.args);
  const target = args.manifestPath ? await readSagaRegistryTarget(args.manifestPath) : undefined;
  await generateSagaRegistry(new LocalProjectFiles(args.projectRoot), {
    roots: args.roots ?? (target ? [target.dir] : undefined),
    registryPath: args.registryPath ?? target?.registryPath ??
      (target ? `${target.dir}/_registry.ts` : undefined),
    fileSuffixes: target?.fileSuffixes,
    exclude: target?.exclude,
  });
}

function parseArgs(args: readonly string[]): Args {
  return parseArgAt(args, 0, { projectRoot: Deno.cwd() });
}

function parseArgAt(args: readonly string[], index: number, current: Args): Args {
  const arg = args[index];
  if (arg === undefined) {
    return current;
  }
  if (arg === '--project-root') {
    return parseArgAt(args, index + 2, {
      ...current,
      projectRoot: requiredValue(args, index + 1, arg),
    });
  }
  if (arg === '--root' || arg === '--roots') {
    return parseArgAt(args, index + 2, {
      ...current,
      roots: splitRoots(requiredValue(args, index + 1, arg)),
    });
  }
  if (arg === '--manifest') {
    return parseArgAt(args, index + 2, {
      ...current,
      manifestPath: requiredValue(args, index + 1, arg),
    });
  }
  if (arg === '--out' || arg === '--registry') {
    return parseArgAt(args, index + 2, {
      ...current,
      registryPath: requiredValue(args, index + 1, arg),
    });
  }
  if (arg === '--profile') {
    requiredValue(args, index + 1, arg);
    return parseArgAt(args, index + 2, current);
  }
  if (arg === '--official-samples') {
    parseBoolean(requiredValue(args, index + 1, arg), arg);
    return parseArgAt(args, index + 2, current);
  }
  throw new Error(`Unknown argument: ${arg}.`);
}

function requiredValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return value;
}

function splitRoots(value: string): readonly string[] {
  return Object.freeze(value.split(',').map((item) => item.trim()).filter(Boolean));
}

function parseBoolean(value: string, flag: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${flag} must be "true" or "false".`);
}

interface RuntimeManifest {
  readonly runtimeRegistries?: readonly RuntimeRegistryTarget[];
}

interface RuntimeRegistryTarget {
  readonly kind: 'map';
  readonly dir: string;
  readonly registryPath?: string;
  readonly fileSuffixes: readonly string[];
  readonly exclude: readonly string[];
}

async function readSagaRegistryTarget(
  manifestPath: string,
): Promise<RuntimeRegistryTarget | undefined> {
  const manifest = JSON.parse(await Deno.readTextFile(manifestPath)) as RuntimeManifest;
  return manifest.runtimeRegistries?.find((target) => target.kind === 'map');
}
