import {
  type BumpResult,
  coordinateVersionBump,
  findVersionResidue,
} from '../deps/bump-version.ts';

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
  readonly bump: (root: string, version: string) => Promise<BumpResult>;
  readonly findResidue: (root: string, oldVersion: string) => Promise<readonly string[]>;
  readonly runCommand: ReleaseCommandRunner;
}

const defaultDependencies: PrepareReleaseDependencies = {
  bump: coordinateVersionBump,
  findResidue: findVersionResidue,
  runCommand,
};

/**
 * Apply a workspace version and run the preparation gates shared by stable and
 * canary cuts. Publication is deliberately outside this helper.
 */
export async function prepareRelease(
  root: string,
  version: string,
  label: string,
  dependencies: PrepareReleaseDependencies = defaultDependencies,
): Promise<BumpResult> {
  const bump = await dependencies.bump(root, version);
  console.log(`${label} bumped ${bump.oldVersion} -> ${bump.newVersion}`);

  const residue = await dependencies.findResidue(root, bump.oldVersion);
  if (residue.length > 0) {
    throw new Error(
      `Version residue remains for ${bump.oldVersion}:\n${
        residue.map((file) => `- ${file}`).join('\n')
      }`,
    );
  }

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
  return bump;
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
