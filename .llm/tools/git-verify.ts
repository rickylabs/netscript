/**
 * Read-only git verification helper for Windows/MCP sessions.
 *
 * Companion to git-commit-paths.ts. Use this instead of raw shell git when a
 * check involves a `rev:path` spec (MSYS mangles `:` -> `;` and `/` -> `\`) or
 * when proxy/cache layers (e.g. the rtk hook) may serve stale `git log` output.
 * Deno.Command spawns the real `git` binary directly: no shell parsing, no proxy.
 *
 * Commands:
 *   exists   --ref <ref> --path <path>     Does <path> exist in <ref>'s tree?
 *   sync     --branch <branch>             Ahead/behind vs origin/<branch>.
 *   ancestor --of <a> --in <b>             Is commit <a> an ancestor of <b>?
 *   tip      [--ref <ref>]                 Print <ref> sha + subject (default HEAD).
 *
 * Common:
 *   --cwd <path>   Repo root. Default: current directory.
 *   --help         Show this help.
 *
 * Examples:
 *   deno run --allow-run .llm/tools/git-verify.ts exists \
 *     --ref origin/main --path .github/workflows/copilot-setup-steps.yml
 *   deno run --allow-run .llm/tools/git-verify.ts sync --branch feat/package-quality
 *   deno run --allow-run .llm/tools/git-verify.ts ancestor --of e951083 --in HEAD
 *
 * Exit codes: 0 = check passed / true; 1 = check failed / false; 2 = usage error.
 */

type Command = 'exists' | 'sync' | 'ancestor' | 'tip';

interface Options {
  command: Command;
  cwd: string;
  ref?: string;
  path?: string;
  branch?: string;
  of?: string;
  in?: string;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-run .llm/tools/git-verify.ts <command> [options]',
    '',
    'Commands:',
    "  exists   --ref <ref> --path <path>   Does <path> exist in <ref>'s tree?",
    '  sync     --branch <branch>           Ahead/behind vs origin/<branch>.',
    '  ancestor --of <a> --in <b>           Is commit <a> an ancestor of <b>?',
    '  tip      [--ref <ref>]               Print <ref> sha + subject (default HEAD).',
    '',
    'Common:',
    '  --cwd <path>   Repo root. Default: current directory.',
    '  --help         Show this help.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parseArgs(args: string[]): Options | null {
  const command = args[0] as Command;
  if (!command || command === '--help' as Command) {
    printHelp();
    return null;
  }
  if (!['exists', 'sync', 'ancestor', 'tip'].includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }

  const options: Options = { command, cwd: Deno.cwd() };
  for (let index = 1; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case '--ref':
        options.ref = requireValue(args, index, arg);
        index++;
        break;
      case '--path':
        options.path = requireValue(args, index, arg);
        index++;
        break;
      case '--branch':
        options.branch = requireValue(args, index, arg);
        index++;
        break;
      case '--of':
        options.of = requireValue(args, index, arg);
        index++;
        break;
      case '--in':
        options.in = requireValue(args, index, arg);
        index++;
        break;
      case '--cwd':
        options.cwd = requireValue(args, index, arg);
        index++;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

interface GitResult {
  code: number;
  stdout: string;
  stderr: string;
}

async function git(args: string[], cwd: string): Promise<GitResult> {
  const command = new Deno.Command('git', { args, cwd, stdout: 'piped', stderr: 'piped' });
  const { code, stdout, stderr } = await command.output();
  const decoder = new TextDecoder();
  return { code, stdout: decoder.decode(stdout).trim(), stderr: decoder.decode(stderr).trim() };
}

/** True/false checks return their boolean as the process exit code (0 = true). */
async function run(options: Options): Promise<number> {
  switch (options.command) {
    case 'exists': {
      if (!options.ref || !options.path) throw new Error('exists requires --ref and --path.');
      // `rev:path` passed as a single argv entry — no shell, so no MSYS mangling.
      const { code } = await git(['cat-file', '-e', `${options.ref}:${options.path}`], options.cwd);
      const present = code === 0;
      console.log(`${present ? 'EXISTS' : 'MISSING'}  ${options.ref}:${options.path}`);
      return present ? 0 : 1;
    }
    case 'sync': {
      if (!options.branch) throw new Error('sync requires --branch.');
      const counts = await git(
        ['rev-list', '--left-right', '--count', `origin/${options.branch}...${options.branch}`],
        options.cwd,
      );
      if (counts.code !== 0) {
        console.error(counts.stderr || `cannot compare origin/${options.branch}`);
        return 2;
      }
      const [behind, ahead] = counts.stdout.split(/\s+/).map(Number);
      const inSync = behind === 0 && ahead === 0;
      console.log(
        `${options.branch}: ${ahead} ahead / ${behind} behind origin  ${
          inSync ? '(in sync)' : '(DIVERGED)'
        }`,
      );
      return inSync ? 0 : 1;
    }
    case 'ancestor': {
      if (!options.of || !options.in) throw new Error('ancestor requires --of and --in.');
      const { code } = await git(
        ['merge-base', '--is-ancestor', options.of, options.in],
        options.cwd,
      );
      const isAncestor = code === 0;
      console.log(`${options.of} is ${isAncestor ? '' : 'NOT '}an ancestor of ${options.in}`);
      return isAncestor ? 0 : 1;
    }
    case 'tip': {
      const ref = options.ref ?? 'HEAD';
      const { code, stdout, stderr } = await git(['log', '-1', '--format=%h %s', ref], options.cwd);
      if (code !== 0) {
        console.error(stderr || `cannot read ${ref}`);
        return 2;
      }
      console.log(`${ref}: ${stdout}`);
      return 0;
    }
  }
}

if (import.meta.main) {
  try {
    const options = parseArgs(Deno.args);
    if (options) Deno.exit(await run(options));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
