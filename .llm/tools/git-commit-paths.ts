/**
 * MCP-friendly git commit/push helper for Windows/MCP sessions.
 *
 * Use this instead of PowerShell-heavy git commands when commit messages contain `:` or when file
 * paths contain characters like `(`, `)`, and `[]`. Deno passes arguments directly to git, so the
 * shell does not get a chance to mangle them.
 *
 * Examples:
 * - deno run --allow-run .llm/tools/git-commit-paths.ts --message chore-sync --all-staged --push --dry-run
 * - deno run --allow-read --allow-run .llm/tools/git-commit-paths.ts --message-file .llm/temp/commit-message.txt --path-file .llm/temp/commit-paths.txt
 */

interface Options {
  cwd: string;
  message?: string;
  messageFile?: string;
  paths: string[];
  pathFiles: string[];
  push: boolean;
  branch?: string;
  allStaged: boolean;
  dryRun: boolean;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-run .llm/tools/git-commit-paths.ts --message <msg> [options]',
    '',
    'Options:',
    '  --message <msg>        Commit message.',
    '  --message-file <path>  Read commit message from a file.',
    '  --path <file>          Path to include with git commit --only. Repeatable.',
    '  --path-file <path>     Read newline-separated commit paths from a file. Repeatable.',
    '  --all-staged      Commit staged changes instead of selecting paths.',
    '  --push            Push to origin after a successful commit.',
    '  --branch <name>   Push branch override. Default: current branch.',
    '  --cwd <path>      Repo root/current working directory. Default: current directory.',
    '  --dry-run         Print commands without executing them.',
    '  --help            Show this help.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseArgs(args: string[]): Options | null {
  const options: Options = {
    cwd: Deno.cwd(),
    paths: [],
    pathFiles: [],
    push: false,
    allStaged: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case '--message':
        options.message = requireValue(args, index, arg);
        index++;
        break;
      case '--message-file':
        options.messageFile = requireValue(args, index, arg);
        index++;
        break;
      case '--path':
        options.paths.push(requireValue(args, index, arg));
        index++;
        break;
      case '--path-file':
        options.pathFiles.push(requireValue(args, index, arg));
        index++;
        break;
      case '--push':
        options.push = true;
        break;
      case '--branch':
        options.branch = requireValue(args, index, arg);
        index++;
        break;
      case '--cwd':
        options.cwd = requireValue(args, index, arg);
        index++;
        break;
      case '--all-staged':
        options.allStaged = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.message && options.messageFile) {
    throw new Error('Use either --message or --message-file, not both.');
  }

  if (!options.message && !options.messageFile) {
    throw new Error('Provide --message <msg> or --message-file <path>.');
  }

  if (!options.allStaged && options.paths.length === 0 && options.pathFiles.length === 0) {
    throw new Error('Provide at least one --path, --path-file, or use --all-staged.');
  }

  if (options.allStaged && (options.paths.length > 0 || options.pathFiles.length > 0)) {
    throw new Error('Use either --all-staged or explicit commit paths, not both.');
  }

  return options;
}

async function resolveMessage(options: Options): Promise<string> {
  if (options.message) return options.message;
  const text = await Deno.readTextFile(options.messageFile!);
  const message = text.trim();
  if (!message) throw new Error('Commit message file is empty.');
  return message;
}

async function resolvePaths(options: Options): Promise<string[]> {
  const paths = [...options.paths];
  for (const pathFile of options.pathFiles) {
    const text = await Deno.readTextFile(pathFile);
    for (const line of text.split(/\r?\n/)) {
      const value = line.trim();
      if (value) paths.push(value);
    }
  }
  return paths;
}

async function runGit(args: string[], cwd: string, dryRun: boolean): Promise<void> {
  console.error(`git ${args.join(' ')}`);
  if (dryRun) return;

  const command = new Deno.Command('git', {
    args,
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const { code } = await command.output();
  if (code !== 0) {
    throw new Error(`git ${args[0]} failed with exit code ${code}`);
  }
}

async function currentBranch(cwd: string): Promise<string> {
  const command = new Deno.Command('git', {
    args: ['branch', '--show-current'],
    cwd,
    stdout: 'piped',
    stderr: 'inherit',
  });
  const { code, stdout } = await command.output();
  if (code !== 0) {
    throw new Error('Unable to determine current branch.');
  }
  const branch = new TextDecoder().decode(stdout).trim();
  if (!branch) {
    throw new Error('Current branch is empty.');
  }
  return branch;
}

const options = parseArgs(Deno.args);
if (options) {
  const message = await resolveMessage(options);
  const paths = options.allStaged ? [] : await resolvePaths(options);
  const commitArgs = ['commit', '-m', message];
  if (!options.allStaged) {
    commitArgs.push('--only', '--', ...paths);
  }

  await runGit(commitArgs, options.cwd, options.dryRun);

  if (options.push) {
    const branch = options.branch ?? await currentBranch(options.cwd);
    await runGit(['push', 'origin', branch], options.cwd, options.dryRun);
  }
}
