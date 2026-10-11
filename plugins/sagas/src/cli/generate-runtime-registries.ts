import { LocalProjectFiles } from '@netscript/plugin/cli';
import { generateSagaRegistry, renderSagaRegistry } from './registry-generator.ts';

interface Args {
  readonly inspect?: boolean;
  readonly inspectionProtocol?: string;
  readonly manifestJson?: string;
  readonly projectRoot: string;
  readonly roots?: readonly string[];
  readonly manifestPath?: string;
  readonly registryPath?: string;
}

if (import.meta.main) {
  const args = parseArgs(Deno.args);
  if (
    args.inspect &&
    (!['1', '2'].includes(args.inspectionProtocol ?? '') || args.manifestJson === undefined)
  ) throw new Error('Inspect mode requires protocol 1 or 2 and --manifest-json.');
  if (!args.inspect && (args.inspectionProtocol !== undefined || args.manifestJson !== undefined)) {
    throw new Error('Inspection flags require --inspect.');
  }
  const target = args.manifestJson
    ? (JSON.parse(args.manifestJson) as RuntimeManifest).runtimeRegistries?.find((target) =>
      target.kind === 'map'
    )
    : args.manifestPath
    ? await readSagaRegistryTarget(args.manifestPath)
    : undefined;
  const options = {
    roots: args.roots ?? (target ? [target.dir] : undefined),
    registryPath: args.registryPath ?? target?.registryPath ??
      (target ? `${target.dir}/_registry.ts` : undefined),
    fileSuffixes: target?.fileSuffixes,
    exclude: target?.exclude,
  };
  const files = new LocalProjectFiles(args.projectRoot);
  if (args.inspect) {
    const entry = await renderSagaRegistry(files, options);
    console.log(
      JSON.stringify({
        inspectionProtocol: Number(args.inspectionProtocol),
        registries: [
          args.inspectionProtocol === '1'
            ? { registryPath: entry.registryPath, sourceFiles: entry.sourceFiles }
            : entry,
        ],
      }),
    );
  } else await generateSagaRegistry(files, options);
}

function parseArgs(args: readonly string[]): Args {
  return parseArgAt(args, 0, { projectRoot: Deno.cwd() });
}

function parseArgAt(args: readonly string[], index: number, current: Args): Args {
  const arg = args[index];
  if (arg === undefined) {
    return current;
  }
  if (arg === '--inspect') return parseArgAt(args, index + 1, { ...current, inspect: true });
  if (arg === '--inspection-protocol') {
    return parseArgAt(args, index + 2, {
      ...current,
      inspectionProtocol: requiredValue(args, index + 1, arg),
    });
  }
  if (arg === '--manifest-json') {
    return parseArgAt(args, index + 2, {
      ...current,
      manifestJson: requiredValue(args, index + 1, arg),
    });
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
