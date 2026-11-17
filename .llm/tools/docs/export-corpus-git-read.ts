/** Explicit Git-read delegation for the generator's existing clean-source guard. */
import { resolve } from '@std/path';

export interface GeneratorGitCommand {
  readonly executable: string;
  readonly args: string[];
  readonly cwd: string;
  readonly strict: boolean;
}
export interface GeneratorGitOutput {
  readonly success: boolean;
  readonly code: number;
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
}
export type GeneratorGitExecutor = (command: GeneratorGitCommand) => Promise<GeneratorGitOutput>;

/** Parse supported generator options without treating wrapper values as new flags. */
export function parseExportCorpusOptions(args: readonly string[]): {
  check: boolean;
  allowDirty: boolean;
  gitReadWrapper?: string;
  docLockfile?: string;
  docCacheDir?: string;
  docImportHosts?: string[];
} {
  const check = args.includes('--check'), allowDirty = args.includes('--allow-dirty');
  const index = args.indexOf('--git-read-wrapper');
  const gitReadWrapper = index < 0 ? undefined : args[index + 1];
  if (
    index >= 0 && (!gitReadWrapper || gitReadWrapper.startsWith('--') ||
      args.lastIndexOf('--git-read-wrapper') !== index)
  ) throw new Error('--git-read-wrapper requires one executable');
  const docFlags = ['--doc-lockfile', '--doc-cache-dir', '--doc-import-hosts'];
  const docValues: (string | undefined)[] = [];
  const consumed = new Set<number>();
  for (const flag of docFlags) {
    const at = args.indexOf(flag), value = at < 0 ? undefined : args[at + 1];
    if (at >= 0) {
      if (!value || value.startsWith('--') || args.lastIndexOf(flag) !== at) {
        throw new Error(`${flag} requires one value`);
      }
      consumed.add(at);
      consumed.add(at + 1);
    }
    docValues.push(value);
  }
  const unknown = args.filter((value, position) =>
    !consumed.has(position) &&
    value !== '--check' && value !== '--allow-dirty' &&
    !(index >= 0 && (position === index || position === index + 1))
  );
  if (unknown.length) throw new Error(`unknown argument: ${unknown[0]}`);
  if (check && allowDirty) {
    throw new Error('--allow-dirty is only valid when writing the generated corpus');
  }
  if (gitReadWrapper && allowDirty) throw new Error('--git-read-wrapper cannot use --allow-dirty');
  return {
    check,
    allowDirty,
    gitReadWrapper,
    ...(docValues[0] !== undefined ? { docLockfile: docValues[0] } : {}),
    ...(docValues[1] !== undefined ? { docCacheDir: docValues[1] } : {}),
    ...(docValues[2] !== undefined ? { docImportHosts: docValues[2].split(',') } : {}),
  };
}

/** The wrapper receives the actual resolved workspace and the exact source read set. */
export function generatorGitCommand(root: string, wrapper?: string): GeneratorGitCommand {
  const cwd = resolve(root);
  const args = ['status', '--porcelain', '--', 'packages', 'plugins'];
  return wrapper
    ? { executable: wrapper, args: [cwd, '--', ...args], cwd, strict: true }
    : { executable: 'git', args, cwd, strict: false };
}

async function execute(command: GeneratorGitCommand): Promise<GeneratorGitOutput> {
  return await new Deno.Command(command.executable, {
    args: command.args,
    cwd: command.cwd,
    stdout: 'piped',
    stderr: 'piped',
    ...(command.strict ? { signal: AbortSignal.timeout(20_000) } : {}),
  }).output();
}

/**
 * Preserve the ordinary generator guard; explicit delegation refuses closed.
 * A wrapper failure never falls back to Git or a separate earlier clean proof.
 */
export async function guardGeneratorWrite(
  root: string,
  options: { readonly allowDirty: boolean; readonly gitReadWrapper?: string },
  run: GeneratorGitExecutor = execute,
): Promise<void> {
  if (options.gitReadWrapper && options.allowDirty) {
    throw new Error('An approved Git read wrapper cannot be combined with --allow-dirty');
  }
  const command = generatorGitCommand(root, options.gitReadWrapper);
  let output: GeneratorGitOutput;
  try {
    output = await run(command);
  } catch (error) {
    if (command.strict) {
      throw new Error('Approved Git read did not confirm clean generator sources');
    }
    console.warn(
      'WARNING: Git is unavailable; continuing MCP export-corpus generation without ' +
        `clean-tree verification (${error instanceof Error ? error.message : String(error)}).`,
    );
    return;
  }
  if (!output.success) {
    if (command.strict) throw new Error('Approved Git read refused generator source verification');
    const detail = new TextDecoder().decode(output.stderr).trim() || `exit ${output.code}`;
    console.warn(
      'WARNING: Git status is unavailable; continuing MCP export-corpus generation without ' +
        `clean-tree verification (${detail}).`,
    );
    return;
  }
  const dirty = new TextDecoder().decode(output.stdout).trimEnd();
  if (!dirty) return;
  const summary = `MCP export-corpus generator read set is dirty:\n${dirty}`;
  if (options.allowDirty) {
    console.warn(`WARNING: ${summary}\nProceeding because --allow-dirty was explicitly supplied.`);
    return;
  }
  throw new Error(
    `${summary}\nRefusing to generate from uncommitted package/plugin sources. ` +
      'Commit or stash them, or deliberately rerun with --allow-dirty.',
  );
}
