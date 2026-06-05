import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';

export async function initializeGitRepository(options: {
  readonly targetPath: string;
  readonly process: ProcessPort;
  readonly branch: string;
  readonly remote: string;
  readonly noGitleaks: boolean;
  readonly push: boolean;
}): Promise<string> {
  await run(options.process, 'git', ['init', '-b', options.branch], options.targetPath);
  if (!options.noGitleaks) {
    await run(
      options.process,
      'gitleaks',
      ['detect', '--source', '.', '--no-git'],
      options.targetPath,
    );
  }
  await run(options.process, 'git', ['add', '.'], options.targetPath);
  await run(options.process, 'git', ['commit', '-m', 'chore: genesis eject'], options.targetPath);
  await run(
    options.process,
    'git',
    ['remote', 'add', 'origin', options.remote],
    options.targetPath,
  );
  const commit = await run(
    options.process,
    'git',
    ['rev-parse', '--short', 'HEAD'],
    options.targetPath,
  );
  if (options.push) {
    await options.process.exec(
      'git',
      ['fetch', 'origin', `${options.branch}:refs/remotes/origin/${options.branch}`],
      { cwd: options.targetPath },
    );
    await run(
      options.process,
      'git',
      ['push', '--force-with-lease', '-u', 'origin', options.branch],
      options.targetPath,
    );
  }
  return commit.trim();
}

async function run(
  process: ProcessPort,
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<string> {
  const result = await process.exec(command, args, { cwd });
  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
  return result.stdout;
}
