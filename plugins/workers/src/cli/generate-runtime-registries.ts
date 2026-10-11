import { dirname, fromFileUrl, join } from 'jsr:@std/path@^1';
import { loadWorkersConfig } from './load-workers-config.ts';
import { writeOfficialSampleConfiguration } from './official-sample-configuration.ts';
import {
  generateRuntimeRegistries,
  renderRuntimeRegistries,
} from './runtime-registry-generator.ts';

interface Args {
  readonly inspect?: boolean;
  readonly inspectionProtocol?: string;
  readonly manifestJson?: string;
  readonly manifestPath: string;
  readonly officialSamples: boolean;
  readonly profile?: string;
  readonly projectRoot: string;
}

if (import.meta.main) {
  const args = parseArgs(Deno.args);
  const workers = await loadWorkersConfig(args.projectRoot);
  if (args.inspect) {
    if (!['1', '2'].includes(args.inspectionProtocol ?? '') || args.manifestJson === undefined) {
      throw new Error('Inspect mode requires protocol 1 or 2 and --manifest-json.');
    }
    const registries = await renderRuntimeRegistries({
      ...args,
      workers,
      manifest: JSON.parse(args.manifestJson),
    });
    console.log(
      JSON.stringify({
        inspectionProtocol: Number(args.inspectionProtocol),
        registries: registries.map((entry) =>
          args.inspectionProtocol === '1'
            ? { registryPath: entry.registryPath, sourceFiles: entry.sourceFiles }
            : entry
        ),
      }),
    );
  } else {
    if (args.inspectionProtocol !== undefined || args.manifestJson !== undefined) {
      throw new Error('Inspection flags require --inspect.');
    }
    const generated = [
      ...await generateRuntimeRegistries({ ...args, workers }),
      ...(args.officialSamples && args.profile === 'scaffold'
        ? await writeOfficialSampleConfiguration({
          projectRoot: args.projectRoot,
          force: false,
        })
        : []),
    ];
    for (const path of generated) {
      console.log(`generated ${path}`);
    }
  }
}

function parseArgs(args: readonly string[]): Args {
  const cliDir = resolveCliDir();
  let inspect = false;
  let inspectionProtocol: string | undefined;
  let manifestJson: string | undefined;
  let projectRoot = Deno.cwd();
  let manifest = cliDir ? join(cliDir, '..', '..', 'scaffold.runtime.json') : '';
  let officialSamples = true;
  let profile: string | undefined;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--project-root') {
      projectRoot = requiredValue(args, ++index, arg);
    } else if (arg === '--inspect') {
      inspect = true;
    } else if (arg === '--inspection-protocol') {
      inspectionProtocol = requiredValue(args, ++index, arg);
    } else if (arg === '--manifest-json') {
      manifestJson = requiredValue(args, ++index, arg);
    } else if (arg === '--manifest') {
      manifest = requiredValue(args, ++index, arg);
    } else if (arg === '--profile') {
      profile = requiredValue(args, ++index, arg);
    } else if (arg === '--official-samples') {
      officialSamples = requiredValue(args, ++index, arg) !== 'false';
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (manifest.length === 0 && manifestJson === undefined) {
    throw new Error('Missing --manifest; default manifest resolution requires a file: module URL.');
  }

  return {
    inspect,
    inspectionProtocol,
    manifestJson,
    manifestPath: manifest,
    officialSamples,
    profile,
    projectRoot,
  };
}

function resolveCliDir(): string | null {
  const moduleUrl = new URL(import.meta.url);
  if (moduleUrl.protocol !== 'file:') {
    return null;
  }
  return dirname(fromFileUrl(moduleUrl));
}

function requiredValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return value;
}
