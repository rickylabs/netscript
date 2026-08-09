import { relative } from '@std/path';
import { discoverVersionManifests, parseSemver, readVersion } from '../deps/bump-version.ts';

export interface VersionMismatch {
  readonly file: string;
  readonly actual: string;
}

export interface ReleaseVersionCoherence {
  readonly expected: string;
  readonly manifests: number;
  readonly mismatches: readonly VersionMismatch[];
}

/** Compare a release version with every manifest owned by the coordinated bump. */
export async function inspectReleaseVersionCoherence(
  root: string,
  expected: string,
): Promise<ReleaseVersionCoherence> {
  parseSemver(expected);
  const manifests = await discoverVersionManifests(root);
  const mismatches: VersionMismatch[] = [];
  for (const path of manifests) {
    const actual = await readVersion(path);
    if (actual !== expected) mismatches.push({ file: relative(root, path), actual });
  }
  return { expected, manifests: manifests.length, mismatches };
}

export interface ReleaseVersionAssertionArgs {
  readonly root: string;
  readonly version: string;
}

function parseArgs(argv: readonly string[]): ReleaseVersionAssertionArgs {
  let root = Deno.cwd();
  let version = '';
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--root') root = requireValue(argv, ++index, arg);
    else if (arg === '--version') version = requireValue(argv, ++index, arg);
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (!version) throw new Error('--version requires the resolved release version.');
  return { root, version };
}

function requireValue(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

export async function runReleaseVersionAssertion(
  args: ReleaseVersionAssertionArgs,
): Promise<number> {
  const result = await inspectReleaseVersionCoherence(args.root, args.version);
  if (result.mismatches.length === 0) {
    console.log(
      `Release version coherence: PASS (${result.manifests} manifests at ${result.expected})`,
    );
    return 0;
  }
  console.error(
    `Release version coherence: FAIL (expected ${result.expected}; ` +
      `${result.mismatches.length} of ${result.manifests} manifests mismatch)`,
  );
  for (const mismatch of result.mismatches) {
    console.error(`- ${mismatch.file}: ${mismatch.actual}`);
  }
  return 1;
}

if (import.meta.main) {
  Deno.exit(await runReleaseVersionAssertion(parseArgs(Deno.args)));
}
