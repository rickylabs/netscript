import { dirname, fromFileUrl, join } from 'jsr:@std/path@^1';
import { loadConfig } from '@netscript/config';
import { type WorkersConfigData, WorkersConfigSchema } from '@netscript/plugin-workers-core/config';
import { writeOfficialSampleConfiguration } from './official-sample-configuration.ts';
import { generateRuntimeRegistries } from './runtime-registry-generator.ts';

interface Args {
  readonly manifestPath: string;
  readonly officialSamples: boolean;
  readonly profile?: string;
  readonly projectRoot: string;
}

if (import.meta.main) {
  const args = parseArgs(Deno.args);
  const workers = await loadWorkersConfig(args.projectRoot);
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

async function loadWorkersConfig(projectRoot: string): Promise<WorkersConfigData | undefined> {
  let workersSection: unknown;
  try {
    workersSection = (await loadConfig({ cwd: projectRoot })).workers;
  } catch (error) {
    if (isMissingProjectConfig(error)) return undefined;
    throw new Error(
      `Failed to load NetScript configuration from ${projectRoot}: ${errorMessage(error)}`,
      { cause: error },
    );
  }

  try {
    return WorkersConfigSchema.parse(workersSection);
  } catch (error) {
    throw new Error(
      `Invalid workers configuration in ${projectRoot}: ${errorMessage(error)}`,
      { cause: error },
    );
  }
}

function isMissingProjectConfig(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('No config file found.');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseArgs(args: readonly string[]): Args {
  const cliDir = resolveCliDir();
  let projectRoot = Deno.cwd();
  let manifest = cliDir ? join(cliDir, '..', '..', 'scaffold.runtime.json') : '';
  let officialSamples = true;
  let profile: string | undefined;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--project-root') {
      projectRoot = requiredValue(args, ++index, arg);
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

  if (manifest.length === 0) {
    throw new Error('Missing --manifest; default manifest resolution requires a file: module URL.');
  }

  return { manifestPath: manifest, officialSamples, profile, projectRoot };
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
