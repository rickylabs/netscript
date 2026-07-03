/**
 * AI plugin runtime-registry generator CLI.
 *
 * The thin entry point the NetScript CLI invokes (via each plugin's
 * `scaffold.runtime.json` `runtimeRegistryGenerator.command`) to regenerate a
 * scaffolded project's static AI registries. It reads the manifest's
 * `runtimeRegistries` targets and delegates each to {@linkcode compileAiRegistry};
 * it contains no forked generator logic and no per-target rendering.
 *
 * @module
 */

import { LocalProjectFiles } from '@netscript/plugin/cli';
import { type AiRegistryTarget, compileAiRegistry } from './ai-registry-compiler.ts';

const DEFAULT_MANIFEST_PATH = 'plugins/ai/scaffold.runtime.json';

/** Parsed CLI arguments for the AI runtime-registry generator. */
interface CliArgs {
  readonly manifestPath: string;
  readonly projectRoot: string;
}

/** Manifest shape consumed by this CLI (only the AI registry targets). */
interface RuntimeManifest {
  readonly runtimeRegistries?: readonly AiRegistryTarget[];
}

if (import.meta.main) {
  await main(Deno.args);
}

/** Generate every AI runtime registry declared in the manifest. */
export async function main(argv: readonly string[]): Promise<void> {
  const args = parseArgs(argv);
  const targets = await readTargets(args.manifestPath);
  const files = new LocalProjectFiles(args.projectRoot);
  for (const target of targets) {
    const result = await compileAiRegistry(files, target);
    if (result.written) {
      console.log(`generated ${result.registryPath} (${result.count} ${target.kind})`);
    } else {
      console.log(`skipped ${target.kind} — no files under ${target.dir}`);
    }
  }
}

function parseArgs(argv: readonly string[]): CliArgs {
  let projectRoot = Deno.cwd();
  let manifestPath = DEFAULT_MANIFEST_PATH;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--project-root') {
      projectRoot = requiredValue(argv, ++index, arg);
    } else if (arg === '--manifest') {
      manifestPath = requiredValue(argv, ++index, arg);
    } else if (arg === '--profile' || arg === '--official-samples') {
      // Accepted for parity with the shared generator invocation; the AI
      // registries have no profile- or sample-specific behavior.
      requiredValue(argv, ++index, arg);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { manifestPath, projectRoot };
}

async function readTargets(manifestPath: string): Promise<readonly AiRegistryTarget[]> {
  const manifest = JSON.parse(await Deno.readTextFile(manifestPath)) as RuntimeManifest;
  return manifest.runtimeRegistries ?? [];
}

function requiredValue(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index];
  if (value === undefined) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return value;
}
