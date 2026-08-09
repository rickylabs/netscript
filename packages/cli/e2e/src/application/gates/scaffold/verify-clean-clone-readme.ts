import { join, resolve } from '@std/path';
import { deriveDefaultAppName } from '../../../../../src/kernel/domain/scaffold/app-name.ts';

if (import.meta.main) await main(resolve(Deno.args[0] ?? '.'));

async function main(repoRoot: string): Promise<void> {
  const sourceParent = join(repoRoot, '.llm', 'tmp', 'clean-clone-readme');
  const projectName = 'generated-readme-fixture';
  const appName = deriveDefaultAppName(projectName);
  const projectRoot = join(sourceParent, projectName);
  const cloneParent = await Deno.makeTempDir({ prefix: 'netscript-clean-clone-' });
  const cloneRoot = join(cloneParent, projectName);

  await Deno.remove(sourceParent, { recursive: true }).catch((error) => {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  });

  try {
    await runCommand('deno', [
      'run',
      '-A',
      join(repoRoot, 'packages', 'cli', 'bin', 'netscript-dev.ts'),
      'init',
      projectName,
      '--path',
      sourceParent,
      '--db',
      'none',
      '--no-aspire',
      '--ci',
      '--yes',
      '--no-git',
      '--force',
    ], repoRoot);

    const readme = await Deno.readTextFile(`${projectRoot}/README.md`);
    const documentedCommand = 'deno task check';
    if (!/^\|\s*`deno task check`\s*\|/m.test(readme)) {
      throw new Error(`generated README does not document literal ${documentedCommand}`);
    }

    await runCommand('git', ['init', '-b', 'main'], projectRoot);
    await runCommand('git', ['add', '.'], projectRoot);
    await runCommand(
      'git',
      [
        '-c',
        'user.name=NetScript CI',
        '-c',
        'user.email=ci@example.invalid',
        'commit',
        '-m',
        'fixture',
      ],
      projectRoot,
    );
    await runCommand('git', ['clone', projectRoot, cloneRoot], projectRoot);

    for (
      const path of [
        join('apps', appName, '.generated', 'manifest.ts'),
        join('apps', appName, '.generated', 'routes.ts'),
      ]
    ) {
      await Deno.stat(join(cloneRoot, path)).catch((error) => {
        if (error instanceof Deno.errors.NotFound) {
          throw new Error(`clean clone is missing generated route artifact: ${path}`);
        }
        throw error;
      });
    }

    await runCommand('deno', ['task', 'check'], cloneRoot);
    console.info(`clean clone ran README command verbatim: ${documentedCommand}`);
  } finally {
    await Deno.remove(sourceParent, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
    await Deno.remove(cloneParent, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}

export async function runCommand(
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<void> {
  let output: Deno.CommandOutput;
  try {
    output = await new Deno.Command(command, {
      args: [...args],
      cwd,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`required clean-clone binary is missing: ${command}`, { cause: error });
    }
    throw error;
  }
  if (output.success) return;
  const decoder = new TextDecoder();
  throw new Error(
    `${command} ${args.join(' ')} failed with ${output.code}\n` +
      decoder.decode(output.stdout) + decoder.decode(output.stderr),
  );
}
