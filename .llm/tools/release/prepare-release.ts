import {
  type BumpResult,
  coordinateVersionBump,
  discoverVersionFiles,
  findVersionResidue,
  type VersionBumpMode,
} from '../deps/bump-version.ts';
import { PUBLISH_ASSET_OUTPUTS } from '../generate-publish-assets.ts';
import { EXPORT_SURFACE_CORPUS_OUTPUT } from '../docs/generate-export-surface-corpus.ts';
import { join } from 'jsr:@std/path@^1.0.0';

export interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export type ReleaseCommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string,
) => Promise<CommandResult>;

export interface PrepareReleaseDependencies {
  readonly bump: (root: string, version: string, mode: VersionBumpMode) => Promise<BumpResult>;
  readonly findResidue: (root: string, oldVersion: string) => Promise<readonly string[]>;
  readonly runCommand: ReleaseCommandRunner;
}

const defaultDependencies: PrepareReleaseDependencies = {
  bump: coordinateVersionBump,
  findResidue: findVersionResidue,
  runCommand,
};

/** Generator-owned outputs staged by every stable or canary release preparation. */
export const PREPARED_RELEASE_GENERATED_OUTPUTS: readonly string[] = [
  ...PUBLISH_ASSET_OUTPUTS,
  EXPORT_SURFACE_CORPUS_OUTPUT,
];

/** Combine the bump writer's discovered files with every generator-owned release output. */
export function collectPreparedReleaseFiles(
  root: string,
  versionFiles: readonly string[],
): string[] {
  return [
    ...new Set([
      ...versionFiles,
      ...PREPARED_RELEASE_GENERATED_OUTPUTS.map((path) => join(root, path)),
    ]),
  ];
}

/** Discover the complete file set that the shared release writer may stage. */
export async function discoverPreparedReleaseFiles(root: string): Promise<string[]> {
  return collectPreparedReleaseFiles(root, await discoverVersionFiles(root));
}

/**
 * Apply a workspace version and run the preparation gates shared by stable and
 * canary cuts. Publication is deliberately outside this helper.
 */
export async function prepareRelease(
  root: string,
  version: string,
  label: string,
  mode: VersionBumpMode,
  dependencies: PrepareReleaseDependencies = defaultDependencies,
): Promise<BumpResult> {
  const bump = await dependencies.bump(root, version, mode);
  console.log(`${label} bumped ${bump.oldVersion} -> ${bump.newVersion}`);

  await runGate(
    label,
    'gen:agent-docs-prose',
    'deno',
    ['task', 'gen:agent-docs-prose'],
    root,
    dependencies,
  );
  await runGate(
    label,
    'gen:publish-assets',
    'deno',
    ['task', 'gen:publish-assets'],
    root,
    dependencies,
  );
  await runGate(
    label,
    'gen:mcp-export-corpus',
    'deno',
    ['task', 'gen:mcp-export-corpus'],
    root,
    dependencies,
  );
  await runGate(
    label,
    'gen:assets-barrel',
    'deno',
    ['task', 'gen:assets-barrel'],
    root,
    dependencies,
  );
  await runGate(
    label,
    'check:agent-docs-prose',
    'deno',
    ['task', 'check:agent-docs-prose'],
    root,
    dependencies,
  );

  const residue = await dependencies.findResidue(root, bump.oldVersion);
  if (residue.length > 0) {
    throw new Error(
      `Version residue remains for ${bump.oldVersion}:\n${
        residue.map((file) => `- ${file}`).join('\n')
      }`,
    );
  }

  // `findResidue` only reads JSON + the lock, so a `@netscript/*` pin left behind in TypeScript is
  // invisible to it — `publish:readiness`'s specifier check is what catches that class (#953).
  await runGate(
    label,
    'publish:readiness',
    'deno',
    ['task', 'publish:readiness'],
    root,
    dependencies,
  );
  await runGate(label, 'publish:dry-run', 'deno', ['task', 'publish:dry-run'], root, dependencies);
  await runGate(label, 'deno ci --prod', 'deno', ['ci', '--prod'], root, dependencies);
  return {
    ...bump,
    files: collectPreparedReleaseFiles(root, bump.files),
  };
}

export async function runCommand(
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<CommandResult> {
  const output = await new Deno.Command(command, {
    args: [...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

export async function mustRun(
  command: string,
  args: readonly string[],
  cwd: string,
  runner: ReleaseCommandRunner = runCommand,
): Promise<void> {
  const result = await runner(command, args, cwd);
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.code !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.code}.`);
  }
}

async function runGate(
  label: string,
  name: string,
  command: string,
  args: readonly string[],
  cwd: string,
  dependencies: PrepareReleaseDependencies,
): Promise<void> {
  console.log(`${label} gate: ${name}`);
  const result = await dependencies.runCommand(command, args, cwd);
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.code !== 0) throw new Error(`${name} failed with exit ${result.code}.`);
}
